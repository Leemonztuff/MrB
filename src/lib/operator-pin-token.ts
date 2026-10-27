import { createHmac, timingSafeEqual } from "node:crypto";

export const OPERATOR_UNLOCK_COOKIE = "mrb_operator_unlock";
export const OPERATOR_UNLOCK_MAX_AGE_SECONDS = 12 * 60 * 60;

type OperatorUnlockPayload = {
  userId: string;
  pinUpdatedAt: string;
  expiresAt: number;
};

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOperatorUnlockToken(
  userId: string,
  pinUpdatedAt: string,
  expiresAt: number,
  secret: string
) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    pinUpdatedAt,
    expiresAt,
  } satisfies OperatorUnlockPayload)).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOperatorUnlockToken(
  token: string | undefined,
  userId: string,
  secret: string,
  now = Date.now()
): OperatorUnlockPayload | null {
  if (!token) return null;

  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length > 0) return null;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object"
      || parsed === null
      || !("userId" in parsed)
      || !("pinUpdatedAt" in parsed)
      || !("expiresAt" in parsed)
      || typeof parsed.userId !== "string"
      || typeof parsed.pinUpdatedAt !== "string"
      || typeof parsed.expiresAt !== "number"
      || parsed.userId !== userId
      || parsed.expiresAt <= now
      || !Number.isFinite(parsed.expiresAt)
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      pinUpdatedAt: parsed.pinUpdatedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}
