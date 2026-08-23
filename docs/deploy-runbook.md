# Production deploy runbook

Stack: `docker-compose.yml` (base) + `docker-compose.prod.yml` (prod overlay),
fronted by Caddy once real domains are configured. Postgres data lives in the
`assertquest_pg_data` volume — never delete it as part of a routine deploy.

## One-time server setup (already done)

1. Generate three secrets:
   ```bash
   openssl rand -hex 32   # -> POSTGRES_PASSWORD
   openssl rand -hex 32   # -> ACCESS_TOKEN_SECRET
   openssl rand -hex 32   # -> THP_ACCESS_TOKEN_SECRET
   ```
2. Set the DB role's password to match the generated `POSTGRES_PASSWORD`:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
     psql -U assertquest -d assertquest -c \
     "ALTER USER assertquest WITH PASSWORD '<POSTGRES_PASSWORD>';"
   ```
3. Create `.env` in the repo root from the template and fill it in:
   ```bash
   cp .env.prod.example .env
   ```
   Required keys: `APP_DOMAIN`, `LEARN_DOMAIN`, `ACME_EMAIL`, `POSTGRES_PASSWORD`,
   `ACCESS_TOKEN_SECRET`, `THP_ACCESS_TOKEN_SECRET`. Keep `.env` out of git.
4. Bring the stack up. Until real domains are pointed at this server's IP,
   skip `caddy` (it needs a resolvable domain to issue a Let's Encrypt cert):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres api web th-web
   ```
   Once `APP_DOMAIN` / `LEARN_DOMAIN` DNS is live, add `caddy` back in:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

`docker-compose.prod.yml` sets `SEED_DEMO_DATA: "false"` on the `api` service,
so `prisma/seed.ts` (which creates demo/test accounts) never runs against
this database — only `prisma migrate deploy` runs on boot.

## Routine patch deploy (every future change)

```bash
cd /path/to/assertquest
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build postgres api web th-web
```
Add `caddy` to that command once it's part of the running stack.

Then check it came up clean:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api --tail=50
```
Look for successful `prisma migrate deploy` output, the server listening on
4000, and **no** "Seeding module: ..." lines.

## One-off demo/test data cleanup

Already run once, but safe to re-run (no-ops if rows are gone):
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U assertquest -d assertquest < scripts/cleanup-prod-demo-data.sql
```
Verify:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U assertquest -d assertquest -c \
  "SELECT email FROM users WHERE email LIKE '%@swiftcargo.test'
   UNION ALL
   SELECT email FROM th_users WHERE email LIKE '%@assertquest.dev';"
```
Should return 0 rows.

## Notes / follow-ups

- The `POSTGRES_PASSWORD`, `ACCESS_TOKEN_SECRET`, and `THP_ACCESS_TOKEN_SECRET`
  values generated during initial setup were pasted into a chat session.
  Rotate them again once things are stable (repeat the `ALTER USER` +
  `.env` edit + restart) so the live secrets don't live in any transcript.
- Once `caddy` is live, `web` and `th-web` no longer need their host ports
  (`5173`, `5174`) exposed publicly — traffic should go through Caddy.
