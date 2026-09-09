# Reservation discovery coverage audit — 2026-09-09

## Result

Reservation discovery no longer relies on each importer remembering a post-publish callback. A database ingress trigger queues eligible `locations` rows whenever they are created or materially change, and the reservation-recovery worker consumes the shared `pending` state.

## Coverage

| Entry/update path | Coverage after this change |
| --- | --- |
| Curated Google publication | Immediate website/provider discovery remains in `googleCuratedPublisher.ts`; database ingress is a fallback contract. |
| Generic staged publication | Any resulting `locations` insert is queued automatically. |
| Other importers | Any resulting `locations` insert/update with a website is queued automatically. |
| Enrichment | A newly added or changed website re-queues discovery automatically when no protected reservation source exists. |
| Manual/admin location creation | New eligible `locations` rows are queued automatically. |
| Owner-managed location setup | Adding/changing a website or removing a stale reservation URL re-queues discovery automatically. |
| Duplicate/hidden/demo inventory | Not queued until it becomes eligible. |
| Manual reservation overrides | Protected; automatic discovery does not overwrite owner/admin choices. |

## Retry policy

- `pending`: eligible immediately.
- `failed`: retry after 1 day because this is usually a transient network/provider failure.
- `not_found`: retry after 7 days.
- `blocked`: retry after 30 days.
- `found`: verify after 30 days when stale.
- `no_website`: no retry until a website is added; the ingress trigger then changes it to `pending`.

## Provider strategy

The website crawler continues to detect supported external reservation links, including OpenTable URLs, without requiring approved OpenTable API access. The denied OpenTable API request is therefore not a blocker for reservation-link discovery.

## Regression protection

`lib/__tests__/reservation-discovery-coverage.test.ts` verifies that:

1. `pending` rows are accepted by the recovery worker.
2. every location insert and material website/reservation change is covered by the universal ingress trigger.
3. failure-aware retry cadences remain encoded.
4. curated Google retains immediate discovery.
5. common provider-link detection remains present.
