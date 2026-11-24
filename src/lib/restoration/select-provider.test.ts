import { describe, expect, it } from "vitest";
import { FakeProvider } from "./fake-provider";
import { selectProvider } from "./select-provider";

describe("selectProvider", () => {
  it("returns FakeProvider when RESTORATION_PROVIDER=fake", () => {
    expect(selectProvider({ RESTORATION_PROVIDER: "fake" })).toBeInstanceOf(
      FakeProvider,
    );
  });

  it("rejects an unknown provider name", () => {
    expect(() =>
      selectProvider({ RESTORATION_PROVIDER: "midjourney" }),
    ).toThrow(/RESTORATION_PROVIDER/);
  });

  it("rejects replicate until its adapter exists", () => {
    expect(() => selectProvider({ RESTORATION_PROVIDER: "replicate" })).toThrow(
      /not implemented/,
    );
  });
});
