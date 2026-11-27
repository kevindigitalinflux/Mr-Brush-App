-- Stage 0 of the cover automation plan: close two live holes on public.profiles.
-- 1) Any logged-in user could UPDATE their own role / company_id / supervisor_id (column privileges were too wide;
--    the RLS WITH CHECK only validated language_preference).
-- 2) The "client reads cleaner names" policy exposes whole rows, including phone, to clients.
--
-- Checked 2026-11-26 before writing/applying:
--  * Live ACL of public.profiles (relacl): {postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--    authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}. No PUBLIC grant, no column-level ACLs.
--  * No non-internal triggers on profiles, no views over profiles, no function bodies mentioning phone.
--  * authenticator is a member of anon, authenticated, service_role (normal Supabase setup).
--  * App code: only direct profiles update is Login.tsx:82 (language_preference); every profiles query names its
--    columns; none selects phone or uses select('*'). n8n uses service_role, whose grants are not touched.
-- Review: Codex 2026-11-26 verdict "apply with changes" (assertions + exact rollback), both added below.
-- Residual (accepted, out of scope): clients can still read contract_type, contracted_hours, supervisor_id of
-- same-company cleaners through the existing client policy. Revisit with the stage 1 view/worker_details work.

begin;

-- (1) Self-update: language_preference only.
revoke update on public.profiles from authenticated, anon;
grant update (language_preference) on public.profiles to authenticated;

-- Nothing in the app inserts, deletes or truncates profiles through the API (RLS has no such policies).
revoke insert, delete, truncate, trigger, references on public.profiles from authenticated, anon;

-- (2) Phone is no longer readable through the API. Table-wide SELECT is replaced by a column list without phone.
--     NOTE: any column added to profiles later needs its own explicit GRANT SELECT (column) to be readable.
revoke select on public.profiles from authenticated, anon;
grant select (id, display_id, role, full_name, language_preference, company_id, is_active,
              created_at, contract_type, supervisor_id, contracted_hours, tutorial_seen_at)
  on public.profiles to authenticated;

-- Assertions: abort (roll back) unless the effective privileges are exactly what we intend.
do $$
declare
  col text;
  allowed_select text[] := array['id','display_id','role','full_name','language_preference','company_id','is_active',
                                 'created_at','contract_type','supervisor_id','contracted_hours','tutorial_seen_at'];
  p text;
begin
  for col in select attname from pg_attribute
              where attrelid = 'public.profiles'::regclass and attnum > 0 and not attisdropped loop
    -- anon: nothing at all
    foreach p in array array['SELECT','UPDATE','INSERT','REFERENCES'] loop
      if has_column_privilege('anon', 'public.profiles', col, p) then
        raise exception 'anon still has % on profiles.%', p, col;
      end if;
    end loop;
    -- authenticated: exact SELECT allowlist
    if has_column_privilege('authenticated', 'public.profiles', col, 'SELECT') <> (col = any (allowed_select)) then
      raise exception 'authenticated SELECT on profiles.% is not as intended', col;
    end if;
    -- authenticated: UPDATE only on language_preference
    if has_column_privilege('authenticated', 'public.profiles', col, 'UPDATE') <> (col = 'language_preference') then
      raise exception 'authenticated UPDATE on profiles.% is not as intended', col;
    end if;
    if has_column_privilege('authenticated', 'public.profiles', col, 'INSERT') then
      raise exception 'authenticated still has INSERT on profiles.%', col;
    end if;
    -- service_role keeps full access (n8n)
    if not (has_column_privilege('service_role', 'public.profiles', col, 'SELECT')
        and has_column_privilege('service_role', 'public.profiles', col, 'UPDATE')) then
      raise exception 'service_role lost access to profiles.%', col;
    end if;
  end loop;
  foreach p in array array['DELETE','TRUNCATE','TRIGGER','REFERENCES','INSERT'] loop
    if has_table_privilege('anon', 'public.profiles', p) or has_table_privilege('authenticated', 'public.profiles', p) then
      raise exception 'a table-level % privilege survives for anon/authenticated', p;
    end if;
  end loop;
end $$;

commit;

-- ROLLBACK (emergency only: restores the vulnerable baseline captured on 2026-11-26 from pg_class.relacl,
-- anon and authenticated both had arwdDxtm granted by postgres, and there were no column-level ACLs):
-- begin;
-- revoke select (id, display_id, role, full_name, language_preference, company_id, is_active,
--                created_at, contract_type, supervisor_id, contracted_hours, tutorial_seen_at) on public.profiles from authenticated;
-- revoke update (language_preference) on public.profiles from authenticated;
-- grant all on public.profiles to anon, authenticated;
-- commit;
-- Then confirm: select relacl from pg_class where oid = 'public.profiles'::regclass;  -- same four entries as above.
