/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

// Execute actual application modules with provider/DB boundaries mocked.
function load(file, mocks) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    URL,
    require(name) {
      if (name === "server-only") return {};
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
      return mocks[name];
    },
  }, { filename: file });
  return exports;
}

const schema = { users: { id: "id", email: "email" } };
const identity = { authIdentities: { supabaseUserId: "subject", userId: "userId" } };
const orm = { eq: (a, b) => [a, b], sql: (parts, ...values) => ({ parts, values }) };
function query(rows, onWhere = () => {}) {
  const chain = {
    from: () => chain, innerJoin: () => chain,
    where(value) { onWhere(value); return chain; },
    limit: async () => rows,
  };
  return chain;
}

test("invalid claims cannot reach local identity lookup, even with legacy cookies", async () => {
  const session = load("src/lib/session.ts", {
    "next/headers": { cookies: async () => ({ get() { throw new Error("Legacy cookie must not be read"); } }) },
    "drizzle-orm": orm, "@/db/schema": schema, "@/db/auth-schema": identity,
    "@/db": { db: { select() { throw new Error("DB must not be read"); } } },
    "@/lib/supabase/config": { isSupabaseConfigured: () => true },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      getClaims: async () => ({ error: new Error("bad signature"), data: null }),
    } }) },
  });
  assert.equal(await session.getCurrentUser(), null);
});

test("verified subject maps to the local role, ignoring metadata role and ID", async () => {
  const localUser = { id: 7, role: "USER", status: "ACTIVE" };
  let filter;
  const session = load("src/lib/session.ts", {
    "next/headers": { cookies: async () => ({}) }, "drizzle-orm": orm, "@/db/schema": schema, "@/db/auth-schema": identity,
    "@/db": { db: { select: () => query([localUser], (value) => { filter = value; }) } },
    "@/lib/supabase/config": { isSupabaseConfigured: () => true },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      getClaims: async () => ({ data: { claims: { sub: "verified-uuid", user_metadata: { role: "ADMIN", id: 1 } } } }),
    } }) },
  });
  assert.equal(await session.getCurrentUser(), localUser);
  assert.equal(filter[1], "verified-uuid");
});

function profileModule({ confirmed = true, existing = false } = {}) {
  const writes = [];
  const tx = {
    select: () => query(existing ? [{ id: 1 }] : []),
    insert(table) {
      return { values(value) {
        writes.push({ table, value });
        return { returning: async () => [{ id: 42 }] };
      } };
    },
  };
  const profile = load("src/lib/supabase/profile.ts", {
    "drizzle-orm": orm, "@/db/schema": schema, "@/db/auth-schema": identity,
    "@/db": { db: { select: () => query([]), transaction: async (fn) => fn(tx) } },
    "./server": { createClient: async () => ({ auth: {
      getClaims: async () => ({ data: { claims: { sub: "verified-uuid" } } }),
      getUser: async () => ({ data: { user: {
        id: "verified-uuid", email: "test@example.com", email_confirmed_at: confirmed ? "now" : null,
        user_metadata: { username: "Member", role: "ADMIN", userId: 1 },
      } } }),
    } }) },
  });
  return { profile, writes };
}

test("email collision never links or modifies a legacy account", async () => {
  const { profile, writes } = profileModule({ existing: true });
  assert.equal(await profile.ensureAuthProfile(), "unlinked");
  assert.equal(writes.length, 0);
});

test("unconfirmed identity cannot provision a local profile", async () => {
  const { profile, writes } = profileModule({ confirmed: false });
  assert.equal(await profile.ensureAuthProfile(), "invalid");
  assert.equal(writes.length, 0);
});

test("new confirmed identity gets USER role and a numeric-ID mapping", async () => {
  const { profile, writes } = profileModule();
  assert.equal(await profile.ensureAuthProfile(), "ready");
  assert.equal(writes[0].value.role, "USER");
  assert.equal(writes[0].value.passwordHash, "SUPABASE_AUTH_ONLY");
  assert.equal(writes[1].value.userId, 42);
  assert.equal(writes[1].value.supabaseUserId, "verified-uuid");
});

test("proxy propagates refreshed cookies to request and response with no-store", async () => {
  const request = new NextRequest("https://example.com/account");
  let verified = false;
  const proxy = load("src/lib/supabase/proxy.ts", {
    "next/server": { NextResponse },
    "./config": { isSupabaseConfigured: () => true, getSupabaseConfig: () => ({ url: "https://example.supabase.co", key: "test" }) },
    "@supabase/ssr": { createServerClient: (_url, _key, { cookies }) => ({ auth: {
      async getClaims() {
        verified = true;
        cookies.setAll([{ name: "sb-token", value: "refreshed", options: { path: "/", httpOnly: true } }], { "Cache-Control": "private, no-store" });
        cookies.setAll([{ name: "sb-other", value: "second", options: { path: "/" } }], {});
        return { data: { claims: { sub: "verified-uuid" } } };
      },
    } }) },
  });
  const response = await proxy.updateSession(request);
  assert.equal(verified, true);
  assert.equal(request.cookies.get("sb-token").value, "refreshed");
  assert.equal(response.cookies.get("sb-token").value, "refreshed");
  assert.equal(response.cookies.get("sb-other").value, "second");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
});

test("invalid confirmation ignores external redirect destinations", async () => {
  const route = load("src/app/auth/confirm/route.ts", {
    "next/server": { NextResponse },
    "@/lib/supabase/server": { createClient: async () => { throw new Error("Unsupported type"); } },
    "@/lib/supabase/profile": {},
    "@/lib/supabase/config": { isSupabaseConfigured: () => true },
  });
  const response = await route.GET(new NextRequest("https://example.com/auth/confirm?type=recovery&token_hash=bad&next=https://evil.example"));
  assert.equal(response.headers.get("location"), "https://example.com/login?error=confirmation");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("logout signs out of Supabase and removes the legacy cookie", async () => {
  let signedOut = false;
  let deleted;
  const session = load("src/lib/session.ts", {
    "next/headers": { cookies: async () => ({ delete: (name) => { deleted = name; } }) },
    "drizzle-orm": orm, "@/db/schema": schema, "@/db/auth-schema": identity, "@/db": {},
    "@/lib/supabase/config": { isSupabaseConfigured: () => true },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      signOut: async () => { signedOut = true; return { error: null }; },
    } }) },
  });
  await session.deleteSession();
  assert.equal(signedOut, true);
  assert.equal(deleted, "session_token");
});

test("existing authorization guard rejects suspended and insufficient-role users", async () => {
  let user = { id: 1, status: "SUSPENDED", role: "ADMIN" };
  const auth = load("src/lib/auth.ts", {
    "next/navigation": { redirect: (path) => { throw new Error(path); } },
    "@/lib/session": { getCurrentUser: async () => user },
  });
  await assert.rejects(auth.requireUser(), /error=suspended/);
  user = { id: 1, status: "ACTIVE", role: "USER" };
  await assert.rejects(auth.requireRole(["ADMIN"]), /unauthorized/);
  user = null;
  await assert.rejects(auth.requireUser(), /\/login/);
});

test("login uses Supabase credentials and rejects an unlinked legacy account", async () => {
  let signedOut = false;
  let credentials;
  const actions = load("src/app/login/actions.ts", {
    "next/navigation": { redirect: (path) => { throw new Error(path); } },
    "@/lib/supabase/config": { isSupabaseConfigured: () => true },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      signInWithPassword: async (value) => { credentials = value; return { error: null }; },
      signOut: async () => { signedOut = true; return { error: null }; },
    } }) },
    "@/lib/supabase/profile": { ensureAuthProfile: async () => "unlinked" },
    "@/lib/session": { getCurrentUser: async () => { throw new Error("Must not grant account access"); } },
  });
  const form = new FormData();
  form.set("email", " MEMBER@example.com ");
  form.set("password", "password-with-spaces ");
  await assert.rejects(actions.loginUser(form), /error=unlinked/);
  assert.equal(credentials.email, "member@example.com");
  assert.equal(credentials.password, "password-with-spaces ");
  assert.equal(signedOut, true);
});
