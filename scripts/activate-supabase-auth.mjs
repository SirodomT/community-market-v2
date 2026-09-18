import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const expected = `CREATE TABLE IF NOT EXISTS auth_identities (
  supabase_user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  CONSTRAINT auth_identities_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`;
const normalize = (value) => value.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
const sql = await readFile(new URL("./supabase-auth-phase1.sql", import.meta.url), "utf8");
if (normalize(sql) !== normalize(expected)) {
  throw new Error("Migration differs from the reviewed auth-only SQL; refusing execution.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");

let connection;
try {
  connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectTimeout: 15000,
    multipleStatements: false,
  });

  const [tables] = await connection.execute(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auth_identities'",
  );
  if (tables.length === 0) {
    await connection.query(sql);
    console.log("Created auth_identities using the reviewed migration.");
  } else {
    console.log("auth_identities already exists; no SQL mutation performed.");
  }

  const [columns] = await connection.execute(
    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auth_identities' ORDER BY ORDINAL_POSITION",
  );
  const [keys] = await connection.execute(
    "SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auth_identities'",
  );
  const [foreignKeys] = await connection.execute(
    "SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA AND k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND k.TABLE_NAME = r.TABLE_NAME WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = 'auth_identities'",
  );
  const uniqueSingleColumn = (column, primary = false) => keys.some((key) =>
    key.COLUMN_NAME === column && Number(key.NON_UNIQUE) === 0 &&
    (!primary || key.INDEX_NAME === "PRIMARY") &&
    keys.filter((other) => other.INDEX_NAME === key.INDEX_NAME).length === 1,
  );
  const valid = columns.length === 2 &&
    columns[0].COLUMN_NAME === "supabase_user_id" && columns[0].DATA_TYPE === "varchar" &&
    Number(columns[0].CHARACTER_MAXIMUM_LENGTH) === 36 && columns[0].IS_NULLABLE === "NO" &&
    columns[1].COLUMN_NAME === "user_id" && columns[1].DATA_TYPE === "int" && columns[1].IS_NULLABLE === "NO" &&
    uniqueSingleColumn("supabase_user_id", true) && uniqueSingleColumn("user_id") &&
    foreignKeys.length === 1 && foreignKeys[0].CONSTRAINT_NAME === "auth_identities_user_fk" &&
    foreignKeys[0].COLUMN_NAME === "user_id" && foreignKeys[0].REFERENCED_TABLE_NAME === "users" &&
    foreignKeys[0].REFERENCED_COLUMN_NAME === "id" && foreignKeys[0].DELETE_RULE === "CASCADE";
  if (!valid) throw new Error("Auth mapping schema does not match the reviewed constraints; no automatic repair attempted.");
  console.log("Verified both columns, primary key, unique user ID, and users(id) foreign key with ON DELETE CASCADE.");
  console.log("No users were created or linked; no marketplace data was changed.");
} catch (error) {
  // Do not print connection credentials or provider diagnostics containing them.
  console.error(error.code ? `Auth migration failed: ${error.code}` : error.message);
  process.exitCode = 1;
} finally {
  await connection?.end();
}
