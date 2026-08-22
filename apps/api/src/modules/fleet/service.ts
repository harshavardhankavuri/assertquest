import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { findConflicts } from "./conflicts.js";
import type { UpsertAssignmentInput } from "./schema.js";
import type { Vehicle, FleetDriver, Assignment, ScheduleConflict } from "@assertquest/shared";
import type {
  Vehicle as PrismaVehicle,
  Assignment as PrismaAssignment,
  User as PrismaUser,
} from "@prisma/client";

function toPublicVehicle(v: PrismaVehicle): Vehicle {
  return { id: v.id, label: v.label, type: v.type, capacityKg: v.capacityKg, plate: v.plate };
}

function toPublicDriver(u: PrismaUser): FleetDriver {
  return { id: u.id, email: u.email };
}

function toPublicAssignment(a: PrismaAssignment): Assignment {
  return {
    id: a.id,
    shipmentId: a.shipmentId,
    vehicleId: a.vehicleId,
    driverId: a.driverId,
    scheduledStart: a.scheduledStart.toISOString(),
    scheduledEnd: a.scheduledEnd.toISOString(),
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listVehicles(): Promise<Vehicle[]> {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { label: "asc" } });
  return vehicles.map(toPublicVehicle);
}

export async function listDrivers(): Promise<FleetDriver[]> {
  const drivers = await prisma.user.findMany({ where: { role: "driver" }, orderBy: { email: "asc" } });
  return drivers.map(toPublicDriver);
}

export async function listAssignments(): Promise<Assignment[]> {
  const assignments = await prisma.assignment.findMany({ orderBy: { scheduledStart: "asc" } });
  return assignments.map(toPublicAssignment);
}

// Creates or updates the assignment for a shipment (upsert by shipmentId) — dragging
// a card to a different vehicle/driver/slot on the board reassigns it in place
// rather than creating a second assignment for the same shipment (FR-901).
export async function upsertAssignment(shipmentId: string, input: UpsertAssignmentInput): Promise<Assignment> {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw ApiError.notFound("Shipment not found");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw ApiError.validation(`Unknown vehicle "${input.vehicleId}"`);

  const driver = await prisma.user.findUnique({ where: { id: input.driverId } });
  if (!driver || driver.role !== "driver") {
    throw ApiError.validation(`"${input.driverId}" is not a known driver`);
  }

  const data = {
    vehicleId: input.vehicleId,
    driverId: input.driverId,
    scheduledStart: new Date(input.scheduledStart),
    scheduledEnd: new Date(input.scheduledEnd),
  };

  const assignment = await prisma.assignment.upsert({
    where: { shipmentId },
    update: data,
    create: { shipmentId, ...data },
  });

  return toPublicAssignment(assignment);
}

export async function deleteAssignment(id: string): Promise<void> {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  await prisma.assignment.delete({ where: { id } });
}

export async function getConflicts(): Promise<ScheduleConflict[]> {
  const assignments = await prisma.assignment.findMany();
  return findConflicts(
    assignments.map((a) => ({
      id: a.id,
      vehicleId: a.vehicleId,
      driverId: a.driverId,
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
    })),
  );
}
