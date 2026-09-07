# Oregon DR recovery — 2026-09-07

## Trigger

The Virginia → Oregon logical replication lane was unhealthy:

- Virginia slot `theouthaven_va_to_or_dr_slot` was inactive with `wal_status = lost` / `wal_removed`.
- Virginia publication covered 462 of 480 eligible public application tables.
- Oregon had 474 eligible tables and a disabled 462-table subscription.

## Pre-reseed repair

Before arming the destructive reseed path:

- Applied the missing Reserve host-operations schema to Oregon, bringing Oregon to 480 eligible tables.
- Normalized `reserve_set_staff_pin`, `reserve_verify_staff_pin`, and `reserve_assign_resource_atomic` to the Virginia definitions.
- Added the 18 missing eligible Virginia tables to `theouthaven_dr_publication` after verifying each has a primary key.

## Workflow hardening

The lost-slot workflow previously hardcoded the old 462-table topology. It now:

- accepts the disabled pre-recovery subscriber based on self-consistent ready/total state instead of an old fixed count;
- requires the replacement subscription to exactly match Oregon's complete eligible table set by count and fingerprint;
- reports recovery without embedding a stale table count.

The recovery remains fail-closed on exact Virginia/Oregon writable catalog parity, Virginia-primary mode, cron safety, publication completeness, replica identity safety, and disabled forward DR schedules.
