import { useState } from "react";
import type { MockMessage } from "@assertquest/shared";
import { Alert, Button, Card, FormField, TextInput } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

// Mock email/SMS outbox viewer (FR-1201) — a Mailhog-style viewable inbox, not a
// real inbox. No real message ever leaves SwiftCargo.
export function OutboxPanel() {
  const { accessToken } = useAuth();
  const [to, setTo] = useState("");
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    if (!accessToken) return;
    setError(null);
    try {
      const res = await api.listOutbox(accessToken, to || undefined);
      setMessages(res.messages);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the outbox.");
    }
  }

  return (
    <section aria-labelledby="outbox-heading">
      <Card>
        <h2 id="outbox-heading" className="mb-4 text-[15px] font-bold tracking-tight text-ink-900">
          Mock outbox
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <FormField label="Recipient (email or mock phone)" htmlFor="outbox-to">
              <TextInput id="outbox-to" name="outbox-to" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>
          <Button type="button" variant="secondary" onClick={onSearch}>
            Search
          </Button>
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg border border-hairline px-3 py-2 text-sm text-ink-600">
              <span className="font-mono text-xs uppercase tracking-wide text-brand-600">[{m.channel}]</span> to{" "}
              {m.to}
              {m.subject ? ` — ${m.subject}` : ""}: {m.body}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
