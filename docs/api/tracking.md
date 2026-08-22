# Tracking API (Module 3)

Base path: `/api/tracking`. This module reads and updates the same shipments Module 2
(Booking) creates — it doesn't own separate records.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## GET /api/tracking

Data table listing (FR-803). **Requires auth.** `customer` sees only their own
shipments; `dispatcher`/`admin` see all.

**Query params**
| Param | Values | Default |
|---|---|---|
| `status` | `booked` \| `in_transit` \| `delivered` | (no filter) |
| `sort` | `createdAt` \| `priceCents` \| `distanceKm` \| `status` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |
| `page` | integer >= 1 | `1` |
| `pageSize` | integer 1-100 | `20` |

**200 response**
```json
{ "items": [ { "...": "Shipment, see docs/api/booking.md" } ], "total": 12, "page": 1, "pageSize": 20 }
```

## GET /api/tracking/export.csv

Same filters as the listing above (status only — always unpaginated, capped at 100
rows), returned as `text/csv` (FR-803).

**200 response:** CSV with header row
`id,status,origin,destination,weightKg,distanceKm,priceCents,currency,createdAt`.

## GET /api/tracking/:id

**Requires auth**, same ownership rules as `GET /api/booking/:id`.

**200 response:** `{ "shipment": { ... } }`

## POST /api/tracking/:id/advance

Manually advances a shipment one simulation tick — `booked` -> `in_transit` on the
first call, then steps the position toward the destination on each subsequent call
until it reaches `delivered`. **Requires auth**, `dispatcher` or `admin` only.
Broadcasts a `tracking-update` event to connected WebSocket clients who can see this
shipment (FR-801).

**200 response:** `{ "shipment": { ... } }`

## GET /api/tracking/ws

WebSocket endpoint for real-time status/position updates (FR-801/FR-802). Since a
browser `WebSocket` upgrade can't carry an `Authorization` header, the access token
is passed as a query parameter instead:

```
ws://localhost:4000/api/tracking/ws?token=<accessToken>
```

On connect, the server sends `{ "type": "connected" }`. After that, whenever a
shipment this connection is allowed to see changes status or position (via
`POST /:id/advance` or the background mocked GPS feed), the server sends:

```json
{ "type": "tracking-update", "shipment": { "...": "full Shipment object" } }
```

The connection is closed with code `4001` if the token is missing, invalid, or
expired.

### Background simulation

When enabled (`TRACKING_SIMULATION_ENABLED`, default `true`), the API ticks every
non-delivered shipment on an interval (`TRACKING_TICK_MS`, default `4000`),
broadcasting each update the same way `/advance` does. Disabled in the test suite so
assertions stay deterministic — tests drive ticks explicitly via `/advance`.

### Flakiness (FR-804)

`FLAKE_FAILURE_RATE_TRACKING` (see `docs/self-host.md`) applies to WebSocket
broadcasts too: each broadcast to a given connection has that probability of instead
closing the connection, to exercise client reconnect handling.
