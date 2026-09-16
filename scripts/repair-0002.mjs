import { config } from "dotenv";
import mysql from "mysql2/promise";

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

config({
  path: ".env.local",
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const connection = await mysql.createConnection(
  process.env.DATABASE_URL
);

const db = drizzle({
  client: connection,
});

try {
  console.log("Running Drizzle migrations...");

  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  console.log("Migration finished successfully.");
} catch (error) {
  console.error("Migration failed:");
  console.error(error);

  process.exitCode = 1;
} finally {
  await connection.end();
}