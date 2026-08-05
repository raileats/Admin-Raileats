import { createHmac, timingSafeEqual } from "crypto";

type VendorOrderActionPayload = {
  orderId: string;
  restroCode: string;
  expiresAt: number;
};

function secret() {
  return String(
    process.env.VENDOR_NOTIFICATION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signature(payload: string, signingSecret: string) {
  return createHmac("sha256", signingSecret)
    .update(payload)
    .digest("base64url");
}

export function createVendorOrderActionToken(
  orderId: string,
  restroCode: string,
  lifetimeSeconds = 48 * 60 * 60
) {
  const signingSecret = secret();
  if (!signingSecret) return null;

  const payload = encode(
    JSON.stringify({
      orderId,
      restroCode,
      expiresAt: Math.floor(Date.now() / 1000) + lifetimeSeconds,
    } satisfies VendorOrderActionPayload)
  );

  return `${payload}.${signature(payload, signingSecret)}`;
}

export function verifyVendorOrderActionToken(
  token: string
): VendorOrderActionPayload | null {
  const signingSecret = secret();
  const [payload, suppliedSignature] = String(token || "").split(".");
  if (!signingSecret || !payload || !suppliedSignature) return null;

  const expectedSignature = signature(payload, signingSecret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as VendorOrderActionPayload;

    if (
      !parsed.orderId ||
      !parsed.restroCode ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
