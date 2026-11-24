import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";
import * as schema from "./schema";

const MISSING =
  "DATABASE_URL is not set. Run `vercel env pull` or copy .env.example to .env.local.";
const NOT_POSTGRES = "DATABASE_URL must be a postgres:// or postgresql:// URL.";

const dbEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: MISSING })
    .min(1, { error: MISSING })
    .regex(/^postgres(ql)?:\/\//, { error: NOT_POSTGRES }),
});

export function parseDbEnv(env: Record<string, string | undefined>) {
  const parsed = dbEnvSchema.safeParse(env);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  return { databaseUrl: parsed.data.DATABASE_URL };
}

export function createDb(databaseUrl: string) {
  return drizzle({ client: neon(databaseUrl), schema });
}

export type Db = ReturnType<typeof createDb>;

let cached: Db | undefined;

/** The app's database. The only way code outside src/lib/db reaches Postgres. */
export function getDb(): Db {
  cached ??= createDb(parseDbEnv(process.env).databaseUrl);
  return cached;
}
