import type { DragEvent } from "react";
import type { Assignment, Shipment, Vehicle } from "@assertquest/shared";
import { shuffleIfEnabled } from "../practice/helpers.js";
import { usePracticeMode } from "../practice/PracticeModeContext.js";
import { getDynamicIdSalt } from "../practice/practiceToggles.js";

interface FleetBoardProps {
  shipments: Shipment[];
  vehicles: Vehicle[];
  assignments: Assignment[];
  onDropOnVehicle: (shipmentId: string, vehicleId: string) => void;
  onDropOnUnassigned: (shipmentId: string) => void;
}

const DRAG_MIME = "application/x-swiftcargo-shipment-id";

// Drag-and-drop Kanban scheduling board (FR-901): columns are vehicles (plus an
// "Unassigned" column), cards are shipments. Dropping a card on a vehicle column
// assigns it there; dropping back on "Unassigned" removes the assignment.
export function FleetBoard({ shipments, vehicles, assignments, onDropOnVehicle, onDropOnUnassigned }: FleetBoardProps) {
  const { toggles } = usePracticeMode();

  function shipmentsFor(vehicleId: string | null): Shipment[] {
    const shipmentIds = new Set(
      assignments.filter((a) => (vehicleId ? a.vehicleId === vehicleId : false)).map((a) => a.shipmentId),
    );
    const base =
      vehicleId === null
        ? shipments.filter((s) => !new Set(assignments.map((a) => a.shipmentId)).has(s.id))
        : shipments.filter((s) => shipmentIds.has(s.id));
    return shuffleIfEnabled(base);
  }

  // Practice-only id assignment: normally one stable id per shipment. With
  // `dynamicIds` on, ids reshuffle each time the toggle is re-enabled. With
  // `duplicateIds` on, the 2nd row in a lane is given the 1st row's id — a
  // classic "locator matched >1 element" bug.
  function rowTestIds(laneShipments: Shipment[]): string[] {
    const ids = laneShipments.map((s) =>
      toggles.dynamicIds ? `fleet-row-${s.id}-${getDynamicIdSalt()}` : `fleet-row-${s.id}`,
    );
    if (toggles.duplicateIds && ids.length > 1) ids[1] = ids[0];
    return ids;
  }

  function onDragStart(e: DragEvent<HTMLLIElement>, shipmentId: string) {
    e.dataTransfer.setData(DRAG_MIME, shipmentId);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function onDrop(e: DragEvent<HTMLDivElement>, vehicleId: string | null) {
    e.preventDefault();
    const shipmentId = e.dataTransfer.getData(DRAG_MIME);
    if (!shipmentId) return;
    if (vehicleId) onDropOnVehicle(shipmentId, vehicleId);
    else onDropOnUnassigned(shipmentId);
  }

  const columns: { key: string; label: string; vehicleId: string | null }[] = [
    { key: "unassigned", label: "Unassigned", vehicleId: null },
    ...vehicles.map((v) => ({ key: v.id, label: v.label, vehicleId: v.id })),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {columns.map((col) => {
        const laneShipments = shipmentsFor(col.vehicleId);
        const testIds = rowTestIds(laneShipments);
        return (
        <div
          key={col.key}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, col.vehicleId)}
          className="rounded-xl border border-hairline bg-white p-3 shadow-card"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{col.label}</h3>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
              {laneShipments.length} shipment{laneShipments.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {laneShipments.map((shipment, index) => (
              <li
                key={shipment.id}
                id={testIds[index]}
                data-testid={testIds[index]}
                draggable
                onDragStart={(e) => onDragStart(e, shipment.id)}
                className="cursor-grab rounded-lg border border-hairline bg-surface-row p-3 text-sm text-ink-700 transition hover:border-brand-200"
              >
                <div className="font-mono text-[11px] font-medium text-brand-600">{shipment.id}</div>
                <div className="mt-1 text-ink-900">
                  {shipment.origin.label} → {shipment.destination.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
        );
      })}
    </div>
  );
}
