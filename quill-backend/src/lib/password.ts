// Password hashing for the Cloudflare Workers edge runtime using the Web Crypto
// API (crypto.subtle). We use PBKDF2-HMAC-SHA256, which is OWASP-accepted and
// requires no native modules — unlike bcrypt, which is awkward on Workers.
//
// We store passwords one-way (hashed), never encrypted: there is no need to ever
// recover the original password, only to verify a login attempt against the hash.
//
// The stored string is self-describing so we never have to track salts/params
// separately:   pbkdf2$<iterations>$<base64-salt>$<base64-hash>

const ITERATIONS = 100_000; // OWASP minimum for PBKDF2-HMAC-SHA256
const HASH_BYTES = 32; // 256-bit derived key
const SALT_BYTES = 16; // 128-bit random salt, unique per password

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

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTES * 8
  );
  return new Uint8Array(bits);
}

/** Hash a plaintext password into a self-describing storable string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_BYTES)));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Verify a plaintext password against a stored hash. Uses a constant-time
 * comparison to avoid leaking information through timing.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await derive(password, salt, iterations);

  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
