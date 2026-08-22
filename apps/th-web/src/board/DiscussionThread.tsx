import { useEffect, useState } from "react";
import type { DiscussionPost } from "@assertquest/shared";
import { Alert, Button, Card } from "@assertquest/shared/ui";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

// Embedded community discussion (FR-307) — post/view solutions, upvote.
export function DiscussionThread({ challengeId }: { challengeId: string }) {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api
      .listDiscussionPosts(challengeId)
      .then((res) => setPosts(res.posts))
      .catch(() => {});
  }

  useEffect(reload, [challengeId]);

  async function onSubmit() {
    if (!accessToken || !body.trim()) return;
    setError(null);
    try {
      await api.createDiscussionPost(challengeId, body, accessToken);
      setBody("");
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not post.");
    }
  }

  async function onUpvote(postId: string) {
    if (!accessToken) return;
    await api.upvotePost(postId, accessToken);
    reload();
  }

  return (
    <section aria-labelledby="discussion-heading" className="mt-8">
      <h2 id="discussion-heading" className="font-display text-xl font-semibold text-navy-900">
        Discussion
      </h2>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <ul className="mt-3 flex flex-col gap-3">
        {posts.length === 0 && (
          <li className="text-sm text-navy-500">No posts yet — be the first to share how you solved it.</li>
        )}
        {posts.map((p) => (
          <li key={p.id}>
            <Card className="flex items-start justify-between gap-4 p-4 transition-colors hover:border-navy-300">
              <p className="text-sm text-navy-700">
                <strong className="text-navy-900">{p.authorName}</strong>: {p.body}
              </p>
              <button
                type="button"
                onClick={() => onUpvote(p.id)}
                disabled={!accessToken}
                className="shrink-0 rounded-lg border border-mist-300 px-3 py-1 text-xs font-medium text-navy-600 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-navy-300"
              >
                ▲ {p.upvotes}
              </button>
            </Card>
          </li>
        ))}
      </ul>
      {accessToken ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="discussion-body" className="text-sm font-medium text-navy-600">
            Share your approach
          </label>
          <textarea
            id="discussion-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-mist-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-300 focus:border-teal-500 focus:outline focus:outline-2 focus:outline-teal-200"
          />
          <Button type="button" onClick={onSubmit} disabled={!body.trim()} className="self-start">
            Post
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-navy-500">Log in to post.</p>
      )}
    </section>
  );
}
