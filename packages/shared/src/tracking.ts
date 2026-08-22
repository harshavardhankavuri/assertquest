import type { Shipment, ShipmentStatus } from "./booking.js";

export const TRACKING_SORT_FIELDS = ["createdAt", "priceCents", "distanceKm", "status"] as const;
export type TrackingSortField = (typeof TRACKING_SORT_FIELDS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface TrackingListResponse {
  items: Shipment[];
  total: number;
  page: number;
  pageSize: number;
}

// Broadcast over the tracking WebSocket (FR-801/FR-802) whenever a tracked
// shipment's status or simulated GPS position changes.
export interface TrackingUpdateEvent {
  type: "tracking-update";
  shipment: Shipment;
}

export interface TrackingConnectedEvent {
  type: "connected";
}

export type TrackingWsEvent = TrackingConnectedEvent | TrackingUpdateEvent;

export type { ShipmentStatus };
