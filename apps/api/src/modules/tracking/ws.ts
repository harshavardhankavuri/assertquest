import type { WebSocket } from "@fastify/websocket";
import type { Shipment, Role, TrackingUpdateEvent } from "@assertquest/shared";
import { moduleFlakeConfig } from "../../core/flake.js";

interface Connection {
  socket: WebSocket;
  userId: string;
  role: Role;
}

const connections = new Map<string, Connection>();
let nextId = 0;

export function registerConnection(socket: WebSocket, userId: string, role: Role): void {
  const id = String(nextId++);
  connections.set(id, { socket, userId, role });
  socket.on("close", () => connections.delete(id));
}

function canSee(conn: Connection, shipment: Shipment): boolean {
  return conn.role === "admin" || conn.role === "dispatcher" || conn.userId === shipment.customerId;
}

// Broadcasts a shipment update to every connected client that can see it (FR-801).
// When flakiness injection is enabled for "tracking" (FR-1403), each broadcast has a
// chance of instead dropping the connection — this is what booking-standard-second-
// thoughts's sibling challenge, tracking-bulk-dead-reckoning, exercises: the client
// must notice the drop and reconnect rather than silently going stale.
export function broadcastShipmentUpdate(shipment: Shipment): void {
  const event: TrackingUpdateEvent = { type: "tracking-update", shipment };
  const payload = JSON.stringify(event);
  const { failureRate } = moduleFlakeConfig("tracking");

  for (const [id, conn] of connections) {
    if (!canSee(conn, shipment)) continue;
    if (failureRate > 0 && Math.random() < failureRate) {
      conn.socket.close(1011, "Simulated connection drop");
      connections.delete(id);
      continue;
    }
    conn.socket.send(payload);
  }
}

export function connectionCount(): number {
  return connections.size;
}
