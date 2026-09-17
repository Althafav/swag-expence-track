import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "session";

const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;

// No fallback secret — a missing env var must fail loudly, not silently
// fall back to a guessable default.
function getSecret(): string {
  const secret = process.env.APP_PASSCODE_SECRET;
  if (!secret) throw new Error("APP_PASSCODE_SECRET is not set");
  return secret;
}

function getPasscode(): string {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) throw new Error("APP_PASSCODE is not set");
  return passcode;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const value = `ok:${Date.now()}`;
  return `${value}.${sign(value)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;

  const value = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(value);

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const [marker, timestampStr] = value.split(":");
  if (marker !== "ok") return false;

  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) return false;
  if (Date.now() - timestamp > MAX_AGE_MS) return false;

  return true;
}

export function verifyPasscode(candidate: string): boolean {
  const expected = getPasscode();
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  // Length check is a fast reject, not a timing leak worth avoiding here —
  // attempts are already rate-limited at the route level.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
