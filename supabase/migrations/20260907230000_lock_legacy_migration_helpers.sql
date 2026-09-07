-- Remove application-role access from one-time regional migration helpers and
-- eliminate source connection material that was retained in a database function.
-- Also pin the remaining Reserve trigger function's search_path.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'migration_work') THEN
    EXECUTE 'REVOKE USAGE ON SCHEMA migration_work FROM PUBLIC, anon, authenticated, service_role';
    EXECUTE 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA migration_work FROM PUBLIC, anon, authenticated, service_role';

    IF to_regprocedure('migration_work.source_connstr()') IS NOT NULL THEN
      EXECUTE 'CREATE OR REPLACE FUNCTION migration_work.source_connstr() RETURNS text LANGUAGE sql STABLE SET search_path = pg_catalog AS ''select null::text''';
      EXECUTE 'REVOKE EXECUTE ON FUNCTION migration_work.source_connstr() FROM PUBLIC, anon, authenticated, service_role';
    END IF;
  END IF;

  IF to_regprocedure('public.score_reserve_opportunity()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.score_reserve_opportunity() SET search_path = public, pg_temp';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.score_reserve_opportunity() FROM PUBLIC, anon, authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'toh_region_migration_reader') THEN
    EXECUTE 'ALTER ROLE toh_region_migration_reader NOLOGIN';
  END IF;
END
$$;
