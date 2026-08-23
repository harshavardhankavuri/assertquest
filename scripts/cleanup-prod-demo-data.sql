-- One-off cleanup: removes demo/test accounts (and everything that cascades
-- from them) that got seeded into production by the old unconditional
-- `prisma/seed.ts` run in apps/api/Dockerfile. Safe to re-run (no-ops if the
-- rows are already gone). Does NOT touch th_challenges (real product content).

-- AssertQuest platform demo accounts (cascades: th_progress, th_discussion_posts)
DELETE FROM th_users WHERE email IN ('learner@assertquest.dev', 'th-admin@assertquest.dev');

-- SwiftCargo demo accounts (cascades: shipments, customs_documents, invoices,
-- payments, assignments, audit_log, notifications, report_jobs, refresh_tokens)
DELETE FROM users WHERE email IN (
  'admin@swiftcargo.test',
  'dispatcher@swiftcargo.test',
  'driver@swiftcargo.test',
  'customer@swiftcargo.test'
);

-- SwiftCargo demo fleet vehicles (not tied to a user FK)
DELETE FROM vehicles WHERE plate IN ('SC-VAN-01', 'SC-BOX-01', 'SC-CTR-01');
