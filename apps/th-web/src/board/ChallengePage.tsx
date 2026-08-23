import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Challenge, ChallengeListItem } from "@assertquest/shared";
import { Alert, Badge, type BadgeTone, Button, Card } from "@assertquest/shared/ui";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError, SWIFTCARGO_URL } from "../lib/api.js";
import { useDocumentMeta } from "../lib/useDocumentMeta.js";
import { HintsList } from "./HintsList.js";
import { DiscussionThread } from "./DiscussionThread.js";

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

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeListItem | null>(null);
  const [related, setRelated] = useState<Challenge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    api
      .getChallenge(id, accessToken)
      .then((res) => setChallenge(res.challenge))
      .then(() => api.getRelatedChallenges(id))
      .then((res) => setRelated(res.challenges))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load this challenge."));
  }, [id, accessToken]);

  useEffect(reload, [reload]);

  useDocumentMeta(
    challenge?.title ?? "Challenge",
    challenge
      ? `${challenge.title} — a ${challenge.module} automation testing challenge on AssertQuest, covering ${challenge.surfaceTags.join(", ")}.`
      : "An automation testing challenge on AssertQuest.",
    `/challenges/${id ?? ""}`,
  );

  // Mark "in progress" as soon as a logged-in learner opens the page — a
  // best-effort signal, never fails loudly if it doesn't stick.
  useEffect(() => {
    if (id && accessToken) api.startChallenge(id, accessToken).then(reload).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  async function onReset() {
    if (!id) return;
    setNotice(null);
    try {
      await api.resetChallenge(id);
      setNotice("Scenario reset.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reset this scenario.");
    }
  }

  async function onClear() {
    if (!id || !accessToken) return;
    try {
      await api.clearChallenge(id, accessToken);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not mark this challenge cleared.");
    }
  }

  if (error) {
    return (
      <main>
        <Alert tone="error">{error}</Alert>
      </main>
    );
  }
  if (!challenge) return null;

  return (
    <main>
      <header className="motion-safe:animate-fade-in-up">
        <h1 className="font-display text-3xl font-semibold text-navy-900">{challenge.title}</h1>
        <Card porthole className="mt-4 transition-colors hover:border-navy-300">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-sm sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">ID</dt>
              <dd className="mt-1">{challenge.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Module</dt>
              <dd className="mt-1">{challenge.module}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Difficulty</dt>
              <dd className="mt-1">
                <Badge tone={DIFFICULTY_TONE[challenge.difficulty] ?? "neutral"}>{challenge.difficulty}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Surface</dt>
              <dd className="mt-1">{challenge.surfaceTags.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Estimated time</dt>
              <dd className="mt-1">{challenge.estimatedMinutes} min</dd>
            </div>
            {accessToken && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Your status</dt>
                <dd className="mt-1">
                  <Badge tone={(challenge.status && STATUS_TONE[challenge.status]) ?? "neutral"}>{challenge.status}</Badge>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </header>

      <p className="mt-6 text-navy-700">{challenge.description}</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-navy-900">Success condition</h2>
      <p className="mt-2 text-navy-700">{challenge.successCondition}</p>

      <HintsList hints={challenge.hints} />

      <p className="mt-6">
        <a href={SWIFTCARGO_URL} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
          Open the live SwiftCargo instance
        </a>
      </p>

      {notice && (
        <div className="mt-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset this scenario
        </Button>
        {accessToken && challenge.status !== "cleared" && (
          <Button type="button" variant="primary" onClick={onClear}>
            Mark cleared
          </Button>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-10">
          <h2 id="related-heading" className="font-display text-xl font-semibold text-navy-900">
            Related challenges
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {related.map((c) => (
              <li key={c.id}>
                <Link to={`/challenges/${c.id}`} className="font-medium text-teal-700 hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DiscussionThread challengeId={challenge.id} />
    </main>
  );
}
