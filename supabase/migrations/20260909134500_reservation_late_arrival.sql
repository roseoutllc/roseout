alter table if exists public.location_reservations
  add column if not exists late_arrival_reported_at timestamptz,
  add column if not exists late_arrival_minutes integer,
  add column if not exists late_arrival_eta text,
  add column if not exists late_arrival_note text;

alter table if exists public.location_reservations
  drop constraint if exists location_reservations_late_arrival_minutes_check;

alter table if exists public.location_reservations
  add constraint location_reservations_late_arrival_minutes_check
  check (late_arrival_minutes is null or (late_arrival_minutes >= 1 and late_arrival_minutes <= 240));

comment on column public.location_reservations.late_arrival_reported_at is 'When the guest reported being delayed. This does not change reservation_time.';
comment on column public.location_reservations.late_arrival_eta is 'Guest-reported estimated arrival time in HH:MM form when known.';
