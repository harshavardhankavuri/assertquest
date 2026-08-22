import { useState, type FormEvent } from "react";
import type { PackageDetails } from "@assertquest/shared";
import { Button, Card, FormField, TextInput } from "../ui/index.js";

interface PackageDetailsStepProps {
  value: PackageDetails;
  onNext: (details: PackageDetails) => void;
  onBack: () => void;
}

// Step 2 of the wizard (FR-701). Local field state is seeded once from `value` on
// mount, then never resynced — correct as long as the parent always passes the
// current lifted values back in on remount, which is exactly what BookingWizard
// fails to do for this step (see booking-standard-second-thoughts).
export function PackageDetailsStep({ value, onNext, onBack }: PackageDetailsStepProps) {
  const [weightKg, setWeightKg] = useState(value.weightKg || "");
  const [lengthCm, setLengthCm] = useState(value.lengthCm || "");
  const [widthCm, setWidthCm] = useState(value.widthCm || "");
  const [heightCm, setHeightCm] = useState(value.heightCm || "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onNext({
      weightKg: Number(weightKg),
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
    });
  }

  return (
    <section aria-labelledby="package-step-heading">
      <Card>
        <h2 id="package-step-heading" className="mb-4 text-lg font-bold tracking-tight text-ink-900">
          Package Details
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FormField label="Weight (kg)" htmlFor="weightKg">
              <TextInput
                id="weightKg"
                name="weightKg"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </FormField>
            <FormField label="Length (cm)" htmlFor="lengthCm">
              <TextInput
                id="lengthCm"
                name="lengthCm"
                type="number"
                min="1"
                step="1"
                required
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
              />
            </FormField>
            <FormField label="Width (cm)" htmlFor="widthCm">
              <TextInput
                id="widthCm"
                name="widthCm"
                type="number"
                min="1"
                step="1"
                required
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
              />
            </FormField>
            <FormField label="Height (cm)" htmlFor="heightCm">
              <TextInput
                id="heightCm"
                name="heightCm"
                type="number"
                min="1"
                step="1"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </FormField>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Next: Pricing</Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
