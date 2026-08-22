import type { AddressPoint, LatLng, PackageDetails, QuoteBreakdown } from "@assertquest/shared";

// Pricing constants (FR-704). Arbitrary but fixed, so quotes are deterministic
// and reproducible across seed/reset cycles.
const BASE_FEE_CENTS = 500;
const RATE_PER_KG_CENTS = 120;
const RATE_PER_KM_CENTS = 8;
// Industry-standard volumetric divisor for cm-based dimensions -> kg.
const VOLUMETRIC_DIVISOR = 5000;
const CURRENCY = "USD";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_KM * c;
}

export function calculateQuote(origin: AddressPoint, destination: AddressPoint, pkg: PackageDetails): QuoteBreakdown {
  const distanceKm = haversineDistanceKm(origin, destination);
  const volumetricWeightKg = (pkg.lengthCm * pkg.widthCm * pkg.heightCm) / VOLUMETRIC_DIVISOR;
  const chargeableWeightKg = Math.max(pkg.weightKg, volumetricWeightKg);

  const weightFeeCents = Math.round(chargeableWeightKg * RATE_PER_KG_CENTS);
  const distanceFeeCents = Math.round(distanceKm * RATE_PER_KM_CENTS);
  const priceCents = BASE_FEE_CENTS + weightFeeCents + distanceFeeCents;

  return {
    distanceKm,
    chargeableWeightKg,
    volumetricWeightKg,
    baseFeeCents: BASE_FEE_CENTS,
    weightFeeCents,
    distanceFeeCents,
    priceCents,
    currency: CURRENCY,
  };
}
