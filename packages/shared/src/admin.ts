export const BULK_SHIPMENT_ACTIONS = ["approve", "cancel"] as const;
export type BulkShipmentAction = (typeof BULK_SHIPMENT_ACTIONS)[number];

export interface BulkActionRequest {
  action: BulkShipmentAction;
  shipmentIds: string[];
}

export interface BulkActionItemResult {
  shipmentId: string;
  success: boolean;
  error?: string;
}

export interface BulkActionResponse {
  action: BulkShipmentAction;
  results: BulkActionItemResult[];
  succeeded: number;
  failed: number;
}

export interface ImportRowResult {
  row: number;
  status: "accepted" | "rejected";
  shipmentId?: string;
  errors?: string[];
}

export interface ImportReport {
  totalRows: number;
  accepted: number;
  rejected: number;
  rows: ImportRowResult[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
}

// Fixed, known set of feature flags — each backed by an env var (FEATURE_<UPPER_SNAKE>)
// on the API, toggled per environment/deployment rather than at runtime (FR-1104).
export const FEATURE_FLAG_KEYS = ["priorityLane", "extendedTracking", "newAdminUi"] as const;
export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;
