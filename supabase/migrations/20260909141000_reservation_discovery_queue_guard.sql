-- Ensure every eligible location creation/update path enters reservation discovery.
-- This is intentionally source-agnostic so future importers cannot bypass discovery.

create or replace function public.apply_reservation_discovery_queue_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  has_reservation_link boolean;
  website_changed boolean;
begin
  has_reservation_link := coalesce(
    nullif(new.external_reservation_url, ''),
    nullif(new.reservation_external_url, ''),
    nullif(new.reservation_provider_url, ''),
    nullif(new.reservation_platform_url, ''),
    nullif(new.reservation_url, ''),
    nullif(new.reservation_link, ''),
    nullif(new.booking_url, '')
  ) is not null;

  website_changed := tg_op = 'INSERT'
    or new.website is distinct from old.website;

  -- Owner/manual/internal reservation choices are authoritative and never queued.
  if coalesce(new.reservation_manual_override, false)
     or coalesce(new.uses_internal_reservations, false)
     or coalesce(new.internal_reservations_enabled, false)
     or lower(coalesce(new.reservation_source, '')) in ('internal', 'both', 'manual') then
    return new;
  end if;

  -- Existing external booking evidence is already actionable.
  if has_reservation_link then
    return new;
  end if;

  -- Ineligible catalog records should not consume crawler capacity.
  if new.deleted_at is not null
     or coalesce(new.is_demo, false)
     or coalesce(new.is_hidden, false)
     or lower(coalesce(new.duplicate_status, '')) = 'duplicate' then
    return new;
  end if;

  if nullif(trim(new.website), '') is null then
    if tg_op = 'INSERT' or website_changed then
      new.reservation_discovery_status := 'no_website';
      new.reservation_discovery_next_retry_at := null;
    end if;
    return new;
  end if;

  -- New locations and newly supplied/changed websites must be checked promptly.
  if tg_op = 'INSERT'
     or website_changed
     or lower(coalesce(new.reservation_discovery_status, '')) in ('', 'no_website') then
    new.reservation_discovery_status := 'pending';
    new.reservation_discovery_next_retry_at := now();
    new.reservation_discovery_checked_at := null;
    new.reservation_discovery_notes := case
      when tg_op = 'INSERT' then 'Queued automatically when location entered the catalog.'
      else 'Queued automatically after website change.'
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_locations_reservation_discovery_queue_guard on public.locations;
create trigger trg_locations_reservation_discovery_queue_guard
before insert or update of website, reservation_manual_override, uses_internal_reservations,
  internal_reservations_enabled, reservation_source, external_reservation_url,
  reservation_external_url, reservation_provider_url, reservation_platform_url,
  reservation_url, reservation_link, booking_url, deleted_at, is_demo, is_hidden,
  duplicate_status
on public.locations
for each row
execute function public.apply_reservation_discovery_queue_guard();

comment on function public.apply_reservation_discovery_queue_guard() is
  'Source-agnostic guard that queues eligible locations for reservation discovery so import/admin/owner creation paths cannot bypass booking-link discovery.';
