-- Lee County Board of Supervisors agenda and minutes archive.
-- Run after county_documents.sql and public_notices.sql.

begin;

create table if not exists public.meeting_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  meeting_date date not null check (meeting_date >= '2016-01-01'),
  meeting_type text not null check (char_length(btrim(meeting_type)) between 1 and 120),
  document_type text not null check (document_type in ('Agenda', 'Minutes')),
  external_url text unique check (external_url is null or char_length(external_url) <= 2000),
  file_name text check (file_name is null or char_length(file_name) <= 240),
  storage_path text unique check (storage_path is null or char_length(storage_path) <= 500),
  mime_type text check (mime_type is null or mime_type = 'application/pdf'),
  file_size bigint check (file_size is null or (file_size > 0 and file_size <= 26214400)),
  is_published boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    external_url is not null
    or (storage_path is not null and file_name is not null and mime_type is not null and file_size is not null)
  ),
  check (
    (storage_path is null and file_name is null and mime_type is null and file_size is null)
    or (storage_path is not null and file_name is not null and mime_type is not null and file_size is not null)
  )
);

create index if not exists meeting_documents_public_idx
  on public.meeting_documents (meeting_date desc, meeting_type, document_type)
  where is_published = true;

create or replace function private.set_meeting_document_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_meeting_document_updated_at on public.meeting_documents;
create trigger set_meeting_document_updated_at
before update on public.meeting_documents
for each row execute function private.set_meeting_document_updated_at();

alter table public.meeting_documents enable row level security;

revoke all on table public.meeting_documents from anon, authenticated;
grant select on table public.meeting_documents to anon;
grant select, insert, update, delete on table public.meeting_documents to authenticated;

drop policy if exists "Published meeting documents are public" on public.meeting_documents;
create policy "Published meeting documents are public"
on public.meeting_documents
for select
to anon, authenticated
using (
  is_published = true
  and meeting_date >= (current_date - interval '3 years')::date
);

drop policy if exists "County admins can read every meeting document" on public.meeting_documents;
create policy "County admins can read every meeting document"
on public.meeting_documents
for select
to authenticated
using ((select private.is_calendar_admin()));

drop policy if exists "County admins can create meeting documents" on public.meeting_documents;
create policy "County admins can create meeting documents"
on public.meeting_documents
for insert
to authenticated
with check ((select private.is_calendar_admin()) and uploaded_by = (select auth.uid()));

drop policy if exists "County admins can update meeting documents" on public.meeting_documents;
create policy "County admins can update meeting documents"
on public.meeting_documents
for update
to authenticated
using ((select private.is_calendar_admin()))
with check ((select private.is_calendar_admin()) and uploaded_by = (select auth.uid()));

drop policy if exists "County admins can delete meeting documents" on public.meeting_documents;
create policy "County admins can delete meeting documents"
on public.meeting_documents
for delete
to authenticated
using ((select private.is_calendar_admin()));

-- Keep the shared bucket private. Visitors can read only files connected to a
-- currently published record in one of the three public content tables.
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

-- Retain older database records for administrators while removing them from
-- the public site and public file access.
update public.meeting_documents
set is_published = false
where is_published = true
  and meeting_date < (current_date - interval '3 years')::date;

commit;
