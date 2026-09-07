create or replace function public.consume_api_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_start timestamptz;
  v_expires_at timestamptz;
  v_count integer;
begin
  if p_key is null or pg_catalog.length(pg_catalog.btrim(p_key)) = 0 then raise exception 'rate limit key is required'; end if;
  if p_limit < 1 or p_window_seconds < 1 then raise exception 'invalid rate limit configuration'; end if;
  v_window_start := pg_catalog.to_timestamp(pg_catalog.floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  v_expires_at := v_window_start + pg_catalog.make_interval(secs => p_window_seconds);
  insert into public.api_rate_limits(rate_key, window_start, request_count, expires_at)
  values (pg_catalog.left(p_key, 250), v_window_start, 1, v_expires_at)
  on conflict (rate_key, window_start) do update set request_count = public.api_rate_limits.request_count + 1, expires_at = excluded.expires_at
  returning request_count into v_count;
  delete from public.api_rate_limits where expires_at < v_now - interval '1 hour';
  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  retry_after_seconds := greatest(1, ceil(extract(epoch from (v_expires_at - v_now)))::integer);
  return next;
end;
$$;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
