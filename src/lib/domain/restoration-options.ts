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

export const OPTION_DESCRIPTIONS: Record<StepKind, string> = {
  restore: "Repairs scratches, tears, dust, and fading.",
  faces: "Sharpens blurry faces so people look clearer.",
  colorize: "Adds natural color to black-and-white photos.",
  upscale: "Makes the photo larger and sharper for printing.",
};

export type StepKind = RestorationStep["kind"];

/** Fixed pipeline order (CLAUDE.md decision 6). Add new options here. */
export const PIPELINE_ORDER: readonly StepKind[] = [
  "restore",
  "faces",
  "colorize",
  "upscale",
];

function toStep(
  kind: StepKind,
  options: Partial<RestorationOptions>,
): RestorationStep | null {
  if (kind === "upscale") {
    return options.upscale ? { kind, factor: options.upscale } : null;
  }
  return options[kind] ? { kind } : null;
}

export function orderOptions(
  options: Partial<RestorationOptions>,
): RestorationStep[] {
  return PIPELINE_ORDER.map((kind) => toStep(kind, options)).filter(
    (step): step is RestorationStep => step !== null,
  );
}
