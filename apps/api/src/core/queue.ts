const DEFAULT_DELAY_MS = 500;

// Minimal async job queue (FR-1203) — jobs run after a delay via setTimeout rather
// than synchronously in the request that enqueued them, so callers get realistic
// "fire and check later" async-assertion practice instead of everything resolving
// instantly. No real broker; this is a mock delivery pipeline, same spirit as the
// mock payment gateway and mock GPS feed elsewhere in the app.
export function enqueue(job: () => Promise<void> | void): void {
  const delayMs = Number(process.env.NOTIFICATION_QUEUE_DELAY_MS ?? DEFAULT_DELAY_MS);
  setTimeout(() => {
    // A queued job can legitimately fail — e.g. the user it targets was deleted by
    // a test-control reset between enqueue and delivery. Since Node terminates the
    // process on an unhandled rejection, a failure here must never escape
    // uncaught, or one late delivery crashes the entire server.
    Promise.resolve()
      .then(job)
      .catch((err: unknown) => {
        console.error("Queued job failed:", err);
      });
  }, delayMs);
}
