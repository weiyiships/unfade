import { z } from "zod";
import { FakeProvider } from "./fake-provider";
import type { RestorationProvider } from "./types";

const envSchema = z.object({
  RESTORATION_PROVIDER: z
    .enum(["fake", "replicate", "gemini"])
    .default("replicate"),
});

export function selectProvider(
  env: Record<string, string | undefined>,
): RestorationProvider {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      "RESTORATION_PROVIDER must be one of fake, replicate, gemini",
    );
  }
  if (parsed.data.RESTORATION_PROVIDER === "fake") return new FakeProvider();
  throw new Error(
    `${parsed.data.RESTORATION_PROVIDER} provider is not implemented yet`,
  );
}
