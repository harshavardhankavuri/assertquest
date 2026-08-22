import type { PaymentStatus } from "@assertquest/shared";

// Mock payment gateway sandbox (FR-1003) — no real payment processor is ever
// involved. Card numbers follow the same convention real-world test gateways
// (Stripe, etc.) use: specific numbers deterministically trigger each outcome so
// challenges are reproducible, and any other well-formed number succeeds.
export const DECLINED_TEST_CARD = "4000000000000002";
export const TIMEOUT_TEST_CARD = "4000000000000119";

export interface GatewayResult {
  status: PaymentStatus;
  failureReason: string | null;
}

export function chargeCard(cardNumber: string): GatewayResult {
  if (cardNumber === DECLINED_TEST_CARD) {
    return { status: "declined", failureReason: "card_declined: insufficient funds" };
  }
  if (cardNumber === TIMEOUT_TEST_CARD) {
    return { status: "timed_out", failureReason: "gateway_timeout: no response from processor" };
  }
  return { status: "succeeded", failureReason: null };
}

export function last4(cardNumber: string): string {
  return cardNumber.slice(-4);
}
