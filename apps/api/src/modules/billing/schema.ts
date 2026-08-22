import { z } from "zod";
import { BILLING_CURRENCIES } from "@assertquest/shared";

export const createInvoiceSchema = z.object({
  currency: z.enum(BILLING_CURRENCIES).default("USD"),
});

export const payInvoiceSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, "Card number must be 13-19 digits"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;
