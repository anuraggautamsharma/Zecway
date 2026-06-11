import crypto from "crypto";

// AES-256-GCM for workspace AI keys. The secret lives only in the server
// environment (AI_KEY_SECRET) — ciphertext in the database is unreadable
// without it, including by us through the Supabase dashboard.

function secretKey(): Buffer | null {
  const raw = process.env.AI_KEY_SECRET;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function encryptionReady(): boolean {
  return secretKey() !== null;
}

export function encryptSecret(plaintext: string): string {
  const key = secretKey();
  if (!key) throw new Error("AI_KEY_SECRET is not configured");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(ciphertext: string): string | null {
  const key = secretKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(ciphertext, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
