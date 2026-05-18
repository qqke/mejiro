-- Login diagnostics for Supabase Auth errors such as:
--   Database error querying schema
--
-- Run this in the Supabase SQL Editor. It only reads metadata and does not
-- modify the database.

select
  'auth_schema_usage' as check_name,
  has_schema_privilege('authenticator', 'auth', 'USAGE') as ok,
  'authenticator needs USAGE on auth for Supabase Auth internals. If false on hosted Supabase, contact Supabase support.' as note;

select
  'auth_tables_rls' as check_name,
  tablename,
  rowsecurity as rls_enabled,
  case
    when rowsecurity then 'Unexpected for Auth-managed tables. Hosted projects usually require Supabase support to repair this.'
    else 'ok'
  end as note
from pg_tables
where schemaname = 'auth'
order by tablename;

select
  'profile_trigger' as check_name,
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
      and not t.tgisinternal
  ) as ok,
  'The project expects this trigger to create public.profiles rows for new Auth users.' as note;

select
  'profile_trigger_function' as check_name,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app_private'
      and p.proname = 'handle_new_user'
  ) as ok,
  'Missing means supabase/schema.sql or the migrations were not fully applied.' as note;

select
  'profiles_grants' as check_name,
  has_schema_privilege('authenticated', 'public', 'USAGE') as authenticated_public_usage,
  has_table_privilege('authenticated', 'public.profiles', 'SELECT') as authenticated_profiles_select,
  has_table_privilege('authenticated', 'public.profiles', 'INSERT') as authenticated_profiles_insert,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as authenticated_profiles_update;

select
  'non_supabase_owned_auth_objects' as check_name,
  oid::regclass::text as object_name,
  pg_get_userbyid(relowner) as owner_name,
  'Custom tables in auth can break or be removed by Supabase platform restrictions; move app tables to public/app_private.' as note
from pg_class
where relnamespace = 'auth'::regnamespace
  and relowner <> 'supabase_auth_admin'::regrole
order by object_name;
