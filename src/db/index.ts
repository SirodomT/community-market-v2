import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined"
  );
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,

  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },

  connectionLimit: 1,
});

export const db = drizzle({
  client: pool,
});