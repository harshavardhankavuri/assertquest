import type { LatLng, ShipmentStatus } from "@assertquest/shared";
import { haversineDistanceKm } from "../booking/pricing.js";

// Fraction of the remaining distance covered on each simulated GPS tick — a mock
// feed, not real telemetry (FR-802). 0.4 means each tick closes 40% of whatever
// distance remains, so shipments always converge on the destination in a bounded
// number of ticks regardless of how far apart origin/destination are.
const STEP_FRACTION = 0.4;
// Once within this many km of the destination, snap to it and mark delivered
// rather than asymptotically approaching forever.
const ARRIVAL_THRESHOLD_KM = 50;

function interpolate(current: LatLng, destination: LatLng, fraction: number): LatLng {
  return {
    lat: current.lat + (destination.lat - current.lat) * fraction,
    lng: current.lng + (destination.lng - current.lng) * fraction,
  };
}

export interface SimulationStep {
  status: ShipmentStatus;
  position: LatLng;
}

// Advances a shipment one tick: booked -> in_transit on the first tick, then steps
// the position toward the destination on each subsequent tick until it arrives.
export function advanceOneTick(
  status: ShipmentStatus,
  currentPosition: LatLng,
  destination: LatLng,
): SimulationStep {
  if (status === "delivered" || status === "cancelled") {
    return { status, position: currentPosition };
  }
  if (status === "booked") {
    return { status: "in_transit", position: currentPosition };
  }

  const nextPosition = interpolate(currentPosition, destination, STEP_FRACTION);
  const remainingKm = haversineDistanceKm(nextPosition, destination);
  if (remainingKm <= ARRIVAL_THRESHOLD_KM) {
    return { status: "delivered", position: destination };
  }
  return { status: "in_transit", position: nextPosition };
}
