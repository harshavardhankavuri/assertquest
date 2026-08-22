import { useState, type FormEvent } from "react";
import type { AddressPoint, PackageDetails, Shipment } from "@assertquest/shared";
import { Alert, Button, Card } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { DocumentUpload } from "./DocumentUpload.js";

interface ConfirmStepProps {
  origin: AddressPoint;
  destination: AddressPoint;
  packageDetails: PackageDetails;
  onBack: () => void;
}

// Step 4 of the wizard (FR-701): submits the booking. The server recomputes the
// price itself (FR-704) — nothing priced here is trusted from the client.
export function ConfirmStep({ origin, destination, packageDetails, onBack }: ConfirmStepProps) {
  const { accessToken } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createBooking({ origin, destination, package: packageDetails }, accessToken);
      setShipment(res.shipment);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create the booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (shipment) {
    return (
      <section aria-labelledby="confirm-step-heading">
        <Card>
          <h2 id="confirm-step-heading" className="mb-4 text-lg font-bold tracking-tight text-ink-900">
            Shipment Booked
          </h2>
          <p className="text-sm text-ink-700">
            Shipment <strong className="font-mono text-ink-900">{shipment.id}</strong> confirmed at{" "}
            <strong className="font-mono text-brand-600">
              {(shipment.priceCents / 100).toFixed(2)} {shipment.currency}
            </strong>
            .
          </p>
          {accessToken && <DocumentUpload shipmentId={shipment.id} accessToken={accessToken} />}
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="confirm-step-heading">
      <Card>
        <h2 id="confirm-step-heading" className="mb-4 text-lg font-bold tracking-tight text-ink-900">
          Confirm
        </h2>
        <p className="text-sm text-ink-700">
          {origin.label} &rarr; {destination.label}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs text-muted">Weight</div>
            <div className="mt-0.5 font-mono text-sm text-ink-900">{packageDetails.weightKg}kg</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs text-muted">Dimensions</div>
            <div className="mt-0.5 font-mono text-sm text-ink-900">
              {packageDetails.lengthCm}&times;{packageDetails.widthCm}&times;{packageDetails.heightCm}cm
            </div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs text-muted">Origin</div>
            <div className="mt-0.5 font-mono text-sm text-ink-900">{origin.label}</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-xs text-muted">Destination</div>
            <div className="mt-0.5 font-mono text-sm text-ink-900">{destination.label}</div>
          </div>
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-6 flex gap-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Booking…" : "Confirm booking"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
