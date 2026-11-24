export const RESTORATION_STATUSES = [
  "queued",
  "processing",
  "succeeded",
  "failed",
] as const;
export type RestorationStatus = (typeof RESTORATION_STATUSES)[number];

export type TransitionResult =
  { ok: true; status: RestorationStatus } | { ok: false; error: string };

/** Every allowed move. The only place status rules live (CLAUDE.md decision 4). */
const ALLOWED: Record<RestorationStatus, readonly RestorationStatus[]> = {
  queued: ["processing", "failed"],
  processing: ["succeeded", "failed"],
  succeeded: [],
  failed: ["queued"], // retry reuses the uploaded photo
};

export function transition(
  from: RestorationStatus,
  to: RestorationStatus,
): TransitionResult {
  if (from === to || ALLOWED[from].includes(to))
    return { ok: true, status: to };
  return {
    ok: false,
    error: `Cannot move a restoration from ${from} to ${to}`,
  };
}
