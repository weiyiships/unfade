import { z } from "zod";
import { FakeProvider } from "./fake-provider";
import type { RestorationProvider } from "./types";

const PROVIDER_NAMES = ["fake", "replicate", "gemini"] as const;
type ProviderName = (typeof PROVIDER_NAMES)[number];

const envSchema = z.object({
  RESTORATION_PROVIDER: z.enum(PROVIDER_NAMES).default("replicate"),
});

/** Add a factory here when a provider adapter lands. */
const FACTORIES: Partial<Record<ProviderName, () => RestorationProvider>> = {
  fake: () => new FakeProvider(),
};

export function selectProvider(
  env: Record<string, string | undefined>,
): RestorationProvider {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `RESTORATION_PROVIDER must be one of ${PROVIDER_NAMES.join(", ")}`,
    );
  }
  const name = parsed.data.RESTORATION_PROVIDER;
  const factory = FACTORIES[name];
  if (!factory) throw new Error(`${name} provider is not implemented yet`);
  return factory();
}
