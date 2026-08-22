export const REPORT_GROUP_BY = ["day", "month"] as const;
export type ReportGroupBy = (typeof REPORT_GROUP_BY)[number];

export interface ReportBucket {
  period: string;
  shipmentCount: number;
  revenueCents: number;
}

export interface ReportSummaryRequest {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  timeZone: string;
}

export interface ReportSummary {
  buckets: ReportBucket[];
  totalShipments: number;
  totalRevenueCents: number;
}

export const REPORT_JOB_STATUSES = ["pending", "processing", "ready", "failed"] as const;
export type ReportJobStatus = (typeof REPORT_JOB_STATUSES)[number];

export interface ReportJob {
  id: string;
  requestedById: string;
  fromDate: string;
  toDate: string;
  groupBy: ReportGroupBy;
  timeZone: string;
  status: ReportJobStatus;
  failureReason: string | null;
  createdAt: string;
  readyAt: string | null;
}
