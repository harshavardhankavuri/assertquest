import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { findOwnedShipment, toPublicShipment } from "../booking/service.js";
import { notify } from "../notifications/service.js";
import { convertUsdCentsToCurrency } from "./currency.js";
import { chargeCard, last4 } from "./mockGateway.js";
import { generateInvoicePdf } from "./pdf.js";
import type { CreateInvoiceInput, PayInvoiceInput } from "./schema.js";
import type { Invoice, Payment, PayInvoiceResponse, Role, BillingCurrency } from "@assertquest/shared";
import type { Invoice as PrismaInvoice, Payment as PrismaPayment } from "@prisma/client";

function toPublicInvoice(i: PrismaInvoice): Invoice {
  return {
    id: i.id,
    shipmentId: i.shipmentId,
    customerId: i.customerId,
    amountCents: i.amountCents,
    currency: i.currency as BillingCurrency,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  };
}

function toPublicPayment(p: PrismaPayment): Payment {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    attemptNumber: p.attemptNumber,
    amountCents: p.amountCents,
    currency: p.currency as BillingCurrency,
    status: p.status,
    cardLast4: p.cardLast4,
    failureReason: p.failureReason,
    createdAt: p.createdAt.toISOString(),
  };
}

// Creates an invoice for a shipment, converting its USD price into the requested
// billing currency (FR-1002). Idempotent: calling this again for the same shipment
// returns the existing invoice rather than erroring, so the UI can call it freely.
export async function createInvoice(
  shipmentId: string,
  requesterId: string,
  role: Role,
  input: CreateInvoiceInput,
): Promise<Invoice> {
  const shipment = await findOwnedShipment(shipmentId, requesterId, role);

  const existing = await prisma.invoice.findUnique({ where: { shipmentId } });
  if (existing) return toPublicInvoice(existing);

  const amountCents = convertUsdCentsToCurrency(shipment.priceCents, input.currency);
  const invoice = await prisma.invoice.create({
    data: {
      shipmentId,
      customerId: shipment.customerId,
      amountCents,
      currency: input.currency,
    },
  });
  return toPublicInvoice(invoice);
}

async function findOwnedInvoice(id: string, requesterId: string, role: Role): Promise<PrismaInvoice> {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const canSeeAll = role === "admin" || role === "dispatcher";
  if (!canSeeAll && invoice.customerId !== requesterId) {
    throw ApiError.forbidden("You do not have access to this invoice");
  }
  return invoice;
}

export async function getInvoice(id: string, requesterId: string, role: Role): Promise<Invoice> {
  const invoice = await findOwnedInvoice(id, requesterId, role);
  return toPublicInvoice(invoice);
}

export async function listInvoices(requesterId: string, role: Role): Promise<Invoice[]> {
  const canSeeAll = role === "admin" || role === "dispatcher";
  const invoices = await prisma.invoice.findMany({
    where: canSeeAll ? {} : { customerId: requesterId },
    orderBy: { createdAt: "desc" },
  });
  return invoices.map(toPublicInvoice);
}

// Attempts a payment against the mock gateway (FR-1003). Declines and timeouts
// leave the invoice open so the same endpoint can be called again to retry
// (FR-1004) — each attempt is recorded as its own Payment row.
export async function payInvoice(
  invoiceId: string,
  requesterId: string,
  role: Role,
  input: PayInvoiceInput,
): Promise<PayInvoiceResponse> {
  const invoice = await findOwnedInvoice(invoiceId, requesterId, role);
  if (invoice.status === "paid") {
    throw ApiError.conflict("This invoice has already been paid");
  }

  const attemptNumber = (await prisma.payment.count({ where: { invoiceId } })) + 1;
  const result = chargeCard(input.cardNumber);

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      attemptNumber,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: result.status,
      cardLast4: last4(input.cardNumber),
      failureReason: result.failureReason,
    },
  });

  let updatedInvoice = invoice;
  if (result.status === "succeeded") {
    updatedInvoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "paid" } });
    notify(invoice.customerId, "payment.succeeded", "Payment received", `Payment for invoice ${invoiceId} was successful.`, {
      email: true,
    });
  } else {
    notify(invoice.customerId, "payment.failed", "Payment failed", `Payment for invoice ${invoiceId} failed: ${result.failureReason}`, {
      email: true,
    });
  }

  return { invoice: toPublicInvoice(updatedInvoice), payment: toPublicPayment(payment) };
}

export async function listPayments(invoiceId: string, requesterId: string, role: Role): Promise<Payment[]> {
  await findOwnedInvoice(invoiceId, requesterId, role);
  const payments = await prisma.payment.findMany({ where: { invoiceId }, orderBy: { attemptNumber: "asc" } });
  return payments.map(toPublicPayment);
}

export async function getInvoicePdf(id: string, requesterId: string, role: Role): Promise<Buffer> {
  const invoice = await findOwnedInvoice(id, requesterId, role);
  const shipment = await findOwnedShipment(invoice.shipmentId, requesterId, role);
  return generateInvoicePdf(toPublicInvoice(invoice), toPublicShipment(shipment));
}
