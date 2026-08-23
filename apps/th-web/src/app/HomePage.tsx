import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Marquee } from "@assertquest/shared/ui";
import { SWIFTCARGO_URL } from "../lib/api.js";
import { useDocumentMeta } from "../lib/useDocumentMeta.js";
import { useParallax } from "./useParallax.js";
import {
  ApiIcon,
  BellIcon,
  BoardIcon,
  ChartIcon,
  ChatIcon,
  DatabaseIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  GearIcon,
  GitBranchIcon,
  PackageIcon,
  RadarIcon,
  ReceiptIcon,
  RefreshIcon,
  ServerIcon,
  ShieldIcon,
  TrophyIcon,
  TruckIcon,
  UiIcon,
  UserIcon,
  UsersIcon,
} from "./icons.js";

function IconTile({ icon: Icon, tone = "teal" }: { icon: ComponentType<{ className?: string }>; tone?: "teal" | "coral" }) {
  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
        tone === "teal" ? "bg-teal-50 text-teal-600" : "bg-coral-50 text-coral-600"
      }`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

const MODULES: Array<{ name: string; icon: ComponentType<{ className?: string }> }> = [
  { name: "Auth & RBAC", icon: ShieldIcon },
  { name: "Shipment Booking", icon: PackageIcon },
  { name: "Dashboard & Tracking", icon: RadarIcon },
  { name: "Fleet & Scheduling", icon: TruckIcon },
  { name: "Billing & Invoicing", icon: ReceiptIcon },
  { name: "Admin Console", icon: GearIcon },
  { name: "Notifications", icon: BellIcon },
  { name: "Reporting", icon: ChartIcon },
];

// Mirrors apps/web/src/practice/practiceToggles.ts's PRACTICE_TOGGLE_META groups —
// kept as a short summary here rather than importing SwiftCargo's own module.
const PRACTICE_GROUPS: Array<{ title: string; examples: string }> = [
  { title: "Locators", examples: "Dynamic ids, duplicate ids, random list order" },
  { title: "Timing & loading", examples: "Slow-loading elements, layout shift" },
  { title: "Visual", examples: "Slow animations, broken UI" },
  { title: "Network & links", examples: "Slow network, broken links, console noise" },
  { title: "DOM & dialogs", examples: "Iframes, shadow DOM, click-intercepted, stale elements, native dialogs" },
];

const STEPS = [
  {
    title: "Pick a scenario",
    body: "Filter the Challenge Board by module, difficulty class, or testing surface — API, DB, or UI.",
    icon: FilterIcon,
  },
  {
    title: "Work against a real app",
    body: "SwiftCargo is a full enterprise logistics app, not a toy fixture — auth, WebSockets, PDFs, flaky endpoints, all real.",
    icon: ServerIcon,
  },
  {
    title: "Reset and clear",
    body: "Every scenario resets to a clean state on demand. Clear it to update your profile and the leaderboard.",
    icon: RefreshIcon,
  },
];

const SURFACES: Array<{ tag: string; title: string; count: string; body: string; icon: ComponentType<{ className?: string }> }> = [
  { tag: "API", title: "API testing", count: "100+", body: "Request validation, RBAC, pagination, idempotency, and negative tests against a real Fastify service.", icon: ApiIcon },
  { tag: "DB", title: "Database testing", count: "100+", body: "Constraints, cascades, transactional atomicity, and persisted state — verified against real Postgres via Prisma.", icon: DatabaseIcon },
  { tag: "UI", title: "UI automation", count: "100+", body: "Forms, drag-and-drop, live WebSocket updates, and locator strategy against the Practice mode chaos toolbar.", icon: UiIcon },
];

const PERSONAS: Array<{ title: string; body: string; icon: ComponentType<{ className?: string }> }> = [
  { title: "Solo learner", body: "Browse challenges, get hints, and track your progress at your own pace.", icon: UserIcon },
  { title: "Team lead", body: "Self-host an instance and assign modules to trainees — no shared account, no vendor lock-in.", icon: UsersIcon },
  { title: "Contributor", body: "Submit new challenges via a GitHub PR — the manifest format is a plain JSON file.", icon: GitBranchIcon },
  { title: "Anonymous visitor", body: "Browse challenges and docs without signing up. An account is only needed to track progress.", icon: EyeIcon },
];

// A single thin-stroke outline, no fill — a quiet nod to the technical line-art
// treatment on minrims.com, echoed here as a shipping crate rather than a product render.
function CrateOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20 55 100 20 180 55 180 120 100 155 20 120Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M20 55 100 90 180 55" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M100 90 100 155" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// Same thin-stroke, no-fill treatment as CrateOutline — a small family of
// background line-art shapes, each drifting slowly (motion-safe only).
function RingOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" />
    </svg>
  );
}

function HexOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <path
        d="M50 3 93 26.5 93 73.5 50 97 7 73.5 7 26.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TriangleOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 90" fill="none" aria-hidden="true" className={className}>
      <path d="M50 4 96 86 4 86Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage() {
  useDocumentMeta(
    "AssertQuest",
    "AssertQuest is a free, self-hostable platform for practicing automation testing — API, DB, and UI — against SwiftCargo, a real enterprise logistics app. 337+ challenges, difficulty tiers, a leaderboard, and community discussion.",
    "/",
  );

  // Background decorative layers only, never text/controls — small, varied
  // offsets so foreground and background never desync distractingly. No-ops
  // under prefers-reduced-motion.
  const crateParallax = useParallax<HTMLDivElement>(0.12);
  const ringParallax = useParallax<HTMLDivElement>(0.06);
  const hexParallax = useParallax<HTMLDivElement>(0.09);

  return (
    <main className="flex flex-col gap-32 pb-8 sm:gap-40">
      <div>
        <section className="relative -mx-6 -mt-10 overflow-hidden bg-diagonal-fade px-6 pb-28 pt-20 sm:px-12 sm:pb-40 sm:pt-28">
          <div ref={crateParallax} className="pointer-events-none absolute -right-6 top-16 h-40 w-40 sm:h-56 sm:w-56">
            <CrateOutline className="h-full w-full text-navy-200 motion-safe:animate-float" />
          </div>
          <div ref={ringParallax} className="pointer-events-none absolute -left-10 bottom-0 hidden h-32 w-32 sm:block">
            <RingOutline className="h-full w-full text-teal-200 motion-safe:animate-spin-slow" />
          </div>
          <div ref={hexParallax} className="pointer-events-none absolute left-[38%] top-4 hidden h-16 w-16 lg:block">
            <HexOutline className="h-full w-full text-coral-200 motion-safe:animate-float-slow" />
          </div>

          <Link
            to="/challenges"
            className="absolute right-6 top-8 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-600 sm:right-12 sm:top-10"
          >
            Browse the Challenge Board
            <span aria-hidden="true">&rarr;</span>
          </Link>

          <div className="relative mx-auto max-w-3xl motion-safe:animate-fade-in-up">
            <Badge tone="teal">Free &amp; self-hostable</Badge>
            <h1 className="mt-6 max-w-xl font-display text-4xl font-normal leading-[1.15] tracking-tight text-navy-900 sm:text-[2.75rem]">
              Practice automation testing — API, DB, and UI — against a real app.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-navy-500">
              AssertQuest is a free, self-hostable platform for practicing automation testing. It wraps a real
              application in a Challenge Board, difficulty tiers, a leaderboard, and community discussion — so
              you&rsquo;re always testing something real, not a toy fixture built to make the answer obvious.
            </p>
            <a
              href={SWIFTCARGO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Open the live SwiftCargo instance
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 40"
            className="absolute bottom-8 right-8 hidden h-10 w-6 text-navy-300 sm:block"
          >
            <path d="M12 0 12 32M4 24 12 34 20 24" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </section>
      </div>

      <section className="mx-auto w-full max-w-5xl">
        <Card className="overflow-hidden transition-colors hover:border-navy-300">
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <Badge tone="coral">The test app</Badge>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">SwiftCargo</h2>
              <p className="mt-2 max-w-lg text-sm text-navy-500">
                SwiftCargo is a full enterprise logistics app built for exactly this: auth, WebSockets, PDFs, flaky
                endpoints, all real. No account required to browse.
              </p>
            </div>
            <a
              href={SWIFTCARGO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 sm:mt-0"
            >
              Open the live SwiftCargo instance
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          <div aria-label="Modules covered" className="-mx-6 mt-6 border-t border-mist-200 bg-mist-200/40 py-4">
            <Marquee>
              {MODULES.map((m) => (
                <span key={m.name} className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-navy-400">
                  <m.icon className="h-4 w-4 text-teal-600" />
                  {m.name}
                </span>
              ))}
            </Marquee>
          </div>
          <div
            aria-label="By the numbers"
            className="-mx-6 -mb-6 grid grid-cols-2 divide-x divide-y divide-mist-200 border-t border-mist-200 sm:grid-cols-5 sm:divide-y-0"
          >
            {[
              { value: "337+", label: "Challenges" },
              { value: "8", label: "Modules" },
              { value: "4", label: "Difficulty tiers" },
              { value: "3", label: "Testing surfaces" },
              { value: "15", label: "Practice toggles" },
            ].map((stat) => (
              <div key={stat.label} className="p-5">
                <div className="font-display text-3xl font-semibold tracking-tight text-navy-900">{stat.value}</div>
                <div className="mt-1 font-mono text-xs uppercase tracking-wide text-navy-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-5xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card
              key={step.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="motion-safe:animate-fade-in-up transition-colors hover:border-navy-300"
            >
              <IconTile icon={step.icon} />
              <span className="mt-3 block font-mono text-xs font-semibold text-coral-500">STEP {i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm text-navy-500">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-5xl overflow-hidden">
        <TriangleOutline className="pointer-events-none absolute -right-8 -top-6 hidden h-24 w-24 text-mist-300 motion-safe:animate-float lg:block" />
        <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Explore by testing surface</h2>
        <p className="mt-2 max-w-lg text-sm text-navy-500">
          Every challenge is tagged by the surface it exercises — filter the Challenge Board down to exactly the
          skill you&rsquo;re practicing.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SURFACES.map((s, i) => (
            <Card
              key={s.tag}
              style={{ animationDelay: `${i * 80}ms` }}
              className="motion-safe:animate-fade-in-up transition-colors hover:border-navy-300"
            >
              <div className="flex items-center justify-between">
                <IconTile icon={s.icon} />
                <Badge tone="teal">{s.tag}</Badge>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-2 text-sm text-navy-500">{s.body}</p>
              <span className="mt-4 block font-mono text-xs uppercase tracking-wide text-coral-500">
                {s.count} challenges
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge tone="coral">SwiftCargo</Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">Practice mode</h2>
            <p className="mt-2 max-w-lg text-sm text-navy-500">
              A floating toolbar on every SwiftCargo page lets you switch on realistic automation pain points at
              will — dynamic ids, flaky timing, broken DOM structures — instead of waiting to stumble into one.
            </p>
          </div>
          <a
            href={SWIFTCARGO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Try Practice mode in SwiftCargo
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_GROUPS.map((group, i) => (
            <Card
              key={group.title}
              style={{ animationDelay: `${i * 70}ms` }}
              className="motion-safe:animate-fade-in-up transition-colors hover:border-navy-300"
            >
              <span className="font-mono text-xs font-semibold text-coral-500">{group.title.toUpperCase()}</span>
              <p className="mt-2 text-sm text-navy-500">{group.examples}</p>
            </Card>
          ))}
          <Card
            style={{ animationDelay: `${PRACTICE_GROUPS.length * 70}ms` }}
            className="motion-safe:animate-fade-in-up border-teal-200 bg-teal-50/60 transition-colors hover:border-navy-300"
          >
            <span className="font-mono text-xs font-semibold text-coral-500">DIFFICULTY PRESETS</span>
            <p className="mt-2 text-sm text-navy-500">
              One-click Beginner / Intermediate / Chaos bundles, plus a session reset that re-arms timer-based
              toggles without touching which ones are on.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-colors hover:border-navy-300 sm:col-span-2 lg:col-span-2">
          <IconTile icon={BoardIcon} />
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-navy-900">The Challenge Board</h2>
          <p className="mt-2 text-sm text-navy-500">
            Filter by module, difficulty class, and surface (API, DB, UI) to find the right scenario, then work
            against a real, resettable SwiftCargo instance.
          </p>
        </Card>
        <Card className="transition-colors hover:border-navy-300">
          <IconTile icon={TrophyIcon} tone="coral" />
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-navy-900">Leaderboard</h2>
          <p className="mt-2 text-sm text-navy-500">Track cleared challenges across the community, per module.</p>
        </Card>
        <Card className="transition-colors hover:border-navy-300">
          <IconTile icon={ChatIcon} />
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-navy-900">Community</h2>
          <p className="mt-2 text-sm text-navy-500">
            Share your approach and learn from others in per-challenge discussion threads.
          </p>
        </Card>
        <Card className="transition-colors hover:border-navy-300 sm:col-span-2 lg:col-span-1">
          <IconTile icon={DownloadIcon} tone="coral" />
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-navy-900">Self-hostable</h2>
          <p className="mt-2 text-sm text-navy-500">
            Run it yourself — no account required to browse, no vendor lock-in.
          </p>
        </Card>
      </section>

      <section className="relative mx-auto w-full max-w-5xl overflow-hidden">
        <HexOutline className="pointer-events-none absolute -right-10 top-2 hidden h-28 w-28 text-mist-300 motion-safe:animate-float-slow lg:block" />
        <h2 className="relative font-display text-2xl font-semibold tracking-tight text-navy-900">Who it&rsquo;s for</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((p, i) => (
            <Card
              key={p.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="motion-safe:animate-fade-in-up transition-colors hover:border-navy-300"
            >
              <IconTile icon={p.icon} tone="coral" />
              <h3 className="mt-3 font-display text-base font-semibold text-navy-900">{p.title}</h3>
              <p className="mt-2 text-sm text-navy-500">{p.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl">
        <Card porthole className="overflow-hidden">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-wide text-teal-500">Porthole // self-host</span>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">
                Run AssertQuest on your own machine
              </h2>
              <p className="mt-2 max-w-md text-sm text-navy-200">
                One command starts Postgres, the SwiftCargo API, SwiftCargo, and this site — fully seeded, ready in
                under 5 minutes.
              </p>
            </div>
            <Link
              to="/self-host"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-600"
            >
              Read the self-host guide
            </Link>
          </div>
          <pre className="mt-6 overflow-x-auto rounded-lg border border-porthole-border bg-black/30 p-4 font-mono text-sm text-teal-500">
            <code>{`git clone https://github.com/harshavardhankavuri/swiftcargo-selfhost.git\ncd swiftcargo-selfhost\ndocker compose up`}</code>
          </pre>
        </Card>
      </section>
    </main>
  );
}
