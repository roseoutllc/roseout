-- Universal reservation-discovery ingress contract.
-- Any location creation or material reservation/website visibility change is queued
-- here, so importers do not need to remember to call a provider-specific hook.

alter table public.locations
  drop constraint if exists locations_reservation_discovery_status_check;

alter table public.locations
  add constraint locations_reservation_discovery_status_check
  check (reservation_discovery_status is null or reservation_discovery_status in (
    'pending', 'found', 'not_found', 'blocked', 'failed', 'no_website', 'manual'
  ));

create or replace function public.queue_location_reservation_discovery()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  has_reservation boolean;
  has_website boolean;
  eligible boolean;
  material_change boolean;
begin
  has_reservation := coalesce(
    nullif(trim(new.reservation_external_url), ''),
    nullif(trim(new.external_reservation_url), ''),
    nullif(trim(new.reservation_provider_url), ''),
    nullif(trim(new.reservation_platform_url), ''),
    nullif(trim(new.reservation_url), ''),
    nullif(trim(new.reservation_link), ''),
    nullif(trim(new.booking_url), '')
  ) is not null;
  has_website := nullif(trim(coalesce(new.website, '')), '') is not null;
  eligible := coalesce(new.reservation_manual_override, false) = false
    and new.deleted_at is null
    and coalesce(new.is_hidden, false) = false
    and lower(coalesce(new.duplicate_status, '')) not in ('duplicate', 'possible_duplicate')
    and coalesce(new.is_demo, false) = false;

  if not eligible or has_reservation then
    return new;
  end if;

  if tg_op = 'INSERT' then
    material_change := true;
  else
    material_change := new.website is distinct from old.website
      or new.reservation_external_url is distinct from old.reservation_external_url
      or new.external_reservation_url is distinct from old.external_reservation_url
      or new.reservation_provider_url is distinct from old.reservation_provider_url
      or new.reservation_platform_url is distinct from old.reservation_platform_url
      or new.reservation_url is distinct from old.reservation_url
      or new.reservation_link is distinct from old.reservation_link
      or new.booking_url is distinct from old.booking_url
      or new.reservation_manual_override is distinct from old.reservation_manual_override
      or new.is_hidden is distinct from old.is_hidden
      or new.duplicate_status is distinct from old.duplicate_status
      or new.deleted_at is distinct from old.deleted_at;
  end if;

  if not material_change then
    return new;
  end if;

  if not has_website then
    new.reservation_discovery_status := 'no_website';
    new.reservation_discovery_next_retry_at := null;
    return new;
  end if;

  new.reservation_discovery_status := 'pending';
  new.reservation_discovery_checked_at := null;
  new.reservation_discovery_next_retry_at := now();
  new.reservation_discovery_stale_at := null;
  return new;
end;
$$;

drop trigger if exists trg_locations_reservation_discovery_ingress_insert on public.locations;
create trigger trg_locations_reservation_discovery_ingress_insert
before insert on public.locations
for each row
execute function public.queue_location_reservation_discovery();

drop trigger if exists trg_locations_reservation_discovery_ingress_update on public.locations;
create trigger trg_locations_reservation_discovery_ingress_update
before update of website, reservation_external_url, external_reservation_url,
  reservation_provider_url, reservation_platform_url, reservation_url,
  reservation_link, booking_url, reservation_manual_override, is_hidden,
  duplicate_status, deleted_at
on public.locations
for each row
execute function public.queue_location_reservation_discovery();

-- Failed network checks should retry sooner than a genuine not-found result.
create or replace function public.tighten_failed_reservation_discovery_retry()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  attempted_at timestamptz;
begin
  if new.reservation_discovery_status <> 'failed'
     or coalesce(new.reservation_manual_override, false) = true then
    return null;
  end if;
  attempted_at := coalesce(new.reservation_discovery_checked_at, new.reservation_discovery_last_attempt_at, now());
  update public.locations
  set reservation_discovery_next_retry_at = attempted_at + interval '1 day',
      gap_repair_next_attempt_at = attempted_at + interval '1 day'
  where id = new.id;
  return null;
end;
$$;

drop trigger if exists trg_locations_reservation_failed_retry on public.locations;
create trigger trg_locations_reservation_failed_retry
after insert or update of reservation_discovery_status, reservation_discovery_checked_at
on public.locations
for each row
when (new.reservation_discovery_status = 'failed')
execute function public.tighten_failed_reservation_discovery_retry();

-- Backfill the uncovered default state: pending rows with websites should be eligible now.
update public.locations
set reservation_discovery_next_retry_at = coalesce(reservation_discovery_next_retry_at, now())
where deleted_at is null
  and coalesce(reservation_manual_override, false) = false
  and coalesce(is_hidden, false) = false
  and lower(coalesce(duplicate_status, '')) not in ('duplicate', 'possible_duplicate')
  and nullif(trim(coalesce(website, '')), '') is not null
  and reservation_discovery_status = 'pending'
  and coalesce(
    nullif(trim(reservation_external_url), ''),
    nullif(trim(external_reservation_url), ''),
    nullif(trim(reservation_provider_url), ''),
    nullif(trim(reservation_platform_url), ''),
    nullif(trim(reservation_url), ''),
    nullif(trim(reservation_link), ''),
    nullif(trim(booking_url), '')
  ) is null;

update public.locations
set reservation_discovery_next_retry_at = least(
      coalesce(reservation_discovery_next_retry_at, now() + interval '1 day'),
      coalesce(reservation_discovery_last_attempt_at, reservation_discovery_checked_at, now()) + interval '1 day'
    ),
    gap_repair_next_attempt_at = least(
      coalesce(gap_repair_next_attempt_at, now() + interval '1 day'),
      coalesce(reservation_discovery_last_attempt_at, reservation_discovery_checked_at, now()) + interval '1 day'
    )
where deleted_at is null
  and coalesce(reservation_manual_override, false) = false
  and reservation_discovery_status = 'failed';

comment on function public.queue_location_reservation_discovery() is
  'Universal reservation-discovery ingress hook for imports, enrichment, manual/admin creation, and owner-managed location updates.';
