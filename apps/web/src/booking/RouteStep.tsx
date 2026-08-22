import { useState } from "react";
import type { AddressPoint } from "@assertquest/shared";
import { Button, Card } from "../ui/index.js";
import { AddressField } from "./AddressField.js";

interface RouteStepProps {
  origin: AddressPoint | null;
  destination: AddressPoint | null;
  onNext: (origin: AddressPoint, destination: AddressPoint) => void;
}

// Step 1 of the wizard (FR-701). Correctly re-initializes from the parent's lifted
// state on every mount, so back-navigation into this step preserves what was chosen —
// unlike PackageDetailsStep, see booking-standard-second-thoughts.
export function RouteStep({ origin, destination, onNext }: RouteStepProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<AddressPoint | null>(origin);
  const [selectedDestination, setSelectedDestination] = useState<AddressPoint | null>(destination);

  return (
    <section aria-labelledby="route-step-heading">
      <Card>
        <h2 id="route-step-heading" className="mb-4 text-lg font-bold tracking-tight text-ink-900">
          Origin &amp; Destination
        </h2>
        <div className="flex flex-col gap-4">
          <AddressField id="origin" label="Origin" value={selectedOrigin} onSelect={setSelectedOrigin} />
          <AddressField
            id="destination"
            label="Destination"
            value={selectedDestination}
            onSelect={setSelectedDestination}
          />
        </div>
        <Button
          type="button"
          className="mt-6"
          disabled={!selectedOrigin || !selectedDestination}
          onClick={() => onNext(selectedOrigin!, selectedDestination!)}
        >
          Next: Package Details
        </Button>
      </Card>
    </section>
  );
}
