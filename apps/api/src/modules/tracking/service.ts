import { prisma } from "../../core/db.js";
import { toPublicShipment, findOwnedShipment } from "../booking/service.js";
import { notify } from "../notifications/service.js";
import { advanceOneTick } from "./gpsSimulator.js";
import type { ListTrackingQuery } from "./schema.js";
import type { Shipment, Role, TrackingListResponse, ShipmentStatus } from "@assertquest/shared";
import type { Prisma } from "@prisma/client";

// Shared by the manual /advance endpoint and the background simulation loop —
// fires exactly once, on the transition into "delivered", not on every tick.
export function notifyIfJustDelivered(customerId: string, previousStatus: ShipmentStatus, newStatus: ShipmentStatus, shipmentId: string): void {
  if (newStatus === "delivered" && previousStatus !== "delivered") {
    notify(customerId, "shipment.delivered", "Shipment delivered", `Shipment ${shipmentId} has been delivered.`, {
      email: true,
      sms: true,
    });
  }
}

export async function listTracking(
  requesterId: string,
  role: Role,
  query: ListTrackingQuery,
): Promise<TrackingListResponse> {
  const canSeeAll = role === "admin" || role === "dispatcher";
  const where: Prisma.ShipmentWhereInput = {
    ...(canSeeAll ? {} : { customerId: requesterId }),
    ...(query.status ? { status: query.status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    items: rows.map(toPublicShipment),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getTracking(id: string, requesterId: string, role: Role): Promise<Shipment> {
  const shipment = await findOwnedShipment(id, requesterId, role);
  return toPublicShipment(shipment);
}

// Manually advances a shipment one simulation tick (FR-801) — the same step the
// automatic background simulator applies, exposed so dispatchers/admins can move a
// shipment forward without waiting for the next tick, and so it's testable
// deterministically rather than only via real-time waiting.
export async function advanceShipment(id: string, requesterId: string, role: Role): Promise<Shipment> {
  const shipment = await findOwnedShipment(id, requesterId, role);
  const step = advanceOneTick(
    shipment.status,
    { lat: shipment.currentLat, lng: shipment.currentLng },
    { lat: shipment.destinationLat, lng: shipment.destinationLng },
  );

  const updated = await prisma.shipment.update({
    where: { id },
    data: {
      status: step.status,
      currentLat: step.position.lat,
      currentLng: step.position.lng,
      positionUpdatedAt: new Date(),
    },
  });

  notifyIfJustDelivered(updated.customerId, shipment.status, updated.status, updated.id);

  return toPublicShipment(updated);
}

const CSV_COLUMNS = [
  "id",
  "status",
  "origin",
  "destination",
  "weightKg",
  "distanceKm",
  "priceCents",
  "currency",
  "createdAt",
] as const;

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV export for the tracking data table (FR-803).
export function toCsv(shipments: Shipment[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = shipments.map((s) =>
    [
      s.id,
      s.status,
      s.origin.label,
      s.destination.label,
      s.package.weightKg,
      s.distanceKm.toFixed(1),
      s.priceCents,
      s.currency,
      s.createdAt,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}
