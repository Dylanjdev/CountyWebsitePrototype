-- Repair the shared private bucket's public read policy after applying the
-- county documents, public notices, and meeting documents migrations.

begin;

drop policy if exists "Public can download published county documents" on storage.objects;
create policy "Public can download published county documents"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'county-documents'
  and (
    exists (
      select 1 from public.county_documents
      where storage_path = name and is_published = true
    )
    or exists (
      select 1 from public.public_notices
      where attachment_path = name
        and status = 'published'
        and (expires_at is null or expires_at >= current_date)
        and coalesce(posted_at, published_at::date, created_at::date) >= (current_date - interval '3 years')::date
    )
    or exists (
      select 1 from public.meeting_documents
      where storage_path = name
        and is_published = true
        and meeting_date >= (current_date - interval '3 years')::date
    )
  )
);

commit;
