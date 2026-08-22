import { z } from "zod";

export const addressPointSchema = z.object({
  label: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const packageDetailsSchema = z.object({
  weightKg: z.number().positive(),
  lengthCm: z.number().positive(),
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
});

export const quoteSchema = z.object({
  origin: addressPointSchema,
  destination: addressPointSchema,
  package: packageDetailsSchema,
});

export const createBookingSchema = quoteSchema;

export type AddressPointInput = z.infer<typeof addressPointSchema>;
export type PackageDetailsInput = z.infer<typeof packageDetailsSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Server-side file validation (FR-705) — client-side checks are for UX only and
// are never trusted; these are the limits actually enforced.
export const ALLOWED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
