import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { notify } from "../notifications/service.js";
import { searchLocations } from "./geocodeData.js";
import { calculateQuote } from "./pricing.js";
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "./schema.js";
import type { QuoteInput, CreateBookingInput } from "./schema.js";
import type { Shipment, CustomsDocumentMeta, QuoteBreakdown, Role } from "@assertquest/shared";
import type { Shipment as PrismaShipment, CustomsDocument as PrismaDocument } from "@prisma/client";

export function geocode(query: string) {
  return searchLocations(query);
}

export function quote(input: QuoteInput): QuoteBreakdown {
  return calculateQuote(input.origin, input.destination, input.package);
}

// Exported for the tracking module (Module 3), which reads these same shipments
// rather than owning separate records.
export function toPublicShipment(s: PrismaShipment): Shipment {
  return {
    id: s.id,
    customerId: s.customerId,
    origin: { label: s.originLabel, lat: s.originLat, lng: s.originLng },
    destination: { label: s.destinationLabel, lat: s.destinationLat, lng: s.destinationLng },
    package: { weightKg: s.weightKg, lengthCm: s.lengthCm, widthCm: s.widthCm, heightCm: s.heightCm },
    distanceKm: s.distanceKm,
    priceCents: s.priceCents,
    currency: s.currency,
    status: s.status,
    approved: s.approved,
    currentPosition: { lat: s.currentLat, lng: s.currentLng },
    positionUpdatedAt: s.positionUpdatedAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

function toPublicDocument(d: PrismaDocument): CustomsDocumentMeta {
  return {
    id: d.id,
    shipmentId: d.shipmentId,
    filename: d.filename,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    createdAt: d.createdAt.toISOString(),
  };
}

// The price is always recomputed here from origin/destination/package — a client-
// supplied priceCents is never trusted, even if the wizard sent one along (FR-704).
export async function createBooking(input: CreateBookingInput, customerId: string): Promise<Shipment> {
  const breakdown = calculateQuote(input.origin, input.destination, input.package);

  const shipment = await prisma.shipment.create({
    data: {
      customerId,
      originLabel: input.origin.label,
      originLat: input.origin.lat,
      originLng: input.origin.lng,
      destinationLabel: input.destination.label,
      destinationLat: input.destination.lat,
      destinationLng: input.destination.lng,
      weightKg: input.package.weightKg,
      lengthCm: input.package.lengthCm,
      widthCm: input.package.widthCm,
      heightCm: input.package.heightCm,
      distanceKm: breakdown.distanceKm,
      priceCents: breakdown.priceCents,
      currency: breakdown.currency,
      currentLat: input.origin.lat,
      currentLng: input.origin.lng,
    },
  });

  notify(
    customerId,
    "shipment.booked",
    "Shipment booked",
    `Your shipment from ${input.origin.label} to ${input.destination.label} has been booked.`,
    { email: true },
  );

  return toPublicShipment(shipment);
}

export async function listBookings(requesterId: string, role: Role): Promise<Shipment[]> {
  const canSeeAll = role === "admin" || role === "dispatcher";
  const shipments = await prisma.shipment.findMany({
    where: canSeeAll ? {} : { customerId: requesterId },
    orderBy: { createdAt: "desc" },
  });
  return shipments.map(toPublicShipment);
}

export async function findOwnedShipment(id: string, requesterId: string, role: Role): Promise<PrismaShipment> {
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) throw ApiError.notFound("Shipment not found");

  const canSeeAll = role === "admin" || role === "dispatcher";
  if (!canSeeAll && shipment.customerId !== requesterId) {
    throw ApiError.forbidden("You do not have access to this shipment");
  }
  return shipment;
}

export async function getBooking(id: string, requesterId: string, role: Role): Promise<Shipment> {
  const shipment = await findOwnedShipment(id, requesterId, role);
  return toPublicShipment(shipment);
}

export async function addDocument(
  shipmentId: string,
  requesterId: string,
  role: Role,
  file: { filename: string; mimeType: string; content: Buffer },
): Promise<CustomsDocumentMeta> {
  await findOwnedShipment(shipmentId, requesterId, role);

  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType)) {
    throw ApiError.validation(
      `Unsupported file type "${file.mimeType}". Allowed types: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}`,
    );
  }
  if (file.content.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw ApiError.validation(`File exceeds the maximum size of ${MAX_DOCUMENT_SIZE_BYTES} bytes`);
  }

  const doc = await prisma.customsDocument.create({
    data: {
      shipmentId,
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.content.byteLength,
      content: file.content,
    },
  });

  return toPublicDocument(doc);
}

export async function listDocuments(
  shipmentId: string,
  requesterId: string,
  role: Role,
): Promise<CustomsDocumentMeta[]> {
  await findOwnedShipment(shipmentId, requesterId, role);
  const docs = await prisma.customsDocument.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "asc" },
  });
  return docs.map(toPublicDocument);
}
