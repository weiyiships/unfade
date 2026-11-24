import type { RestorationStep } from "@/lib/domain/restoration-options";

export type RestorationJob = {
  restorationId: string;
  imageUrl: string;
  steps: RestorationStep[];
};

export type ProviderStatus =
  | { status: "processing" }
  | { status: "succeeded"; outputUrl: string }
  | { status: "failed"; error: string };

export interface RestorationProvider {
  start(job: RestorationJob): Promise<string>;
  getStatus(providerJobId: string): Promise<ProviderStatus>;
}
