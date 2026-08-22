import { z } from "zod";
import { BULK_SHIPMENT_ACTIONS } from "@assertquest/shared";

export const bulkActionSchema = z.object({
  action: z.enum(BULK_SHIPMENT_ACTIONS),
  shipmentIds: z.array(z.string().min(1)).min(1, "shipmentIds must include at least one id"),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;
