# Fleet & Scheduling API (Module 4)

Base path: `/api/fleet`. Every route requires auth and is `dispatcher`/`admin` only —
this is the dispatch team's own tool, not customer-facing.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## GET /api/fleet/vehicles

**200 response:** `{ "vehicles": [{ "id", "label", "type": "van"|"box_truck"|"container_truck", "capacityKg", "plate" }] }`

## GET /api/fleet/drivers

Lists SwiftCargo accounts with role `driver`.

**200 response:** `{ "drivers": [{ "id", "email" }] }`

## GET /api/fleet/assignments

**200 response:** `{ "assignments": [{ "id", "shipmentId", "vehicleId", "driverId", "scheduledStart", "scheduledEnd", "createdAt" }] }`

## PUT /api/fleet/assignments/:shipmentId

Creates or updates the assignment for a shipment — an **upsert keyed by
`shipmentId`** (FR-901). Dragging a card to a new vehicle/driver/slot on the board
calls this again for the same shipment; it updates the existing row rather than
creating a second one.

**Body**
```json
{ "vehicleId": "...", "driverId": "...", "scheduledStart": "2026-09-01T08:00:00.000Z", "scheduledEnd": "2026-09-01T10:00:00.000Z" }
```

**200 response:** `{ "assignment": { ... } }`
**400** if `vehicleId`/`driverId` don't exist, `driverId` isn't a `driver`-role
account, or `scheduledStart` isn't before `scheduledEnd`.

**This intentionally does not reject overlapping schedules.** A dispatcher can
double-book a vehicle or driver — see `GET /api/fleet/conflicts` below, which is
how the board is expected to catch it instead.

## DELETE /api/fleet/assignments/:id

Removes an assignment (unassigns the shipment). **204** on success, **404** if the
assignment doesn't exist.

## GET /api/fleet/conflicts

Conflict detection (FR-902): every pair of assignments that share a vehicle or a
driver with overlapping `scheduledStart`/`scheduledEnd` windows.

**200 response**
```json
{
  "conflicts": [
    { "resourceType": "driver", "resourceId": "...", "assignmentIds": ["...", "..."] }
  ]
}
```

The scheduling board UI polls this and renders a visible banner/toast when
non-empty (FR-903) — a conflict must never be console-only.
