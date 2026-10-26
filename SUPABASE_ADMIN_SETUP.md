# Lee County Supabase admin setup

This Lee County website uses its configured Supabase project for administrator accounts, documents, notices, meetings, and calendar data.

## Apply the additive document schema

Open the existing Supabase project, go to **SQL Editor**, and run all of [`supabase/county_documents.sql`](supabase/county_documents.sql). The script:

- creates `public.county_documents`;
- creates a private `county-documents` Storage bucket;
- reuses `calendar_admins` and `private.is_calendar_admin()` for authorization;
- allows anonymous visitors to read metadata and download files only after publication;
- allows approved administrators to upload, publish, unpublish, and delete documents;
- limits files to 25 MB and common document/image formats.

The script is additive and safe to rerun. Do not disable Row Level Security and never put a Supabase secret or `service_role` key in the frontend.

## Add public-notice publishing

After the document schema is installed, run all of [`supabase/public_notices.sql`](supabase/public_notices.sql). This second additive migration:

- creates the editable `public_notices` table;
- adds draft, published, and archived states;
- supports deadlines, automatic expiration, contacts, submission addresses, external links, featured notices, and optional PDF attachments;
- keeps draft and archived attachments private;
- gives public visitors access only to published, unexpired notices and their PDFs;
- seeds the four notices carried over from the former county website without overwriting later staff edits.

Both scripts can be rerun safely. Run them in the documented order because the notice migration reuses the private `county-documents` bucket and its administrator upload policies.

## Add the meetings and agendas archive

Run [`supabase/meeting_documents.sql`](supabase/meeting_documents.sql) after the two migrations above. It creates the database used for newly added agendas and minutes and extends the private storage policy to cover published meeting PDFs.

The retained PDF archive is stored in the private `county-documents` bucket under `county-archive/`. Published agenda and minutes metadata is stored in `meeting_documents`; the other 24 migrated county PDFs are private drafts in `county_documents` so staff can review and publish them from the admin page. The site creates temporary links for published meeting PDFs after checking the database's three-year retention rule.

The completed migration uploaded and SHA-256 verified 158 PDFs totaling 20,712,702 bytes. [`supabase/archive-upload-manifest.json`](supabase/archive-upload-manifest.json) records every local path, remote path, byte count, and checksum. To verify or repeat the migration from a machine that still has the source PDFs, set server-only credentials and run:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY \
npm run migrate:documents
```

Never place the service-role key in `.env.local` under a `VITE_` name or expose it to the frontend. The migration refuses to overwrite a remote object whose checksum differs from its local file.

The static meeting index remains as a fallback for official legacy links and locally indexed audio. Regenerate it only while `src/assets/county_archive` is available:

```bash
npm run generate:meetings
```

Audio files were not part of the PDF migration. They remain local or use the official legacy URLs already recorded in the static index.

If an older installation applied the storage migrations in a different order, run [`supabase/storage_public_read_policy.sql`](supabase/storage_public_read_policy.sql) once. It restores public read access for published documents, current notices, and meeting PDFs while keeping drafts private.

## Local configuration

Use the Lee County website's configured Supabase project URL and publishable key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The local `.env.local` is ignored by Git. Production hosting must receive the same two public Supabase values during its build. The service-role key is needed only for trusted migration scripts and must never be added to the frontend build.

## Administrator access

Approved administrators can sign in at `/admin` with their Lee County email and password. Access is checked against `calendar_admins` in Supabase; a browser session alone does not grant document or public-notice access.

When an invited user opens a Supabase invitation, the website recognizes the `invite` callback, routes it to `/admin`, and opens a **Create your account** dialog. The user chooses a password there and then continues directly into the administration page.

In **Authentication → URL Configuration** in the Supabase Dashboard, set the production Site URL to the website root and allow the admin URL as a redirect URL. For the current GitHub Pages deployment, allow:

```text
https://dylanjdev.github.io/CountyWebsitePrototype/admin
```

If invitations are sent with the Auth Admin API instead of the Supabase Dashboard, pass that same full URL as the `redirectTo` option. The Auth Admin API and its secret key must only run in a trusted server environment. Dashboard invitations use the configured Site URL; invite callbacks that arrive at the website root are moved to `/admin` automatically.

An Auth invitation and administrator authorization are separate. Before the new user signs in, add the invited user's ID to `calendar_admins` through the existing administrator procedure. Do not weaken the table's Row Level Security policies or treat every authenticated account as an administrator.

From the **Public notices** tab, staff can create a draft, preview it, publish it, edit its content, replace its PDF, or archive it. The **Meetings** tab manages Board of Supervisors agendas and minutes. The **Document library** tab manages bids, budgets, forms, reports, and other standalone files.

Create and revoke administrators through the Lee County Supabase project's existing administrator procedure. Public sign-up should remain disabled.

## Add Adobe PDF accessibility auto-tagging

The `adobe-autotag` Edge Function sends an administrator-accessible PDF from
the private document bucket to Adobe PDF Accessibility Auto-Tag and saves the
tagged PDF and optional XLSX report back to Supabase Storage. The admin then
runs Adobe PDF Accessibility Checker automatically, receives passed, failed,
and manual-review counts, and can download the private JSON checker report.
Both Adobe operations use separate start and status requests so processing
does not hold one Edge Function request open long enough to reach the hosted
runtime timeout.

Set `ADOBE_PDF_SERVICES_CLIENT_ID` and `ADOBE_PDF_SERVICES_CLIENT_SECRET` as
Supabase Edge Function secrets, then deploy:

```bash
supabase functions deploy adobe-autotag
```

See [`supabase/functions/adobe-autotag/README.md`](supabase/functions/adobe-autotag/README.md)
for the request format. Adobe credentials must remain server-side and must
never use a `VITE_` environment variable.
