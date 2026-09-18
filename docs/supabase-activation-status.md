# PostgreSQL activation status — 2026-09-18

## Approved additive reconciliation completed

The user-approved additive reconciliation has committed successfully. The sections
below this update describe the earlier inspection and broader, unapplied plan.
They are historical context, not instructions to run the original activation script.

- Refreshed inventory matched the earlier ten-table schema and all 61 row counts.
- Both normalized duplicate checks returned zero conflicting groups.
- Renamed the ten approved existing indexes; added users_email_lower_unique and
  categories_name_lower_unique.
- Created empty public.auth_identities with UUID primary key, unique integer
  user_id, FK to public.users(id) with ON DELETE CASCADE, and RLS enabled.
- No FK to auth.users was added. Auth trigger metadata was also verified unchanged.
- Applied only these statements in one transaction, locking existing marketplace
  tables against concurrent writes and comparing full-row SHA-256 fingerprints
  (including IDs and server-serialized timestamp precision) before commit.
- A separate read-only transaction verified the committed result: all 61 existing
  rows unchanged, auth_identities empty, 30 valid indexes and 32 valid constraints.
- Existing enums, columns, defaults, foreign keys, RLS policies and migration
  journal state remain unchanged. No incompatible migration was marked applied.
- No DROP, TRUNCATE, DELETE, data import, row updates, Auth user creation/linking,
  or legacy database access was performed.
- `npx tsc --noEmit`, `npm run build`, and targeted ESLint passed. Build emitted
  a non-blocking warning about an unrelated package-lock.json outside the repository.

Dedicated runner: scripts/reconcile-supabase-additive.mjs. Evidence (metadata,
counts and fingerprints only; no row contents or credentials):
work/supabase-additive-preflight.json, work/supabase-additive-committed.json,
work/supabase-additive-verification.json. The runner refuses another apply once
the schema no longer matches its preflight baseline; do not blindly rerun it.

Remaining intentional differences: existing five enums/shared types, timestamps
without timezone and current defaults, orders FK NO ACTION, constraint-backed
uniqueness, and absent auth.users mapping FK. Drizzle's fresh-install schema and
migration are not an exact representation of this adopted live schema. Baseline
alignment, Auth linking and marketplace data migration were not authorized in
this additive operation and have not been started.

## Historical pre-reconciliation status

Activation is pending schema reconciliation. No live migration SQL, data import, Auth user creation or
linking has been performed by this activation run. No legacy database was accessed.

- Reviewed the activation script and confirmed the initial migration hash matches
  the approved Phase 2 SQL.
- Database/Auth project identifiers match; the Auth endpoint accepts the configured
  publishable key in a read-only settings request.
- Resolved the database TLS trust error using Supabase's public production CA;
  certificate and hostname verification remain enabled in both runtime and script.
- The earlier password-placeholder issue is resolved. A new read-only transaction
  successfully inspected the live database after the user updated credentials.
- The configured project already contains ten marketplace tables and 61 rows.
  Its schema differs from the reviewed Phase 2 migration. The activation script
  stopped without executing DDL or writing a migration journal entry.
- No Drizzle journal exists. All ten tables have RLS enabled; no marketplace RLS
  policies exist. Five differently named enum types already exist. The
  `auth_identities` table is missing.
- Full schema definitions and aggregate counts (no row contents/credentials) are
  in `work/supabase-schema-inspection.json`. See the reconciliation report below.
- Local validation passed after the TLS changes: `npx tsc --noEmit`,
  `npm run build`, targeted ESLint and `git diff --check`.

After confirming the intended target and approving a reconciliation approach,
run the read-only state inspection again:

```sh
node scripts/activate-supabase-postgres.mjs --check
```

Only if that inspection confirms the reviewed migration is missing and no
conflicting objects exist, continue the authorized schema activation:

```sh
node scripts/activate-supabase-postgres.mjs --apply
```

The script uses one transaction with transaction-local locking, settings and
catalog verification, compatible with the transaction pooler (`prepare: false`).
DDL and the Drizzle journal entry commit together. It does not reapply a matching
recorded migration or automatically repair conflicting/partial schemas. Checks
use read-only transactions; `--apply` never imports marketplace data or Auth users.

## Existing populated schema: reconciliation required

| Table | Existing rows |
| --- | ---: |
| users | 4 |
| shops | 2 |
| products | 5 |
| categories | 6 |
| cart_items | 1 |
| orders | 13 |
| order_items | 14 |
| order_shops | 11 |
| shop_requests | 3 |
| sessions | 2 |

These rows were present before this activation attempt; this agent did not create
or import them. The read-only inspection found 29 primary/unique/foreign-key
constraints and 26 indexes on these tables.

Missing additions: `auth_identities` (UUID primary key, unique local user ID, two
foreign keys, RLS) and lower-case unique indexes for users.email/categories.name.
Adding the indexes requires checking normalized duplicates without exposing row
contents. No Auth users should be created or linked as part of these additions.

Existing FK indexes largely cover the required columns but have different names;
do not blindly create duplicates. Existing cart/order-shop uniqueness is expressed
as table constraints rather than standalone unique indexes, which is functionally
equivalent. `orders.user_id` currently uses ON DELETE NO ACTION rather than the
reviewed RESTRICT action; deferrability and desired behavior require review.

Existing enum types:

- `user_role_enum` instead of `user_role`
- `user_status_enum` instead of `user_status`
- `active_status_enum` shared by shops/products instead of separate enum types
- `shop_request_status_enum` instead of `shop_request_status`
- `order_status_enum` shared by orders/order_shops instead of separate enum types

Labels match the reviewed role/status values. A reconciliation can either adopt
the existing type names in Drizzle or explicitly convert the columns to the
reviewed types after approval. Neither approach has been executed.

Existing timestamps are `timestamp without time zone`, versus the reviewed
`timestamp(3) with time zone`. Do not guess whether these values represent UTC or
Asia/Bangkok. Confirm their source timezone and precision requirements before
proposing any conversion. `sessions.expires_at` also has an unexpected
CURRENT_TIMESTAMP default; the reviewed schema has no default.

Do not mark the original migration as applied merely because tables exist.
Choose a reviewed baseline/reconciliation strategy that accurately records the
live schema and its subsequent changes. The fresh-database migration remains
unchanged and must not be rerun against this populated project.

The script's reference comparison excludes PostgreSQL 18 catalog NOT NULL
constraint entries because earlier server versions represent those only in
column metadata. Column nullability is still verified explicitly.

## Confirmed reconciliation plan — not applied

The user confirmed that this populated Supabase project is the intended target
and requested preservation of every existing row and a reconciliation plan.

Recommended approach: adopt the existing compatible schema rather than rewrite
populated tables to match a fresh-install migration.

1. **Read-only preflight.** Refresh the schema inventory immediately before any
   approved change. Check foreign-key actions/deferrability, identity sequence
   configuration and sequence positions, normalized-email/category duplicate
   counts, and existing index definitions. Confirm the meaning/timezone of current
   timestamp values. Capture an approved backup before production DDL.
2. **Prepare a local Drizzle baseline.** Match the existing five enum types,
   shared enum usage, timestamp-without-time-zone columns, current defaults,
   constraint-backed uniqueness, FK actions and existing index names. Keep
   numeric IDs and numeric(10,2) money unchanged. Do not change stored timestamps
   or their application decoding without an explicit timezone decision.
3. **Prepare a separate additive migration.** Create only `auth_identities` with
   its UUID primary key, unique integer `user_id`, foreign keys to `auth.users`
   and public `users`, and RLS. It starts empty and creates/links no Auth users.
   Propose the two lower-case unique indexes only if the duplicate preflight
   passes and case-insensitive uniqueness is approved. Reuse existing FK indexes;
   do not create a second equivalent set merely to match naming conventions.
4. **Test locally.** Reconstruct the observed schema in an isolated PostgreSQL
   test engine, apply the additive draft there, and validate Drizzle queries,
   auth mapping, checkout rollback, stock return, permissions and build output.
   The production rows are not needed for these tests.
5. **Review before live changes.** Present the exact baseline, additive SQL,
   verification results and rollback approach. Use a new reconciled migration
   history; preserve the original fresh-install migration as an unapplied
   artifact. Register an adopted baseline only after exact schema verification,
   explicitly recording that existing objects were adopted rather than created.
   Never mark the incompatible original migration as applied.
6. **After approval only.** Apply the additive DDL transactionally, record the
   agreed migration history, verify definitions and compare row counts under an
   appropriate write freeze. Stop before account linking, data import, Storage
   migration or Phase 3.

No existing tables, enum types, columns, indexes or constraints will be dropped
or rewritten by the proposed additive activation. Any discovered sequence repair,
duplicate cleanup, timezone conversion or behavior change is a separate reviewed
decision, not an automatic part of this plan.

Latest local verification after successful connection and schema inspection:
TypeScript, production build, and activation-script ESLint all passed. Live
activation remains incomplete pending review of the reconciliation work.
