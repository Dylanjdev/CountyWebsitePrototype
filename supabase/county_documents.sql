-- Lee County public document library and administrator uploads.
-- Run this file in the Supabase project configured for the Lee County website.
-- It reuses public.calendar_admins and private.is_calendar_admin().

begin;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.county_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text check (description is null or char_length(description) <= 2000),
  category text not null check (category in (
    'Public Notices',
    'Meeting Minutes',
    'Bid Notices',
    'County Budgets',
    'Forms',
    'Reports',
    'Policies',
    'Other'
  )),
  document_date date not null default current_date,
  file_name text not null check (char_length(file_name) between 1 and 240),
  storage_path text not null unique check (char_length(storage_path) between 1 and 500),
  mime_type text not null check (char_length(mime_type) between 1 and 160),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  is_published boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists county_documents_public_idx
  on public.county_documents (category, document_date desc, created_at desc)
  where is_published = true;

create or replace function private.set_county_document_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_county_document_updated_at on public.county_documents;
create trigger set_county_document_updated_at
before update on public.county_documents
for each row execute function private.set_county_document_updated_at();

alter table public.county_documents enable row level security;

revoke all on table public.county_documents from anon, authenticated;
grant select on table public.county_documents to anon;
grant select, insert, update, delete on table public.county_documents to authenticated;

drop policy if exists "Published county documents are public" on public.county_documents;
create policy "Published county documents are public"
on public.county_documents
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "County admins can read every document" on public.county_documents;
create policy "County admins can read every document"
on public.county_documents
for select
to authenticated
using ((select private.is_calendar_admin()));

drop policy if exists "County admins can create documents" on public.county_documents;
create policy "County admins can create documents"
on public.county_documents
for insert
to authenticated
with check ((select private.is_calendar_admin()) and uploaded_by = (select auth.uid()));

drop policy if exists "County admins can update documents" on public.county_documents;
create policy "County admins can update documents"
on public.county_documents
for update
to authenticated
using ((select private.is_calendar_admin()))
with check ((select private.is_calendar_admin()));

drop policy if exists "County admins can delete documents" on public.county_documents;
create policy "County admins can delete documents"
on public.county_documents
for delete
to authenticated
using ((select private.is_calendar_admin()));

-- A private bucket keeps drafts inaccessible. Public access is granted only
-- when a matching metadata row has been published.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'county-documents',
  'county-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can download published county documents" on storage.objects;
create policy "Public can download published county documents"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'county-documents'
  and exists (
    select 1
    from public.county_documents
    where storage_path = name
      and is_published = true
  )
);

drop policy if exists "County admins can read every county document file" on storage.objects;
create policy "County admins can read every county document file"
on storage.objects
for select
to authenticated
using (bucket_id = 'county-documents' and (select private.is_calendar_admin()));

drop policy if exists "County admins can upload county document files" on storage.objects;
create policy "County admins can upload county document files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'county-documents' and (select private.is_calendar_admin()));

drop policy if exists "County admins can update county document files" on storage.objects;
create policy "County admins can update county document files"
on storage.objects
for update
to authenticated
using (bucket_id = 'county-documents' and (select private.is_calendar_admin()))
with check (bucket_id = 'county-documents' and (select private.is_calendar_admin()));

drop policy if exists "County admins can delete county document files" on storage.objects;
create policy "County admins can delete county document files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'county-documents' and (select private.is_calendar_admin()));

commit;
