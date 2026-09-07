-- Public media buckets must not accept SVG because SVG is active content when
-- opened directly. Keep private applicant documents private and leave their
-- document MIME allowlist unchanged.

update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']::text[]
where id in ('email-assets','reservation-assets','user-avatars');

-- Defense in depth: applicant resumes contain PII and must never become public.
update storage.buckets
set public = false
where id = 'career-resumes';
