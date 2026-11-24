import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { PG, pgErrorCode } from "./pg-error";
import { users } from "./schema";
import { setupTestDb } from "./test-db";

const testDb = setupTestDb();

const newUser = (email: string) => ({
  name: "Ada",
  email,
  passwordHash: "$2b$12$hash",
});

describe("users table", () => {
  it("stores a user with a generated id and created_at", async () => {
    const [user] = await testDb()
      .insert(users)
      .values(newUser("ada@example.com"))
      .returning();

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user).toMatchObject({
      name: "Ada",
      email: "ada@example.com",
      passwordHash: "$2b$12$hash",
    });
  });

  it("rejects a duplicate email", async () => {
    await testDb().insert(users).values(newUser("dup@example.com"));

    expect(
      await pgErrorCode(
        testDb().insert(users).values(newUser("dup@example.com")),
      ),
    ).toBe(PG.uniqueViolation);
  });

  it("treats emails that differ only in case as duplicates", async () => {
    await testDb().insert(users).values(newUser("Grace@Example.com"));

    expect(
      await pgErrorCode(
        testDb().insert(users).values(newUser("grace@example.COM")),
      ),
    ).toBe(PG.uniqueViolation);
  });

  it.each(["name", "email", "password_hash"])("requires %s", async (column) => {
    const values: Record<string, string> = {
      name: "'Ada'",
      email: "'required@example.com'",
      password_hash: "'hash'",
    };
    delete values[column];

    expect(
      await pgErrorCode(
        testDb().execute(
          sql.raw(
            `insert into users (${Object.keys(values).join(", ")}) values (${Object.values(values).join(", ")})`,
          ),
        ),
      ),
    ).toBe(PG.notNullViolation);
  });
});
