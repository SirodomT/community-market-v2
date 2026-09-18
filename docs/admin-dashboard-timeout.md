# Admin dashboard timeout — resolved

## Cause and reproduction

The dashboard submitted five autocommit SELECTs with Promise.all through one
postgres.js connection (max:1, prepare:false) to Supabase's transaction pooler.
That concurrent/pipelined batch stalled awaiting replies. Subsequent requests
using the same client also stalled. This was not a single slow SQL statement.

Temporary per-query instrumentation on the original production build recorded:
role verification completed in 794ms; users count completed in 413ms; shops,
products, orders and pending-request counts remained pending. Recent orders and
completed orders were never reached. The earliest unresolved dashboard query was:

```sql
select count(*) from "shops";
```

The affected batch also contains:

```sql
select count(*) from "users";
select count(*) from "products";
select count(*) from "orders";
select count(*) from "shop_requests" where "shop_requests"."status" = $1;
-- parameter: PENDING
```

An isolated driver reproduction using the same pooler/SSL/prepare/max settings
completed users and shops counts, then timed out after 15 seconds with three
pending replies. The varying last successful query demonstrates that the problem
is the concurrent batch, not shops SQL itself. max_pipeline:1 did not resolve the
reproduction and was not added to application configuration.

The identical seven queries executed sequentially completed successfully:

| Query | Isolated elapsed time | Result |
| --- | ---: | --- |
| Users count (includes initial connection) | 1272ms | 4 |
| Shops count | 122ms | 2 |
| Products count | 145ms | 5 |
| Orders count | 122ms | 13 |
| Pending requests count | 258ms | 1 |
| Recent orders, descending creation date, limit 5 | 278ms | 5 rows |
| Completed orders count | 284ms | 3 |

This matches the transaction-pooler pipelining failure described in Supabase's
[Supavisor issue 1061](https://github.com/supabase/supavisor/issues/1061).
The provider's deployed internal version was not inspected; we confirmed the
failing concurrency pattern and working sequential alternative empirically.

## Other causes checked

- No slow COUNT: all individual counts completed quickly with unchanged SQL.
- Recent orders has no joins and no N+1 loop; it was not reached during the stall.
- No MySQL syntax incompatibility: every existing query executes successfully.
- No database-wide pool exhaustion: an independent client executed the complete
  sequential workload while the application's connection was stalled.
- Aggregate connection inspection during the earlier failure found idle backends,
  not a waiting active query or blocked transaction. No locks were killed or reset.
- Layout and page both perform ADMIN checks; these remain unchanged. The page's
  role timing completed before the failing count batch.
- Reusing the stalled client affected later authenticated routes. Restarting only
  the local test server cleared it; reproducing the batch reintroduced the stall.

## Minimal fix

src/app/admin/page.tsx now awaits the five counts sequentially, with a comment
explaining the pooler limitation. All SQL, filters, totals, recent-order ordering,
limits, rendering and ADMIN protection are retained. No driver/pool settings,
authentication code or database schema/data were changed. All temporary timing
instrumentation and the one-off diagnostic runner were removed.

scripts/smoke-demo-auth.mjs now records elapsed times for successful protected
route GETs. This is test reporting only, not application instrumentation.

## Final validation

- npx tsc --noEmit: passed.
- npm run build: passed (existing unrelated external package-lock warning).
- npm run lint: passed.
- ADMIN password login, /admin, /admin/users, /admin/shops, /admin/orders and logout:
  passed on the final production build without instrumentation.
- /admin: HTTP 200, complete response in 2454ms.
- Logged-out protected routes and wrong password: denied as expected.
- Independent verification: all 61 marketplace rows and IDs retain their full-row
  fingerprints; all four Auth accounts/mappings, roles, statuses, emails and
  imported hashes remain correct. Deferred Auth FK remains absent.

No migrations or Storage work were performed.
