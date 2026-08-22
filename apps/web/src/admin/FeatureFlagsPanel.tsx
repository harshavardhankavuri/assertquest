import type { FeatureFlags } from "@assertquest/shared";
import { Badge, Card } from "../ui/index.js";

export function FeatureFlagsPanel({ flags }: { flags: FeatureFlags | null }) {
  return (
    <section aria-labelledby="feature-flags-heading">
      <Card>
        <h2 id="feature-flags-heading" className="mb-2 text-[15px] font-bold tracking-tight text-ink-900">
          Feature flags
        </h2>
        <p className="mb-4 text-sm text-muted">
          Toggled per environment via env vars — see docs/api/admin.md for the exact variable names.
        </p>
        {flags && (
          <ul className="flex flex-wrap gap-2">
            {Object.entries(flags).map(([key, value]) => (
              <li key={key} className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2">
                <span className="text-sm text-ink-900">{key}</span>
                <Badge tone={value ? "success" : "neutral"}>{value ? "on" : "off"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
