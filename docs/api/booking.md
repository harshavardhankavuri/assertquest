# Booking API (Module 2)

Base path: `/api/booking`

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

Codes used by this module: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401),
`FORBIDDEN` (403), `NOT_FOUND` (404).

## GET /api/booking/geocode?q=

Mock address autocomplete (FR-703) against a fixed set of freight hubs — no real
geocoding provider involved. Matches are a case-insensitive substring on the label.

**200 response**
```json
{ "results": [{ "label": "Port of Los Angeles, CA, USA", "lat": 33.7395, "lng": -118.2597 }] }
```
Returns at most 8 results. An empty or missing `q` returns an empty array.

## POST /api/booking/quote

Dynamic pricing calculator (FR-704). Public — no auth required.

**Body**
```json
{
  "origin": { "label": "...", "lat": 33.7395, "lng": -118.2597 },
  "destination": { "label": "...", "lat": 51.9496, "lng": 4.1453 },
  "package": { "weightKg": 100, "lengthCm": 50, "widthCm": 40, "heightCm": 30 }
}
```

**200 response**
```json
{
  "distanceKm": 8890.2,
  "chargeableWeightKg": 100,
  "volumetricWeightKg": 12,
  "baseFeeCents": 500,
  "weightFeeCents": 12000,
  "distanceFeeCents": 71122,
  "priceCents": 83622,
  "currency": "USD"
}
```
`chargeableWeightKg` is `max(weightKg, volumetricWeightKg)`; volumetric weight is
`(lengthCm * widthCm * heightCm) / 5000`. `priceCents` is always
`baseFeeCents + weightFeeCents + distanceFeeCents`.

## POST /api/booking

Creates a confirmed shipment. **Requires auth** (`customer`, `dispatcher`, or `admin`).

**Body:** same shape as `/quote`. Any client-supplied price field is ignored — the
server always recomputes the price from origin/destination/package itself (FR-704).

**201 response**
```json
{
  "shipment": {
    "id": "...",
    "customerId": "...",
    "origin": { "label": "...", "lat": 0, "lng": 0 },
    "destination": { "label": "...", "lat": 0, "lng": 0 },
    "package": { "weightKg": 100, "lengthCm": 50, "widthCm": 40, "heightCm": 30 },
    "distanceKm": 8890.2,
    "priceCents": 83622,
    "currency": "USD",
    "createdAt": "..."
  }
}
```

## GET /api/booking

Lists shipments. `customer` sees only their own; `dispatcher`/`admin` see all.
**Requires auth.**

**200 response:** `{ "shipments": [ ... ] }`, newest first.

## GET /api/booking/:id

**Requires auth.** `404` if the shipment doesn't exist; `403` if the caller is a
`customer` who doesn't own it.

**200 response:** `{ "shipment": { ... } }`

## GET /api/booking/:id/documents

Lists customs document metadata (not file content) for a shipment. Same ownership
rules as `GET /api/booking/:id`.

**200 response:** `{ "documents": [{ "id", "shipmentId", "filename", "mimeType", "sizeBytes", "createdAt" }] }`

## POST /api/booking/:id/documents

Uploads a customs document (FR-705) as `multipart/form-data` with a single file field
named `document`. **Requires auth**, same ownership rules as above.

Server-side validation (never trust the client-side check in the wizard):
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Max size: 5MB (`5 * 1024 * 1024` bytes)

**201 response:** `{ "document": { "id", "shipmentId", "filename", "mimeType", "sizeBytes", "createdAt" } }`
**400** `VALIDATION_ERROR` for a disallowed MIME type or a file over the size limit —
rejected uploads are never persisted.
