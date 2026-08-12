import "server-only";
import {
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_P = 1;
const SCRYPT_R = 8;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey as Buffer);
    });
  });
}

/**
 * Hash a password with scrypt.
 * Format: scrypt$N$r$p$saltB64$hashB64
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    p: SCRYPT_P,
    r: SCRYPT_R,
  });

  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Verify a password against a stored scrypt hash.
 * Uses timing-safe comparison on the derived key bytes.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const parts = passwordHash.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");

  if (
    !Number.isFinite(n) ||
    !Number.isFinite(p) ||
    !Number.isFinite(r) ||
    expected.length === 0 ||
    salt.length === 0
  ) {
    return false;
  }

  const derived = await scryptAsync(password, salt, expected.length, {
    N: n,
    p,
    r,
  });

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
