-- Lock privileged SECURITY DEFINER RPCs behind the service role.
-- These functions either mutate operational state or can return internal location data.
-- Public browser/API flows must go through server routes that apply authentication,
-- authorization and distributed rate limiting before invoking privileged RPCs.

revoke execute on function public.enqueue_nightly_location_search_profile_run(integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.enqueue_nightly_location_search_profile_run(integer)
  to service_role;

revoke execute on function public.enterprise_search_profile_locations(
  text, text, text[], text, text, text, text, text, text,
  double precision, double precision, double precision, integer
) from PUBLIC, anon, authenticated;
grant execute on function public.enterprise_search_profile_locations(
  text, text, text[], text, text, text, text, text, text,
  double precision, double precision, double precision, integer
) to service_role;

revoke execute on function public.book_large_group_live(
  uuid, text, text, text, text, date, time without time zone, integer,
  integer, text, text, text, text, timestamp with time zone
) from PUBLIC, anon, authenticated;
grant execute on function public.book_large_group_live(
  uuid, text, text, text, text, date, time without time zone, integer,
  integer, text, text, text, text, timestamp with time zone
) to service_role;

revoke execute on function public.track_location_analytics_event(
  uuid, text, text, text, text, text, text, text, text, text, jsonb
) from PUBLIC, anon, authenticated;
grant execute on function public.track_location_analytics_event(
  uuid, text, text, text, text, text, text, text, text, text, jsonb
) to service_role;
