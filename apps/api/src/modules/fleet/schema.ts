import { z } from "zod";

export const upsertAssignmentSchema = z
  .object({
    vehicleId: z.string().min(1),
    driverId: z.string().min(1),
    scheduledStart: z.string().datetime(),
    scheduledEnd: z.string().datetime(),
  })
  .refine((v) => new Date(v.scheduledStart) < new Date(v.scheduledEnd), {
    message: "scheduledStart must be before scheduledEnd",
    path: ["scheduledEnd"],
  });

export type UpsertAssignmentInput = z.infer<typeof upsertAssignmentSchema>;
