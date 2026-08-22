# Billing API (Module 5)

Base path: `/api/billing`. One invoice per shipment, billed in the currency chosen
at invoice-creation time.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## POST /api/billing/shipments/:shipmentId/invoice

Creates an invoice for a shipment, converting its USD price into the requested
currency (FR-1002). **Idempotent** — calling this again for the same shipment
returns the existing invoice instead of erroring. **Requires auth**, same ownership
rules as `GET /api/booking/:id`.

**Body:** `{ "currency": "USD" | "EUR" | "GBP" | "JPY" | "INR" }` (defaults to `USD`)

**201 response**
```json
{ "invoice": { "id": "...", "shipmentId": "...", "customerId": "...", "amountCents": 79658, "currency": "EUR", "status": "open", "createdAt": "..." } }
```

`amountCents` is in the currency's own minor unit — for `JPY` (no minor unit) this
is a whole number of yen, not "yen cents". Exchange rates are fixed constants (not
real FX rates); see `apps/api/src/modules/billing/currency.ts`.

## GET /api/billing/invoices

Lists invoices. `customer` sees only their own; `dispatcher`/`admin` see all.
**Requires auth.**

## GET /api/billing/invoices/:id

**Requires auth**, same ownership rules as above. **404** if not found, **403** if a
customer requests one they don't own.

## GET /api/billing/invoices/:id/pdf

PDF invoice export (FR-1001). **Requires auth**, same ownership rules.

**200 response:** `Content-Type: application/pdf`, body starts with the PDF magic
number `%PDF-`.

## POST /api/billing/invoices/:id/pay

Attempts a payment against the mock gateway sandbox (FR-1003). **Requires auth**,
same ownership rules. **409** if the invoice is already `paid`.

**Body:** `{ "cardNumber": "4242424242424242" }` (13-19 digits)

The mock gateway is entirely deterministic — no real payment processor is ever
contacted:

| Card number | Outcome |
|---|---|
| `4000000000000002` | `declined` — "card_declined: insufficient funds" |
| `4000000000000119` | `timed_out` — "gateway_timeout: no response from processor" |
| any other well-formed number | `succeeded` |

A `declined` or `timed_out` payment leaves the invoice `open`, so the same endpoint
can be called again to retry with a different card (FR-1004) — each attempt is
recorded rather than overwritten.

**200 response**
```json
{
  "invoice": { "...": "Invoice, status reflects this attempt's outcome" },
  "payment": { "id": "...", "invoiceId": "...", "attemptNumber": 1, "status": "declined", "cardLast4": "0002", "failureReason": "card_declined: insufficient funds", "...": "..." }
}
```

## GET /api/billing/invoices/:id/payments

Full payment attempt history for an invoice, oldest first. **Requires auth**, same
ownership rules.

**200 response:** `{ "payments": [ ... ] }`
