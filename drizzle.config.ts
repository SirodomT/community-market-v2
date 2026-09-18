import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

// Generation is offline. A future approved migration should use a direct or
// session-mode connection, supplied separately from the transaction pooler.
const databaseUrl = process.env.DATABASE_MIGRATION_URL;
if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  throw new Error("DATABASE_MIGRATION_URL must be PostgreSQL; MySQL/TiDB is retired.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle-postgres",
  strict: true,
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
