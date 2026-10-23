import { createClient } from '@supabase/supabase-js'

const sourceUrl = 'https://www.leecova.com/meeting-minutes'
const dryRun = process.argv.includes('--dry-run')

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim()
}

const months = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  sept: 9,
  october: 10,
  november: 11,
  december: 12,
}

function parseMeetingTitle(value) {
  const cleaned = decodeHtml(value).replace(/\b2106\b/g, '2016')
  const match = cleaned.match(/^(January|February|March|April|May|June|July|August|September|Sept\.?|October|November|December)\s*(\d{1,2}),?\s*(\d{4})\s+(.+)$/i)
  if (!match) return null
  return {
    month: months[match[1].toLowerCase().replace('.', '')],
    day: Number(match[2]),
    statedYear: Number(match[3]),
    meetingType: match[4].replace(/\s+/g, ' ').trim().replace(/^Reguar Meeting$/i, 'Regular Meeting').replace(/^Regular meeting$/i, 'Regular Meeting'),
  }
}

function mostCommonYear(items) {
  const counts = items.reduce((result, item) => {
    result[item.statedYear] = (result[item.statedYear] || 0) + 1
    return result
  }, {})
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0])
}

function formatTitle(date, meetingType) {
  const [year, month, day] = date.split('-').map(Number)
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${label} ${meetingType}`
}

const response = await fetch(sourceUrl)
if (!response.ok) throw new Error(`Could not load ${sourceUrl}: HTTP ${response.status}`)
const html = await response.text()
const tokens = []
const headingPattern = /<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi
const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
for (const match of html.matchAll(headingPattern)) {
  const text = decodeHtml(match[2]).toLowerCase()
  if (text === 'agendas' || text === 'minutes' || text === 'audio recordings') tokens.push({ index: match.index, kind: 'heading', text })
}
for (const match of html.matchAll(anchorPattern)) tokens.push({ index: match.index, kind: 'link', href: decodeHtml(match[1]), text: match[2] })
tokens.sort((a, b) => a.index - b.index)

const blocks = []
let currentBlock = null

for (const token of tokens) {
  if (token.kind === 'heading') {
    if (token.text === 'audio recordings') {
      currentBlock = null
    } else {
      currentBlock = { documentType: token.text === 'agendas' ? 'Agenda' : 'Minutes', items: [] }
      blocks.push(currentBlock)
    }
    continue
  }
  if (!currentBlock) continue
  const parsed = parseMeetingTitle(token.text)
  if (!parsed) continue
  currentBlock.items.push({ ...parsed, externalUrl: token.href })
}

const imported = []
for (const block of blocks) {
  if (block.items.length === 0) continue
  const archiveYear = mostCommonYear(block.items)
  if (archiveYear < 2016 || archiveYear > new Date().getFullYear()) continue
  for (const item of block.items) {
    const meetingDate = `${archiveYear}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
    imported.push({
      title: formatTitle(meetingDate, item.meetingType),
      meeting_date: meetingDate,
      meeting_type: item.meetingType,
      document_type: block.documentType,
      external_url: item.externalUrl,
      is_published: true,
    })
  }
}

const records = [...new Map(imported.map((record) => [record.external_url, record])).values()]
const summary = records.reduce((result, record) => {
  const year = record.meeting_date.slice(0, 4)
  result[year] ||= { agendas: 0, minutes: 0 }
  result[year][record.document_type === 'Agenda' ? 'agendas' : 'minutes'] += 1
  return result
}, {})

console.log(`Found ${records.length} unique meeting documents across ${Object.keys(summary).length} years.`)
console.table(summary)

if (dryRun) process.exit(0)

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the import. Never expose the service-role key in a VITE_ variable.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
for (let index = 0; index < records.length; index += 200) {
  const batch = records.slice(index, index + 200)
  const { error } = await supabase.from('meeting_documents').upsert(batch, { onConflict: 'external_url', ignoreDuplicates: true })
  if (error) throw new Error(`Import failed near record ${index + 1}: ${error.message}`)
}

console.log(`Imported ${records.length} meeting-document links. Re-running this command will skip existing source URLs.`)
