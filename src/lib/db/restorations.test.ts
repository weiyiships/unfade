import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RESTORATION_STATUSES } from "@/lib/domain/restoration-status";
import { PG, pgErrorCode } from "./pg-error";
import { photos, restorationStatus, restorations } from "./schema";
import { createTestDb, type TestDb } from "./test-db";

let db: TestDb;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
afterAll(() => close?.());

async function createPhoto() {
  const [photo] = await db
    .insert(photos)
    .values({
      originalUrl: "https://blob.example/originals/wedding.png",
      fileName: "wedding.png",
      width: 640,
      height: 480,
    })
    .returning();
  return photo;
}

const options = {
  restore: true,
  faces: true,
  colorize: false,
  upscale: 2 as const,
};

describe("restorations table", () => {
  it("starts queued and stores the chosen options as JSON", async () => {
    const photo = await createPhoto();
    const [restoration] = await db
      .insert(restorations)
      .values({ photoId: photo.id, optionsJson: options })
      .returning();

    expect(restoration).toMatchObject({
      photoId: photo.id,
      status: "queued",
      optionsJson: options,
      resultUrl: null,
      error: null,
      completedAt: null,
    });
    expect(restoration.createdAt).toBeInstanceOf(Date);
  });

  it("uses the domain's restoration statuses for its enum", () => {
    expect(restorationStatus.enumValues).toEqual([...RESTORATION_STATUSES]);
  });

  it("rejects a status outside the enum", async () => {
    const photo = await createPhoto();

    expect(
      await pgErrorCode(
        db.execute(
          sql`insert into restorations (photo_id, options_json, status) values (${photo.id}, '{}', 'cancelled')`,
        ),
      ),
    ).toBe(PG.invalidTextRepresentation);
  });

  it("rejects a restoration for a photo that does not exist", async () => {
    expect(
      await pgErrorCode(
        db.insert(restorations).values({
          photoId: "00000000-0000-4000-8000-000000000000",
          optionsJson: options,
        }),
      ),
    ).toBe(PG.foreignKeyViolation);
  });

  it("records a finished restoration's result", async () => {
    const photo = await createPhoto();
    const completedAt = new Date("2026-11-24T12:00:00Z");
    const [restoration] = await db
      .insert(restorations)
      .values({
        photoId: photo.id,
        optionsJson: options,
        status: "succeeded",
        resultUrl: "https://blob.example/results/wedding.png",
        completedAt,
      })
      .returning();

    expect(restoration.resultUrl).toBe(
      "https://blob.example/results/wedding.png",
    );
    expect(restoration.completedAt).toEqual(completedAt);
  });

  it("deletes a photo's restorations when the photo is deleted", async () => {
    const photo = await createPhoto();
    await db
      .insert(restorations)
      .values({ photoId: photo.id, optionsJson: options });

    await db.delete(photos).where(eq(photos.id, photo.id));

    expect(
      await db
        .select()
        .from(restorations)
        .where(eq(restorations.photoId, photo.id)),
    ).toEqual([]);
  });
});
