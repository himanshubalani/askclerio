import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns the result in the format: `iv:ciphertext:authTag` (all hex-encoded).
 *
 * @param plaintext - The string to encrypt
 * @param key - A 64-character hex string representing the 32-byte encryption key
 * @returns The encrypted string in `iv:ciphertext:authTag` format
 */
export function encrypt(plaintext: string, key: string): string {
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      "Encryption key must be a 64-character hex string (32 bytes)",
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypts a ciphertext string that was encrypted with `encrypt`.
 * Expects the input in the format: `iv:ciphertext:authTag` (all hex-encoded).
 *
 * @param ciphertext - The encrypted string in `iv:ciphertext:authTag` format
 * @param key - A 64-character hex string representing the 32-byte encryption key
 * @returns The decrypted plaintext string
 */
export function decrypt(ciphertext: string, key: string): string {
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      "Encryption key must be a 64-character hex string (32 bytes)",
    );
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid ciphertext format. Expected `iv:ciphertext:authTag`",
    );
  }

  const [ivHex, encryptedHex, authTagHex] = parts;

  const iv = Buffer.from(ivHex!, "hex");
  const encrypted = Buffer.from(encryptedHex!, "hex");
  const authTag = Buffer.from(authTagHex!, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
