export const VEHICLE_TYPES = ["van", "box_truck", "container_truck"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface Vehicle {
  id: string;
  label: string;
  type: VehicleType;
  capacityKg: number;
  plate: string;
}

export interface FleetDriver {
  id: string;
  email: string;
}

export interface Assignment {
  id: string;
  shipmentId: string;
  vehicleId: string;
  driverId: string;
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
}

export interface UpsertAssignmentRequest {
  vehicleId: string;
  driverId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export const CONFLICT_RESOURCE_TYPES = ["vehicle", "driver"] as const;
export type ConflictResourceType = (typeof CONFLICT_RESOURCE_TYPES)[number];

// A conflict is a pair of assignments that share a vehicle or driver with
// overlapping time windows (FR-902) — surfaced by the API so the UI can render a
// visible warning (FR-903) rather than silently allowing the double-booking.
export interface ScheduleConflict {
  resourceType: ConflictResourceType;
  resourceId: string;
  assignmentIds: [string, string];
}
