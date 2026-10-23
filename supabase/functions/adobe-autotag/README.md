# Adobe PDF Auto-Tag Edge Function

This authenticated Supabase Edge Function sends an existing PDF from the
private `county-documents` bucket to Adobe PDF Accessibility Auto-Tag, then
saves the tagged PDF and optional XLSX accessibility report back to the same
bucket. Only users listed in `calendar_admins` can invoke it.

## Secrets

Set these values from Adobe's `pdfservices-api-credentials.json`:

```bash
supabase secrets set ADOBE_PDF_SERVICES_CLIENT_ID=... ADOBE_PDF_SERVICES_CLIENT_SECRET=...
```

For local development, copy `.env.example` to `supabase/functions/.env` and
fill in both values. The real `.env` file is ignored by Git.

## Invoke

Start a job with a PDF already in Supabase Storage:

```js
const { data: job, error } = await supabase.functions.invoke('adobe-autotag', {
  body: {
    action: 'start',
    sourcePath: 'documents/2026/example.pdf',
    generateReport: true,
  },
})
```

Poll from the signed-in administrator's browser. Use `retryAfter` from each
response before polling again:

```js
const { data: result, error } = await supabase.functions.invoke('adobe-autotag', {
  body: {
    action: 'status',
    pollingUrl: job.pollingUrl,
    outputPath: job.outputPath,
    reportPath: job.reportPath,
    generateReport: job.generateReport,
  },
})
```

When the status is `done`, the tagged PDF has replaced the source by default.
Pass a different `outputPath` in the start request to retain the original.
The XLSX report remains private and the final response includes a one-hour
signed URL for it.

The administrator interface then invokes `checker-start` and polls
`checker-status`. This runs Adobe PDF Accessibility Checker against the tagged
PDF, saves its JSON report beside the PDF in private Storage, and returns the
counts for passed, failed, and manual-review rules. A successful machine check
does not replace the manual review Adobe identifies for reading order, color
contrast, or the meaning of alternate text.
