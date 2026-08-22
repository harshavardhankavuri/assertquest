# Notifications API (Module 7)

Base path: `/api/notifications`. Every route requires auth.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## How delivery works (FR-1203)

Notifications and mock messages are never written synchronously in the request
that triggers them. Actions across other modules call an internal `notify()`
helper, which enqueues a job that runs after a delay
(`NOTIFICATION_QUEUE_DELAY_MS`, default `500`ms — see `docs/self-host.md`). A test
that checks immediately after the triggering action and finds nothing yet is not
broken; it needs to poll or wait past the delay.

**Events that currently notify:**

| Trigger | Type | Title | Channels |
|---|---|---|---|
| Shipment booked | `shipment.booked` | "Shipment booked" | email |
| Shipment delivered (status transitions to `delivered`) | `shipment.delivered` | "Shipment delivered" | email + sms |
| Payment succeeds | `payment.succeeded` | "Payment received" | email |
| Payment declines or times out | `payment.failed` | "Payment failed" | email |

## GET /api/notifications

In-app notification center (FR-1202) for the calling user, newest first.

**200 response**
```json
{
  "notifications": [
    { "id": "...", "userId": "...", "type": "shipment.booked", "title": "Shipment booked", "body": "...", "read": false, "createdAt": "..." }
  ],
  "unreadCount": 1
}
```

## POST /api/notifications/:id/read

Marks one notification read. **404** if not found, **403** if it belongs to
another user.

**200 response:** `{ "notification": { ... } }`

## POST /api/notifications/read-all

Marks every unread notification for the calling user as read.

**200 response:** `{ "marked": 3 }`

## GET /api/notifications/outbox

Mock email/SMS outbox (FR-1201) — a viewable sent-log for test assertions, the
same role a tool like Mailhog plays in a real dev environment. No real message
ever leaves the system. **Admin only**, since it can show every user's messages.

**Query params:** `to` (optional) — filter by recipient (an email address for
`channel: "email"`, or the mock phone number for `channel: "sms"`).

**200 response**
```json
{
  "messages": [
    { "id": "...", "channel": "email", "to": "customer@swiftcargo.test", "subject": "Shipment booked", "body": "...", "createdAt": "..." }
  ]
}
```

SMS recipients are deterministic fake phone numbers derived from the user id
(`+1555<first 7 hex chars of the user id>`) — there are no real phone numbers
anywhere in SwiftCargo.
