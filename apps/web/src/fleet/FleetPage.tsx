import { useCallback, useEffect, useState } from "react";
import type { Assignment, FleetDriver, ScheduleConflict, Shipment, Vehicle } from "@assertquest/shared";
import { Alert, Card, FormField, PageHeader, SelectInput, TextInput } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { FleetBoard } from "./FleetBoard.js";
import { ConflictBanner } from "./ConflictBanner.js";
import { ScheduleList } from "./ScheduleList.js";

const ASSIGNMENT_DURATION_MS = 2 * 60 * 60 * 1000; // 2-hour slot per assignment

function defaultDateTimeLocal(): string {
  const now = new Date(Date.now() + 60 * 60 * 1000); // an hour from now, so it's schedulable
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

export function FleetPage() {
  const { accessToken } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [driverId, setDriverId] = useState("");
  const [start, setStart] = useState(defaultDateTimeLocal());
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    const [tracking, vehiclesRes, driversRes, assignmentsRes, conflictsRes] = await Promise.all([
      api.listTracking(accessToken, { pageSize: 100 }),
      api.listVehicles(accessToken),
      api.listFleetDrivers(accessToken),
      api.listAssignments(accessToken),
      api.listConflicts(accessToken),
    ]);
    setShipments(tracking.items);
    setVehicles(vehiclesRes.vehicles);
    setDrivers(driversRes.drivers);
    setAssignments(assignmentsRes.assignments);
    setConflicts(conflictsRes.conflicts);
    setDriverId((current) => current || driversRes.drivers[0]?.id || "");
  }, [accessToken]);

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load fleet data."));
  }, [reload]);

  async function onDropOnVehicle(shipmentId: string, vehicleId: string) {
    if (!accessToken || !driverId) return;
    setError(null);
    try {
      const scheduledStart = new Date(start).toISOString();
      const scheduledEnd = new Date(new Date(start).getTime() + ASSIGNMENT_DURATION_MS).toISOString();
      await api.upsertAssignment(shipmentId, { vehicleId, driverId, scheduledStart, scheduledEnd }, accessToken);
      await reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not assign shipment.");
    }
  }

  async function onDropOnUnassigned(shipmentId: string) {
    if (!accessToken) return;
    const existing = assignments.find((a) => a.shipmentId === shipmentId);
    if (!existing) return;
    setError(null);
    try {
      await api.deleteAssignment(existing.id, accessToken);
      await reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not unassign shipment.");
    }
  }

  if (!accessToken) return null;

  return (
    <main>
      <PageHeader title="Fleet & scheduling" />
      <ConflictBanner conflicts={conflicts} vehicles={vehicles} drivers={drivers} />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <FormField label="Assign as driver" htmlFor="fleet-driver">
              <SelectInput id="fleet-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.email}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <div className="min-w-[220px]">
            <FormField label="Slot start (2-hour window)" htmlFor="fleet-start">
              <TextInput id="fleet-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </FormField>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-xl font-bold tracking-tight text-ink-900">Board</h2>
      <FleetBoard
        shipments={shipments}
        vehicles={vehicles}
        assignments={assignments}
        onDropOnVehicle={onDropOnVehicle}
        onDropOnUnassigned={onDropOnUnassigned}
      />

      <ScheduleList
        assignments={assignments}
        shipments={shipments}
        vehicles={vehicles}
        drivers={drivers}
        conflicts={conflicts}
      />
    </main>
  );
}
