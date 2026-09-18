import { readFile, writeFile, mkdir } from "node:fs/promises";
import { config } from "dotenv";
import postgres from "postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { PGlite } from "@electric-sql/pglite";

class ActivationError extends Error {}

// One reviewed schema migration only. This is not a general data migration tool.
const reviewedHash = "ad6453480331b310cd108514b4fb5246ba57798c71b9d49fd944ada3ba0c824e";
const apply = process.argv.includes("--apply");
if (process.argv.slice(2).some((arg) => !["--check", "--apply"].includes(arg))) {
  throw new ActivationError("Use --check (read-only, default) or --apply.");
}
config({ path: ".env.local", quiet: true });

const snapshot = JSON.parse(await readFile("drizzle-postgres/meta/0000_snapshot.json", "utf8"));
const tableNames = Object.values(snapshot.tables).map((table) => table.name).sort();
const enumNames = Object.values(snapshot.enums).map((type) => type.name).sort();
const migrations = readMigrationFiles({ migrationsFolder: "drizzle-postgres" });
if (migrations.length !== 1 || migrations[0].hash !== reviewedHash) {
  throw new ActivationError("Migration differs from the reviewed Phase 2 SQL; refusing execution.");
}
const migration = migrations[0];
const { certificate } = JSON.parse(await readFile("certs/supabase-ca.json", "utf8"));

// Catalog-only comparisons: no marketplace or Auth row contents are retrieved.
async function catalog(query) {
  const tables = await query(`SELECT c.relname AS name, c.relrowsecurity AS rls
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY($1) ORDER BY 1`, [tableNames]);
  const columns = await query(`SELECT c.relname AS table_name, a.attname AS name,
    format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS not_null,
    a.attidentity AS identity, pg_get_expr(d.adbin,d.adrelid) AS default_value
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    WHERE n.nspname='public' AND c.relname=ANY($1) AND a.attnum>0 AND NOT a.attisdropped
    ORDER BY c.relname,a.attnum`, [tableNames]);
  const constraints = await query(`SELECT c.relname AS table_name, k.conname AS name,
    k.contype AS type, k.convalidated AS valid, pg_get_constraintdef(k.oid) AS definition
    FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=ANY($1) AND k.contype <> 'n' ORDER BY 1,2`, [tableNames]);
  const indexes = await query(`SELECT c.relname AS table_name, i.relname AS name,
    x.indisvalid AS valid, pg_get_indexdef(i.oid) AS definition
    FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=ANY($1) ORDER BY 1,2`, [tableNames]);
  const enums = await query(`SELECT t.typname AS name, e.enumlabel AS label
    FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE n.nspname='public' AND t.typname=ANY($1) ORDER BY t.typname,e.enumsortorder`, [enumNames]);
  const policies = await query(`SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename=ANY($1) ORDER BY 1,2`, [tableNames]);
  return { tables, columns, constraints, indexes, enums, policies };
}

let client;
let reference;
try {
  const databaseUrl = process.env.DATABASE_URL;
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!databaseUrl || !authUrl || !key) throw new ActivationError("The three required Supabase environment values must be present.");
  let database;
  let auth;
  try { database = new URL(databaseUrl); auth = new URL(authUrl); }
  catch { throw new ActivationError("Invalid database or Supabase URL; credentials were not printed."); }
  if (!["postgres:", "postgresql:"].includes(database.protocol) ||
      !database.hostname.endsWith(".pooler.supabase.com") || database.port !== "6543") {
    throw new ActivationError("DATABASE_URL must be the Supabase transaction pooler URI on port 6543.");
  }
  if (auth.protocol !== "https:" || !auth.hostname.endsWith(".supabase.co") ||
      !decodeURIComponent(database.username).endsWith(`.${auth.hostname.split(".")[0]}`)) {
    throw new ActivationError("Database and Auth URLs must identify the same Supabase project.");
  }
  if (!key.startsWith("sb_publishable_")) throw new ActivationError("Expected a Supabase publishable key.");
  const password = decodeURIComponent(database.password);
  if (!password || /\[YOUR[-_ ]|YOUR_PASSWORD|YOUR_DATABASE_PASSWORD|ENCODED_DATABASE_PASSWORD/i.test(password)) {
    throw new ActivationError("DATABASE_URL still contains a missing/placeholder database password; update .env.local before activation.");
  }
  console.log("Required configuration present; database and Auth project identifiers match. Credentials hidden.");

  const authResponse = await fetch(new URL("/auth/v1/settings", auth), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (!authResponse.ok) throw new ActivationError(`Supabase Auth settings check failed (HTTP ${authResponse.status}).`);
  console.log("Supabase Auth endpoint accepts the configured publishable key (read-only settings check).");

  // Build a reference from the exact SQL in an isolated, in-memory PostgreSQL engine.
  reference = new PGlite();
  await reference.exec("CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); SET search_path=public;");
  for (const statement of migration.sql) await reference.exec(statement);
  const expected = await catalog(async (sql, params) => (await reference.query(sql, params)).rows);

  client = postgres(databaseUrl, {
    prepare: false, ssl: { ca: certificate, rejectUnauthorized: true }, max: 1, connect_timeout: 15, idle_timeout: 5,
    onnotice() {},
  });
  await client.begin(async (tx) => {
    if (!apply) await tx`SET TRANSACTION READ ONLY`;
    await tx`SET LOCAL search_path=public`;
    await tx`SET LOCAL lock_timeout='10s'`;
    await tx`SET LOCAL statement_timeout='30s'`;
    if (apply) await tx`SELECT pg_advisory_xact_lock(1789651539, 434)`;
    const [authTable] = await tx`SELECT to_regclass('auth.users') IS NOT NULL AS present`;
    if (!authTable.present) throw new ActivationError("Supabase auth.users is missing; refusing schema activation.");
    const [journal] = await tx`SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS present`;
    const history = journal.present
      ? await tx`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`
      : [];
    const alreadyApplied = history.length === 1 && history[0].hash === migration.hash &&
      Number(history[0].created_at) === migration.folderMillis;
    if (history.length && !alreadyApplied) throw new ActivationError("Unexpected migration history; refusing automatic changes.");
    const existing = await tx`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=ANY(${tableNames})`;
    const existingTypes = await tx`SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname='public' AND t.typname=ANY(${enumNames})`;
    const before = await catalog((sql, params) => tx.unsafe(sql, params));
    if (!apply) {
      const counts = [];
      for (const table of before.tables) {
        const [row] = await tx`SELECT count(*)::integer AS count FROM ${tx(`public.${table.name}`)}`;
        counts.push({ table: table.name, count: row.count });
      }
      const allPublicEnums = await tx`SELECT t.typname AS name, e.enumlabel AS label
        FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
        WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`;
      await mkdir("work", { recursive: true });
      await writeFile("work/supabase-schema-inspection.json", JSON.stringify({
        inspectedAt: new Date().toISOString(), history, actual: before, expected,
        counts, allPublicEnums,
      }, null, 2));
      console.log(JSON.stringify({ marketplaceRowCounts: counts }));
    }
    console.log(JSON.stringify({ currentState: {
      migrationJournalPresent: journal.present,
      migrationRecorded: alreadyApplied,
      migrationEntries: history.length,
      tables: before.tables,
      enumTypes: [...new Set(before.enums.map((entry) => entry.name))],
      constraints: before.constraints.map(({ table_name, name }) => ({ table_name, name })),
      indexes: before.indexes.map(({ table_name, name }) => ({ table_name, name })),
      policies: before.policies,
    } }));
    if (!alreadyApplied && (existing.length || existingTypes.length)) {
      throw new ActivationError("Target contains conflicting marketplace objects without matching migration history; no changes applied.");
    }
    if (!alreadyApplied && !apply) {
      console.log("Preflight passed: no conflicting marketplace tables/enums; Supabase auth.users exists. No SQL writes performed.");
      return;
    }
    if (!alreadyApplied) {
      await tx`CREATE SCHEMA IF NOT EXISTS drizzle`;
      await tx`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`;
      for (const statement of migration.sql) await tx.unsafe(statement);
      await tx`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${migration.hash}, ${migration.folderMillis})`;
    }
    const actual = await catalog((sql, params) => tx.unsafe(sql, params));
    for (const section of Object.keys(expected)) {
      if (JSON.stringify(actual[section]) !== JSON.stringify(expected[section])) {
        throw new ActivationError(`Schema verification mismatch in ${section}; transaction rolled back. No automatic repair attempted.`);
      }
    }
    const counts = [];
    for (const name of tableNames) {
      const [row] = await tx`SELECT count(*)::integer AS count FROM ${tx(`public.${name}`)}`;
      counts.push({ table: name, count: row.count });
    }
    console.log(alreadyApplied ? "Migration already recorded; verified without reapplying DDL." : "Schema and Drizzle journal verified; committing activation transaction.");
    console.log(`Verified ${actual.tables.length} RLS-enabled tables, ${actual.columns.length} columns, ${actual.constraints.length} constraints, ${actual.indexes.length} indexes, and ${enumNames.length} enum types against the reviewed SQL.`);
    console.log(JSON.stringify({ marketplaceRowCounts: counts }));
  });
  console.log(apply ? "Activation finished. No existing data imported; no Auth users created or linked." : "Read-only check finished.");
} catch (error) {
  // Never print a connection string, query parameter, key or provider error detail.
  console.error(error instanceof ActivationError ? error.message : `Activation failed (${error.code || error.cause?.code || error.name || "unknown error"}). Credentials hidden.`);
  process.exitCode = 1;
} finally {
  await client?.end({ timeout: 5 });
  await reference?.close();
}
