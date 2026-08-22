import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiErrorBody,
  PublicUser,
  GeocodeSuggestion,
  QuoteRequest,
  QuoteBreakdown,
  CreateBookingRequest,
  Shipment,
  CustomsDocumentMeta,
  TrackingListResponse,
  ShipmentStatus,
  TrackingSortField,
  SortOrder,
  Invoice,
  Payment,
  BillingCurrency,
  PayInvoiceResponse,
  Vehicle,
  FleetDriver,
  Assignment,
  UpsertAssignmentRequest,
  ScheduleConflict,
  FeatureFlags,
  AuditLogEntry,
  BulkActionRequest,
  BulkActionResponse,
  ImportReport,
  NotificationListResponse,
  MockMessage,
  ReportSummary,
  ReportSummaryRequest,
  ReportJob,
} from "@assertquest/shared";
import { networkDelayIfEnabled } from "../practice/helpers.js";

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(body: ApiErrorBody, status: number) {
    super(body.error.message);
    this.code = body.error.code;
    this.status = status;
  }
}

// AuthProvider registers this so a 401 from any authed call (expired/invalid
// access token) clears the stale in-memory session immediately, instead of
// leaving the UI showing signed-in state until the user happens to navigate.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  await networkDelayIfEnabled();
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    // Only set Content-Type when there's actually a body — Fastify's JSON body
    // parser rejects an empty body sent with Content-Type: application/json (e.g.
    // bodyless POSTs like /auth/refresh or /tracking/:id/advance).
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });

  if (!res.ok) {
    const body = (await res.json()) as ApiErrorBody;
    if (res.status === 401 && path !== "/auth/refresh") onSessionExpired?.();
    throw new ApiRequestError(body, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function authed<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` } });
}

export const api = {
  register: (payload: RegisterRequest) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: LoginRequest) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  refresh: () => request<AuthResponse>("/auth/refresh", { method: "POST" }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: (accessToken: string) => authed<{ user: PublicUser }>("/auth/me", accessToken),

  geocode: (q: string) => request<{ results: GeocodeSuggestion[] }>(`/booking/geocode?q=${encodeURIComponent(q)}`),

  quote: (payload: QuoteRequest) =>
    request<QuoteBreakdown>("/booking/quote", { method: "POST", body: JSON.stringify(payload) }),

  createBooking: (payload: CreateBookingRequest, accessToken: string) =>
    authed<{ shipment: Shipment }>("/booking", accessToken, { method: "POST", body: JSON.stringify(payload) }),

  uploadDocument: async (shipmentId: string, file: File, accessToken: string) => {
    const formData = new FormData();
    formData.append("document", file);
    const res = await fetch(`/api/booking/${shipmentId}/documents`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    if (!res.ok) {
      const body = (await res.json()) as ApiErrorBody;
      throw new ApiRequestError(body, res.status);
    }
    return res.json() as Promise<{ document: CustomsDocumentMeta }>;
  },

  listTracking: (
    accessToken: string,
    params: { status?: ShipmentStatus; sort?: TrackingSortField; order?: SortOrder; page?: number; pageSize?: number },
  ) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) search.set(key, String(value));
    }
    const qs = search.toString();
    return authed<TrackingListResponse>(`/tracking${qs ? `?${qs}` : ""}`, accessToken);
  },

  advanceShipment: (shipmentId: string, accessToken: string) =>
    authed<{ shipment: Shipment }>(`/tracking/${shipmentId}/advance`, accessToken, { method: "POST" }),

  trackingExportCsvUrl: () => "/api/tracking/export.csv",

  trackingWsUrl: (accessToken: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/tracking/ws?token=${encodeURIComponent(accessToken)}`;
  },

  listInvoices: (accessToken: string) => authed<{ invoices: Invoice[] }>("/billing/invoices", accessToken),

  createInvoice: (shipmentId: string, currency: BillingCurrency, accessToken: string) =>
    authed<{ invoice: Invoice }>(`/billing/shipments/${shipmentId}/invoice`, accessToken, {
      method: "POST",
      body: JSON.stringify({ currency }),
    }),

  payInvoice: (invoiceId: string, cardNumber: string, accessToken: string) =>
    authed<PayInvoiceResponse>(`/billing/invoices/${invoiceId}/pay`, accessToken, {
      method: "POST",
      body: JSON.stringify({ cardNumber }),
    }),

  listPayments: (invoiceId: string, accessToken: string) =>
    authed<{ payments: Payment[] }>(`/billing/invoices/${invoiceId}/payments`, accessToken),

  invoicePdfUrl: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/pdf`,

  listVehicles: (accessToken: string) => authed<{ vehicles: Vehicle[] }>("/fleet/vehicles", accessToken),

  listFleetDrivers: (accessToken: string) => authed<{ drivers: FleetDriver[] }>("/fleet/drivers", accessToken),

  listAssignments: (accessToken: string) => authed<{ assignments: Assignment[] }>("/fleet/assignments", accessToken),

  upsertAssignment: (shipmentId: string, payload: UpsertAssignmentRequest, accessToken: string) =>
    authed<{ assignment: Assignment }>(`/fleet/assignments/${shipmentId}`, accessToken, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listConflicts: (accessToken: string) => authed<{ conflicts: ScheduleConflict[] }>("/fleet/conflicts", accessToken),

  deleteAssignment: (assignmentId: string, accessToken: string) =>
    authed<void>(`/fleet/assignments/${assignmentId}`, accessToken, { method: "DELETE" }),

  getFeatureFlags: (accessToken: string) => authed<{ flags: FeatureFlags }>("/admin/feature-flags", accessToken),

  listAuditLog: (accessToken: string) => authed<{ entries: AuditLogEntry[] }>("/admin/audit-log", accessToken),

  bulkShipmentAction: (payload: BulkActionRequest, accessToken: string) =>
    authed<BulkActionResponse>("/admin/shipments/bulk", accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  importShipmentsCsv: async (file: File, accessToken: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/shipments/import", {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    if (!res.ok) {
      const body = (await res.json()) as ApiErrorBody;
      throw new ApiRequestError(body, res.status);
    }
    return res.json() as Promise<ImportReport>;
  },

  listNotifications: (accessToken: string) => authed<NotificationListResponse>("/notifications", accessToken),

  markNotificationRead: (id: string, accessToken: string) =>
    authed<{ notification: NotificationListResponse["notifications"][number] }>(`/notifications/${id}/read`, accessToken, {
      method: "POST",
    }),

  markAllNotificationsRead: (accessToken: string) =>
    authed<{ marked: number }>("/notifications/read-all", accessToken, { method: "POST" }),

  listOutbox: (accessToken: string, to?: string) =>
    authed<{ messages: MockMessage[] }>(`/notifications/outbox${to ? `?to=${encodeURIComponent(to)}` : ""}`, accessToken),

  getReportSummary: (params: ReportSummaryRequest, accessToken: string) => {
    const search = new URLSearchParams({
      from: params.from,
      to: params.to,
      groupBy: params.groupBy,
      timeZone: params.timeZone,
    });
    return authed<ReportSummary>(`/reporting/summary?${search.toString()}`, accessToken);
  },

  createReportJob: (params: ReportSummaryRequest, accessToken: string) =>
    authed<{ job: ReportJob }>("/reporting/jobs", accessToken, { method: "POST", body: JSON.stringify(params) }),

  getReportJob: (id: string, accessToken: string) => authed<{ job: ReportJob }>(`/reporting/jobs/${id}`, accessToken),

  reportJobDownloadUrl: (id: string) => `/api/reporting/jobs/${id}/download`,
};
