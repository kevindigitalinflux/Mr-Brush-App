-- Facility guide (first use: Journey London Office cover guide).
-- Guide text, including door/alarm codes, lives ONLY in this table (RLS) and the private
-- storage bucket below. The seed content is kept OUT of git on purpose (it contains codes).
-- Run once against bstohwxzufebufbybxtd.

create table if not exists public.facility_guide_sections (
  id          uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  sort        int  not null,
  slug        text not null,
  title       jsonb not null,            -- {"en": "...", "es": "..."}
  summary     jsonb,                     -- same shape, optional
  time_label  text,                      -- e.g. "06:45 - 08:00"
  steps       jsonb not null default '[]'::jsonb,
  -- step shape: {"t":{en,es}, "code":"1234", "code_label":{en,es}, "warn":{en,es},
  --              "photos":["file.jpg"], "contact":{"name","phone","email"}}
  created_at  timestamptz not null default now(),
  unique (facility_id, slug)
);

alter table public.facility_guide_sections enable row level security;

-- Who may read a facility's guide: its supervisors, its cleaners (hours row), and any
-- cleaner with a recent or future shift there. SECURITY DEFINER because cleaners cannot
-- read cleaner_facility_hours or supervisor_facilities directly.
create or replace function public.can_view_facility_guide(fac text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.supervisor_facilities sf
                  where sf.profile_id = auth.uid() and sf.facility_id::text = fac)
      or exists (select 1 from public.cleaner_facility_hours h
                  where h.cleaner_id = auth.uid() and h.facility_id::text = fac)
      or exists (select 1 from public.job_zones z join public.jobs j on j.id = z.job_id
                  where z.cleaner_id = auth.uid() and j.facility_id::text = fac
                    and j.scheduled_date >= current_date - 14);
$$;

revoke all on function public.can_view_facility_guide(text) from public, anon;
grant execute on function public.can_view_facility_guide(text) to authenticated;

drop policy if exists "facility_guide_sections: staff read" on public.facility_guide_sections;
create policy "facility_guide_sections: staff read" on public.facility_guide_sections
  for select to authenticated
  using (public.can_view_facility_guide(facility_id::text));
-- No insert/update/delete policies: content is changed by an admin via SQL only.

-- Private bucket; files are stored as <facility_id>/<file>.jpg and served by signed URLs.
insert into storage.buckets (id, name, public)
values ('facility-guide', 'facility-guide', false)
on conflict (id) do nothing;

drop policy if exists "facility-guide: staff read" on storage.objects;
create policy "facility-guide: staff read" on storage.objects
  for select to authenticated
  using (bucket_id = 'facility-guide'
         and public.can_view_facility_guide((storage.foldername(name))[1]));
