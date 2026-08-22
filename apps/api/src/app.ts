import Fastify from "fastify";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { openapiDocument } from "./docs/openapi.js";
import { ApiError } from "./core/errors.js";
import { authRoutes } from "./modules/auth/routes.js";
import { bookingRoutes } from "./modules/booking/routes.js";
import { trackingRoutes } from "./modules/tracking/routes.js";
import { startSimulationLoop } from "./modules/tracking/simulationLoop.js";
import { billingRoutes } from "./modules/billing/routes.js";
import { fleetRoutes } from "./modules/fleet/routes.js";
import { adminRoutes } from "./modules/admin/routes.js";
import { notificationsRoutes } from "./modules/notifications/routes.js";
import { reportingRoutes } from "./modules/reporting/routes.js";
// selfhost-mirror:strip-start
import { thPlatformRoutes } from "./modules/thPlatform/routes.js";
// selfhost-mirror:strip-end
import { testControlRoutes } from "./core/testControl.js";
import "./modules/auth/seed.js"; // side effect: registers the auth module lifecycle
import "./modules/booking/seed.js"; // side effect: registers the booking module lifecycle
import "./modules/tracking/seed.js"; // side effect: registers the tracking module lifecycle
import "./modules/billing/seed.js"; // side effect: registers the billing module lifecycle
import "./modules/fleet/seed.js"; // side effect: registers the fleet module lifecycle
import "./modules/admin/seed.js"; // side effect: registers the admin module lifecycle
import "./modules/notifications/seed.js"; // side effect: registers the notifications module lifecycle
import "./modules/reporting/seed.js"; // side effect: registers the reporting module lifecycle
// selfhost-mirror:strip-start
import "./modules/thPlatform/seed.js"; // side effect: registers the thPlatform module lifecycle (last, so all challenge manifests are seeded first)
// selfhost-mirror:strip-end

// selfhost-mirror:strip-start
// The AssertQuest learning platform (challenges, th-web auth) is only exposed on the
// hosted instance. Self-hosted deployments serve SwiftCargo alone, so the route surface
// is gated behind this flag — defaults to off, hosted deployment sets it to "true".
const isAssertQuestPlatformEnabled = process.env.ENABLE_ASSERTQUEST_PLATFORM === "true";
// selfhost-mirror:strip-end

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cookie);
  app.register(websocket);

  // Static-mode Swagger: the document is hand-authored in docs/openapi.ts rather
  // than introspected from route schemas, since handlers validate with zod
  // directly instead of declaring Fastify `schema` objects. UI served at /docs.
  app.register(swagger, { mode: "static", specification: { document: openapiDocument as never } });
  app.register(swaggerUi, { routePrefix: "/docs" });

  app.setErrorHandler((err: Error & { statusCode?: number }, request, reply) => {
    if (err instanceof ApiError) {
      reply.code(err.statusCode).send({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    request.log.error(err);
    // Framework-level errors (e.g. Fastify's body parser rejecting a malformed
    // request) already carry the right 4xx status — only fall back to 500 for
    // errors that don't declare one.
    const isClientError = typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500;
    const statusCode = isClientError ? err.statusCode! : 500;
    const code = isClientError ? "VALIDATION_ERROR" : "INTERNAL_ERROR";
    const message = isClientError ? err.message : "Something went wrong";
    reply.code(statusCode).send({ error: { code, message } });
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(bookingRoutes, { prefix: "/api/booking" });
  app.register(trackingRoutes, { prefix: "/api/tracking" });
  app.register(billingRoutes, { prefix: "/api/billing" });
  app.register(fleetRoutes, { prefix: "/api/fleet" });
  app.register(adminRoutes, { prefix: "/api/admin" });
  app.register(notificationsRoutes, { prefix: "/api/notifications" });
  app.register(reportingRoutes, { prefix: "/api/reporting" });
  // selfhost-mirror:strip-start
  if (isAssertQuestPlatformEnabled) {
    app.register(thPlatformRoutes, { prefix: "/api/th" });
  }
  // selfhost-mirror:strip-end
  app.register(testControlRoutes, { prefix: "/api/test" });

  const simulationTimer = startSimulationLoop();
  app.addHook("onClose", (_instance, done) => {
    if (simulationTimer) clearInterval(simulationTimer);
    done();
  });

  return app;
}
