import { useEffect, useRef, useState } from "react";
import type { Shipment, TrackingWsEvent } from "@assertquest/shared";
import { api } from "../lib/api.js";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 10000;

// Keeps a WebSocket connection to the tracking feed alive, reconnecting with backoff
// whenever it drops (FR-804) — including drops caused intentionally by
// FLAKE_FAILURE_RATE_TRACKING (see tracking-bulk-dead-reckoning). Callers get both the
// current connection status (to show a visible reconnecting indicator) and each
// shipment update as it arrives.
export function useTrackingSocket(accessToken: string | null, onUpdate: (shipment: Shipment) => void) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let hasConnectedOnce = false;

    function connect() {
      if (cancelled) return;
      setStatus(hasConnectedOnce ? "reconnecting" : "connecting");
      socket = new WebSocket(api.trackingWsUrl(accessToken!));

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as TrackingWsEvent;
        if (data.type === "connected") {
          hasConnectedOnce = true;
          setStatus("open");
        } else if (data.type === "tracking-update") {
          onUpdateRef.current(data.shipment);
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        const delay = Math.min(RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
        attempt += 1;
        setStatus("reconnecting");
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      setStatus("closed");
    };
  }, [accessToken]);

  return status;
}
