-- Apply to the EXISTING MySQL/TiDB database, not Supabase Postgres.
-- Additive auth-only migration; no existing rows are changed.
CREATE TABLE IF NOT EXISTS auth_identities (
  supabase_user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  CONSTRAINT auth_identities_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
