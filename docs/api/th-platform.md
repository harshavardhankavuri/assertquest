# AssertQuest Platform API

Base path: `/api/th`. This is the practice-platform layer itself (Challenge Board,
challenge pages, profile, leaderboard, community discussion) — entirely separate
from SwiftCargo's own `/api/*` routes and account system. AssertQuest accounts
(`THUser`) are not SwiftCargo accounts (`User`); logging into one does not log you
into the other.

All error responses use the structured shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## Auth

Simpler than SwiftCargo's Module 1 on purpose: one access token (default 7 day
TTL, `THP_ACCESS_TOKEN_TTL_SECONDS`), no refresh-token rotation — that complexity
is Module 1's own teaching point, not something the platform layer re-demonstrates.
Store the token client-side and send it as `Authorization: Bearer <token>`.

### POST /api/th/auth/register
**Body:** `{ "email": "...", "password": "at-least-8-chars" }`
**201:** `{ "user": { "id", "email", "displayName", "publicRealName", "role": "learner", "createdAt" }, "accessToken": "..." }`

A random, anonymized `displayName` (e.g. `swift-harbor-4821`) is assigned at
registration — this is what's shown publicly (leaderboard, discussion) by
default, never the email.

### POST /api/th/auth/login
**Body:** `{ "email": "...", "password": "..." }` — same response shape as register.

### GET /api/th/auth/me
**Requires auth.** Returns the caller's own full record (including email).

### PATCH /api/th/auth/me
**Requires auth.** **Body:** `{ "publicRealName": true }` — opt in (or back out)
to showing your email instead of `displayName` on the leaderboard and in
discussion posts (FR-403).

## Challenge Board

### GET /api/th/challenges?module=&class=&surface=&q=&page=&pageSize=
Browsable without an account. `class` is the difficulty tier
(`light`|`standard`|`heavy`|`bulk`), `surface` is `api`|`db`|`ui`, `q` free-texts
across title+description. **200:** `{ "challenges": [...], "total", "page", "pageSize" }`.
When called with a valid `Authorization` header, each challenge includes a
personal `status: "open" | "in_progress" | "cleared"`; anonymous requests omit
`status` entirely.

### GET /api/th/challenges/:id
Same optional-auth behavior as the list.

### GET /api/th/challenges/:id/related
Other challenges in the same module (FR-306).

### POST /api/th/challenges/:id/reset
No auth required — resetting a scenario is part of the sandbox, not a
privileged action. Delegates to the challenge's SwiftCargo module's own
`reset()` (the same lifecycle `POST /api/test/reset?module=` uses).

### POST /api/th/challenges/:id/start
**Requires auth.** Marks the challenge `in_progress` for the caller. A no-op if
already `in_progress` or `cleared` (never downgrades a cleared challenge).

### POST /api/th/challenges/:id/clear
**Requires auth.** Marks the challenge `cleared` (FR-308).

## Profile

### GET /api/th/profile/:userId
Public. `{ "userId", "displayName", "totalChallenges", "totalCleared", "byModule": [{ "module", "totalChallenges", "cleared" }] }`

### POST /api/th/profile/me/reset-progress?module=
**Requires auth.** Resets only the caller's own progress (FR-104) — omit
`module` to reset every module's progress at once.

## Leaderboard

### GET /api/th/leaderboard?module=&range=
`range` is `all` (default) | `month` | `week`. Ranked by challenges cleared.
Anonymized by default — `name` is the cleared user's `displayName` unless they
opted into `publicRealName`, in which case it's their email.

## Community

### GET /api/th/activity?limit=
Public. Most recently cleared challenges across all users (default limit 20),
for the Community page's recent-activity feed (FR-401). Same anonymization rule
as the leaderboard.

## Discussion (FR-307)

### GET /api/th/discussion/:challengeId
Public. Posts sorted by upvotes desc, then oldest first.

### POST /api/th/discussion/:challengeId
**Requires auth.** **Body:** `{ "body": "..." }` (max 4000 chars).

### POST /api/th/discussion/posts/:postId/upvote
**Requires auth.** No per-user upvote-once enforcement — moderation is
manual/lightweight only for v1 (PRD §10).
