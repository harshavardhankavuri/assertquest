import type { ScheduleConflict } from "@assertquest/shared";

interface AssignmentWindow {
  id: string;
  vehicleId: string;
  driverId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}

function overlaps(a: AssignmentWindow, b: AssignmentWindow): boolean {
  return a.scheduledStart < b.scheduledEnd && b.scheduledStart < a.scheduledEnd;
}

// Detects double-bookings (FR-902): any two assignments sharing a vehicle or a
// driver whose time windows overlap. Pure and read-only — nothing here prevents the
// double-booking from existing, it only reports it (see schema.prisma's note on
// Assignment for why writes are never rejected).
export function findConflicts(assignments: AssignmentWindow[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a = assignments[i];
      const b = assignments[j];
      if (!overlaps(a, b)) continue;

      if (a.vehicleId === b.vehicleId) {
        conflicts.push({ resourceType: "vehicle", resourceId: a.vehicleId, assignmentIds: [a.id, b.id] });
      }
      if (a.driverId === b.driverId) {
        conflicts.push({ resourceType: "driver", resourceId: a.driverId, assignmentIds: [a.id, b.id] });
      }
    }
  }

  return conflicts;
}
