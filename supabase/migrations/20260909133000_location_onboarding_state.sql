create table if not exists public.location_onboarding_state (
  location_id uuid primary key references public.locations(id) on delete cascade,
  skipped_steps text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint location_onboarding_state_skipped_steps_check
    check (skipped_steps <@ array['reservations','events_experiences']::text[])
);

alter table public.location_onboarding_state enable row level security;

comment on table public.location_onboarding_state is
  'Server-managed owner onboarding preferences. Skipped optional steps remain available to complete later.';
