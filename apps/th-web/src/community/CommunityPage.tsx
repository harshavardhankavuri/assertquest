import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ActivityEntry } from "@assertquest/shared";
import { Card, PageHeader } from "@assertquest/shared/ui";
import { api } from "../lib/api.js";
import { useDocumentMeta } from "../lib/useDocumentMeta.js";

export function CommunityPage() {
  useDocumentMeta(
    "Community",
    "Discuss automation testing challenges, share approaches, and connect with other AssertQuest learners.",
    "/community",
  );

  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    api.getRecentActivity(20).then((res) => setActivity(res.entries));
  }, []);

  return (
    <main>
      <div className="motion-safe:animate-fade-in-up">
        <PageHeader
          title="Community"
          description="Discuss challenges, share approaches, or ask for help — join the discussion on individual challenge pages, or drop into the wider community."
        />

        <Card porthole className="overflow-hidden">
          <span className="font-mono text-xs uppercase tracking-wide text-teal-300">Porthole // join in</span>
          <h2 className="mt-2 font-display text-lg font-semibold text-white">Find us elsewhere</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            <li>
              <a
                href="https://github.com/harshavardhankavuri/assertquest/discussions"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                GitHub Discussions
              </a>
            </li>
            <li>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Discord
              </a>
            </li>
          </ul>
        </Card>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-navy-900">Recent activity</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {activity.length === 0 && <li className="text-sm text-navy-500">No cleared challenges yet.</li>}
        {activity.map((a, i) => (
          <li key={i}>
            <Card className="p-4 text-sm text-navy-700 transition-colors hover:border-navy-300">
              <Link to={`/profile/${a.userId}`} className="font-medium text-teal-700 hover:underline">
                {a.name}
              </Link>{" "}
              cleared{" "}
              <Link to={`/challenges/${a.challengeId}`} className="font-medium text-teal-700 hover:underline">
                {a.challengeTitle}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
