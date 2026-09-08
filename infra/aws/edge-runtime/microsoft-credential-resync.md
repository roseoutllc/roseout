# Virginia Microsoft credential resync

This marker intentionally triggers the existing AWS edge-runtime deployment workflow so the active Virginia runtime secret is rebuilt from the production credential authority.

The edge-runtime workflow already maps the production `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET` values into `/theouthaven/production/edge-runtime/env` in `us-east-1` without logging the values.

This keeps Virginia as the active production credential source while Oregon remains reserved for DR/failback.
