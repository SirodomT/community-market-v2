import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});