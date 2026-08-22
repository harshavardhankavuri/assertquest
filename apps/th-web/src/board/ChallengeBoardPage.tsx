import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CHALLENGE_DIFFICULTIES, CHALLENGE_SURFACES } from "@assertquest/shared";
import type { ChallengeListItem } from "@assertquest/shared";
import { Alert, Badge, type BadgeTone, Button, Card, FormField, PageHeader, SelectInput, TextInput } from "@assertquest/shared/ui";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

const DIFFICULTY_TONE: Record<string, BadgeTone> = {
  light: "teal",
  standard: "neutral",
  heavy: "coral",
  bulk: "danger",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  open: "neutral",
  in_progress: "warning",
  cleared: "success",
};

// Every filter combination lives in the URL (FR-204: unique, shareable, indexable
// view per filter) — state is derived from searchParams, never held separately,
// so a link to a filtered view reproduces exactly that view for anyone who opens it.
export function ChallengeBoardPage() {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const module = searchParams.get("module") ?? "";
  const difficultyClass = searchParams.get("class") ?? "";
  const surface = searchParams.get("surface") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = 20;

  useEffect(() => {
    api
      .listChallenges(
        {
          module: module || undefined,
          class: (difficultyClass || undefined) as ChallengeListItem["difficulty"] | undefined,
          surface: (surface || undefined) as ChallengeListItem["surfaceTags"][number] | undefined,
          q: q || undefined,
          page,
          pageSize,
        },
        accessToken,
      )
      .then((res) => {
        setChallenges(res.challenges);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load challenges."));
  }, [module, difficultyClass, surface, q, page, accessToken]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any filter change resets pagination
    setSearchParams(next);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main>
      <div className="motion-safe:animate-fade-in-up">
        <PageHeader title="Challenge Board" description="Filter by module, difficulty, and surface to find your next scenario." />

        <Card className="mb-6 transition-colors hover:border-navy-300">
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Module" htmlFor="board-module">
            <TextInput
              id="board-module"
              value={module}
              onChange={(e) => updateParam("module", e.target.value)}
              placeholder="e.g. auth"
            />
          </FormField>

          <FormField label="Difficulty" htmlFor="board-class">
            <SelectInput id="board-class" value={difficultyClass} onChange={(e) => updateParam("class", e.target.value)}>
              <option value="">All</option>
              {CHALLENGE_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Surface" htmlFor="board-surface">
            <SelectInput id="board-surface" value={surface} onChange={(e) => updateParam("surface", e.target.value)}>
              <option value="">All</option>
              {CHALLENGE_SURFACES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Search" htmlFor="board-q">
            <TextInput
              id="board-q"
              value={q}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="title or description"
            />
          </FormField>
        </form>
        </Card>
      </div>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-mist-200 shadow-sm transition-colors hover:border-navy-300">
        <table className="w-full divide-y divide-mist-200 bg-white text-sm">
          <thead className="bg-mist-100 text-xs uppercase tracking-wide text-navy-600">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-left">Difficulty</th>
              <th className="px-4 py-3 text-left">Surface</th>
              <th className="px-4 py-3 text-left">Est. time</th>
              {accessToken && <th className="px-4 py-3 text-left">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-200">
            {challenges.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-foam-100 focus-within:bg-foam-100">
                <td className="px-4 py-3">
                  <Link to={`/challenges/${c.id}`} className="font-medium text-teal-700 hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-navy-600">{c.module}</td>
                <td className="px-4 py-3">
                  <Badge tone={DIFFICULTY_TONE[c.difficulty] ?? "neutral"}>{c.difficulty}</Badge>
                </td>
                <td className="px-4 py-3 text-navy-600">{c.surfaceTags.join(", ")}</td>
                <td className="px-4 py-3 text-navy-600">{c.estimatedMinutes} min</td>
                {accessToken && (
                  <td className="px-4 py-3">
                    <Badge tone={(c.status && STATUS_TONE[c.status]) ?? "neutral"}>{c.status}</Badge>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.set("page", String(page - 1));
            setSearchParams(next);
          }}
        >
          Previous
        </Button>
        <span className="text-sm text-navy-600">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.set("page", String(page + 1));
            setSearchParams(next);
          }}
        >
          Next
        </Button>
      </nav>
    </main>
  );
}
