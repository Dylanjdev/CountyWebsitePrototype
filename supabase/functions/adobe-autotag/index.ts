import { createClient, type SupabaseClient } from 'supabase'

const ADOBE_API_ORIGIN = 'https://pdf-services.adobe.io'
const DOCUMENT_BUCKET = 'county-documents'
const MAX_STORAGE_FILE_SIZE = 25 * 1024 * 1024

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type StartRequest = {
  action: 'start'
  sourcePath: string
  outputPath?: string
  reportPath?: string
  generateReport?: boolean
  shiftHeadings?: boolean
}

type StatusRequest = {
  action: 'status'
  pollingUrl: string
  outputPath: string
  reportPath?: string
  generateReport?: boolean
}

type CheckerStartRequest = {
  action: 'checker-start'
  sourcePath: string
  reportPath?: string
}

type CheckerStatusRequest = {
  action: 'checker-status'
  pollingUrl: string
  sourcePath: string
  reportPath: string
}

type FunctionRequest = StartRequest | StatusRequest | CheckerStartRequest | CheckerStatusRequest

type AdobeAsset = {
  assetID?: string
  downloadUri?: string
}

class HttpError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

function requireEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new HttpError(500, `${name} is not configured.`)
  return value
}

function getSupabasePublishableKey(request: Request) {
  const requestKey = request.headers.get('apikey')?.trim()
  if (requestKey) return requestKey

  const configuredKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
  if (configuredKeys) {
    try {
      const keys = JSON.parse(configuredKeys) as Record<string, string>
      if (keys.default) return keys.default
    } catch {
      throw new HttpError(500, 'Supabase publishable keys are misconfigured.')
    }
  }

  return requireEnvironment('SUPABASE_ANON_KEY')
}

async function getAdminClient(request: Request) {
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!authorization || !token) throw new HttpError(401, 'Sign in before auto-tagging a PDF.')

  const supabase = createClient(
    requireEnvironment('SUPABASE_URL'),
    getSupabasePublishableKey(request),
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) throw new HttpError(401, 'Your session is invalid or expired.')

  const { data: administrator, error: adminError } = await supabase
    .from('calendar_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (adminError || !administrator) throw new HttpError(403, 'County administrator access is required.')
  return { supabase, userId: userData.user.id }
}

function normalizeStoragePath(value: unknown, extension: '.pdf' | '.xlsx' | '.json') {
  if (typeof value !== 'string') throw new HttpError(400, `A ${extension} storage path is required.`)
  const path = value.trim().replace(/^\/+/, '')
  const segments = path.split('/')
  if (
    !path ||
    path.length > 500 ||
    path.includes('\\') ||
    segments.some((segment) => !segment || segment === '.' || segment === '..') ||
    !path.toLowerCase().endsWith(extension)
  ) {
    throw new HttpError(400, `The storage path must be a valid ${extension} file path.`)
  }
  return path
}

function defaultReportPath(outputPath: string) {
  return outputPath.replace(/\.pdf$/i, '-accessibility-report.xlsx')
}

function defaultCheckerReportPath(sourcePath: string) {
  return sourcePath.replace(/\.pdf$/i, '-accessibility-check.json')
}

function validatePollingUrl(value: unknown, operation: 'autotag' | 'accessibilitychecker') {
  if (typeof value !== 'string') throw new HttpError(400, 'An Adobe polling URL is required.')

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new HttpError(400, 'The Adobe polling URL is invalid.')
  }

  const allowedHost = url.hostname === 'pdf-services.adobe.io' || /^pdf-services-(ue1|ew1)\.adobe\.io$/.test(url.hostname)
  if (url.protocol !== 'https:' || !allowedHost || !url.pathname.includes(`/operation/${operation}/`)) {
    throw new HttpError(400, `The Adobe polling URL is not a valid ${operation} API URL.`)
  }
  return url.href
}

async function readResponseBody(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text.slice(0, 1000)
  }
}

async function assertResponse(response: Response, message: string) {
  if (response.ok) return response
  const details = await readResponseBody(response)
  throw new HttpError(response.status >= 500 ? 502 : response.status, message, details)
}

async function getAdobeAccessToken() {
  const body = new URLSearchParams({
    client_id: requireEnvironment('ADOBE_PDF_SERVICES_CLIENT_ID'),
    client_secret: requireEnvironment('ADOBE_PDF_SERVICES_CLIENT_SECRET'),
  })
  const response = await fetch(`${ADOBE_API_ORIGIN}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  await assertResponse(response, 'Adobe authentication failed.')
  const data = await response.json() as { access_token?: string }
  if (!data.access_token) throw new HttpError(502, 'Adobe did not return an access token.')
  return data.access_token
}

function adobeHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'x-api-key': requireEnvironment('ADOBE_PDF_SERVICES_CLIENT_ID'),
  }
}

async function uploadPDFToAdobe(sourcePDF: Blob, accessToken: string) {
  const headers = adobeHeaders(accessToken)
  const assetResponse = await fetch(`${ADOBE_API_ORIGIN}/assets`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaType: 'application/pdf' }),
  })
  await assertResponse(assetResponse, 'Adobe could not create an upload location.')
  const asset = await assetResponse.json() as { assetID?: string, uploadUri?: string }
  if (!asset.assetID || !asset.uploadUri) throw new HttpError(502, 'Adobe returned an incomplete upload location.')

  const uploadResponse = await fetch(asset.uploadUri, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: sourcePDF,
  })
  await assertResponse(uploadResponse, 'The PDF could not be uploaded to Adobe.')
  return asset.assetID
}

async function startJob(body: StartRequest, supabase: SupabaseClient) {
  const sourcePath = normalizeStoragePath(body.sourcePath, '.pdf')
  const outputPath = normalizeStoragePath(body.outputPath || sourcePath, '.pdf')
  const generateReport = body.generateReport !== false
  const reportPath = generateReport
    ? normalizeStoragePath(body.reportPath || defaultReportPath(outputPath), '.xlsx')
    : undefined

  const { data: sourcePDF, error: downloadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .download(sourcePath)
  if (downloadError || !sourcePDF) throw new HttpError(404, 'The source PDF could not be read from Supabase Storage.', downloadError?.message)
  if (!sourcePDF.size) throw new HttpError(400, 'The source PDF is empty.')
  if (sourcePDF.size > 100 * 1024 * 1024) throw new HttpError(413, 'Adobe Auto-Tag supports PDFs up to 100 MB.')

  const accessToken = await getAdobeAccessToken()
  const headers = adobeHeaders(accessToken)
  const assetID = await uploadPDFToAdobe(sourcePDF, accessToken)

  const jobResponse = await fetch(`${ADOBE_API_ORIGIN}/operation/autotag`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetID,
      generateReport,
      shiftHeadings: body.shiftHeadings === true,
    }),
  })
  await assertResponse(jobResponse, 'Adobe could not start the auto-tag job.')
  const pollingLocation = jobResponse.headers.get('location')
  if (!pollingLocation) throw new HttpError(502, 'Adobe did not return a job polling URL.')

  return {
    status: 'submitted',
    pollingUrl: validatePollingUrl(new URL(pollingLocation, ADOBE_API_ORIGIN).href, 'autotag'),
    sourcePath,
    outputPath,
    reportPath,
    generateReport,
  }
}

async function downloadAdobeAsset(asset: AdobeAsset | undefined, label: string) {
  if (!asset?.downloadUri) throw new HttpError(502, `Adobe did not return the ${label} download URL.`)
  const response = await fetch(asset.downloadUri)
  await assertResponse(response, `The ${label} could not be downloaded from Adobe.`)
  return await response.blob()
}

async function updateDocumentMetadata(supabase: SupabaseClient, userId: string, outputPath: string, fileSize: number) {
  const updates = await Promise.all([
    supabase.from('county_documents').update({ file_size: fileSize, mime_type: 'application/pdf' }).eq('storage_path', outputPath),
    supabase.from('public_notices').update({ attachment_size: fileSize, attachment_mime_type: 'application/pdf', updated_by: userId }).eq('attachment_path', outputPath),
    supabase.from('meeting_documents').update({ file_size: fileSize, mime_type: 'application/pdf', uploaded_by: userId }).eq('storage_path', outputPath),
  ])
  return updates.flatMap((result) => result.error ? [result.error.message] : [])
}

async function checkJob(body: StatusRequest, supabase: SupabaseClient, userId: string) {
  const pollingUrl = validatePollingUrl(body.pollingUrl, 'autotag')
  const outputPath = normalizeStoragePath(body.outputPath, '.pdf')
  const generateReport = body.generateReport !== false
  const reportPath = generateReport
    ? normalizeStoragePath(body.reportPath || defaultReportPath(outputPath), '.xlsx')
    : undefined
  const accessToken = await getAdobeAccessToken()
  const statusResponse = await fetch(pollingUrl, { headers: adobeHeaders(accessToken) })
  await assertResponse(statusResponse, 'Adobe job status could not be retrieved.')
  const job = await statusResponse.json() as {
    status?: string
    error?: { code?: string, message?: string, status?: number }
    'tagged-pdf'?: AdobeAsset
    report?: AdobeAsset
  }

  if (job.status === 'failed') {
    throw new HttpError(job.error?.status || 422, job.error?.message || 'Adobe could not auto-tag this PDF.', job.error)
  }
  if (job.status !== 'done') {
    const retryAfter = Number(statusResponse.headers.get('retry-after')) || 3
    return { status: 'in progress', retryAfter: Math.max(1, Math.min(retryAfter, 15)) }
  }

  const taggedPDF = await downloadAdobeAsset(job['tagged-pdf'], 'tagged PDF')
  if (!taggedPDF.size || taggedPDF.size > MAX_STORAGE_FILE_SIZE) {
    throw new HttpError(413, 'The tagged PDF exceeds the 25 MB Supabase Storage limit.')
  }

  const { error: outputError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(outputPath, taggedPDF, { contentType: 'application/pdf', upsert: true })
  if (outputError) throw new HttpError(502, 'The tagged PDF could not be saved to Supabase Storage.', outputError.message)

  let reportSize: number | undefined
  let reportSignedUrl: string | undefined
  if (generateReport && reportPath) {
    const report = await downloadAdobeAsset(job.report, 'accessibility report')
    reportSize = report.size
    const { error: reportError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(reportPath, report, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      })
    if (reportError) throw new HttpError(502, 'The accessibility report could not be saved to Supabase Storage.', reportError.message)
    const { data: signedReport } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(reportPath, 3600)
    reportSignedUrl = signedReport?.signedUrl
  }

  const metadataWarnings = await updateDocumentMetadata(supabase, userId, outputPath, taggedPDF.size)
  return {
    status: 'done',
    outputPath,
    outputSize: taggedPDF.size,
    reportPath,
    reportSize,
    reportSignedUrl,
    metadataWarnings,
  }
}

async function startCheckerJob(body: CheckerStartRequest, supabase: SupabaseClient) {
  const sourcePath = normalizeStoragePath(body.sourcePath, '.pdf')
  const reportPath = normalizeStoragePath(body.reportPath || defaultCheckerReportPath(sourcePath), '.json')
  const { data: sourcePDF, error: downloadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .download(sourcePath)
  if (downloadError || !sourcePDF) throw new HttpError(404, 'The tagged PDF could not be read for its accessibility check.', downloadError?.message)
  if (!sourcePDF.size) throw new HttpError(400, 'The tagged PDF is empty.')
  if (sourcePDF.size > 100 * 1024 * 1024) throw new HttpError(413, 'Adobe Accessibility Checker supports PDFs up to 100 MB.')

  const accessToken = await getAdobeAccessToken()
  const assetID = await uploadPDFToAdobe(sourcePDF, accessToken)
  const jobResponse = await fetch(`${ADOBE_API_ORIGIN}/operation/accessibilitychecker`, {
    method: 'POST',
    headers: { ...adobeHeaders(accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetID }),
  })
  await assertResponse(jobResponse, 'Adobe could not start the accessibility check.')
  const pollingLocation = jobResponse.headers.get('location')
  if (!pollingLocation) throw new HttpError(502, 'Adobe did not return an accessibility checker polling URL.')

  return {
    status: 'submitted',
    pollingUrl: validatePollingUrl(new URL(pollingLocation, ADOBE_API_ORIGIN).href, 'accessibilitychecker'),
    sourcePath,
    reportPath,
  }
}

function checkerSummary(report: Record<string, unknown>) {
  const summary = report.Summary && typeof report.Summary === 'object'
    ? report.Summary as Record<string, unknown>
    : {}
  const count = (key: string) => Number.isFinite(Number(summary[key])) ? Number(summary[key]) : 0
  return {
    description: typeof summary.Description === 'string' ? summary.Description : '',
    passed: count('Passed'),
    failed: count('Failed'),
    needsManualCheck: count('Needs manual check'),
    passedManually: count('Passed manually'),
    failedManually: count('Failed manually'),
    skipped: count('Skipped'),
  }
}

function checkerSections(report: Record<string, unknown>) {
  const detailedReport = report['Detailed Report'] && typeof report['Detailed Report'] === 'object'
    ? report['Detailed Report'] as Record<string, unknown>
    : {}

  return Object.entries(detailedReport).flatMap(([category, value]) => {
    if (!Array.isArray(value)) return []
    const rules = value.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const rule = item as Record<string, unknown>
      return [{
        name: typeof rule.Rule === 'string' ? rule.Rule : 'Accessibility rule',
        status: typeof rule.Status === 'string' ? rule.Status : 'Unknown',
        description: typeof rule.Description === 'string' ? rule.Description : '',
      }]
    })
    return rules.length ? [{ category, rules }] : []
  })
}

async function checkCheckerJob(body: CheckerStatusRequest, supabase: SupabaseClient) {
  const pollingUrl = validatePollingUrl(body.pollingUrl, 'accessibilitychecker')
  const sourcePath = normalizeStoragePath(body.sourcePath, '.pdf')
  const reportPath = normalizeStoragePath(body.reportPath || defaultCheckerReportPath(sourcePath), '.json')
  const accessToken = await getAdobeAccessToken()
  const statusResponse = await fetch(pollingUrl, { headers: adobeHeaders(accessToken) })
  await assertResponse(statusResponse, 'Adobe accessibility check status could not be retrieved.')
  const job = await statusResponse.json() as {
    status?: string
    error?: { code?: string, message?: string, status?: number }
    report?: AdobeAsset
  }

  if (job.status === 'failed') {
    throw new HttpError(job.error?.status || 422, job.error?.message || 'Adobe could not check this PDF.', job.error)
  }
  if (job.status !== 'done') {
    const retryAfter = Number(statusResponse.headers.get('retry-after')) || 3
    return { status: 'in progress', retryAfter: Math.max(1, Math.min(retryAfter, 15)) }
  }

  const reportBlob = await downloadAdobeAsset(job.report, 'accessibility checker report')
  if (!reportBlob.size || reportBlob.size > MAX_STORAGE_FILE_SIZE) {
    throw new HttpError(413, 'The accessibility checker report exceeds the Supabase Storage limit.')
  }

  let report: Record<string, unknown>
  const reportText = await reportBlob.text()
  try {
    report = JSON.parse(reportText) as Record<string, unknown>
  } catch {
    throw new HttpError(502, 'Adobe returned an invalid accessibility checker report.')
  }

  const { error: reportError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(reportPath, new Blob([reportText], { type: 'text/plain' }), { contentType: 'text/plain', upsert: true })
  if (reportError) throw new HttpError(502, 'The accessibility checker report could not be saved to Supabase Storage.', reportError.message)
  const { data: signedReport } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(reportPath, 3600)

  return {
    status: 'done',
    sourcePath,
    reportPath,
    reportSize: reportBlob.size,
    reportSignedUrl: signedReport?.signedUrl,
    summary: checkerSummary(report),
    sections: checkerSections(report),
  }
}

async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    const { supabase, userId } = await getAdminClient(request)
    let body: FunctionRequest
    try {
      body = await request.json()
    } catch {
      throw new HttpError(400, 'A JSON request body is required.')
    }

    if (body.action === 'start') return jsonResponse(await startJob(body, supabase))
    if (body.action === 'status') return jsonResponse(await checkJob(body, supabase, userId))
    if (body.action === 'checker-start') return jsonResponse(await startCheckerJob(body, supabase))
    if (body.action === 'checker-status') return jsonResponse(await checkCheckerJob(body, supabase))
    throw new HttpError(400, 'Unsupported Adobe accessibility action.')
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unexpected auto-tagging error.'
    const details = error instanceof HttpError ? error.details : undefined
    console.error('Adobe auto-tag error', { status, message, details })
    return jsonResponse({ error: message, details }, status)
  }
}

Deno.serve(handler)
