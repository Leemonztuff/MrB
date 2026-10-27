import { describe, expect, it } from "vitest";
import {
  createOperatorUnlockToken,
  verifyOperatorUnlockToken,
} from "@/lib/operator-pin-token";

const secret = "un-secreto-de-prueba-suficientemente-largo";
const pinUpdatedAt = "2026-10-27T15:00:00.000Z";

describe("operator unlock token", () => {
  it("binds a short-lived unlock to the operator and PIN version", () => {
    const expiresAt = 10_000;
    const token = createOperatorUnlockToken("operator-1", pinUpdatedAt, expiresAt, secret);

    expect(verifyOperatorUnlockToken(token, "operator-1", secret, 9_999)).toEqual({
      userId: "operator-1",
      pinUpdatedAt,
      expiresAt,
    });
  });

  it("rejects a token for another operator or an expired session", () => {
    const token = createOperatorUnlockToken("operator-1", pinUpdatedAt, 10_000, secret);

    expect(verifyOperatorUnlockToken(token, "operator-2", secret, 9_999)).toBeNull();
    expect(verifyOperatorUnlockToken(token, "operator-1", secret, 10_000)).toBeNull();
  });

  it("rejects tampered payloads and signatures", () => {
    const token = createOperatorUnlockToken("operator-1", pinUpdatedAt, 10_000, secret);
    const [payload, signature] = token.split(".");

    expect(verifyOperatorUnlockToken(`${payload}x.${signature}`, "operator-1", secret, 9_999)).toBeNull();
    expect(verifyOperatorUnlockToken(`${payload}.${signature}x`, "operator-1", secret, 9_999)).toBeNull();
  });
});
