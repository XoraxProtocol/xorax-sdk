/**
 * Cryptographic utility functions for Xorax mixer
 * Handles secret/nullifier generation and commitment computation
 */

/**
 * Generate a random 32-byte secret
 */
export function generateSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(secret);
  } else {
    // Node.js environment
    const crypto = require("crypto");
    const randomBytes = crypto.randomBytes(32);
    secret.set(randomBytes);
  }
  return secret;
}

/**
 * Generate a random 32-byte nullifier
 */
export function generateNullifier(): Uint8Array {
  const nullifier = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(nullifier);
  } else {
    // Node.js environment
    const crypto = require("crypto");
    const randomBytes = crypto.randomBytes(32);
    nullifier.set(randomBytes);
  }
  return nullifier;
}

/**
 * Compute commitment hash from secret and nullifier
 * commitment = SHA256(secret || nullifier)
 * This matches the Solana program's hashv implementation
 */
export async function computeCommitment(
  secret: Uint8Array,
  nullifier: Uint8Array
): Promise<Uint8Array> {
  const combined = new Uint8Array(secret.length + nullifier.length);
  combined.set(secret);
  combined.set(nullifier, secret.length);

  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    // Browser environment
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined);
    return new Uint8Array(hashBuffer);
  } else {
    // Node.js environment
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(combined).digest();
    return new Uint8Array(hash);
  }
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to Array (for Anchor/Solana compatibility)
 */
export function toArray(bytes: Uint8Array): number[] {
  return Array.from(bytes);
}

/**
 * Generate deposit credentials (secret + nullifier + commitment)
 */
export async function generateDepositCredentials() {
  const secret = generateSecret();
  const nullifier = generateNullifier();
  const commitment = await computeCommitment(secret, nullifier);

  return {
    secret,
    nullifier,
    commitment,
    secretHex: toHex(secret),
    nullifierHex: toHex(nullifier),
    commitmentHex: toHex(commitment),
  };
}

/**
 * Verify that a secret and nullifier produce the given commitment
 */
export async function verifyCommitment(
  secret: Uint8Array,
  nullifier: Uint8Array,
  expectedCommitment: Uint8Array
): Promise<boolean> {
  const computed = await computeCommitment(secret, nullifier);

  if (computed.length !== expectedCommitment.length) {
    return false;
  }

  for (let i = 0; i < computed.length; i++) {
    if (computed[i] !== expectedCommitment[i]) {
      return false;
    }
  }

  return true;
}
