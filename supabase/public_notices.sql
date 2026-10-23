-- Lee County public notice publishing workflow.
-- Run county_documents.sql first. This migration reuses its private storage
-- bucket and the existing calendar administrator authorization function.

begin;

create table if not exists public.public_notices (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  notice_type text not null check (char_length(btrim(notice_type)) between 1 and 80),
  summary text not null check (char_length(btrim(summary)) between 1 and 1200),
  body text check (body is null or char_length(body) <= 10000),
  posted_at date,
  deadline_at timestamp without time zone,
  expires_at date,
  contact_name text check (contact_name is null or char_length(contact_name) <= 180),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 40),
  submission_address text check (submission_address is null or char_length(submission_address) <= 500),
  action_url text check (action_url is null or char_length(action_url) <= 2000),
  action_label text check (action_label is null or char_length(action_label) <= 80),
  attachment_name text check (attachment_name is null or char_length(attachment_name) <= 240),
  attachment_path text unique check (attachment_path is null or char_length(attachment_path) <= 500),
  attachment_mime_type text check (attachment_mime_type is null or attachment_mime_type = 'application/pdf'),
  attachment_size bigint check (attachment_size is null or (attachment_size > 0 and attachment_size <= 26214400)),
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (attachment_path is null and attachment_name is null and attachment_mime_type is null and attachment_size is null)
    or
    (attachment_path is not null and attachment_name is not null and attachment_mime_type is not null and attachment_size is not null)
  )
);

create index if not exists public_notices_public_idx
  on public.public_notices (is_featured desc, posted_at desc, created_at desc)
  where status = 'published';

create index if not exists public_notices_admin_idx
  on public.public_notices (updated_at desc);

create or replace function private.set_public_notice_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_public_notice_updated_at on public.public_notices;
create trigger set_public_notice_updated_at
before update on public.public_notices
for each row execute function private.set_public_notice_updated_at();

alter table public.public_notices enable row level security;

revoke all on table public.public_notices from anon, authenticated;
grant select on table public.public_notices to anon;
grant select, insert, update, delete on table public.public_notices to authenticated;

drop policy if exists "Published and unexpired notices are public" on public.public_notices;
create policy "Published and unexpired notices are public"
on public.public_notices
for select
to anon, authenticated
using (
  status = 'published'
  and (expires_at is null or expires_at >= current_date)
  and coalesce(posted_at, published_at::date, created_at::date) >= (current_date - interval '3 years')::date
);

drop policy if exists "County admins can read every notice" on public.public_notices;
create policy "County admins can read every notice"
on public.public_notices
for select
to authenticated
using ((select private.is_calendar_admin()));

drop policy if exists "County admins can create notices" on public.public_notices;
create policy "County admins can create notices"
on public.public_notices
for insert
to authenticated
with check (
  (select private.is_calendar_admin())
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

drop policy if exists "County admins can update notices" on public.public_notices;
create policy "County admins can update notices"
on public.public_notices
for update
to authenticated
using ((select private.is_calendar_admin()))
with check ((select private.is_calendar_admin()) and updated_by = (select auth.uid()));

drop policy if exists "County admins can delete notices" on public.public_notices;
create policy "County admins can delete notices"
on public.public_notices
for delete
to authenticated
using ((select private.is_calendar_admin()));

-- Expand the existing private bucket's read policy so published notice PDFs
-- are downloadable while draft and archived attachments remain private.
drop policy if exists "Public can download published county documents" on storage.objects;
create policy "Public can download published county documents"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'county-documents'
  and (
    exists (
      select 1
      from public.county_documents
      where storage_path = name
        and is_published = true
    )
    or exists (
      select 1
      from public.public_notices
      where attachment_path = name
        and status = 'published'
        and (expires_at is null or expires_at >= current_date)
        and coalesce(posted_at, published_at::date, created_at::date) >= (current_date - interval '3 years')::date
    )
  )
);

-- Preserve the notices from the former website on first setup. Re-running the
-- migration never overwrites changes made by county staff.
insert into public.public_notices (
  slug, title, notice_type, summary, body, posted_at, deadline_at, expires_at,
  contact_name, contact_phone, action_url, action_label, is_featured, status,
  published_at
)
values
  (
    'website-redesign-and-development',
    'Website Redesign and Development',
    'Request for proposals',
    'The County of Lee, Virginia is soliciting proposals from qualified firms or individuals to provide website redesign and development services.',
    'Firms or individuals submitting proposals must meet the minimum qualifications and criteria described in the full request. Selection will be based on the proposal that best meets the needs of the county. Price will be considered, but will not be the sole determining factor.',
    '2026-09-21',
    '2026-10-15 14:00:00',
    '2026-10-15',
    'Jerrica Eldridge-Carter, Purchasing Clerk',
    '(276) 346-7714',
    'https://www.leecova.com/_files/ugd/0394e7_3ccd9a52796544be9420115969ace47c.pdf',
    'View full RFP (PDF)',
    true,
    'published',
    now()
  ),
  (
    'virginia-2026-roadway-safety-survey',
    'Virginia 2026 Roadway Safety Survey',
    'Public input requested',
    'The Virginia Department of Transportation and the Virginia Strategic Highway Safety Plan Steering Committee are seeking public input to help update Virginia’s 2027–2031 Strategic Highway Safety Plan.',
    'Residents are encouraged to complete and share the survey so the plan reflects a broad and diverse group of Virginians.',
    null,
    null,
    null,
    null,
    null,
    'https://publicinput.com/i31756',
    'Take the survey',
    false,
    'published',
    now()
  ),
  (
    'well-repair-and-maintenance',
    'Well Repair and Maintenance',
    'As-needed services',
    'Lee County is seeking as-needed services for residential wells located near the Lee County Transfer Station in Jonesville, Virginia.',
    'Services may include pump repair or replacement and other well maintenance. Qualified and interested entities may submit a statement to the Lee County Administrator’s Office, Room 111, Lee County Courthouse, P.O. Box 367, Jonesville, VA 24263.',
    null,
    null,
    null,
    'Clint Carter, County Administrator',
    '(276) 346-7714',
    null,
    null,
    false,
    'published',
    now()
  ),
  (
    'second-amendment-commitment',
    'Commitment to the Second Amendment',
    'Board statement',
    'The Lee County Board of Supervisors affirms its strong commitment to the Second Amendment and to the citizens of Lee County.',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    false,
    'published',
    now()
  )
on conflict (slug) do nothing;

-- Keep older records available to county administrators while automatically
-- removing them and their attachments from the public website.
update public.public_notices
set status = 'archived', is_featured = false
where status = 'published'
  and coalesce(posted_at, published_at::date, created_at::date) < (current_date - interval '3 years')::date;

commit;
