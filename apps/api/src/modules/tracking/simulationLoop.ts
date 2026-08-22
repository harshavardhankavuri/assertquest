import { prisma } from "../../core/db.js";
import { toPublicShipment } from "../booking/service.js";
import { advanceOneTick } from "./gpsSimulator.js";
import { notifyIfJustDelivered } from "./service.js";
import { broadcastShipmentUpdate } from "./ws.js";

const DEFAULT_TICK_MS = 4000;

// Background mocked GPS feed (FR-802): periodically nudges every non-delivered
// shipment toward its destination and broadcasts the update. Disabled entirely when
// TRACKING_SIMULATION_ENABLED=false — used in tests, where ticks should only happen
// via the explicit POST /:id/advance endpoint so assertions are deterministic.
export function startSimulationLoop(): NodeJS.Timeout | undefined {
  if (process.env.TRACKING_SIMULATION_ENABLED === "false") {
    return undefined;
  }
  const tickMs = Number(process.env.TRACKING_TICK_MS ?? DEFAULT_TICK_MS);

  return setInterval(() => {
    void tick();
  }, tickMs);
}

async function tick() {
  const active = await prisma.shipment.findMany({ where: { status: { notIn: ["delivered", "cancelled"] } } });
  for (const shipment of active) {
    const step = advanceOneTick(
      shipment.status,
      { lat: shipment.currentLat, lng: shipment.currentLng },
      { lat: shipment.destinationLat, lng: shipment.destinationLng },
    );
    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: step.status, currentLat: step.position.lat, currentLng: step.position.lng, positionUpdatedAt: new Date() },
    });
    notifyIfJustDelivered(updated.customerId, shipment.status, updated.status, updated.id);
    broadcastShipmentUpdate(toPublicShipment(updated));
  }
}
