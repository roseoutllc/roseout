# Admin Search Batch E

Scope: harden six remaining Admin search warning routes.

- Search Anchors list/create/detail/update/approve/disable/merge now use named response projections.
- Search Anchor request metadata is JSON-object only and capped at 10 KB serialized.
- Search Anchor aliases and string fields are bounded.
- Merge requires an existing, different target anchor and caps notes at 1,000 characters.
- Search Benchmark labels use named query/label/scorecard projections, bounded inputs, and verify the benchmark query exists before upsert.
- Permanent regression coverage: `scripts/audit-admin-search-batch-e-pii.mjs`.

Expected broad-select warning reduction: 26 -> 20.
