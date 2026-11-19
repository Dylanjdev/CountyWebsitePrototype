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
Before an in-place replacement, the function saves a private copy beside the
source using the `-pre-auto-repair.pdf` suffix. The final response includes
one-hour signed URLs for the original backup and repaired PDF so an
administrator can compare them. Pass a different `outputPath` in the start
request to retain the source in place. The XLSX report also remains private and
the final response includes a one-hour signed URL for it.

The admin interface also sends the county record title and `en-US` language.
After Adobe returns the tagged PDF, the function sets that title as the PDF
title and configures readers to show it in the title bar, sets the primary
document language, and sets every page's tab order to follow the document
structure. The `automaticRepairs` response lists each applied repair for the
review panel.

The administrator can send `restore-backup` with the returned `originalPath`
as `backupPath` and `outputPath` to put the original file back. This action also
updates the matching document record's file size.

The administrator interface then invokes `checker-start` and polls
`checker-status`. This runs Adobe PDF Accessibility Checker against the tagged
PDF, saves its JSON report beside the PDF in private Storage, and returns the
counts for passed, failed, and manual-review rules. A successful machine check
does not replace the manual review Adobe identifies for reading order, color
contrast, or the meaning of alternate text.
