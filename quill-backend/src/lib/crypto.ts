// Symmetric encryption for secrets at rest (e.g. LinkedIn OAuth access tokens)
// using AES-256-GCM via the Web Crypto API — native on the Cloudflare Workers
// edge runtime, no dependencies.
//
// Unlike passwords (which we HASH, one-way), OAuth tokens must be recoverable to
// call the provider, so we ENCRYPT them reversibly. The master key lives ONLY as
// a Workers secret (TOKEN_ENC_KEY), never in the database — so a DB leak alone
// yields only ciphertext, not usable tokens.
//
// Stored format (single string, base64): <12-byte IV> || <ciphertext+GCM tag>.
// A fresh random IV per encryption is required for GCM security.

const IV_BYTES = 12; // 96-bit IV, the standard/recommended size for AES-GCM

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Derive a stable AES-256 key from the secret. The secret is hashed to exactly
// 32 bytes via SHA-256 so any sufficiently-strong secret string works as input.
async function getKey(secret: string): Promise<CryptoKey> {
  if (!secret) throw new Error("TOKEN_ENC_KEY is not configured");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt plaintext into a self-contained base64 string (IV prepended). */
export async function encryptSecret(plaintext: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const ctBytes = new Uint8Array(ciphertext);
  const packed = new Uint8Array(iv.length + ctBytes.length);
  packed.set(iv, 0);
  packed.set(ctBytes, iv.length);
  return toBase64(packed);
}

/** Decrypt a string produced by encryptSecret back to plaintext. */
export async function decryptSecret(packedB64: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const packed = fromBase64(packedB64);
  const iv = packed.slice(0, IV_BYTES);
  const ciphertext = packed.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
