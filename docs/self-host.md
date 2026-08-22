# Self-hosting SwiftCargo

This is the public self-host path: a filtered, SwiftCargo-only mirror of the
main AssertQuest monorepo, published automatically to
[`swiftcargo-selfhost`](https://github.com/harshavardhankavuri/swiftcargo-selfhost)
on every push to `main` (see `scripts/build-selfhost-mirror.sh` and
`.github/workflows/mirror-selfhost.yml` in the main repo). It contains
SwiftCargo (the logistics/freight app used as a practice target) and its API —
the AssertQuest learning platform (Challenge Board, leaderboard, community —
`th-web`) is intentionally not included here. See "Running the full
AssertQuest monorepo" below if you want that too.

## Quick start

```bash
git clone https://github.com/harshavardhankavuri/swiftcargo-selfhost.git
cd swiftcargo-selfhost
docker compose up
```

That's it — Postgres, the SwiftCargo API, and the SwiftCargo web app all
start, migrations run automatically, and the database is seeded with demo
data. Give it a minute or two on first run (target: ready in under 5 minutes,
FR-502).

- SwiftCargo (the app under test): http://localhost:5173
- API: http://localhost:4000 (health check at `/health`)
- API docs (interactive Swagger UI): http://localhost:5173/docs — the `web`
  nginx container proxies `/docs` to the API, so this works without opening
  port 4000 directly
- Postgres: `localhost:5432` (user/password/db: `assertquest`)

## Demo accounts

Every seeded SwiftCargo account shares the password `Password123!`:

| Role | Email |
|---|---|
| Admin | admin@swiftcargo.test |
| Dispatcher | dispatcher@swiftcargo.test |
| Driver | driver@swiftcargo.test |
| Customer | customer@swiftcargo.test |

This is a practice sandbox — no real user data is ever stored, so shared demo
passwords are intentional and fine.

## Environment variables

Set in `docker-compose.yml` for the containerized flow, or in `apps/api/.env`
(copy from `apps/api/.env.example`) when running the API outside Docker.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — | Postgres connection string |
| `PORT` | `4000` | API port |
| `ACCESS_TOKEN_SECRET` | dev value | JWT signing secret — change this for any non-local deployment |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` (15m) | Access token lifetime |
| `REFRESH_TOKEN_TTL_SECONDS` | `604800` (7d) | Refresh token lifetime |
| `GOOGLE_OAUTH_ENABLED` | `false` | Toggles the (currently stubbed) Google login route — see Open Items below |
| `FLAKE_LATENCY_MS[_<MODULE>]` | `0` | Injects artificial latency per module, for realistic flaky-test practice |
| `FLAKE_FAILURE_RATE[_<MODULE>]` | `0` | Injects a random failure rate (0–1) per module — also drops tracking WebSocket connections, see `docs/api/tracking.md` |
| `TRACKING_SIMULATION_ENABLED` | `true` | Toggles the background mocked GPS feed that advances shipments automatically |
| `TRACKING_TICK_MS` | `4000` | How often the background GPS feed advances active shipments |
| `FEATURE_PRIORITY_LANE` / `FEATURE_EXTENDED_TRACKING` / `FEATURE_NEW_ADMIN_UI` | `false` | Feature flags (FR-1104) — set to `true` to enable; see `docs/api/admin.md` |
| `NOTIFICATION_QUEUE_DELAY_MS` | `500` | Delay before a queued notification/mock message is actually written (FR-1203) — also delays scheduled report jobs (FR-1303), see `docs/api/reporting.md` |

## Resetting/seeding data

Every module exposes its own seed/reset via the test-control API, scoped per module
or globally:

```bash
curl -X POST "http://localhost:4000/api/test/reset?module=auth"
curl -X POST "http://localhost:4000/api/test/seed"   # all modules
```

## Running the API and web app outside Docker

```bash
npm install
cp apps/api/.env.example apps/api/.env   # point DATABASE_URL at your own Postgres
npm run build --workspace @assertquest/shared
npm run --workspace @assertquest/api prisma:generate
npm run --workspace @assertquest/api prisma:migrate
npm run --workspace @assertquest/api seed
npm run dev:api   # in one terminal
npm run dev:web   # in another — SwiftCargo (the app under test), port 5173
```

## Troubleshooting

- **Port already in use**: change the host-side port mapping in `docker-compose.yml`
  (e.g. `"5433:5432"`) if you already run Postgres locally on 5432.
- **`docker compose up` hangs on `api`**: the API waits for Postgres's healthcheck;
  check `docker compose logs postgres` first.
- **Web app can't reach the API**: in the Docker Compose setup, the `web`
  container's nginx proxies `/api/*` to the `api` service internally — you
  should never need to point the browser at port 4000 directly.

## Known open items (see PRD `docs/assertquest-requirements.md` §13)

- Google OAuth login is scaffolded but not wired up — needs real OAuth client
  credentials, which isn't something this repo can supply.
- All eight SwiftCargo modules are implemented: Auth & RBAC, Shipment Booking,
  Dashboard & Tracking, Fleet & Scheduling, Billing & Invoicing, Admin Console,
  Notifications, and Reporting.

## Running the full AssertQuest monorepo

The above covers the public `swiftcargo-selfhost` mirror. If you're working on
AssertQuest itself — the learning platform layer (Challenge Board, challenge
pages, profile, leaderboard, community discussion) on top of SwiftCargo — clone
the main monorepo instead:

```bash
git clone https://github.com/harshavardhankavuri/assertquest.git
cd assertquest
docker compose up
```

This additionally starts the AssertQuest platform site (`th-web`) on
http://localhost:5174, with its own separate account system from SwiftCargo's
(see `docs/api/th-platform.md` for why), its own demo accounts
(`learner@assertquest.dev` / `th-admin@assertquest.dev`, password
`LearnTest123!`), and the `ENABLE_ASSERTQUEST_PLATFORM` / `THP_ACCESS_TOKEN_SECRET`
/ `THP_ACCESS_TOKEN_TTL_SECONDS` environment variables that gate and secure it.
`apps/th-web` also reads a build-time variable, `VITE_SWIFTCARGO_URL` (default
`http://localhost:5173`), for the "open the live target" links on challenge
pages — set it in `docker-compose.yml`'s `th-web.build.args` if your SwiftCargo
instance lives elsewhere. Run `npm run dev:th-web` for the equivalent outside
Docker.
