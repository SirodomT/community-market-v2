# Phase 1: Supabase authentication

> Historical Phase 1 record. Phase 2 retires MySQL/TiDB entirely. Do not restore
> its DATABASE_URL or run the MySQL activation script. Current setup and pending
> PostgreSQL migration approval are documented in [supabase-phase2.md](supabase-phase2.md).

The app uses Supabase Auth with cookie-based SSR, separate browser/server clients,
and Next.js 16 `src/proxy.ts` session refresh. Server identity checks await
`supabase.auth.getClaims()`. No service-role key is required in the app.

## Setup before enabling authentication

1. Keep `DATABASE_URL` in `.env.local`. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's Connect dialog.
   Restart Next.js after changing environment variables.
2. Apply `scripts/supabase-auth-phase1.sql` to the existing MySQL/TiDB database.
   This creates only `auth_identities`; it does not migrate marketplace tables.
   Applied and its constraints verified on 2026-09-17 against the database configured
   in this workspace. Other environments still need this migration. Do not run a
   broad schema push. The guarded runner is `node scripts/activate-supabase-auth.mjs`;
   it only executes the exact reviewed SQL and checks an existing table without altering it.
3. Enable email/password authentication in Supabase. Set minimum password length
   to at least 8 and enable email confirmation. Configure the Auth Site URL as
   the application's origin (localhost during local testing; HTTPS in production).
4. In Auth > Email Templates > Confirm signup, use this link:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a>
   ```

   The route accepts only the signup email flow and always redirects within this
   application. It does not accept a user-provided destination.

## Identity and compatibility

Supabase owns credentials and session cookies. Legacy `session_token` cookies
are no longer accepted, and logout also deletes that cookie. Existing password
hashes and session rows are retained but are not used for authentication.

`auth_identities` maps a Supabase UUID to an existing numeric `users.id` so that
all marketplace foreign keys and business logic remain intact. Roles and account
status are read from the existing users table on each authorization check.
User-editable Supabase metadata never supplies roles, status, or local IDs.

On the first confirmed login, a new email receives a local USER/ACTIVE profile
and identity mapping in one database transaction. The required legacy password
column stores a non-password marker (`SUPABASE_AUTH_ONLY`), never the supplied
password. No profile is created during an unconfirmed signup or page render.

An email collision with an existing local account returns an account-linking
message. It never links automatically. Before existing users can log in, a trusted
operator must create/import their Supabase Auth accounts, arrange their password
setup, independently verify ownership, and insert the one-to-one mapping:

```sql
INSERT INTO auth_identities (supabase_user_id, user_id)
VALUES ('verified-supabase-auth-user-uuid', 123);
```

Verify both identifiers and the Supabase project before executing this statement.
In particular, do not grant an existing seller/admin identity merely because
an untrusted signup supplied the same email. Existing users/passwords are not
automatically imported by Phase 1.

Suspension still blocks protected requests using the existing database status.
The unchanged admin code deletes legacy sessions, which does not revoke Supabase
tokens. A suspended user remains blocked, but reactivation may let an unexpired
Supabase session work again. Global Supabase session administration is deferred.

Without Supabase configuration, public pages work and protected routes treat the
visitor as signed out. Login/signup show a configuration error. Once configured,
database or provider failures are surfaced rather than falling back to legacy auth.

## Verification

Run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
`node --test tests/auth-phase1.test.cjs`.

With a configured test project and applied auth table, verify:

- New signup prompts for email confirmation; confirmation creates one profile.
- Invalid/expired confirmation links fail without an external redirect.
- Invalid passwords and unconfirmed accounts fail; confirmed login reaches account.
- Reload and expired access-token refresh preserve login and refreshed cookies.
- Logout blocks a subsequent protected request; legacy/forged cookies cannot log in.
- Existing unlinked email cannot inherit a legacy account; a trusted link retains its ID.
- Suspended users and unauthorized roles remain blocked by existing guards.
- Concurrent first logins do not create duplicate profiles.

Live tests require Supabase credentials, email delivery and the auth table. No
marketplace data migration, deployment, or live account import is part of this change.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
and [password authentication](https://supabase.com/docs/guides/auth/passwords).
