FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/th-web/package.json apps/th-web/package.json
RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/th-web apps/th-web

# Vite inlines VITE_* env vars into the bundle at build time, not container
# startup — it must be an ARG/ENV here, not a docker-compose runtime `environment:`.
ARG VITE_SWIFTCARGO_URL=http://localhost:5173
ENV VITE_SWIFTCARGO_URL=$VITE_SWIFTCARGO_URL

RUN npm run build --workspace @assertquest/shared
RUN npm run build --workspace @assertquest/th-web

FROM nginx:alpine
COPY --from=build /repo/apps/th-web/dist /usr/share/nginx/html
COPY apps/th-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5174
