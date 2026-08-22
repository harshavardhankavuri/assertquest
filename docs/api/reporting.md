# Reporting API (Module 8)

Base path: `/api/reporting`. Every route requires auth and is `dispatcher`/`admin`
only — this is a business analytics surface, not customer-facing.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## Date range & timezone semantics (FR-1302)

Both `GET /summary` and `POST /jobs` share the same query shape:

| Param | Type | Notes |
|---|---|---|
| `from` | ISO datetime | **Inclusive** |
| `to` | ISO datetime | **Exclusive** — a shipment created exactly at `to` is not counted |
| `groupBy` | `day` \| `month` | Default `day` |
| `timeZone` | IANA timezone name | Default `UTC`, e.g. `America/New_York` |

Bucketing happens **in the requested timezone**, not UTC. A shipment's `createdAt`
is always stored in UTC, but which calendar day (or month) it's bucketed under
depends on `timeZone` — the same shipment can land in different buckets, or even
different months, depending on what timezone the report is viewed in. This is
intentional, not a bug; see `apps/api/src/modules/reporting/bucketing.ts`.

## GET /api/reporting/summary

Synchronous chart data (FR-1301): shipment volume and revenue over time.

**200 response**
```json
{
  "buckets": [{ "period": "2026-03-01", "shipmentCount": 4, "revenueCents": 234500 }],
  "totalShipments": 4,
  "totalRevenueCents": 234500
}
```

`period` is `YYYY-MM-DD` for `groupBy=day`, `YYYY-MM` for `groupBy=month`, always
in the requested `timeZone`.

## POST /api/reporting/jobs

Scheduled report generation (FR-1303) — same query shape as `/summary`, in the
request body instead of query params. The CSV is generated asynchronously on the
same queue Module 7 (Notifications) uses (`NOTIFICATION_QUEUE_DELAY_MS`, default
`500`ms — see `docs/self-host.md`); the job is not "ready" the instant this
returns.

**202 response:** `{ "job": { "id", "requestedById", "fromDate", "toDate", "groupBy", "timeZone", "status": "pending", "failureReason": null, "createdAt", "readyAt": null } }`

## GET /api/reporting/jobs/:id

Poll this until `status` is `"ready"` (or `"failed"`). Admins can see every
dispatcher's jobs; a dispatcher only their own.

**200 response:** `{ "job": { ... } }`

## GET /api/reporting/jobs/:id/download

**200 response:** `Content-Type: text/csv`, header row
`period,shipmentCount,revenueCents`, matching what `GET /summary` would return for
the same query.

**409** if the job isn't `"ready"` yet — check `GET /jobs/:id` first.
