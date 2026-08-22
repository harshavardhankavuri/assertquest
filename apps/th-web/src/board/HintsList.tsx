import { useState } from "react";
import { Button, Card } from "@assertquest/shared/ui";

// Progressive hints (FR-303): the first hint is visible by default, later hints
// need an explicit reveal so learners aren't spoiled all at once.
export function HintsList({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(1);

  return (
    <section aria-labelledby="hints-heading" className="mt-8">
      <h2 id="hints-heading" className="font-display text-xl font-semibold text-navy-900">
        Hints
      </h2>
      <Card className="mt-3 transition-colors hover:border-navy-300">
        <ol className="flex flex-col gap-3">
          {hints.slice(0, revealed).map((hint, i) => (
            <li key={i} className="flex gap-3 text-sm text-navy-700">
              <span className="font-mono text-xs font-medium text-teal-600">{i + 1}.</span>
              <span>{hint}</span>
            </li>
          ))}
        </ol>
        {revealed < hints.length && (
          <Button type="button" variant="ghost" className="mt-4" onClick={() => setRevealed((r) => r + 1)}>
            Show next hint ({hints.length - revealed} remaining)
          </Button>
        )}
      </Card>
    </section>
  );
}
