import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { historicalMeetingDocuments } from '../src/data/historicalMeetings.js'

const projectRoot = resolve(import.meta.dirname, '..')
const archiveRoot = join(projectRoot, 'src/assets/county_archive')
const manifestPath = join(projectRoot, 'supabase/archive-upload-manifest.json')
const bucket = 'county-documents'
const archivePrefix = 'county-archive'
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Never expose the service-role key in a VITE_ variable.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) paths.push(...await walk(path))
    else paths.push(path)
  }
  return paths
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function archivePath(filePath) {
  return relative(archiveRoot, filePath).split('\\').join('/')
}

function storagePath(localArchivePath) {
  return `${archivePrefix}/${localArchivePath}`
}

function meetingIdentity(record) {
  const type = record.meeting_type?.toLowerCase()
    .replace(/\s+part\s+\d+$/i, '')
    .replace(/secondary system six-year plan|ssyp/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return `${record.meeting_date}|${type}|${record.document_type}`
}

function documentTitle(fileName) {
  return basename(fileName, extname(fileName))
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function uploadAndVerify(filePath, index, total) {
  const localArchivePath = archivePath(filePath)
  const destination = storagePath(localArchivePath)
  const localBytes = await readFile(filePath)
  const localHash = sha256(localBytes)
  const { data: existing } = await supabase.storage.from(bucket).download(destination)

  if (existing) {
    const existingBytes = Buffer.from(await existing.arrayBuffer())
    if (existingBytes.length !== localBytes.length || sha256(existingBytes) !== localHash) {
      throw new Error(`A different object already exists at ${destination}. Nothing was overwritten.`)
    }
    console.log(`[${index}/${total}] Verified existing ${localArchivePath}`)
  } else {
    const { error: uploadError } = await supabase.storage.from(bucket).upload(destination, localBytes, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) throw new Error(`Upload failed for ${localArchivePath}: ${uploadError.message}`)

    const { data: downloaded, error: verificationError } = await supabase.storage.from(bucket).download(destination)
    if (verificationError || !downloaded) throw new Error(`Could not verify ${localArchivePath}: ${verificationError?.message || 'download failed'}`)
    const downloadedBytes = Buffer.from(await downloaded.arrayBuffer())
    if (downloadedBytes.length !== localBytes.length || sha256(downloadedBytes) !== localHash) {
      throw new Error(`Checksum verification failed for ${localArchivePath}.`)
    }
    console.log(`[${index}/${total}] Uploaded and verified ${localArchivePath}`)
  }

  const fileStats = await stat(filePath)
  return {
    archive_path: localArchivePath,
    storage_path: destination,
    size: fileStats.size,
    sha256: localHash,
  }
}

async function uploadFiles(files) {
  const results = []
  const concurrency = 6
  for (let start = 0; start < files.length; start += concurrency) {
    const batch = files.slice(start, start + concurrency)
    const uploaded = await Promise.all(batch.map((filePath, offset) => uploadAndVerify(filePath, start + offset + 1, files.length)))
    results.push(...uploaded)
  }
  return results
}

async function syncMeetingMetadata(uploadedByArchivePath) {
  const records = historicalMeetingDocuments.filter((record) => record.archive_path?.toLowerCase().endsWith('.pdf'))
  const { data: existingRows, error: queryError } = await supabase
    .from('meeting_documents')
    .select('id,meeting_date,meeting_type,document_type,external_url,storage_path')
  if (queryError) throw new Error(`Could not read meeting metadata: ${queryError.message}`)

  const byStoragePath = new Map((existingRows || []).filter((row) => row.storage_path).map((row) => [row.storage_path, row]))
  const byExternalUrl = new Map((existingRows || []).filter((row) => row.external_url).map((row) => [row.external_url, row]))
  const byIdentity = new Map((existingRows || []).map((row) => [meetingIdentity(row), row]))
  let inserted = 0
  let updated = 0

  for (const record of records) {
    const uploaded = uploadedByArchivePath.get(record.archive_path)
    if (!uploaded) throw new Error(`Uploaded object is missing for ${record.archive_path}`)
    const payload = {
      title: record.title,
      meeting_date: record.meeting_date,
      meeting_type: record.meeting_type,
      document_type: record.document_type,
      external_url: record.external_url || null,
      file_name: record.file_name,
      storage_path: uploaded.storage_path,
      mime_type: 'application/pdf',
      file_size: uploaded.size,
      is_published: true,
    }
    const existing = byStoragePath.get(payload.storage_path)
      || (payload.external_url ? byExternalUrl.get(payload.external_url) : null)
      || byIdentity.get(meetingIdentity(payload))
    const result = existing
      ? await supabase.from('meeting_documents').update(payload).eq('id', existing.id)
      : await supabase.from('meeting_documents').insert(payload)
    if (result.error) throw new Error(`Could not save metadata for ${record.archive_path}: ${result.error.message}`)
    if (existing) updated += 1
    else inserted += 1
  }

  return { inserted, updated, total: records.length }
}

async function syncGeneralDocumentMetadata(uploadedByArchivePath) {
  const generalDocuments = [...uploadedByArchivePath.values()]
    .filter((item) => item.archive_path.startsWith('Unsorted/General/'))
  const { data: existingRows, error: queryError } = await supabase
    .from('county_documents')
    .select('id,storage_path')
    .in('storage_path', generalDocuments.map((item) => item.storage_path))
  if (queryError) throw new Error(`Could not read document metadata: ${queryError.message}`)
  const byStoragePath = new Map((existingRows || []).map((row) => [row.storage_path, row]))
  let inserted = 0
  let updated = 0

  for (const document of generalDocuments) {
    const payload = {
      title: documentTitle(document.archive_path),
      description: 'Migrated from the former Lee County website archive.',
      category: 'Other',
      document_date: new Date().toISOString().slice(0, 10),
      file_name: basename(document.archive_path),
      storage_path: document.storage_path,
      mime_type: 'application/pdf',
      file_size: document.size,
      is_published: false,
    }
    const existing = byStoragePath.get(document.storage_path)
    const result = existing
      ? await supabase.from('county_documents').update(payload).eq('id', existing.id)
      : await supabase.from('county_documents').insert(payload)
    if (result.error) throw new Error(`Could not save metadata for ${document.archive_path}: ${result.error.message}`)
    if (existing) updated += 1
    else inserted += 1
  }

  return { inserted, updated, total: generalDocuments.length }
}

const files = (await walk(archiveRoot))
  .filter((filePath) => extname(filePath).toLowerCase() === '.pdf' || basename(filePath).toLowerCase() === '.pdf')
  .sort((first, second) => archivePath(first).localeCompare(archivePath(second)))

console.log(`Uploading ${files.length} PDFs from ${relative(projectRoot, archiveRoot)}.`)
const uploaded = await uploadFiles(files)
const uploadedByArchivePath = new Map(uploaded.map((item) => [item.archive_path, item]))
const meetings = await syncMeetingMetadata(uploadedByArchivePath)
const generalDocuments = await syncGeneralDocumentMetadata(uploadedByArchivePath)
const manifest = {
  bucket,
  prefix: archivePrefix,
  generated_at: new Date().toISOString(),
  file_count: uploaded.length,
  total_bytes: uploaded.reduce((total, item) => total + item.size, 0),
  meeting_records: meetings,
  general_document_records: generalDocuments,
  files: uploaded,
}
await mkdir(join(projectRoot, 'supabase'), { recursive: true })
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Verified ${manifest.file_count} PDFs (${manifest.total_bytes} bytes).`)
console.log(`Meeting metadata: ${meetings.inserted} inserted, ${meetings.updated} updated.`)
console.log(`General documents: ${generalDocuments.inserted} inserted as private drafts, ${generalDocuments.updated} updated.`)
console.log(`Wrote ${relative(projectRoot, manifestPath)}.`)
