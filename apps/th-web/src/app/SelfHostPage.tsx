import { Card, PageHeader } from "@assertquest/shared/ui";

const ENV_VARS: Array<{ name: string; def: string; purpose: string }> = [
  { name: "DATABASE_URL", def: "—", purpose: "Postgres connection string" },
  { name: "PORT", def: "4000", purpose: "API port" },
  { name: "ACCESS_TOKEN_SECRET", def: "dev value", purpose: "JWT signing secret for SwiftCargo — change for any non-local deployment" },
  { name: "ACCESS_TOKEN_TTL_SECONDS", def: "900 (15m)", purpose: "Access token lifetime" },
  { name: "REFRESH_TOKEN_TTL_SECONDS", def: "604800 (7d)", purpose: "Refresh token lifetime" },
  { name: "FLAKE_LATENCY_MS[_<MODULE>]", def: "0", purpose: "Injects artificial latency per module, for flaky-test practice" },
  { name: "FLAKE_FAILURE_RATE[_<MODULE>]", def: "0", purpose: "Injects a random failure rate (0–1) per module" },
  { name: "THP_ACCESS_TOKEN_SECRET", def: "dev value", purpose: "JWT signing secret for the AssertQuest platform layer" },
];

const DEMO_ACCOUNTS: Array<{ system: string; role: string; email: string; password: string }> = [
  { system: "SwiftCargo", role: "Admin", email: "admin@swiftcargo.test", password: "Password123!" },
  { system: "SwiftCargo", role: "Dispatcher", email: "dispatcher@swiftcargo.test", password: "Password123!" },
  { system: "SwiftCargo", role: "Driver", email: "driver@swiftcargo.test", password: "Password123!" },
  { system: "SwiftCargo", role: "Customer", email: "customer@swiftcargo.test", password: "Password123!" },
  { system: "AssertQuest", role: "Learner", email: "learner@assertquest.dev", password: "LearnTest123!" },
  { system: "AssertQuest", role: "Admin", email: "th-admin@assertquest.dev", password: "LearnTest123!" },
];

export function SelfHostPage() {
  return (
    <main className="pb-8">
      <PageHeader
        title="Self-hosting AssertQuest"
        description="One command starts Postgres, the SwiftCargo API, SwiftCargo, and this site — fully seeded, ready in under 5 minutes."
      />

      <Card porthole>
        <span className="font-mono text-xs uppercase tracking-wide text-teal-300">Quick start</span>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-porthole-border bg-black/30 p-4 font-mono text-sm text-teal-200">
          <code>{`git clone https://github.com/harshavardhankavuri/swiftcargo-selfhost.git\ncd swiftcargo-selfhost\ndocker compose up`}</code>
        </pre>
        <ul className="mt-4 grid gap-1 font-mono text-sm text-navy-200 sm:grid-cols-2">
          <li>AssertQuest — http://localhost:5174</li>
          <li>SwiftCargo — http://localhost:5173</li>
          <li>API — http://localhost:4000/health</li>
          <li>Postgres — localhost:5432</li>
          <li>API docs (Swagger UI) — /docs, proxied by both apps above</li>
        </ul>
      </Card>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-navy-900">Demo accounts</h2>
        <p className="mt-1 text-sm text-navy-500">
          This is a practice sandbox — no real user data is ever stored, so shared demo passwords are intentional.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-mist-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-mist-100 text-xs uppercase tracking-wide text-navy-600">
                <th className="px-4 py-3">System</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {DEMO_ACCOUNTS.map((acc) => (
                <tr key={acc.email} className="hover:bg-foam-100">
                  <td className="px-4 py-3">{acc.system}</td>
                  <td className="px-4 py-3">{acc.role}</td>
                  <td className="px-4 py-3 font-mono">{acc.email}</td>
                  <td className="px-4 py-3 font-mono">{acc.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-navy-900">Environment variables</h2>
        <p className="mt-1 text-sm text-navy-500">
          Set in <code className="font-mono">docker-compose.yml</code> for the containerized flow, or in{" "}
          <code className="font-mono">apps/api/.env</code> when running the API outside Docker.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-mist-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-mist-100 text-xs uppercase tracking-wide text-navy-600">
                <th className="px-4 py-3">Variable</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {ENV_VARS.map((v) => (
                <tr key={v.name} className="hover:bg-foam-100">
                  <td className="px-4 py-3 font-mono text-teal-700">{v.name}</td>
                  <td className="px-4 py-3 font-mono">{v.def}</td>
                  <td className="px-4 py-3 text-navy-600">{v.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-navy-900">Resetting &amp; seeding data</h2>
        <p className="mt-2 text-sm text-navy-500">
          Every module exposes its own seed/reset via the test-control API, scoped per module or globally:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-mist-200 bg-navy-900 p-4 font-mono text-sm text-teal-200">
          <code>{`curl -X POST "http://localhost:4000/api/test/reset?module=auth"\ncurl -X POST "http://localhost:4000/api/test/seed"   # all modules`}</code>
        </pre>
        <p className="mt-3 text-sm text-navy-500">
          Individual challenge pages call their own reset endpoint to reset just the scenario in question — see the
          &ldquo;Reset this scenario&rdquo; action on any Challenge Board entry.
        </p>
      </section>
    </main>
  );
}
