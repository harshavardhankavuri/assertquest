export interface AddressPoint {
  label: string;
  lat: number;
  lng: number;
}

export interface PackageDetails {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface QuoteRequest {
  origin: AddressPoint;
  destination: AddressPoint;
  package: PackageDetails;
}

export interface QuoteBreakdown {
  distanceKm: number;
  chargeableWeightKg: number;
  volumetricWeightKg: number;
  baseFeeCents: number;
  weightFeeCents: number;
  distanceFeeCents: number;
  priceCents: number;
  currency: string;
}

export interface CreateBookingRequest extends QuoteRequest {}

export const SHIPMENT_STATUSES = ["booked", "in_transit", "delivered", "cancelled"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  customerId: string;
  origin: AddressPoint;
  destination: AddressPoint;
  package: PackageDetails;
  distanceKm: number;
  priceCents: number;
  currency: string;
  status: ShipmentStatus;
  approved: boolean;
  currentPosition: LatLng;
  positionUpdatedAt: string;
  createdAt: string;
}

export interface GeocodeSuggestion extends AddressPoint {}

export interface CustomsDocumentMeta {
  id: string;
  shipmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}
