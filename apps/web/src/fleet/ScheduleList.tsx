import type { Assignment, FleetDriver, ScheduleConflict, Shipment, Vehicle } from "@assertquest/shared";
import { Card } from "../ui/index.js";

interface ScheduleListProps {
  assignments: Assignment[];
  shipments: Shipment[];
  vehicles: Vehicle[];
  drivers: FleetDriver[];
  conflicts: ScheduleConflict[];
}

// Chronological schedule / calendar view (FR-902) — every assignment in time order,
// with conflicting rows marked so the conflict is visible in context, not just in
// the summary banner above the board.
export function ScheduleList({ assignments, shipments, vehicles, drivers, conflicts }: ScheduleListProps) {
  const conflictingAssignmentIds = new Set(conflicts.flatMap((c) => c.assignmentIds));
  const sorted = [...assignments].sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  return (
    <section aria-labelledby="schedule-heading" className="mt-6">
      <Card>
        <h2 id="schedule-heading" className="mb-4 text-lg font-semibold text-ink-900">
          Schedule
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-hairline">
            <thead className="bg-surface-subtle font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
              <tr>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">End</th>
                <th className="px-4 py-2 text-left">Shipment</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-white">
              {sorted.map((a) => {
                const shipment = shipments.find((s) => s.id === a.shipmentId);
                const vehicle = vehicles.find((v) => v.id === a.vehicleId);
                const driver = drivers.find((d) => d.id === a.driverId);
                const conflicted = conflictingAssignmentIds.has(a.id);
                return (
                  <tr
                    key={a.id}
                    className={
                      conflicted
                        ? "bg-negative-50 transition-colors hover:bg-negative-100"
                        : "transition-colors hover:bg-surface-row"
                    }
                  >
                    <td className="px-4 py-2 font-mono text-sm text-muted">{new Date(a.scheduledStart).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-sm text-muted">{new Date(a.scheduledEnd).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-ink-700">
                      {shipment ? `${shipment.origin.label} → ${shipment.destination.label}` : a.shipmentId}
                    </td>
                    <td className="px-4 py-2 text-sm text-ink-700">{vehicle?.label ?? a.vehicleId}</td>
                    <td className="px-4 py-2 text-sm text-ink-700">
                      {conflicted && (
                        <span aria-label="Scheduling conflict" className="mr-1 text-negative-600">
                          ⚠
                        </span>
                      )}
                      {driver?.email ?? a.driverId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
