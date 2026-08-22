import type { FleetDriver, ScheduleConflict, Vehicle } from "@assertquest/shared";

interface ConflictBannerProps {
  conflicts: ScheduleConflict[];
  vehicles: Vehicle[];
  drivers: FleetDriver[];
}

// Visible warning for double-booked vehicles/drivers (FR-903) — must be a real,
// announced DOM element (role="alert"), never just a console.error, so testers can
// actually assert on it. See tracking-bulk-dead-reckoning for the same principle
// applied to WebSocket drops.
export function ConflictBanner({ conflicts, vehicles, drivers }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  function describe(conflict: ScheduleConflict): string {
    if (conflict.resourceType === "vehicle") {
      const vehicle = vehicles.find((v) => v.id === conflict.resourceId);
      return `Vehicle "${vehicle?.label ?? conflict.resourceId}" is double-booked`;
    }
    const driver = drivers.find((d) => d.id === conflict.resourceId);
    return `Driver ${driver?.email ?? conflict.resourceId} is double-booked`;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-6 flex gap-2.5 rounded-lg border border-negative-100 bg-negative-50 px-4 py-3"
    >
      <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-negative-600" />
      <div>
        <strong className="text-sm font-semibold text-negative-700">Scheduling conflicts detected</strong>
        <ul className="mt-1 flex flex-col gap-0.5">
          {conflicts.map((c, i) => (
            <li key={`${c.resourceType}-${c.resourceId}-${i}`} className="text-sm text-negative-700">
              {describe(c)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
