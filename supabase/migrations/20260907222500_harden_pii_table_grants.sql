-- Defense in depth for high-value PII tables.
--
-- Several tables had broad SQL grants left over from access-parity replay while RLS
-- still denied ordinary clients. Make the SQL grants match the actual application
-- architecture so a future RLS policy change cannot accidentally expose PII.

set search_path = public, pg_catalog;

-- Server-only reservation, support, ticketing and booking records.
revoke all privileges on table public.location_reservations from PUBLIC, anon, authenticated;
revoke all privileges on table public.reservations from PUBLIC, anon, authenticated;
revoke all privileges on table public.support_tickets from PUBLIC, anon, authenticated;
revoke all privileges on table public.support_ticket_messages from PUBLIC, anon, authenticated;
revoke all privileges on table public.event_ticket_orders from PUBLIC, anon, authenticated;
revoke all privileges on table public.event_tickets from PUBLIC, anon, authenticated;
revoke all privileges on table public.experience_bookings from PUBLIC, anon, authenticated;
revoke all privileges on table public.career_application_files from PUBLIC, anon, authenticated;

grant all privileges on table public.location_reservations to service_role;
grant all privileges on table public.reservations to service_role;
grant all privileges on table public.support_tickets to service_role;
grant all privileges on table public.support_ticket_messages to service_role;
grant all privileges on table public.event_ticket_orders to service_role;
grant all privileges on table public.event_tickets to service_role;
grant all privileges on table public.experience_bookings to service_role;
grant all privileges on table public.career_application_files to service_role;

-- Applicants may read/update their own application through existing ownership RLS;
-- public submissions themselves continue to go through the server-side application API.
revoke all privileges on table public.career_applications from PUBLIC, anon, authenticated;
grant select, update on table public.career_applications to authenticated;
grant all privileges on table public.career_applications to service_role;

-- CRM contacts remain available only to authenticated CRM admins through crm_admin_all RLS.
revoke all privileges on table public.crm_contacts from PUBLIC, anon, authenticated;
grant select, insert, update, delete on table public.crm_contacts to authenticated;
grant all privileges on table public.crm_contacts to service_role;
