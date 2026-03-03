import { config } from "dotenv-flow";
import type { Config } from "drizzle-kit";

// Load .env files following Next.js convention (.env, .env.local, .env.development, etc.)
config();

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/workflow",
  },
} satisfies Config;
