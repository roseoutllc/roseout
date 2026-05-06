-- RoseOut support ticket system tables.
-- Run this in Supabase SQL before enabling support tickets in production.

create extension if not exists pgcrypto;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique,
  requester_name text,
  requester_email text not null,
  requester_phone text,
  topic text default 'General Support',
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  source text default 'support_form',
  public_access_token text not null unique,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_type text not null default 'creator',
  author_name text,
  author_email text,
  author_phone text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_requester_email_idx
  on public.support_tickets (requester_email);

create index if not exists support_tickets_last_message_at_idx
  on public.support_tickets (last_message_at desc);

create index if not exists support_ticket_messages_ticket_id_idx
  on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
