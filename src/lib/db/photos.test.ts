import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PG, pgErrorCode } from "./pg-error";
import { photos, users } from "./schema";
import { createTestDb, type TestDb } from "./test-db";

let db: TestDb;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
afterAll(() => close?.());

const newPhoto = (overrides: Partial<typeof photos.$inferInsert> = {}) => ({
  originalUrl: "https://blob.example/originals/grandma.jpg",
  fileName: "grandma.jpg",
  width: 1200,
  height: 800,
  ...overrides,
});

async function createUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({ name: "Ada", email, passwordHash: "hash" })
    .returning();
  return user;
}

describe("photos table", () => {
  it("stores a visitor photo without a user", async () => {
    const [photo] = await db.insert(photos).values(newPhoto()).returning();

    expect(photo.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(photo.userId).toBeNull();
    expect(photo.createdAt).toBeInstanceOf(Date);
    expect(photo).toMatchObject(newPhoto());
  });

  it("links a photo to its owner", async () => {
    const user = await createUser("owner@example.com");
    const [photo] = await db
      .insert(photos)
      .values(newPhoto({ userId: user.id }))
      .returning();

    expect(photo.userId).toBe(user.id);
  });

  it("rejects a photo for a user that does not exist", async () => {
    expect(
      await pgErrorCode(
        db
          .insert(photos)
          .values(newPhoto({ userId: "00000000-0000-4000-8000-000000000000" })),
      ),
    ).toBe(PG.foreignKeyViolation);
  });

  it.each([
    { width: 0, height: 800 },
    { width: 1200, height: 0 },
    { width: -1, height: 800 },
  ])("rejects non-positive dimensions %o", async (dimensions) => {
    expect(
      await pgErrorCode(db.insert(photos).values(newPhoto(dimensions))),
    ).toBe(PG.checkViolation);
  });

  it("deletes a user's photos when the user is deleted", async () => {
    const user = await createUser("leaving@example.com");
    await db.insert(photos).values(newPhoto({ userId: user.id }));

    await db.delete(users).where(eq(users.id, user.id));

    expect(
      await db.select().from(photos).where(eq(photos.userId, user.id)),
    ).toEqual([]);
  });
});
