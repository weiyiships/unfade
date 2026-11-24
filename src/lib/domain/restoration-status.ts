export type RestorationStatus =
  "queued" | "processing" | "succeeded" | "failed";

export type TransitionResult =
  { ok: true; status: RestorationStatus } | { ok: false; error: string };

export function transition(
  from: RestorationStatus,
  to: RestorationStatus,
): TransitionResult {
  if (from === to) return { ok: true, status: to };
  if (from === "queued" && (to === "processing" || to === "failed"))
    return { ok: true, status: to };
  if (from === "processing" && (to === "succeeded" || to === "failed"))
    return { ok: true, status: to };
  if (from === "failed" && to === "queued") return { ok: true, status: to };
  return {
    ok: false,
    error: `Cannot move a restoration from ${from} to ${to}`,
  };
}
