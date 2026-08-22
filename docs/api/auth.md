# Auth API (Module 1)

Base path: `/api/auth`

All error responses use the structured shape:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "...", "details": null } }
```

Codes used by this module: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401),
`TOKEN_EXPIRED` (401), `FORBIDDEN` (403), `CONFLICT` (409), `NOT_FOUND` (404).

## POST /api/auth/register

Creates a new SwiftCargo account and starts a session.

**Body**
```json
{ "email": "driver@swiftcargo.test", "password": "at-least-8-chars", "role": "driver" }
```
`role` is one of `admin | dispatcher | driver | customer`.

**201 response**
```json
{
  "user": { "id": "...", "email": "...", "role": "driver", "createdAt": "..." },
  "tokens": { "accessToken": "...", "accessTokenExpiresAt": "2026-08-17T12:15:00.000Z" }
}
```

A `Set-Cookie: th_refresh=...` header (httpOnly, path `/api/auth`) is also set — this
is how the refresh token is delivered, never in the JSON body.

**409** if the email is already registered.

## POST /api/auth/login

**Body:** `{ "email": "...", "password": "..." }`
**200 response:** same shape as register.
**401** on invalid credentials (deliberately doesn't distinguish "no such user" from
"wrong password").

## POST /api/auth/refresh

Reads the `th_refresh` cookie, rotates it (the presented token is revoked and a new
one issued), and returns a fresh access token. No request body.

**200 response:** same shape as login/register.
**401** if the cookie is missing, expired, or has already been used (rotation makes
reuse of an old refresh token detectable and rejected).

## GET /api/auth/me

**Header:** `Authorization: Bearer <accessToken>`
**200 response:** `{ "user": { ... } }`
**401** `UNAUTHORIZED` if the header is missing/malformed/invalid; `TOKEN_EXPIRED` if
the token has expired.

## GET /api/auth/admin-check

Example admin-only protected resource, used to exercise RBAC (until real modules with
their own protected routes exist).

**Header:** `Authorization: Bearer <accessToken>`
**200** if the caller's role is `admin`.
**403** `FORBIDDEN` for any other role.

## GET /api/auth/google

Stubbed (FR-603, Should-priority). Returns `404` unless `GOOGLE_OAUTH_ENABLED=true`,
in which case it currently returns `501` — the actual OAuth exchange isn't implemented
yet (requires real Google OAuth client credentials to build against).
