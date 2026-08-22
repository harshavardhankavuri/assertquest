# Admin Console API (Module 6)

Base path: `/api/admin`. Every route requires auth; all but `GET /feature-flags`
are `admin`-only.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## GET /api/admin/feature-flags

Feature flags (FR-1104) — toggled per environment via env vars, not a runtime
switch, so there's no `PUT` to change them at runtime. Available to **any
authenticated user**, since other pages' UI conditionally renders based on these
too, not just the admin console.

**200 response**
```json
{ "flags": { "priorityLane": false, "extendedTracking": false, "newAdminUi": false } }
```

Each flag's env var is `FEATURE_<KEY_AS_UPPER_SNAKE_CASE>`, e.g. `priorityLane` ->
`FEATURE_PRIORITY_LANE=true`. Unset or any value other than `"true"` means off.

## GET /api/admin/audit-log

Audit trail (FR-1101) — currently recorded for `auth.login`, `auth.register`,
`shipment.bulk_approve`, `shipment.bulk_cancel`, and `shipment.csv_import`.
Newest first, capped at the 100 most recent entries. **Admin only.**

**200 response**
```json
{
  "entries": [
    { "id": "...", "actorId": "...", "actorEmail": "customer@swiftcargo.test", "action": "auth.login", "targetType": "user", "targetId": "...", "metadata": null, "createdAt": "..." }
  ]
}
```

## POST /api/admin/shipments/bulk

Bulk approve/cancel (FR-1102). **Admin only.**

**Body:** `{ "action": "approve" | "cancel", "shipmentIds": ["...", "..."] }`

Every id is processed independently — an unknown id, or cancelling a `delivered`
shipment, fails **only that item**; it never blocks or rolls back the others.
Always responds `200`, even when every item failed — check `results`.

**200 response**
```json
{
  "action": "cancel",
  "results": [
    { "shipmentId": "...", "success": true },
    { "shipmentId": "...", "success": false, "error": "Shipment not found" }
  ],
  "succeeded": 1,
  "failed": 1
}
```

## POST /api/admin/shipments/import

CSV bulk import (FR-1103). **Admin only.** `multipart/form-data` with a single file
field named `file`.

**Required columns** (any order, quote fields containing commas):
`customerEmail, originLabel, originLat, originLng, destinationLabel, destinationLat, destinationLng, weightKg, lengthCm, widthCm, heightCm`

Each row is validated and, if valid, priced with the same formula as
`POST /api/booking/quote` and created directly (no wizard). Invalid rows are
rejected with reasons and never persisted; this never rolls back sibling rows.

**200 response**
```json
{
  "totalRows": 3,
  "accepted": 1,
  "rejected": 2,
  "rows": [
    { "row": 2, "status": "accepted", "shipmentId": "..." },
    { "row": 3, "status": "rejected", "errors": ["Unknown customer email \"nobody@example.com\""] },
    { "row": 4, "status": "rejected", "errors": ["weightKg must be a number"] }
  ]
}
```

`row` is 1-indexed counting the header row as row 1, so the first data row is `2`.
