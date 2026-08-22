// Hand-authored OpenAPI 3.0 document covering every HTTP route the API exposes.
//
// Route handlers validate with zod internally (see each module's schema.ts) rather
// than declaring Fastify `schema` objects, so this is wired up in "static" mode
// (@fastify/swagger just serves this document, it doesn't introspect routes) —
// that keeps the docs in sync with the zod schemas as the single source of truth
// for request shapes, without forcing every handler to duplicate validation as
// inline Fastify JSON schema.
export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SwiftCargo API",
    version: "1.0.0",
    description:
      "**SwiftCargo** (`/api/auth`, `/api/booking`, `/api/tracking`, `/api/billing`, `/api/fleet`, " +
      "`/api/admin`, `/api/notifications`, `/api/reporting`) — the freight-forwarding app under test. " +
      "Its own account system (`User`), JWT access tokens (15m) + httpOnly refresh cookie (7d, scoped to `/api/auth`).\n\n" +
      "`/api/test/*` is an unauthenticated seed/reset control surface for the practice sandbox — never enable " +
      "this on a deployment with real user data.\n\n" +
      "This document covers the SwiftCargo automation-practice target only. The AssertQuest platform layer " +
      "(`/api/th/*` — challenge board, leaderboard, community discussion) sits on top of SwiftCargo but isn't " +
      "itself a practice target, so it's intentionally left out of these docs.",
  },
  servers: [{ url: "/", description: "Same origin as the web app (reverse-proxied in prod, Vite dev proxy locally)" }],
  tags: [
    { name: "Health" },
    { name: "SwiftCargo / Auth" },
    { name: "SwiftCargo / Booking" },
    { name: "SwiftCargo / Tracking" },
    { name: "SwiftCargo / Billing" },
    { name: "SwiftCargo / Fleet" },
    { name: "SwiftCargo / Admin" },
    { name: "SwiftCargo / Notifications" },
    { name: "SwiftCargo / Reporting" },
    { name: "Test Control" },
  ],
  components: {
    securitySchemes: {
      swiftCargoBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "SwiftCargo access token from `/api/auth/login`, `/register`, or `/refresh`. 15 minute TTL.",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: ["UNAUTHORIZED", "TOKEN_EXPIRED", "FORBIDDEN", "VALIDATION_ERROR", "CONFLICT", "NOT_FOUND", "INTERNAL_ERROR"],
              },
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      Role: { type: "string", enum: ["admin", "dispatcher", "driver", "customer"] },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          accessTokenExpiresAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/PublicUser" },
          tokens: { $ref: "#/components/schemas/AuthTokens" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "role"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          role: { $ref: "#/components/schemas/Role" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AddressPoint: {
        type: "object",
        required: ["label", "lat", "lng"],
        properties: {
          label: { type: "string" },
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
        },
      },
      PackageDetails: {
        type: "object",
        required: ["weightKg", "lengthCm", "widthCm", "heightCm"],
        properties: {
          weightKg: { type: "number", exclusiveMinimum: 0 },
          lengthCm: { type: "number", exclusiveMinimum: 0 },
          widthCm: { type: "number", exclusiveMinimum: 0 },
          heightCm: { type: "number", exclusiveMinimum: 0 },
        },
      },
      QuoteRequest: {
        type: "object",
        required: ["origin", "destination", "package"],
        properties: {
          origin: { $ref: "#/components/schemas/AddressPoint" },
          destination: { $ref: "#/components/schemas/AddressPoint" },
          package: { $ref: "#/components/schemas/PackageDetails" },
        },
      },
      QuoteBreakdown: {
        type: "object",
        properties: {
          distanceKm: { type: "number" },
          chargeableWeightKg: { type: "number" },
          volumetricWeightKg: { type: "number" },
          baseFeeCents: { type: "integer" },
          weightFeeCents: { type: "integer" },
          distanceFeeCents: { type: "integer" },
          priceCents: { type: "integer" },
          currency: { type: "string" },
        },
      },
      ShipmentStatus: { type: "string", enum: ["booked", "in_transit", "delivered", "cancelled"] },
      Shipment: {
        type: "object",
        properties: {
          id: { type: "string" },
          customerId: { type: "string" },
          origin: { $ref: "#/components/schemas/AddressPoint" },
          destination: { $ref: "#/components/schemas/AddressPoint" },
          package: { $ref: "#/components/schemas/PackageDetails" },
          distanceKm: { type: "number" },
          priceCents: { type: "integer" },
          currency: { type: "string" },
          status: { $ref: "#/components/schemas/ShipmentStatus" },
          approved: { type: "boolean" },
          currentPosition: {
            type: "object",
            properties: { lat: { type: "number" }, lng: { type: "number" } },
          },
          positionUpdatedAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      GeocodeSuggestion: { $ref: "#/components/schemas/AddressPoint" },
      CustomsDocumentMeta: {
        type: "object",
        properties: {
          id: { type: "string" },
          shipmentId: { type: "string" },
          filename: { type: "string" },
          mimeType: { type: "string" },
          sizeBytes: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TrackingListResponse: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Shipment" } },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
        },
      },
      BillingCurrency: { type: "string", enum: ["USD", "EUR", "GBP", "JPY", "INR"] },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string" },
          shipmentId: { type: "string" },
          customerId: { type: "string" },
          amountCents: { type: "integer" },
          currency: { $ref: "#/components/schemas/BillingCurrency" },
          status: { type: "string", enum: ["open", "paid"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          invoiceId: { type: "string" },
          attemptNumber: { type: "integer" },
          amountCents: { type: "integer" },
          currency: { $ref: "#/components/schemas/BillingCurrency" },
          status: { type: "string", enum: ["succeeded", "declined", "timed_out"] },
          cardLast4: { type: "string" },
          failureReason: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PayInvoiceResponse: {
        type: "object",
        properties: {
          invoice: { $ref: "#/components/schemas/Invoice" },
          payment: { $ref: "#/components/schemas/Payment" },
        },
      },
      Vehicle: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          type: { type: "string", enum: ["van", "box_truck", "container_truck"] },
          capacityKg: { type: "number" },
          plate: { type: "string" },
        },
      },
      FleetDriver: {
        type: "object",
        properties: { id: { type: "string" }, email: { type: "string", format: "email" } },
      },
      Assignment: {
        type: "object",
        properties: {
          id: { type: "string" },
          shipmentId: { type: "string" },
          vehicleId: { type: "string" },
          driverId: { type: "string" },
          scheduledStart: { type: "string", format: "date-time" },
          scheduledEnd: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UpsertAssignmentRequest: {
        type: "object",
        required: ["vehicleId", "driverId", "scheduledStart", "scheduledEnd"],
        properties: {
          vehicleId: { type: "string" },
          driverId: { type: "string" },
          scheduledStart: { type: "string", format: "date-time" },
          scheduledEnd: { type: "string", format: "date-time" },
        },
      },
      ScheduleConflict: {
        type: "object",
        properties: {
          resourceType: { type: "string", enum: ["vehicle", "driver"] },
          resourceId: { type: "string" },
          assignmentIds: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
        },
      },
      FeatureFlags: {
        type: "object",
        properties: {
          priorityLane: { type: "boolean" },
          extendedTracking: { type: "boolean" },
          newAdminUi: { type: "boolean" },
        },
      },
      AuditLogEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          actorId: { type: "string" },
          actorEmail: { type: "string", format: "email" },
          action: { type: "string" },
          targetType: { type: "string", nullable: true },
          targetId: { type: "string", nullable: true },
          metadata: {},
          createdAt: { type: "string", format: "date-time" },
        },
      },
      BulkActionRequest: {
        type: "object",
        required: ["action", "shipmentIds"],
        properties: {
          action: { type: "string", enum: ["approve", "cancel"] },
          shipmentIds: { type: "array", items: { type: "string" }, minItems: 1 },
        },
      },
      BulkActionResponse: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["approve", "cancel"] },
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                shipmentId: { type: "string" },
                success: { type: "boolean" },
                error: { type: "string" },
              },
            },
          },
          succeeded: { type: "integer" },
          failed: { type: "integer" },
        },
      },
      ImportReport: {
        type: "object",
        properties: {
          totalRows: { type: "integer" },
          accepted: { type: "integer" },
          rejected: { type: "integer" },
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                row: { type: "integer" },
                status: { type: "string", enum: ["accepted", "rejected"] },
                shipmentId: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      MockMessage: {
        type: "object",
        properties: {
          id: { type: "string" },
          channel: { type: "string", enum: ["email", "sms"] },
          to: { type: "string" },
          subject: { type: "string", nullable: true },
          body: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      NotificationListResponse: {
        type: "object",
        properties: {
          notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
          unreadCount: { type: "integer" },
        },
      },
      ReportSummary: {
        type: "object",
        properties: {
          buckets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                period: { type: "string" },
                shipmentCount: { type: "integer" },
                revenueCents: { type: "integer" },
              },
            },
          },
          totalShipments: { type: "integer" },
          totalRevenueCents: { type: "integer" },
        },
      },
      ReportJob: {
        type: "object",
        properties: {
          id: { type: "string" },
          requestedById: { type: "string" },
          fromDate: { type: "string", format: "date-time" },
          toDate: { type: "string", format: "date-time" },
          groupBy: { type: "string", enum: ["day", "month"] },
          timeZone: { type: "string" },
          status: { type: "string", enum: ["pending", "processing", "ready", "failed"] },
          failureReason: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          readyAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request failed schema validation",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Unauthorized: {
        description: "Missing, invalid, or expired bearer token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Forbidden: {
        description: "Authenticated but lacking the required role",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      NotFound: {
        description: "Resource does not exist, or isn't visible to the caller",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } } } } } },
      },
    },

    "/api/auth/register": {
      post: {
        tags: ["SwiftCargo / Auth"],
        summary: "Create a SwiftCargo account",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } },
        responses: {
          "201": { description: "Account created; sets the refresh cookie", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["SwiftCargo / Auth"],
        summary: "Log in with email/password",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: {
          "200": { description: "Sets the refresh cookie", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["SwiftCargo / Auth"],
        summary: "Rotate the refresh cookie for a new access token",
        description: "Reads the httpOnly `th_refresh` cookie. Presenting an already-revoked or expired token is rejected.",
        responses: {
          "200": { description: "New access token + rotated refresh cookie", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["SwiftCargo / Auth"],
        summary: "Revoke the refresh cookie",
        description: "Revokes the presented refresh token server-side (if any) and clears the cookie. Idempotent — succeeds even with no cookie present.",
        responses: { "204": { description: "Logged out" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["SwiftCargo / Auth"],
        summary: "Get the current user",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/PublicUser" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/auth/admin-check": {
      get: {
        tags: ["SwiftCargo / Auth"],
        summary: "Sample admin-only resource (used to exercise 403 behavior)",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/auth/google": {
      get: {
        tags: ["SwiftCargo / Auth"],
        summary: "Google OAuth login (gated off by default)",
        description: "Returns 404 unless `GOOGLE_OAUTH_ENABLED=true`; returns 501 even then, since the flow isn't implemented yet.",
        responses: {
          "404": { $ref: "#/components/responses/NotFound" },
          "501": { description: "Not implemented", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    "/api/booking/geocode": {
      get: {
        tags: ["SwiftCargo / Booking"],
        summary: "Address autocomplete against a fixed hub list (mocked, no auth)",
        parameters: [{ name: "q", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { results: { type: "array", items: { $ref: "#/components/schemas/GeocodeSuggestion" } } } } } } } },
      },
    },
    "/api/booking/quote": {
      post: {
        tags: ["SwiftCargo / Booking"],
        summary: "Calculate a shipping quote (public)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/QuoteRequest" } } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/QuoteBreakdown" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/booking": {
      post: {
        tags: ["SwiftCargo / Booking"],
        summary: "Book a shipment",
        security: [{ swiftCargoBearer: [] }],
        description: "Roles: customer, dispatcher, admin.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/QuoteRequest" } } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { shipment: { $ref: "#/components/schemas/Shipment" } } } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      get: {
        tags: ["SwiftCargo / Booking"],
        summary: "List the caller's shipments (or all, for dispatcher/admin)",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { shipments: { type: "array", items: { $ref: "#/components/schemas/Shipment" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/booking/{id}": {
      get: {
        tags: ["SwiftCargo / Booking"],
        summary: "Get a shipment by id",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { shipment: { $ref: "#/components/schemas/Shipment" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/booking/{id}/documents": {
      get: {
        tags: ["SwiftCargo / Booking"],
        summary: "List customs documents attached to a shipment",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { documents: { type: "array", items: { $ref: "#/components/schemas/CustomsDocumentMeta" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      post: {
        tags: ["SwiftCargo / Booking"],
        summary: "Upload a customs document",
        description: "multipart/form-data with a single file field named `document`. Allowed types: application/pdf, image/jpeg, image/png. Max size: 5MB.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { document: { type: "string", format: "binary" } } } } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { document: { $ref: "#/components/schemas/CustomsDocumentMeta" } } } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/tracking": {
      get: {
        tags: ["SwiftCargo / Tracking"],
        summary: "List/sort/filter/paginate tracked shipments",
        security: [{ swiftCargoBearer: [] }],
        parameters: [
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/ShipmentStatus" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "priceCents", "distanceKm", "status"], default: "createdAt" } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingListResponse" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/tracking/export.csv": {
      get: {
        tags: ["SwiftCargo / Tracking"],
        summary: "CSV export of the tracking listing (same filters, unpaginated)",
        security: [{ swiftCargoBearer: [] }],
        parameters: [
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/ShipmentStatus" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "priceCents", "distanceKm", "status"] } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string", format: "binary" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/tracking/{id}": {
      get: {
        tags: ["SwiftCargo / Tracking"],
        summary: "Get a shipment's tracking detail",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { shipment: { $ref: "#/components/schemas/Shipment" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/tracking/{id}/advance": {
      post: {
        tags: ["SwiftCargo / Tracking"],
        summary: "Manually advance a shipment one simulation tick",
        description: "Roles: dispatcher, admin. Broadcasts the update over the tracking WebSocket.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { shipment: { $ref: "#/components/schemas/Shipment" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/tracking/ws": {
      get: {
        tags: ["SwiftCargo / Tracking"],
        summary: "Real-time shipment status/position feed (WebSocket upgrade)",
        description:
          "Not a plain HTTP endpoint — upgrade a WebSocket connection to this URL. The access token travels as " +
          "a query param (`?token=`) since browsers can't set an Authorization header on the upgrade request. " +
          "Sends `{type:\"connected\"}` once authenticated, then `{type:\"tracking-update\", shipment}` on every change.",
        parameters: [{ name: "token", in: "query", required: true, schema: { type: "string" } }],
        responses: { "101": { description: "Switching Protocols" } },
      },
    },

    "/api/billing/shipments/{shipmentId}/invoice": {
      post: {
        tags: ["SwiftCargo / Billing"],
        summary: "Create (or fetch the existing) invoice for a shipment",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "shipmentId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { currency: { $ref: "#/components/schemas/BillingCurrency" } } },
            },
          },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { invoice: { $ref: "#/components/schemas/Invoice" } } } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/billing/invoices": {
      get: {
        tags: ["SwiftCargo / Billing"],
        summary: "List invoices visible to the caller",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { invoices: { type: "array", items: { $ref: "#/components/schemas/Invoice" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/billing/invoices/{id}": {
      get: {
        tags: ["SwiftCargo / Billing"],
        summary: "Get an invoice",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { invoice: { $ref: "#/components/schemas/Invoice" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/billing/invoices/{id}/pdf": {
      get: {
        tags: ["SwiftCargo / Billing"],
        summary: "Download the invoice as a PDF",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "PDF file", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/billing/invoices/{id}/payments": {
      get: {
        tags: ["SwiftCargo / Billing"],
        summary: "List payment attempts for an invoice",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/billing/invoices/{id}/pay": {
      post: {
        tags: ["SwiftCargo / Billing"],
        summary: "Attempt payment on an invoice (mock gateway)",
        description: "Retry-friendly: calling again on a still-open invoice records a new attempt rather than erroring.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["cardNumber"], properties: { cardNumber: { type: "string", pattern: "^\\d{13,19}$" } } },
            },
          },
        },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PayInvoiceResponse" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/fleet/vehicles": {
      get: {
        tags: ["SwiftCargo / Fleet"],
        summary: "List vehicles",
        security: [{ swiftCargoBearer: [] }],
        description: "Roles: dispatcher, admin.",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { vehicles: { type: "array", items: { $ref: "#/components/schemas/Vehicle" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/fleet/drivers": {
      get: {
        tags: ["SwiftCargo / Fleet"],
        summary: "List drivers",
        security: [{ swiftCargoBearer: [] }],
        description: "Roles: dispatcher, admin.",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { drivers: { type: "array", items: { $ref: "#/components/schemas/FleetDriver" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/fleet/assignments": {
      get: {
        tags: ["SwiftCargo / Fleet"],
        summary: "List assignments",
        security: [{ swiftCargoBearer: [] }],
        description: "Roles: dispatcher, admin.",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { assignments: { type: "array", items: { $ref: "#/components/schemas/Assignment" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/fleet/assignments/{shipmentId}": {
      put: {
        tags: ["SwiftCargo / Fleet"],
        summary: "Upsert the assignment for a shipment",
        description: "Roles: dispatcher, admin. Called on every dispatch-board drag-drop, whether assigning for the first time or moving to a new vehicle/driver/slot.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "shipmentId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpsertAssignmentRequest" } } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { assignment: { $ref: "#/components/schemas/Assignment" } } } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/fleet/assignments/{id}": {
      delete: {
        tags: ["SwiftCargo / Fleet"],
        summary: "Delete an assignment",
        description: "Roles: dispatcher, admin.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/fleet/conflicts": {
      get: {
        tags: ["SwiftCargo / Fleet"],
        summary: "List double-booking conflicts",
        description: "Roles: dispatcher, admin. Overlapping windows for the same vehicle/driver are allowed to be written; this is how the UI surfaces the warning.",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { conflicts: { type: "array", items: { $ref: "#/components/schemas/ScheduleConflict" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/admin/feature-flags": {
      get: {
        tags: ["SwiftCargo / Admin"],
        summary: "Get feature flags",
        description: "Any authenticated role — used to drive conditional rendering app-wide, not just the admin console.",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { flags: { $ref: "#/components/schemas/FeatureFlags" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/admin/audit-log": {
      get: {
        tags: ["SwiftCargo / Admin"],
        summary: "List the audit log",
        description: "Roles: admin.",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { entries: { type: "array", items: { $ref: "#/components/schemas/AuditLogEntry" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/shipments/bulk": {
      post: {
        tags: ["SwiftCargo / Admin"],
        summary: "Bulk approve or cancel shipments",
        description: "Roles: admin. Always returns 200 with a per-item report — one failing shipment id never blocks the rest.",
        security: [{ swiftCargoBearer: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkActionRequest" } } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/BulkActionResponse" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/shipments/import": {
      post: {
        tags: ["SwiftCargo / Admin"],
        summary: "Bulk import shipments from CSV",
        description: "Roles: admin. multipart/form-data with a single file field named `file`.",
        security: [{ swiftCargoBearer: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ImportReport" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/notifications": {
      get: {
        tags: ["SwiftCargo / Notifications"],
        summary: "List the caller's notifications",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/NotificationListResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/notifications/{id}/read": {
      post: {
        tags: ["SwiftCargo / Notifications"],
        summary: "Mark one notification read",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { notification: { $ref: "#/components/schemas/Notification" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/notifications/read-all": {
      post: {
        tags: ["SwiftCargo / Notifications"],
        summary: "Mark all of the caller's notifications read",
        security: [{ swiftCargoBearer: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { marked: { type: "integer" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/notifications/outbox": {
      get: {
        tags: ["SwiftCargo / Notifications"],
        summary: "View the mock email/SMS outbox",
        description: "Roles: admin. Mailhog-style viewable log for test assertions — no real message ever leaves the system.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "to", in: "query", schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { messages: { type: "array", items: { $ref: "#/components/schemas/MockMessage" } } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/reporting/summary": {
      get: {
        tags: ["SwiftCargo / Reporting"],
        summary: "Shipment volume/revenue chart data",
        description: "Roles: dispatcher, admin.",
        security: [{ swiftCargoBearer: [] }],
        parameters: [
          { name: "from", in: "query", required: true, schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", required: true, schema: { type: "string", format: "date-time" } },
          { name: "groupBy", in: "query", schema: { type: "string", enum: ["day", "month"], default: "day" } },
          { name: "timeZone", in: "query", schema: { type: "string", default: "UTC" } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ReportSummary" } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/reporting/jobs": {
      post: {
        tags: ["SwiftCargo / Reporting"],
        summary: "Schedule an asynchronous CSV report",
        description: "Roles: dispatcher, admin. Same query shape as /summary; poll GET /jobs/{id} until status is \"ready\".",
        security: [{ swiftCargoBearer: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["from", "to"],
                properties: {
                  from: { type: "string", format: "date-time" },
                  to: { type: "string", format: "date-time" },
                  groupBy: { type: "string", enum: ["day", "month"], default: "day" },
                  timeZone: { type: "string", default: "UTC" },
                },
              },
            },
          },
        },
        responses: {
          "202": { description: "Accepted", content: { "application/json": { schema: { type: "object", properties: { job: { $ref: "#/components/schemas/ReportJob" } } } } } },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/reporting/jobs/{id}": {
      get: {
        tags: ["SwiftCargo / Reporting"],
        summary: "Get a report job's status",
        description: "Roles: dispatcher (own jobs only), admin (any).",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { job: { $ref: "#/components/schemas/ReportJob" } } } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/reporting/jobs/{id}/download": {
      get: {
        tags: ["SwiftCargo / Reporting"],
        summary: "Download a ready report job's CSV",
        security: [{ swiftCargoBearer: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string", format: "binary" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },


    "/api/test/seed": {
      post: {
        tags: ["Test Control"],
        summary: "Seed one module's data, or all modules",
        description: "Unauthenticated by design — this is a practice-sandbox control surface, never exposed on a deployment with real user data.",
        parameters: [{ name: "module", in: "query", schema: { type: "string" }, description: "Omit to seed every registered module" }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { seeded: { type: "array", items: { type: "string" } } } } } } },
          "404": { description: "Unknown module name" },
        },
      },
    },
    "/api/test/reset": {
      post: {
        tags: ["Test Control"],
        summary: "Reset one module's data, or all modules",
        description: "Unauthenticated by design — this is a practice-sandbox control surface, never exposed on a deployment with real user data.",
        parameters: [{ name: "module", in: "query", schema: { type: "string" }, description: "Omit to reset every registered module" }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { reset: { type: "array", items: { type: "string" } } } } } } },
          "404": { description: "Unknown module name" },
        },
      },
    },
  },
};
