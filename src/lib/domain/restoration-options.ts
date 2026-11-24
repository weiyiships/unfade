import { z } from "zod";

export const restorationOptionsSchema = z
  .object({
    restore: z.boolean().default(true),
    faces: z.boolean().default(false),
    colorize: z.boolean().default(false),
    upscale: z.union([z.literal(2), z.literal(4)]).optional(),
  })
  .strict()
  .refine(
    (o) => o.restore || o.faces || o.colorize || o.upscale !== undefined,
    {
      message: "Choose at least one option",
    },
  );

export type RestorationOptions = z.infer<typeof restorationOptionsSchema>;

export type RestorationStep =
  | { kind: "restore" }
  | { kind: "faces" }
  | { kind: "colorize" }
  | { kind: "upscale"; factor: 2 | 4 };

export const OPTION_DESCRIPTIONS = {
  restore: "Repairs scratches, tears, dust, and fading.",
  faces: "Sharpens blurry faces so people look clearer.",
  colorize: "Adds natural color to black-and-white photos.",
  upscale: "Makes the photo larger and sharper for printing.",
} as const;

export function orderOptions(
  options: Partial<RestorationOptions>,
): RestorationStep[] {
  const steps: RestorationStep[] = [];
  if (options.restore) steps.push({ kind: "restore" });
  if (options.faces) steps.push({ kind: "faces" });
  if (options.colorize) steps.push({ kind: "colorize" });
  if (options.upscale) steps.push({ kind: "upscale", factor: options.upscale });
  return steps;
}
