import "server-only";

/**
 * BWS0.3 — Pipeline decode response BPJS (SERVER-ONLY). LANGKAH YANG HILANG di
 * FE lama (yang cuma no-op LZ-String). V-Claim 2.x: field `response` =
 *
 *   base64( AES-256-CBC( LZString.compressToEncodedURIComponent(json) ) )
 *
 * Decode = kebalikannya:
 *   AES-256-CBC decrypt → LZString.decompressFromEncodedURIComponent → JSON.parse
 *
 * Kunci: `key = SHA256(consId + consSecret + timestamp)` (32 byte biner),
 * `iv = key[0..16]`. `timestamp` HARUS sama dengan yang dikirim di header request.
 *
 * Aturan: [docs/BPJS-WS-RULES.md](../../../../docs/BPJS-WS-RULES.md) R5.
 */

import { createHash, createDecipheriv, createCipheriv } from "node:crypto";
import LZString from "lz-string";
import { BpjsDecodeError } from "./errors";

/** Derive kunci+IV AES dari (consId, consSecret, timestamp). */
export function deriveAesKeyIv(
  consId: string,
  consSecret: string,
  timestamp: string,
): { key: Buffer; iv: Buffer } {
  const key = createHash("sha256").update(consId + consSecret + timestamp, "utf8").digest(); // 32 byte
  const iv = key.subarray(0, 16);
  return { key, iv };
}

/**
 * Decode field `response` BPJS (string base64 ter-enkripsi) → objek bertipe `T`.
 * Throw `BpjsDecodeError` bila langkah mana pun gagal (kunci salah / kontrak rusak).
 */
export function decodeBpjsResponse<T = unknown>(
  rawResponse: string,
  consId: string,
  consSecret: string,
  timestamp: string,
): T {
  const { key, iv } = deriveAesKeyIv(consId, consSecret, timestamp);

  let decrypted: string;
  try {
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    decipher.setAutoPadding(true);
    const buf = Buffer.concat([decipher.update(Buffer.from(rawResponse, "base64")), decipher.final()]);
    decrypted = buf.toString("utf8");
  } catch (err) {
    throw new BpjsDecodeError("AES-256-CBC decrypt gagal (kunci/timestamp salah?)", err);
  }

  const json = LZString.decompressFromEncodedURIComponent(decrypted);
  if (json == null || json.length === 0) {
    throw new BpjsDecodeError("LZ-String decompress mengembalikan kosong");
  }

  try {
    return JSON.parse(json) as T;
  } catch (err) {
    throw new BpjsDecodeError("JSON.parse hasil decode gagal", err);
  }
}

/** Round-trip helper (test): encode payload lalu decode → harus identik. */
export function encodeBpjsResponse(
  payload: unknown,
  consId: string,
  consSecret: string,
  timestamp: string,
): string {
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const { key, iv } = deriveAesKeyIv(consId, consSecret, timestamp);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const buf = Buffer.concat([cipher.update(Buffer.from(compressed, "utf8")), cipher.final()]);
  return buf.toString("base64");
}
