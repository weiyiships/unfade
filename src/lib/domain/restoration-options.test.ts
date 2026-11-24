import { describe, expect, it } from "vitest";
import {
  OPTION_DESCRIPTIONS,
  orderOptions,
  restorationOptionsSchema,
} from "./restoration-options";

describe("orderOptions", () => {
  it("orders options restore → faces → colorize → upscale", () => {
    expect(
      orderOptions({ upscale: 4, colorize: true, faces: true, restore: true }),
    ).toEqual([
      { kind: "restore" },
      { kind: "faces" },
      { kind: "colorize" },
      { kind: "upscale", factor: 4 },
    ]);
  });

  it("keeps the fixed order when only some options are chosen", () => {
    expect(
      orderOptions({ upscale: 2, restore: false, colorize: true }),
    ).toEqual([{ kind: "colorize" }, { kind: "upscale", factor: 2 }]);
  });

  it("returns only restore for a single option", () => {
    expect(orderOptions({ restore: true })).toEqual([{ kind: "restore" }]);
  });
});

describe("restorationOptionsSchema", () => {
  it("turns general restoration on by default", () => {
    expect(restorationOptionsSchema.parse({})).toEqual({
      restore: true,
      faces: false,
      colorize: false,
    });
  });

  it("accepts upscale factors 2 and 4", () => {
    expect(restorationOptionsSchema.parse({ upscale: 2 }).upscale).toBe(2);
    expect(restorationOptionsSchema.parse({ upscale: 4 }).upscale).toBe(4);
  });

  it("rejects other upscale factors", () => {
    expect(restorationOptionsSchema.safeParse({ upscale: 3 }).success).toBe(
      false,
    );
  });

  it("rejects a selection with no options", () => {
    expect(
      restorationOptionsSchema.safeParse({
        restore: false,
        faces: false,
        colorize: false,
      }).success,
    ).toBe(false);
  });

  it("rejects unknown options", () => {
    expect(restorationOptionsSchema.safeParse({ sharpen: true }).success).toBe(
      false,
    );
  });
});

describe("OPTION_DESCRIPTIONS", () => {
  it("has a one-line description for every option", () => {
    for (const kind of ["restore", "faces", "colorize", "upscale"] as const) {
      expect(OPTION_DESCRIPTIONS[kind]).toMatch(/^[^\n]{10,120}$/);
    }
  });
});
