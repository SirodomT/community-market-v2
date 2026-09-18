# Demo Auth smoke results — 2026-09-18

Update: the dashboard timeout described below is now resolved. See
[admin-dashboard-timeout.md](admin-dashboard-timeout.md) for the reproduction,
minimal sequential-query fix and passing final ADMIN regression test. The
remaining text records the earlier smoke run.

Inspected scripts/verify-demo-auth.mjs before testing. No migration rerun, account
creation, mapping insertion, deferred foreign key or marketplace mutation occurred.
Tests submitted the actual Next.js login/logout server-action forms over HTTP and
requested protected routes against the local production server on port 3100.
Passwords came from ignored environment variables; no passwords, tokens, cookies,
session values or administrative credentials were logged or persisted.

| Account | Password login | Logout | Authorization |
| --- | --- | --- | --- |
| bs@test.com (USER, integer ID 3) | Pass | Pass | /account allowed; /seller, /seller/products and /admin denied |
| boss@test.com (SELLER, integer ID 1) | Pass | Pass | /seller, /seller/products, /seller/orders and own product edit GET allowed; other-shop product edit denied; /admin denied |
| admin@test.com (ADMIN, integer ID 2) | Pass | Pass | /account, /admin/users, /admin/shops and /admin/orders allowed; /admin dashboard timed out |

Wrong-password login was rejected. After each successful logout, /account, /seller
and /admin redirected to /login. These routes also rejected access following the
wrong-password attempt. No product edits, order actions or admin mutations were
submitted: marketplace authorization tests used GET only.

The initial harness misclassified Next.js streamed meta-refresh redirects as
failures. After inspecting the actual response and correcting the harness, USER
and SELLER denial/logout checks passed. This was a harness issue, not an application
authorization failure.

The /admin dashboard request did not complete; subsequent authenticated requests
also stalled. Restarting the local test server allowed login/account requests,
but revisiting the dashboard stalled again. Tests then isolated the dashboard and
confirmed the other admin pages plus logout. The dashboard failure remains open;
no application changes were made to hide or fix it. Aggregate database inspection
showed no waiting active query at the time sampled, so the root cause is not proven.

Final independent read-only verification passed: exactly four Auth accounts and
four unique mappings, correct UUID-to-integer relationships, unchanged roles/status
and exact emails, confirmed demo accounts and preserved bcrypt hashes. Full-row
SHA-256 fingerprints for all ten marketplace tables match the migration baseline:
all 61 existing rows and IDs remain unchanged. Deferred Auth foreign-key count: 0.

Artifacts: scripts/smoke-demo-auth.mjs, work/demo-auth-smoke-results.json and
work/demo-auth-smoke-admin-results.json. The first result file retains the interrupted
full run; the admin result file records the successful isolated remaining tests.
Storage migration and later phases were not started.
