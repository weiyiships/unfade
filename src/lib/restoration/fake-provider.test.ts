import { describe, expect, it } from "vitest";
import { FakeProvider } from "./fake-provider";
import type { RestorationJob } from "./types";

const job: RestorationJob = {
  restorationId: "r1",
  imageUrl: "blob://original",
  steps: [{ kind: "restore" }],
};

describe("FakeProvider", () => {
  it("returns a deterministic provider job id", async () => {
    const provider = new FakeProvider();
    expect(await provider.start(job)).toBe("fake-r1");
    expect(await new FakeProvider().start(job)).toBe("fake-r1");
  });

  it("reports processing first, then succeeded with an output URL", async () => {
    const provider = new FakeProvider({ pollsUntilDone: 1 });
    const id = await provider.start(job);
    expect(await provider.getStatus(id)).toEqual({ status: "processing" });
    expect(await provider.getStatus(id)).toEqual({
      status: "succeeded",
      outputUrl: "https://fake.provider.test/fake-r1.png",
    });
  });

  it("can be configured to fail for error-path tests", async () => {
    const provider = new FakeProvider({ pollsUntilDone: 0, fail: true });
    const id = await provider.start(job);
    expect(await provider.getStatus(id)).toEqual({
      status: "failed",
      error: "Fake failure",
    });
  });

  it("reports failed for an unknown job id", async () => {
    expect(await new FakeProvider().getStatus("nope")).toMatchObject({
      status: "failed",
    });
  });
});
