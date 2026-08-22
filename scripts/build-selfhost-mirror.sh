#!/usr/bin/env bash
# Builds a filtered copy of this repo containing SwiftCargo (the app under test) only —
# no AssertQuest learning platform (th-web, thPlatform module/routes, challenge docs).
# Used by .github/workflows/mirror-selfhost.yml to publish that copy to a public
# self-host repo. Safe to run locally too: ./scripts/build-selfhost-mirror.sh /tmp/out
set -euo pipefail

OUT_DIR="${1:?usage: build-selfhost-mirror.sh <output-dir>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Whole-directory copies, then targeted removals — simpler to keep in sync than an
# include-list as new SwiftCargo modules get added.
cp -r "$REPO_ROOT/apps" "$OUT_DIR/apps"
cp -r "$REPO_ROOT/packages" "$OUT_DIR/packages"
cp -r "$REPO_ROOT/docs" "$OUT_DIR/docs"
cp -r "$REPO_ROOT/scripts" "$OUT_DIR/scripts"
cp "$REPO_ROOT/package.json" "$REPO_ROOT/package-lock.json" "$REPO_ROOT/tsconfig.base.json" "$OUT_DIR/"

# --- AssertQuest-only surfaces: removed entirely ---
rm -rf "$OUT_DIR/apps/th-web"
rm -rf "$OUT_DIR/apps/api/src/modules/thPlatform"
rm -f "$OUT_DIR/apps/api/test/thPlatform.test.ts"
rm -f "$OUT_DIR/docs/api/th-platform.md"
rm -f "$OUT_DIR/scripts/build-selfhost-mirror.sh"
# NOTE: docs/challenges/ and packages/shared/src/challenges.ts stay — every SwiftCargo
# module's own seed.ts (not just thPlatform) loads challenge manifests via
# apps/api/src/challenges/manifest.ts to populate the tHChallenge table. That's static
# scenario content, not AssertQuest product code, so it's left in rather than risking a
# broken build by unpicking it out of 8 seed files.

# --- Hosted-only ops files: not relevant to a local self-host (note: .github/ was
# never copied above, so no need to strip it here) ---
rm -f "$OUT_DIR/Caddyfile" "$OUT_DIR/docker-compose.prod.yml" "$OUT_DIR/.env.prod.example" "$OUT_DIR/docker-compose.selfhost.yml"

# --- Never publish local env files, even though .gitignore keeps them out of what CI
# checks out — this script is also run against a working tree directly. ---
find "$OUT_DIR" \( -name '.env' -o -name '.env.*' \) ! -name '.env.example' -exec rm -f {} +

# --- Lines marked for stripping in code that stays (imports/registration wired to
# the now-deleted thPlatform module and shared package). Markers live inline in the
# source; see apps/api/src/app.ts and packages/shared/src/index.ts.
for f in \
  "$OUT_DIR/apps/api/src/app.ts" \
  "$OUT_DIR/apps/api/prisma/seed.ts" \
  "$OUT_DIR/packages/shared/src/index.ts"
do
  sed -i '/selfhost-mirror:strip-start/,/selfhost-mirror:strip-end/d' "$f"
done
rm -f "$OUT_DIR/packages/shared/src/platform.ts"

# --- package.json workspace scripts reference th-web; drop those references ---
node -e '
  const fs = require("fs");
  const path = "'"$OUT_DIR"'/package.json";
  const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
  delete pkg.scripts["dev:th-web"];
  pkg.scripts.build = "npm run build --workspace packages/shared && npm run build --workspace apps/api && npm run build --workspace apps/web";
  pkg.scripts.typecheck = "npm run typecheck --workspace packages/shared && npm run typecheck --workspace apps/api && npm run typecheck --workspace apps/web";
  pkg.scripts.lint = "npm run lint --workspace apps/api && npm run lint --workspace apps/web";
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
'

# --- Self-host compose file (was an override merged onto docker-compose.yml; here
# it is the whole file since th-web/thPlatform never existed in this tree) ---
cat > "$OUT_DIR/docker-compose.yml" <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: assertquest
      POSTGRES_PASSWORD: assertquest
      POSTGRES_DB: assertquest
    ports:
      - "5432:5432"
    volumes:
      - assertquest_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assertquest"]
      interval: 3s
      timeout: 3s
      retries: 20

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://assertquest:assertquest@postgres:5432/assertquest
      PORT: 4000
      NODE_ENV: production
      ACCESS_TOKEN_SECRET: dev-access-secret-change-me
      ACCESS_TOKEN_TTL_SECONDS: 900
      REFRESH_TOKEN_TTL_SECONDS: 604800
      GOOGLE_OAUTH_ENABLED: "false"
    ports:
      - "4000:4000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 3s
      timeout: 3s
      retries: 30

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    depends_on:
      api:
        condition: service_healthy
    ports:
      - "5173:5173"

volumes:
  assertquest_pg_data:
EOF

cat > "$OUT_DIR/README.md" <<'EOF'
# SwiftCargo (self-host)

SwiftCargo is a logistics/freight management app used as a realistic target for
practicing API, DB, and UI test automation. This repo is a filtered mirror,
published automatically from the main AssertQuest repo, containing SwiftCargo only.

## Run it

```
docker compose up
```

- Web UI: http://localhost:5173
- API: http://localhost:4000 (docs at /docs)

## About

This repo is generated by CI — don't send PRs here. To contribute, see the main
AssertQuest project.
EOF
