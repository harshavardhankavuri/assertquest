import type { FastifyInstance } from "fastify";
import { createInvoiceSchema, payInvoiceSchema } from "./schema.js";
import * as billingService from "./service.js";
import { authenticate } from "../auth/middleware.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

export async function billingRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "billing");

  // Creates (or returns the existing) invoice for a shipment, in the requested
  // billing currency (FR-1002). Owner, dispatcher, or admin.
  app.post<{ Params: { shipmentId: string } }>(
    "/shipments/:shipmentId/invoice",
    { preHandler: authenticate },
    async (request, reply) => {
      const parsed = createInvoiceSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        throw ApiError.validation("Invalid invoice payload", parsed.error.flatten());
      }
      const invoice = await billingService.createInvoice(
        request.params.shipmentId,
        request.auth!.userId,
        request.auth!.role,
        parsed.data,
      );
      reply.code(201).send({ invoice });
    },
  );

  app.get("/invoices", { preHandler: authenticate }, async (request, reply) => {
    reply.send({ invoices: await billingService.listInvoices(request.auth!.userId, request.auth!.role) });
  });

  app.get<{ Params: { id: string } }>("/invoices/:id", { preHandler: authenticate }, async (request, reply) => {
    const invoice = await billingService.getInvoice(request.params.id, request.auth!.userId, request.auth!.role);
    reply.send({ invoice });
  });

  // PDF invoice generation (FR-1001).
  app.get<{ Params: { id: string } }>("/invoices/:id/pdf", { preHandler: authenticate }, async (request, reply) => {
    const pdf = await billingService.getInvoicePdf(request.params.id, request.auth!.userId, request.auth!.role);
    reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="invoice-${request.params.id}.pdf"`)
      .send(pdf);
  });

  app.get<{ Params: { id: string } }>(
    "/invoices/:id/payments",
    { preHandler: authenticate },
    async (request, reply) => {
      const payments = await billingService.listPayments(request.params.id, request.auth!.userId, request.auth!.role);
      reply.send({ payments });
    },
  );

  // Mock payment gateway (FR-1003) with retry support (FR-1004): calling this again
  // on an open invoice records a new attempt rather than erroring.
  app.post<{ Params: { id: string } }>("/invoices/:id/pay", { preHandler: authenticate }, async (request, reply) => {
    const parsed = payInvoiceSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid payment payload", parsed.error.flatten());
    }
    const result = await billingService.payInvoice(
      request.params.id,
      request.auth!.userId,
      request.auth!.role,
      parsed.data,
    );
    reply.send(result);
  });
}
