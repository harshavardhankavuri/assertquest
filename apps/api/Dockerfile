FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY docs/challenges docs/challenges

RUN npm run build --workspace @assertquest/shared
RUN npm run --workspace @assertquest/api prisma:generate
RUN npm run build --workspace @assertquest/api

WORKDIR /repo/apps/api
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && ([ \"$SEED_DEMO_DATA\" = \"false\" ] || npx tsx prisma/seed.ts) && node dist/server.js"]
