# AssertQuest — Detailed Requirements Document

**Product:** AssertQuest (practice platform) + SwiftCargo (the enterprise app under test)
**Document type:** Product Requirements Document (PRD)
**Status:** Draft v1
**Related docs:** `swiftcargo-requirements-architecture.md`, `assertquest-design-plan.md`, Ocean Breeze homepage mockups

---

## 1. Overview

AssertQuest is a free, self-hostable platform that teaches automation testing (API, DB,
UI) by giving learners a realistic enterprise application — **SwiftCargo**, a logistics
and freight management system — to test against. AssertQuest wraps SwiftCargo in
challenges, difficulty tiers, community support, and a self-host workflow.

This document defines *what* needs to be built, at a level detailed enough to plan
work module by module. Visual design is defined separately in the design plan and the
Ocean Breeze mockups; this document focuses on functional and non-functional
requirements, data, and acceptance criteria.

---

## 2. Goals & Non-Goals

### Goals
- Give testers realistic, enterprise-grade UI/API/DB surfaces to practice against
- Offer challenges at every difficulty level, tagged and filterable
- Make the whole thing free to use publicly, and free to self-host via one command
- Build organic discoverability (SEO-indexable challenge pages, strong docs)
- Support community contribution of new challenges
- Ship module by module so each module is independently usable

### Non-Goals (v1)
- Not a general-purpose LMS or course platform (no video lessons, no certifications)
- Not a paid product — no billing/subscription system for AssertQuest itself
  (SwiftCargo's *own* billing module is a practice surface, not a real payment system)
- Not multi-tenant — v1 supports one public instance + self-hosted single-tenant copies,
  not org-level tenant isolation

---

## 3. Personas

| Persona | Description | Primary need |
|---|---|---|
| Solo learner | Individual automation tester upskilling | Browse challenges, get hints, track progress |
| Team lead | QA lead onboarding a team | Self-host an instance, assign modules to trainees |
| Contributor | Experienced tester/dev | Submit new challenges via GitHub PR flow |
| Anonymous visitor | Found the site via search | Browse challenges/docs without signing up |

---

## 4. Functional Requirements

Requirements are grouped by **platform-level** (AssertQuest itself) and **application-level**
(SwiftCargo, the app being tested). Each has an ID for traceability.

### 4.1 Platform — Account & Access

| ID | Requirement | Priority |
|---|---|---|
| FR-101 | Visitors can browse all challenges and docs without an account | Must |
| FR-102 | Users can register/log in (email+password, optional Google OAuth) | Must |
| FR-103 | Logged-in users have a profile tracking cleared/in-progress challenges per module | Must |
| FR-104 | Users can reset their own progress per module | Should |
| FR-105 | Anonymous progress is not persisted across sessions (no local-only tracking promises) | Must |

### 4.2 Platform — Challenge Board

| ID | Requirement | Priority |
|---|---|---|
| FR-201 | Board lists all challenges with ID, title, module, difficulty ("cargo class"), status | Must |
| FR-202 | Board supports filtering by module, difficulty, and testing surface (API/DB/UI) | Must |
| FR-203 | Board supports free-text search across title and description | Must |
| FR-204 | Each filtered view has a unique, shareable, indexable URL (for SEO) | Must |
| FR-205 | Board updates live on filter change without full page reload | Should |
| FR-206 | Logged-in users see personal status (Open/In Progress/Cleared) per row | Must |
| FR-207 | Board is keyboard-navigable; all rows reachable and actionable via keyboard | Must |

### 4.3 Platform — Individual Challenge Page

| ID | Requirement | Priority |
|---|---|---|
| FR-301 | Each challenge has its own page with a manifest header (ID, module, class, surface, est. time) | Must |
| FR-302 | Plain-language scenario description and clear success/pass condition | Must |
| FR-303 | Progressive hints — first hint visible by default, further hints require explicit reveal | Must |
| FR-304 | Link to the live target (public demo instance or user's self-hosted instance) | Must |
| FR-305 | "Reset this scenario" action calls the seed/reset API for a clean state | Must |
| FR-306 | Related-challenges list (same module) | Should |
| FR-307 | Embedded community discussion thread (post/view solutions, upvote) | Should |
| FR-308 | Logged-in users can mark a challenge "cleared," updating profile and leaderboard | Must |

### 4.4 Platform — Community & Leaderboard

| ID | Requirement | Priority |
|---|---|---|
| FR-401 | Community page lists links to Discussions/Discord and recent solved-challenge activity | Should |
| FR-402 | Leaderboard ranks users by challenges cleared, filterable by module and time range | Should |
| FR-403 | Leaderboard is anonymized by default (username only); opt-in to show real name | Must |
| FR-404 | Contribution flow: form pre-fills a GitHub issue/PR template for a new challenge | Should |

### 4.5 Platform — Self-Host

| ID | Requirement | Priority |
|---|---|---|
| FR-501 | `git clone` + single `docker compose up` command starts UI, API, and DB fully seeded | Must |
| FR-502 | Self-hosted instance reaches ready state in under 5 minutes on a typical dev machine | Must |
| FR-503 | Self-hosted instance includes the full challenge manifest, identical to hosted version | Must |
| FR-504 | Self-host docs cover environment variables, ports, and troubleshooting | Must |
| FR-505 | Self-hosted instance can optionally sync progress back to the public leaderboard (opt-in) | Could |

### 4.6 SwiftCargo — Auth & RBAC (Module 1)

| ID | Requirement | Priority |
|---|---|---|
| FR-601 | Multi-role login: Admin, Dispatcher, Driver, Customer | Must |
| FR-602 | JWT access token + refresh token flow with configurable expiry | Must |
| FR-603 | Optional Google OAuth login path | Should |
| FR-604 | Role-gated UI: each role sees only permitted nav items/actions | Must |
| FR-605 | 401 on expired/invalid token, 403 on insufficient permission, both with structured error bodies | Must |

### 4.7 SwiftCargo — Shipment Booking (Module 2)

| ID | Requirement | Priority |
|---|---|---|
| FR-701 | Multi-step booking wizard: origin/destination → package details → pricing → confirm | Must |
| FR-702 | Wizard preserves state on back-navigation (this is intentionally buggy in one challenge variant) | Must |
| FR-703 | Address autocomplete via a mocked geocoding endpoint | Must |
| FR-704 | Dynamic pricing calculator reacting to package weight/dimensions/distance | Must |
| FR-705 | File upload for customs documents, with client- and server-side validation | Must |

### 4.8 SwiftCargo — Dashboard & Tracking (Module 3)

| ID | Requirement | Priority |
|---|---|---|
| FR-801 | Real-time shipment status updates via WebSocket | Must |
| FR-802 | Map view showing live position from a mocked GPS feed | Must |
| FR-803 | Data table with sort, filter, pagination, and CSV export | Must |
| FR-804 | Reconnect handling when WebSocket drops (with an intentionally flaky variant) | Should |

### 4.9 SwiftCargo — Fleet & Scheduling (Module 4)

| ID | Requirement | Priority |
|---|---|---|
| FR-901 | Drag-and-drop scheduling board (Kanban-style) for assigning shipments to vehicles/drivers | Must |
| FR-902 | Calendar view with conflict detection (double-booked driver/vehicle) | Must |
| FR-903 | Conflict state surfaces a visible banner/toast, not just a console error | Must |

### 4.10 SwiftCargo — Billing & Invoicing (Module 5)

| ID | Requirement | Priority |
|---|---|---|
| FR-1001 | PDF invoice generation per shipment | Must |
| FR-1002 | Multi-currency support with correct formatting/rounding | Must |
| FR-1003 | Mock payment gateway sandbox with success, decline, and timeout paths | Must |
| FR-1004 | Payment retry flow after a simulated failure | Should |

### 4.11 SwiftCargo — Admin Console (Module 6)

| ID | Requirement | Priority |
|---|---|---|
| FR-1101 | Audit log of user actions (who/what/when) | Must |
| FR-1102 | Bulk operations (bulk approve/cancel shipments) with partial-failure handling | Must |
| FR-1103 | CSV import with row-level validation and a report of accepted/rejected rows | Must |
| FR-1104 | Feature flags togglable per environment, driving conditional UI | Should |

### 4.12 SwiftCargo — Notifications (Module 7)

| ID | Requirement | Priority |
|---|---|---|
| FR-1201 | Mock email/SMS service with a viewable inbox for test assertions | Must |
| FR-1202 | In-app notification center with read/unread state persisted per user | Must |
| FR-1203 | Notification delivery is asynchronous (queued), for realistic async-assertion practice | Should |

### 4.13 SwiftCargo — Reporting (Module 8)

| ID | Requirement | Priority |
|---|---|---|
| FR-1301 | Charts for shipment volume and revenue over time | Must |
| FR-1302 | Date-range filters, including month/timezone boundary edge cases | Must |
| FR-1303 | Scheduled report generation (async job, downloadable when ready) | Should |

### 4.14 Cross-cutting — Seed/Reset & Challenge Framework

| ID | Requirement | Priority |
|---|---|---|
| FR-1401 | `/api/test/seed` and `/api/test/reset` endpoints, scoped per module or global | Must |
| FR-1402 | Challenge manifest (JSON) with module, difficulty, testing surface, and hint tags | Must |
| FR-1403 | Flakiness injection config: togglable latency and random-failure rates per environment | Should |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Public site TTFB under 300ms for cached pages; challenge board filter response under 200ms |
| Availability | Public demo instance targets 99% uptime (best-effort, not SLA-backed) |
| Accessibility | WCAG 2.1 AA baseline; axe-core clean on all pages; full keyboard navigation |
| Security | No real PII collected; mock payment/SMS/email only; rate limiting on public API |
| SEO | Server-rendered pages, unique meta tags per challenge/module, sitemap.xml, structured data on challenge pages |
| Portability | Self-host works on Docker Desktop (Mac/Windows/Linux) with no cloud dependency required |
| Test isolation | Every module supports full data reset without affecting other modules' state |
| Internationalization | Not required for v1; currency formatting in Billing should still be locale-aware |
| Browser support | Latest two versions of Chrome, Firefox, Safari, Edge |
| Motion/reduced-motion | All animated UI (flip-board, scroll-reveal, marquee) respects `prefers-reduced-motion` |

---

## 6. Design Requirements

Full detail lives in the design plan; summarized here for traceability:

- **Palette:** Ocean Breeze — foam/mist light backgrounds, teal primary accent, coral
  secondary accent, navy headings, one intentional dark "porthole" surface (terminal,
  self-host card) for contrast grounding
- **Type system:** Zilla Slab (display), Inter (body), IBM Plex Mono (data/code/manifest
  numbers)
- **Signature component:** the Harbor Board — flip-board challenge listing, used as both
  homepage hero and the actual Challenge Board browsing UI
- **Component patterns:** pill-shaped buttons/nav, bento-grid feature layout, glass
  panel on the hero board, scroll-reveal on section entry, infinite marquee for module
  list
- **Accessibility in design:** visible focus states in teal, sufficient contrast on both
  light (Ocean Breeze) and dark (porthole) surfaces

---

## 7. Data Requirements

See `swiftcargo-requirements-architecture.md §6` for the full entity list
(`users`, `shipments`, `invoices`, `payments`, `notifications`, `audit_logs`, etc.).
Additional platform-level entities needed for AssertQuest itself:

```
th_users (id, email, role, created_at)
th_challenges (id, module, title, difficulty, surface_tags[], description, hints[])
th_progress (id, user_id, challenge_id, status, cleared_at)
th_discussion_posts (id, challenge_id, user_id, body, upvotes, created_at)
```

---

## 8. API Requirements (platform-level, additive to SwiftCargo's own API)

```
GET    /api/th/challenges?module=&class=&surface=&q=&page=
GET    /api/th/challenges/:id
POST   /api/th/challenges/:id/reset
POST   /api/th/challenges/:id/clear         (auth required)
GET    /api/th/leaderboard?module=&range=
GET    /api/th/profile/:userId
POST   /api/th/discussion/:challengeId
```

---

## 9. Acceptance Criteria (Definition of Done, per module)

A module is considered done when:
1. All **Must**-priority functional requirements for that module are implemented
2. Seed/reset works cleanly for that module in isolation
3. At least one challenge per difficulty tier (Light/Standard/Heavy/Bulk) exists and is
   playable end-to-end
4. Module's API endpoints are documented in the docs site
5. Module passes an accessibility check (axe-core clean) on its primary UI
6. Module works correctly in a fresh self-hosted `docker compose up` run

---

## 10. Assumptions & Constraints

- Public hosting relies on free tiers (Vercel/Netlify + Railway/Render/Fly.io or
  Supabase) — some rate/resource limits are expected and acceptable for a free product
- Payment, SMS, and email are always mocked — no real transactions or messages ever
  leave the system
- Community moderation (discussion posts) is manual/lightweight for v1, no automated
  moderation tooling planned

---

## 11. Success Metrics

| Metric | Target (initial) |
|---|---|
| Challenges published at launch | 40+ across all 8 modules |
| Self-host setup success rate | Under 5 min, first try, per FR-502 |
| Organic search impressions (3 months post-launch) | Indexed and ranking for "playwright practice site" class queries |
| GitHub stars (6 months) | Directional signal only, no hard target set yet |

---

## 12. Build Order (unchanged from architecture doc, restated for traceability)

1. Infra scaffold (Docker Compose, migrations, seed/reset framework, CI)
2. Module 1 — Auth
3. Module 2 — Shipment Booking
4. Module 3 — Dashboard/Tracking
5. Module 5 — Billing
6. Module 4 — Fleet/Scheduling
7. Module 6 — Admin Console
8. Module 7 — Notifications
9. Module 8 — Reporting
10. AssertQuest platform layer (Board, Challenge pages, Community, Leaderboard, Self-host docs) — can begin in parallel once Module 1 and the seed/reset framework exist

---

## 13. Open Questions

- Modular monolith vs. microservices from day one (unresolved in architecture doc)
- GraphQL in addition to REST, or REST-only for v1
- SQLite support for self-host alongside Postgres, or Postgres-only
- Discussion feature: build in-house (FR-307/FR-401) vs. embed GitHub Discussions
  directly to reduce scope
- Whether self-hosted instances should be able to opt into the public leaderboard
  (FR-505) for v1 or defer to v2
