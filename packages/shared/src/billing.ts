export const BILLING_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR"] as const;
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number];

export const INVOICE_STATUSES = ["open", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = ["succeeded", "declined", "timed_out"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Invoice {
  id: string;
  shipmentId: string;
  customerId: string;
  amountCents: number;
  currency: BillingCurrency;
  status: InvoiceStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  attemptNumber: number;
  amountCents: number;
  currency: BillingCurrency;
  status: PaymentStatus;
  cardLast4: string;
  failureReason: string | null;
  createdAt: string;
}

export interface CreateInvoiceRequest {
  currency: BillingCurrency;
}

export interface PayInvoiceRequest {
  cardNumber: string;
}

export interface PayInvoiceResponse {
  invoice: Invoice;
  payment: Payment;
}
