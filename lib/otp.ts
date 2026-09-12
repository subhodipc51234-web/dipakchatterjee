// lib/otp.ts
//
// Login OTP: generation, hashing, and verification. The raw 6-digit
// code is never stored or logged anywhere — only an HMAC-SHA256 hash
// (keyed by APP_ENCRYPTION_KEY, the same secret .env.example already
// reserves for "encrypting a sensitive field at rest") ever touches the
// database, in admin_otp_codes.
//
// Server-only: pulls in `node:crypto` and reads a server-only env var.

import { createHmac, randomInt, timingSafeEqual } from "crypto";

const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;

function otpSecret(): string {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set — required to hash OTP codes. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return secret;
}

export function generateOtp(): string {
  // randomInt is cryptographically secure (backed by the OS CSPRNG),
  // unlike Math.random(). Zero-padded so e.g. 42 renders as "000042",
  // not a 2-digit code.
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string): string {
  return createHmac("sha256", otpSecret()).update(code).digest("hex");
}

export function verifyOtpHash(code: string, hash: string): boolean {
  const expected = Buffer.from(hashOtp(code), "hex");
  const actual = Buffer.from(hash, "hex");
  // Constant-time comparison — a plain `===` would let an attacker
  // infer correct prefix bytes from response-time differences.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
