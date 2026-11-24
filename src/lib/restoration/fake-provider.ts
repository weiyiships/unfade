import type {
  ProviderStatus,
  RestorationJob,
  RestorationProvider,
} from "./types";

export class FakeProvider implements RestorationProvider {
  private polls = new Map<string, number>();
  private pollsUntilDone: number;
  private fail: boolean;

  constructor(options: { pollsUntilDone?: number; fail?: boolean } = {}) {
    this.pollsUntilDone = options.pollsUntilDone ?? 1;
    this.fail = options.fail ?? false;
  }

  async start(job: RestorationJob): Promise<string> {
    const id = `fake-${job.restorationId}`;
    this.polls.set(id, 0);
    return id;
  }

  async getStatus(providerJobId: string): Promise<ProviderStatus> {
    const count = this.polls.get(providerJobId);
    if (count === undefined) return { status: "failed", error: "Unknown job" };
    this.polls.set(providerJobId, count + 1);
    if (count < this.pollsUntilDone) return { status: "processing" };
    if (this.fail) return { status: "failed", error: "Fake failure" };
    return {
      status: "succeeded",
      outputUrl: `https://fake.provider.test/${providerJobId}.png`,
    };
  }
}
