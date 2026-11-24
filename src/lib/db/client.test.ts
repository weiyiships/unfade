import { describe, expect, it } from "vitest";
import { createDb, parseDbEnv } from "./client";

const NEON_URL =
  "postgresql://unfade:secret@ep-quiet-sun-123456.us-east-2.aws.neon.tech/unfade?sslmode=require";

describe("parseDbEnv", () => {
  it("returns the Postgres connection string", () => {
    expect(parseDbEnv({ DATABASE_URL: NEON_URL })).toEqual({
      databaseUrl: NEON_URL,
    });
  });

  it("accepts the postgres:// scheme", () => {
    const url = "postgres://localhost:5432/unfade";
    expect(parseDbEnv({ DATABASE_URL: url }).databaseUrl).toBe(url);
  });

  it.each([undefined, ""])(
    "explains how to fix a missing DATABASE_URL (%j)",
    (value) => {
      expect(() => parseDbEnv({ DATABASE_URL: value })).toThrow(
        "DATABASE_URL is not set. Run `vercel env pull` or copy .env.example to .env.local.",
      );
    },
  );

  it("rejects a connection string that is not Postgres", () => {
    expect(() =>
      parseDbEnv({ DATABASE_URL: "mysql://localhost:3306/unfade" }),
    ).toThrow("DATABASE_URL must be a postgres:// or postgresql:// URL.");
  });

  it("does not leak the connection string in errors", () => {
    expect(() =>
      parseDbEnv({ DATABASE_URL: "mysql://user:hunter2@host/db" }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("hunter2"),
      }),
    );
  });
});

describe("createDb", () => {
  it("builds a Drizzle client with the schema without connecting", () => {
    const db = createDb(NEON_URL);

    expect(typeof db.select).toBe("function");
    expect(db.query.users).toBeDefined();
    expect(db.query.photos).toBeDefined();
    expect(db.query.restorations).toBeDefined();
  });
});
