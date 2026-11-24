import { sql } from "drizzle-orm";
import type { RestorationOptions } from "@/lib/domain/restoration-options";
import { RESTORATION_STATUSES } from "@/lib/domain/restoration-status";
import {
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null for visitor uploads (PRD FR-6).
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    originalUrl: text("original_url").notNull(),
    fileName: text("file_name").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("photos_width_positive", sql`${t.width} > 0`),
    check("photos_height_positive", sql`${t.height} > 0`),
  ],
);

export const restorationStatus = pgEnum(
  "restoration_status",
  RESTORATION_STATUSES,
);

export const restorations = pgTable("restorations", {
  id: uuid("id").primaryKey().defaultRandom(),
  photoId: uuid("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  optionsJson: jsonb("options_json").$type<RestorationOptions>().notNull(),
  status: restorationStatus("status").notNull().default("queued"),
  resultUrl: text("result_url"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
