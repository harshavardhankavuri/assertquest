import { z } from "zod";
import { SHIPMENT_STATUSES, TRACKING_SORT_FIELDS, SORT_ORDERS } from "@assertquest/shared";

export const listTrackingQuerySchema = z.object({
  status: z.enum(SHIPMENT_STATUSES).optional(),
  sort: z.enum(TRACKING_SORT_FIELDS).default("createdAt"),
  order: z.enum(SORT_ORDERS).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListTrackingQuery = z.infer<typeof listTrackingQuerySchema>;
