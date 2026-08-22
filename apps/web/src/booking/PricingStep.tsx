import { useEffect, useState } from "react";
import type { AddressPoint, PackageDetails, QuoteBreakdown } from "@assertquest/shared";
import { Alert, Button, Card } from "../ui/index.js";
import { api, ApiRequestError } from "../lib/api.js";

interface PricingStepProps {
  origin: AddressPoint;
  destination: AddressPoint;
  packageDetails: PackageDetails;
  onNext: () => void;
  onBack: () => void;
}

// Step 3 of the wizard (FR-704): fetches a live quote from the pricing calculator.
export function PricingStep({ origin, destination, packageDetails, onNext, onBack }: PricingStepProps) {
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .quote({ origin, destination, package: packageDetails })
      .then((res) => {
        if (!cancelled) setQuote(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not calculate a quote.");
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, packageDetails]);

  return (
    <section aria-labelledby="pricing-step-heading">
      <Card>
        <h2 id="pricing-step-heading" className="mb-4 text-lg font-bold tracking-tight text-ink-900">
          Pricing
        </h2>
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {quote && (
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-hairline py-2">
              <span className="text-sm text-muted">Distance</span>
              <span className="font-mono text-sm text-ink-900">{quote.distanceKm.toFixed(1)} km</span>
            </div>
            <div className="flex items-center justify-between border-b border-hairline py-2">
              <span className="text-sm text-muted">Chargeable weight</span>
              <span className="font-mono text-sm text-ink-900">{quote.chargeableWeightKg.toFixed(1)} kg</span>
            </div>
            <div className="flex items-center justify-between border-b border-hairline py-2">
              <span className="text-sm text-muted">Base fee</span>
              <span className="font-mono text-sm text-ink-900">{(quote.baseFeeCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-hairline py-2">
              <span className="text-sm text-muted">Weight fee</span>
              <span className="font-mono text-sm text-ink-900">{(quote.weightFeeCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-hairline py-2">
              <span className="text-sm text-muted">Distance fee</span>
              <span className="font-mono text-sm text-ink-900">{(quote.distanceFeeCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-ink-900">Total</span>
              <span className="font-mono text-base font-semibold text-ink-900">
                {(quote.priceCents / 100).toFixed(2)} {quote.currency}
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button type="button" disabled={!quote} onClick={onNext}>
            Next: Confirm
          </Button>
        </div>
      </Card>
    </section>
  );
}
