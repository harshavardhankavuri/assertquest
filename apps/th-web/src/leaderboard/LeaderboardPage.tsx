import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LEADERBOARD_RANGES } from "@assertquest/shared";
import type { LeaderboardEntry, LeaderboardRange } from "@assertquest/shared";
import { Badge, Card, FormField, PageHeader, SelectInput, TextInput } from "@assertquest/shared/ui";
import { api } from "../lib/api.js";
import { useDocumentMeta } from "../lib/useDocumentMeta.js";

export function LeaderboardPage() {
  useDocumentMeta(
    "Leaderboard",
    "Track cleared automation testing challenges across the AssertQuest community, per module — anonymized by default.",
    "/leaderboard",
  );

  const [module, setModule] = useState("");
  const [range, setRange] = useState<LeaderboardRange>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.getLeaderboard(module || undefined, range).then((res) => setEntries(res.entries));
  }, [module, range]);

  return (
    <main>
      <div className="motion-safe:animate-fade-in-up">
        <PageHeader
          title="Leaderboard"
          description="Anonymized by default — only shows an account's email if they opted in."
        />

        <Card className="mb-6 transition-colors hover:border-navy-300">
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Module" htmlFor="lb-module">
            <TextInput id="lb-module" value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. auth" />
          </FormField>
          <FormField label="Range" htmlFor="lb-range">
            <SelectInput id="lb-range" value={range} onChange={(e) => setRange(e.target.value as LeaderboardRange)}>
              {LEADERBOARD_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </form>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mist-200 shadow-sm transition-colors hover:border-navy-300">
        <table className="w-full divide-y divide-mist-200 bg-white text-sm">
          <thead className="bg-mist-100 text-xs uppercase tracking-wide text-navy-600">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Learner</th>
              <th className="px-4 py-3 text-left">Cleared</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-200">
            {entries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-3 text-navy-500">
                  No cleared challenges yet for this range.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr
                key={e.userId}
                className={`transition-colors hover:bg-foam-100 ${e.rank <= 3 ? "bg-teal-50/60" : ""}`}
              >
                <td className="px-4 py-3">
                  {e.rank <= 3 ? (
                    <Badge tone="teal">#{e.rank}</Badge>
                  ) : (
                    <span className="font-mono text-xs text-navy-600">#{e.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/profile/${e.userId}`} className="font-medium text-teal-700 hover:underline">
                    {e.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy-600">{e.clearedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
