import { describe, expect, it } from "vitest";
import { isMissingTableError } from "@/lib/supabase/errors";

describe("isMissingTableError", () => {
  it("detecta tablas faltantes de PostgreSQL y PostgREST", () => {
    expect(isMissingTableError({ code: "42P01" })).toBe(true);
    expect(isMissingTableError({ code: "PGRST205" })).toBe(true);
  });

  it("ignora errores distintos o sin código", () => {
    expect(isMissingTableError({ code: "23505" })).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });
});
