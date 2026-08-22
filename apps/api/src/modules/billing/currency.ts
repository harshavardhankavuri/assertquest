import type { BillingCurrency } from "@assertquest/shared";

// Fixed exchange rates against USD (shipment prices are always priced in USD by
// Module 2) — arbitrary but fixed, so conversions are deterministic and
// reproducible across seed/reset cycles, same rationale as booking's pricing
// constants. Not real FX rates.
const EXCHANGE_RATES_PER_USD: Record<BillingCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  INR: 83.12,
};

// Minor-unit digits per ISO 4217 — JPY has no minor unit, unlike the others (FR-1002:
// "correct formatting/rounding" means not treating every currency as 2-decimal USD).
const MINOR_UNIT_DIGITS: Record<BillingCurrency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  INR: 2,
};

// Converts a USD amount in cents into the target currency's minor units (e.g. cents
// for USD/EUR, whole yen for JPY), rounded to that currency's own precision.
export function convertUsdCentsToCurrency(usdCents: number, currency: BillingCurrency): number {
  const usdAmount = usdCents / 100;
  const targetAmount = usdAmount * EXCHANGE_RATES_PER_USD[currency];
  const digits = MINOR_UNIT_DIGITS[currency];
  return Math.round(targetAmount * 10 ** digits);
}

export function minorUnitDigits(currency: BillingCurrency): number {
  return MINOR_UNIT_DIGITS[currency];
}

export function formatCurrency(amountMinorUnits: number, currency: BillingCurrency): string {
  const digits = MINOR_UNIT_DIGITS[currency];
  const amount = amountMinorUnits / 10 ** digits;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
