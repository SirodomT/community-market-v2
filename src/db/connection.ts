export function getRuntimeDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required: use the Supabase Shared Pooler transaction URI (port 6543).");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("DATABASE_URL must be a valid PostgreSQL connection URI."); }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use PostgreSQL. MySQL/TiDB connections are retired.");
  }
  if (!url.hostname.endsWith(".pooler.supabase.com") || url.port !== "6543") {
    throw new Error("Runtime DATABASE_URL must use the Supabase Shared Pooler in transaction mode (port 6543).");
  }
  return value;
}
