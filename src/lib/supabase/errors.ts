const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "PGRST205"]);

export function isMissingTableError(error: { code?: string } | null | undefined): boolean {
  return Boolean(error?.code && MISSING_TABLE_ERROR_CODES.has(error.code));
}
