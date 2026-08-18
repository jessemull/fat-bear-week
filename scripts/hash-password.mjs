#!/usr/bin/env node

/**
 * Hash a password the same way the app does (scrypt$N$r$p$salt$hash).
 *
 * Usage (from repo root):
 *   node scripts/hash-password.mjs 'your-password-here'
 *
 * Or:
 *   cd web && node ../scripts/hash-password.mjs 'your-password-here'
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, 64, {
  N: 16384,
  p: 1,
  r: 8,
});

const hash = [
  "scrypt",
  "16384",
  "8",
  "1",
  salt.toString("base64"),
  derived.toString("base64"),
].join("$");

console.log(hash);
