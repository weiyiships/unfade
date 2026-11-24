/** Postgres error codes the schema tests assert on. */
export const PG = {
  uniqueViolation: "23505",
  notNullViolation: "23502",
  foreignKeyViolation: "23503",
  checkViolation: "23514",
  invalidTextRepresentation: "22P02",
} as const;

/** Resolves to the Postgres error code a failed query raised, or null if it succeeded. */
export async function pgErrorCode(query: PromiseLike<unknown>) {
  try {
    await query;
    return null;
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    return cause?.code ?? (error as { code?: string }).code ?? "unknown";
  }
}
