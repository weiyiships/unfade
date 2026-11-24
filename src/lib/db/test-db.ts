import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll } from "vitest";
import * as schema from "./schema";

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

/** In-memory Postgres (PGlite) with every committed migration applied. */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, client, close: () => client.close() };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];

/**
 * Gives a test file its own migrated PGlite database for all its tests.
 * Call at the top level of the file; use the returned function inside tests.
 */
export function setupTestDb(): () => TestDb {
  let current: Awaited<ReturnType<typeof createTestDb>> | undefined;
  beforeAll(async () => {
    current = await createTestDb();
  });
  afterAll(() => current?.close());
  return () => {
    if (!current) throw new Error("Test database is not ready");
    return current.db;
  };
}
