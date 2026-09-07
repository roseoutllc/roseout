-- Restore the intended least-privilege boundary for privileged SECURITY DEFINER RPCs.
--
-- These functions either write privileged data or can expose full internal location rows.
-- They are invoked by trusted server/service-role code and must not be directly callable
-- through the public Data API by anonymous or ordinary authenticated users.

set search_path = public, pg_catalog;

revoke all on function public.enqueue_nightly_location_search_profile_run(integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.enqueue_nightly_location_search_profile_run(integer)
  to service_role;

revoke all on function public.enterprise_search_profile_locations(
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  double precision,
  integer
) from PUBLIC, anon, authenticated;
grant execute on function public.enterprise_search_profile_locations(
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  double precision,
  integer
) to service_role;

revoke all on function public.book_large_group_live(
  uuid,
  text,
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  integer,
  text,
  text,
  text,
  text,
  timestamp with time zone
) from PUBLIC, anon, authenticated;
grant execute on function public.book_large_group_live(
  uuid,
  text,
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  integer,
  text,
  text,
  text,
  text,
  timestamp with time zone
) to service_role;

revoke all on function public.track_location_analytics_event(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from PUBLIC, anon, authenticated;
grant execute on function public.track_location_analytics_event(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;
