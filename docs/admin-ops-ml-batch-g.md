# Admin Ops / ML Batch G

Batch G reduces privileged Admin data reads and mutation response surfaces across eight operational, machine-learning, production-readiness, reservation-discovery, and Google-enrichment routes.

## Scope

- `app/api/admin/backfill-reservation-links/route.ts`
- `app/api/admin/cleanup-locations/route.ts`
- `app/api/admin/ml/recalculate-location-scores/route.ts`
- `app/api/admin/ml/recalculate-phase2/route.ts`
- `app/api/admin/ml/recalculate-review-intelligence/route.ts`
- `app/api/admin/production-finish-line/route.ts`
- `app/api/admin/production-finish-line/run-gate/route.ts`
- `app/api/admin/restaurants/enrich-google-metadata/route.ts`

## Security boundaries

- Replace broad service-role `select(*)` reads with explicit projections.
- Keep ML scoring reads limited to required search, analytics, outing, and approved-review signals rather than user/session/contact fields.
- Keep production-finish-line responses on explicit collection projections and allowlisted writes.
- Bound free text and diagnostic/error payloads returned to Admin clients.
- Keep reservation-link backfill on table-specific schemas so owner/billing/claim data is not pulled into the worker.
- Reuse the canonical restaurant-to-location projection during Google enrichment instead of returning a complete restaurant row after mutation.

Regression coverage is in `scripts/audit-admin-ops-ml-batch-g-pii.mjs` and runs in the Admin dashboard hardening workflow.
