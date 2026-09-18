# Demo Auth linking runner

## Current status

The approved demo migration completed successfully in the preceding execution:
four confirmed demo Auth accounts and four mappings; all 61 marketplace rows were
preserved. Do not rerun the migration. Subsequent smoke testing and its unresolved
admin dashboard timeout are recorded in [demo-auth-smoke-report.md](demo-auth-smoke-report.md).
The preparation notes below are historical, not an instruction to apply again.

## Historical preparation notes

Runner: `scripts/migrate-demo-auth.mjs`. Tests: `tests/demo-auth-runner.test.mjs`.

**DEMO/TEST ONLY:** imports the four reviewed test accounts with `email_confirm:
true`, bypassing email ownership verification for login testing. This is not a
production account-verification policy. No email delivery or sign-in is performed.

The Node-only operator CLI reads `.env.local`. Supply `SUPABASE_SECRET_KEY` or
`SUPABASE_SERVICE_ROLE_KEY` (the former takes precedence). Never prefix either
with NEXT_PUBLIC_, import the runner into the application, or commit credentials.
Existing DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL must identify the same project.
Database access uses the transaction pooler, verified TLS and prepare:false.

Read-only command: `node scripts/migrate-demo-auth.mjs --dry-run` (also the default).
Future apply command, only after approval:
`node scripts/migrate-demo-auth.mjs --apply --demo-test-only`.
The apply command has NOT been executed.

Latest dry run: four allowlisted accounts, all four hashes bcrypt-compatible,
zero duplicate email groups, zero Auth users, zero mappings, zero custom triggers
on the inspected Auth/mapping tables and no deferred Auth FK. An admin credential
is present; dry run does not authenticate it or prove its administrative access.
`applyReady` means local prerequisites passed, not that provider creation was tested.
Five mock-based tests and targeted ESLint passed. No production write tests ran.

## Changes on a future approved apply

- Supabase admin.createUser creates four Auth users using existing bcrypt hashes
  in memory, exact stored emails, planned UUIDs and demo-only confirmation.
- Supabase manages auth.users, auth.identities and any enabled Auth audit records.
- public.auth_identities receives four mappings in a single transaction.
- All ten existing marketplace tables are SHARE-locked against concurrent writes
  during application; full-row fingerprints and IDs must match before commit.
- public.users, role/status values and marketplace relationships remain unchanged.
- No schema changes, foreign-key additions, migration-history writes or old-provider
  access. No Auth role escalation: the application reads its role from public.users.

Run during a brief maintenance window; disable concurrent signup/administrative
account creation and review configured Auth hooks before the approved execution.
Database trigger inspection does not enumerate dashboard-configured HTTP hooks.
Locks have a bounded acquisition timeout. Auth requests have a 15-second timeout.

## Recovery

Auth HTTP operations and mapping SQL are not atomic together. The runner records
planned UUIDs before each API call in the git-ignored local file
`work/demo-auth-recovery/manifest.json`. It contains run/project identifiers,
integer IDs, emails, planned Auth UUIDs, statuses and marketplace fingerprints;
never password hashes, passwords, credentials or tokens. Treat it as private
operational data. The exclusive manifest creation prevents automatic reruns.

- `planned`: no request started for this entry.
- `request_pending`: API call may have succeeded; inspect Auth by the recorded UUID
  and exact email. Never retry or adopt a same-email account automatically.
- `created`: returned UUID/email/confirmation passed verification.
- `mapping_commit_pending`: commit may or may not have completed; inspect mappings.
- `completed`: the database commit succeeded and completion was saved locally.

Any duplicate, existing Auth account/mapping, source drift, API error, unexpected
email normalization or mapping conflict stops execution. Prior Auth creations may
remain. Mapping inserts roll back together on pre-commit failure. A connection
failure at commit must be treated as ambiguous and inspected before recovery.

No automatic delete, ban, cleanup or resume is implemented. After a failure,
preserve the manifest and perform a read-only audit. A separately reviewed recovery
can complete mappings for verified run-owned accounts or remove only the mappings
and Auth accounts proven to belong to this run. Never remove or modify marketplace
rows. Do not delete the manifest to bypass the guard. Completed recovery must
recheck all original row fingerprints. Newly created unlinked accounts cannot
automatically claim an existing marketplace profile through the current app.
