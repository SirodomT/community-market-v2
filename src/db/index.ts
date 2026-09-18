import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getRuntimeDatabaseUrl } from "./connection";
import { certificate } from "../../certs/supabase-ca.json";

function createDatabase() {
  const client = postgres(getRuntimeDatabaseUrl(), {
    prepare: false,
    ssl: { ca: certificate, rejectUnauthorized: true },
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client);
}

type Database = ReturnType<typeof createDatabase>;
let database: Database | undefined;

// Lazy initialization permits compilation without credentials or a live database.
// The first runtime query fails clearly if DATABASE_URL is absent/incorrect.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    database ??= createDatabase();
    const value = Reflect.get(database, property);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
