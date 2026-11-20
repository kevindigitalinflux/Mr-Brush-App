-- Cleaner tutorial video: remember who has seen / skipped the prompt.
-- NOT YET APPLIED. Review, then run once against bstohwxzufebufbybxtd.
alter table public.profiles add column if not exists tutorial_seen_at timestamptz;

-- Cleaners cannot be trusted with a broad UPDATE on profiles, so expose one narrow RPC
-- that can only stamp the caller's own row.
create or replace function public.mark_tutorial_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set tutorial_seen_at = coalesce(tutorial_seen_at, now())
   where id = auth.uid();
$$;

revoke all on function public.mark_tutorial_seen() from public, anon;
grant execute on function public.mark_tutorial_seen() to authenticated;
