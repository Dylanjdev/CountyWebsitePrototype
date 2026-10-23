import { mkdir, open, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const archiveRoot = join(projectRoot, 'src/assets/county_archive')
const outputPath = join(projectRoot, 'src/data/historicalMeetings.js')
const sourceUrl = 'https://www.leecova.com/meeting-minutes'
const retentionDate = new Date()
retentionDate.setFullYear(retentionDate.getFullYear() - 3)
const retentionCutoff = [retentionDate.getFullYear(), String(retentionDate.getMonth() + 1).padStart(2, '0'), String(retentionDate.getDate()).padStart(2, '0')].join('-')

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

const ignoredLocalFiles = new Set([
  // Draft July 21 minutes; the approved copy is in the 2026 folder.
  'Unsorted/Minutes/.pdf',
  // Duplicate of 2025/Audio/June_3_2025_Recessed_Meeting.mp3.
  'Unsorted/Audio/.mp3',
  // Agenda copies that were also saved in Minutes; canonical copies are in Agendas.
  '2025/Minutes/July_152025_Regular_Meeting.pdf',
  '2025/Minutes/May_20_2025_Public_Hearing.pdf',
  '2025/Minutes/September_162025_Regular_Meeting.pdf',
  '2026/Minutes/January_20_2026_Regular_Meeting.pdf',
  '2026/Minutes/July_21_2026_Regular_Meeting.pdf',
  '2026/Minutes/Sept_15_2026_Recessed_Meeting.pdf',
  '2026/Minutes/Sept_15_2026_Regular_Meeting.pdf',
])

const localPathOverrides = new Map([
  ['Unsorted/Agendas/June_1802024_Regular_Meeting.pdf', { meeting_date: '2024-06-18', meeting_type: 'Regular Meeting', document_type: 'Agenda' }],
])

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

function cleanMeetingType(value) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^Reguar Meeting$/i, 'Regular Meeting')
    .replace(/^Regular meeting$/i, 'Regular Meeting')
    .replace(/^Called Meeting$/i, 'Special Called Meeting')
    .replace(/^Recessed$/i, 'Recessed Meeting')
    .replace(/^Secondary System Six-Year Plan Public Hearing$/i, 'SSYP Public Hearing')
}

function parseMeetingTitle(value, fallbackYear) {
  const cleaned = decodeHtml(value).replace(/\b2106\b/g, '2016')
  const match = cleaned.match(/^(January|February|March|April|May|June|July|August|September|Sept\.?|October|November|December)\s*(\d{1,2}),?\s*(?:(\d{4})\s+)?(.+)$/i)
  if (!match) return null
  const year = Number(match[3] || fallbackYear)
  if (!year) return null
  return {
    month: months[match[1].toLowerCase().replace('.', '')],
    day: Number(match[2]),
    statedYear: year,
    meetingType: cleanMeetingType(match[4]),
  }
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatTitle(date, meetingType) {
  const [year, month, day] = date.split('-').map(Number)
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)))
  return `${label} ${meetingType}`
}

function normalizeMeetingType(value) {
  const type = cleanMeetingType(value)
    .replace(/\s+Part\s+\d+$/i, '')
    .toLowerCase()
  if (type.includes('public hearing')) return 'public hearing'
  if (type.includes('special') || type === 'called meeting') return 'special called meeting'
  if (type.includes('organizational')) return 'organizational meeting'
  if (type.includes('annual')) return 'annual meeting'
  if (type.includes('recessed')) return 'recessed meeting'
  if (type.includes('regular')) return 'regular meeting'
  return type
}

function recordKey(record, includePart = true) {
  const part = includePart ? record.part || '' : ''
  return [record.meeting_date, normalizeMeetingType(record.meeting_type), record.document_type, part].join('|')
}

function absoluteUrl(value) {
  try {
    return new URL(value, sourceUrl).href
  } catch {
    return ''
  }
}

async function scrapePublishedRecords() {
  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const tokens = []
    const textPattern = /<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi
    const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

    for (const match of html.matchAll(textPattern)) {
      const text = decodeHtml(match[2])
      const lower = text.toLowerCase()
      if (['agendas', 'minutes', 'audio recordings', 'audio'].includes(lower)) tokens.push({ index: match.index, kind: 'heading', text: lower })
      else if (/^20(1[6-9]|2\d)$/.test(text)) tokens.push({ index: match.index, kind: 'year', year: Number(text) })
    }
    for (const match of html.matchAll(anchorPattern)) {
      tokens.push({ index: match.index, kind: 'link', href: absoluteUrl(decodeHtml(match[1])), text: match[2] })
    }
    tokens.sort((a, b) => a.index - b.index)

    const documentBlocks = []
    let currentBlock = null
    let section = ''
    let audioYear = null
    const audioRecords = []

    for (const token of tokens) {
      if (token.kind === 'heading') {
        if (token.text === 'audio recordings' || token.text === 'audio') {
          section = 'Audio'
          currentBlock = null
        } else {
          section = token.text === 'agendas' ? 'Agenda' : 'Minutes'
          currentBlock = { documentType: section, items: [] }
          documentBlocks.push(currentBlock)
        }
        continue
      }
      if (token.kind === 'year') {
        if (section === 'Audio') audioYear = token.year
        continue
      }
      if (token.kind !== 'link' || !token.href) continue

      if (section === 'Audio') {
        const parsed = parseMeetingTitle(token.text, audioYear)
        if (!parsed || parsed.statedYear < 2020 || parsed.statedYear > 2099) continue
        audioYear = parsed.statedYear
        const partMatch = parsed.meetingType.match(/\s+Part\s+(\d+)$/i)
        const meetingType = cleanMeetingType(parsed.meetingType.replace(/\s+Part\s+\d+$/i, ''))
        const meetingDate = formatDate(parsed.statedYear, parsed.month, parsed.day)
        audioRecords.push({
          title: formatTitle(meetingDate, meetingType),
          meeting_date: meetingDate,
          meeting_type: meetingType,
          document_type: 'Audio',
          part: partMatch ? Number(partMatch[1]) : null,
          external_url: token.href,
        })
      } else if (currentBlock) {
        const parsed = parseMeetingTitle(token.text)
        if (parsed) currentBlock.items.push({ ...parsed, externalUrl: token.href })
      }
    }

    const documentRecords = []
    for (const block of documentBlocks) {
      const years = block.items.reduce((counts, item) => ({ ...counts, [item.statedYear]: (counts[item.statedYear] || 0) + 1 }), {})
      const archiveYear = Number(Object.entries(years).sort((a, b) => b[1] - a[1])[0]?.[0])
      if (archiveYear < 2016 || archiveYear > 2099) continue
      for (const item of block.items) {
        const meetingDate = formatDate(archiveYear, item.month, item.day)
        documentRecords.push({
          title: formatTitle(meetingDate, item.meetingType),
          meeting_date: meetingDate,
          meeting_type: item.meetingType,
          document_type: block.documentType,
          part: null,
          external_url: item.externalUrl,
        })
      }
    }

    return [...documentRecords, ...audioRecords]
  } catch (error) {
    console.warn(`Could not refresh official meeting links: ${error.message}. Building the manifest from local files only.`)
    return []
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else files.push(path)
  }
  return files
}

function parseLocalFilename(archivePath) {
  if (localPathOverrides.has(archivePath)) return { ...localPathOverrides.get(archivePath), part: null }

  const segments = archivePath.split('/')
  const folder = segments.at(-2)
  const stem = basename(archivePath, extname(archivePath)).replace(/\u00a0/g, '_')
  const match = stem.match(/^(January|February|March|April|May|June|July|August|September|Sept|October|November|December)_?(\d{1,2})_?(\d{4})_?(.+)$/i)
  if (!match) return null

  const month = months[match[1].toLowerCase()]
  const day = Number(match[2])
  const year = Number(match[3] === '2106' ? '2016' : match[3])
  if (!month || day < 1 || day > 31 || year < 2016 || year > 2099) return null

  const rawType = match[4].replaceAll('_', ' ').replace(/\s+/g, ' ').trim()
  const partMatch = rawType.match(/\s+Part\s+(\d+)$/i)
  const meetingType = cleanMeetingType(rawType.replace(/\s+Part\s+\d+$/i, ''))
  const defaultType = folder === 'Agendas' ? 'Agenda' : folder === 'Minutes' ? 'Minutes' : folder === 'Audio' ? 'Audio' : null
  const documentType = defaultType
  if (!documentType) return null

  return {
    meeting_date: formatDate(year, month, day),
    meeting_type: meetingType,
    document_type: documentType,
    part: partMatch ? Number(partMatch[1]) : null,
  }
}

async function readLocalRecords() {
  const files = await walk(archiveRoot)
  const records = []

  for (const filePath of files) {
    const archivePath = relative(archiveRoot, filePath).split('\\').join('/')
    const extension = extname(filePath).toLowerCase()
    if (!['.pdf', '.mp3'].includes(extension) || ignoredLocalFiles.has(archivePath) || archivePath.startsWith('Unsorted/General/')) continue

    const handle = await open(filePath, 'r')
    const signatureBuffer = Buffer.alloc(64)
    await handle.read(signatureBuffer, 0, signatureBuffer.length, 0)
    await handle.close()
    const signature = signatureBuffer.toString('utf8').trimStart().toLowerCase()
    if (signature.startsWith('<!doctype') || signature.startsWith('<html')) continue

    const parsed = parseLocalFilename(archivePath)
    if (!parsed) continue
    const fileStats = await stat(filePath)
    records.push({
      ...parsed,
      title: formatTitle(parsed.meeting_date, parsed.meeting_type),
      file_name: basename(filePath),
      file_size: fileStats.size,
      archive_path: archivePath,
    })
  }

  return records
}

const publishedRecords = await scrapePublishedRecords()
const localRecords = await readLocalRecords()
const localByKey = new Map()
for (const record of localRecords) {
  const key = recordKey(record)
  if (!localByKey.has(key)) localByKey.set(key, [])
  localByKey.get(key).push(record)
}

const claimedPaths = new Set()
const merged = publishedRecords.map((record) => {
  const candidates = localByKey.get(recordKey(record)) || localByKey.get(recordKey(record, false)) || []
  const local = candidates.find((candidate) => !claimedPaths.has(candidate.archive_path))
  if (local) claimedPaths.add(local.archive_path)
  return { ...record, ...(local || {}) }
})

for (const record of localRecords) {
  if (!claimedPaths.has(record.archive_path)) merged.push({ ...record, external_url: '' })
}

const uniqueRecords = [...new Map(merged.map((record) => {
  const identity = record.archive_path || `${recordKey(record)}|${record.external_url}`
  return [identity, record]
})).values()]
  .filter((record) => record.meeting_date >= retentionCutoff)
  .map((record, index) => ({
    id: `archive-${index + 1}`,
    source: 'historical',
    title: record.title,
    meeting_date: record.meeting_date,
    meeting_type: record.meeting_type,
    document_type: record.document_type,
    part: record.part || null,
    file_name: record.file_name || null,
    file_size: record.file_size || null,
    archive_path: record.archive_path || null,
    external_url: record.external_url || null,
  }))
  .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date)
    || a.meeting_type.localeCompare(b.meeting_type)
    || ['Agenda', 'Minutes', 'Audio'].indexOf(a.document_type) - ['Agenda', 'Minutes', 'Audio'].indexOf(b.document_type)
    || (a.part || 0) - (b.part || 0))

const output = `// Generated by scripts/generate-meeting-archive.mjs.\n// Historical records are static; Supabase records are layered on at runtime.\n\nexport const historicalMeetingDocuments = ${JSON.stringify(uniqueRecords, null, 2)}\n`
await mkdir(join(projectRoot, 'src/data'), { recursive: true })
await writeFile(outputPath, output)

const counts = uniqueRecords.reduce((result, record) => {
  const year = record.meeting_date.slice(0, 4)
  result[year] ||= { Agenda: 0, Minutes: 0, Audio: 0 }
  result[year][record.document_type] += 1
  return result
}, {})

console.log(`Generated ${relative(projectRoot, outputPath)} with ${uniqueRecords.length} records (${uniqueRecords.filter((record) => record.archive_path).length} backed by local files).`)
console.table(counts)
