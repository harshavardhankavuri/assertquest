import { z } from "zod";
import { REPORT_GROUP_BY } from "@assertquest/shared";

// A minimal IANA timezone name check — real validity is deferred to Intl itself
// (an invalid name throws at format time, caught in the service layer).
const timeZoneSchema = z.string().min(1).default("UTC");

export const reportQuerySchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    groupBy: z.enum(REPORT_GROUP_BY).default("day"),
    timeZone: timeZoneSchema,
  })
  .refine((v) => new Date(v.from) < new Date(v.to), { message: "from must be before to", path: ["to"] });

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
