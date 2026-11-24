import { describe, expect, it } from "vitest";
import { transition } from "./restoration-status";

describe("transition", () => {
  it.each([
    ["queued", "processing"],
    ["queued", "failed"],
    ["processing", "succeeded"],
    ["processing", "failed"],
  ] as const)("allows %s → %s", (from, to) => {
    expect(transition(from, to)).toEqual({ ok: true, status: to });
  });

  it("treats staying in the same status as a no-op", () => {
    expect(transition("processing", "processing")).toEqual({
      ok: true,
      status: "processing",
    });
  });

  it.each([
    ["queued", "succeeded"],
    ["processing", "queued"],
    ["succeeded", "failed"],
    ["succeeded", "processing"],
    ["failed", "succeeded"],
  ] as const)("rejects %s → %s", (from, to) => {
    expect(transition(from, to)).toEqual({
      ok: false,
      error: `Cannot move a restoration from ${from} to ${to}`,
    });
  });

  it("allows retry from failed back to queued", () => {
    expect(transition("failed", "queued")).toEqual({
      ok: true,
      status: "queued",
    });
  });
});
