import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { quoteSchema, createBookingSchema, MAX_DOCUMENT_SIZE_BYTES } from "./schema.js";
import * as bookingService from "./service.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

export async function bookingRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "booking");
  await app.register(multipart, { limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES } });

  // Mock geocoding (FR-703) — address autocomplete against a fixed hub list.
  app.get<{ Querystring: { q?: string } }>("/geocode", async (request, reply) => {
    reply.send({ results: bookingService.geocode(request.query.q ?? "") });
  });

  // Dynamic pricing calculator (FR-704). Public: pricing itself isn't sensitive,
  // and letting anonymous visitors try the calculator matches the wizard UX.
  app.post("/quote", async (request, reply) => {
    const parsed = quoteSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid quote payload", parsed.error.flatten());
    }
    reply.send(bookingService.quote(parsed.data));
  });

  app.post(
    "/",
    { preHandler: [authenticate, requireRole("customer", "dispatcher", "admin")] },
    async (request, reply) => {
      const parsed = createBookingSchema.safeParse(request.body);
      if (!parsed.success) {
        throw ApiError.validation("Invalid booking payload", parsed.error.flatten());
      }
      const shipment = await bookingService.createBooking(parsed.data, request.auth!.userId);
      reply.code(201).send({ shipment });
    },
  );

  app.get("/", { preHandler: authenticate }, async (request, reply) => {
    const shipments = await bookingService.listBookings(request.auth!.userId, request.auth!.role);
    reply.send({ shipments });
  });

  app.get<{ Params: { id: string } }>("/:id", { preHandler: authenticate }, async (request, reply) => {
    const shipment = await bookingService.getBooking(request.params.id, request.auth!.userId, request.auth!.role);
    reply.send({ shipment });
  });

  app.get<{ Params: { id: string } }>(
    "/:id/documents",
    { preHandler: authenticate },
    async (request, reply) => {
      const documents = await bookingService.listDocuments(
        request.params.id,
        request.auth!.userId,
        request.auth!.role,
      );
      reply.send({ documents });
    },
  );

  // Customs document upload (FR-705). Client-side validation in the wizard is UX
  // only; the real enforcement of file type and size happens here.
  app.post<{ Params: { id: string } }>(
    "/:id/documents",
    { preHandler: authenticate },
    async (request, reply) => {
      const uploaded = await request.file();
      if (!uploaded) {
        throw ApiError.validation("No file was uploaded");
      }
      let content: Buffer;
      try {
        content = await uploaded.toBuffer();
      } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "FST_REQ_FILE_TOO_LARGE") {
          throw ApiError.validation(`File exceeds the maximum size of ${MAX_DOCUMENT_SIZE_BYTES} bytes`);
        }
        throw err;
      }
      const document = await bookingService.addDocument(request.params.id, request.auth!.userId, request.auth!.role, {
        filename: uploaded.filename,
        mimeType: uploaded.mimetype,
        content,
      });
      reply.code(201).send({ document });
    },
  );
}
