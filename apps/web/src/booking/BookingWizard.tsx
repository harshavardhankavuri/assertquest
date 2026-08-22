import { useState } from "react";
import type { AddressPoint, PackageDetails } from "@assertquest/shared";
import { PageHeader } from "../ui/index.js";
import { RouteStep } from "./RouteStep.js";
import { PackageDetailsStep } from "./PackageDetailsStep.js";
import { PricingStep } from "./PricingStep.js";
import { ConfirmStep } from "./ConfirmStep.js";

type Step = "route" | "package" | "pricing" | "confirm";

const STEP_LABELS: Record<Step, string> = {
  route: "Origin & Destination",
  package: "Package Details",
  pricing: "Pricing",
  confirm: "Confirm",
};

const DEFAULT_PACKAGE: PackageDetails = { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 };

// Multi-step booking wizard (FR-701): origin/destination -> package details ->
// pricing -> confirm. All step values are lifted here so back-navigation can
// restore them.
export function BookingWizard() {
  const [step, setStep] = useState<Step>("route");
  const [origin, setOrigin] = useState<AddressPoint | null>(null);
  const [destination, setDestination] = useState<AddressPoint | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails>(DEFAULT_PACKAGE);

  const steps: Step[] = ["route", "package", "pricing", "confirm"];

  return (
    <main>
      <PageHeader title="Book a Shipment" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_240px]">
        <ol className="flex flex-row gap-2 lg:flex-col lg:gap-1.5">
          {steps.map((s, i) => {
            const active = s === step;
            const done = steps.indexOf(step) > i;
            return (
              <li
                key={s}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : done
                      ? "border-hairline bg-white text-ink-600"
                      : "border-hairline bg-white text-faint"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    active ? "bg-brand-500 text-white" : done ? "bg-ink-600 text-white" : "bg-surface-subtle text-faint"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden lg:inline">{STEP_LABELS[s]}</span>
              </li>
            );
          })}
        </ol>
        <div>
          {step === "route" && (
            <RouteStep
              origin={origin}
              destination={destination}
              onNext={(o, d) => {
                setOrigin(o);
                setDestination(d);
                setStep("package");
              }}
            />
          )}
          {step === "package" && (
            <PackageDetailsStep
              // FR-702, intentionally buggy: this should pass `packageDetails` (the
              // lifted state) so returning to this step restores previously entered
              // values, same as RouteStep does for origin/destination above. It
              // doesn't — see booking-standard-second-thoughts.
              value={DEFAULT_PACKAGE}
              onNext={(p) => {
                setPackageDetails(p);
                setStep("pricing");
              }}
              onBack={() => setStep("route")}
            />
          )}
          {step === "pricing" && origin && destination && (
            <PricingStep
              origin={origin}
              destination={destination}
              packageDetails={packageDetails}
              onNext={() => setStep("confirm")}
              onBack={() => setStep("package")}
            />
          )}
          {step === "confirm" && origin && destination && (
            <ConfirmStep
              origin={origin}
              destination={destination}
              packageDetails={packageDetails}
              onBack={() => setStep("pricing")}
            />
          )}
        </div>
        <aside className="rounded-xl border border-hairline bg-white p-5 shadow-card h-fit">
          <h2 className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Booking Summary</h2>
          <dl className="mt-3 flex flex-col gap-3">
            <div>
              <dt className="text-xs text-muted">Origin</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink-900">{origin?.label ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Destination</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink-900">{destination?.label ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Package</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink-900">
                {packageDetails.weightKg
                  ? `${packageDetails.weightKg}kg · ${packageDetails.lengthCm}×${packageDetails.widthCm}×${packageDetails.heightCm}cm`
                  : "—"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
