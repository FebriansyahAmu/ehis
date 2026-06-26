import "server-only";

/**
 * BWS0.2 — Signature & headers BPJS (SERVER crypto, Node `crypto.createHmac`).
 *
 * 4-header wajib: `X-cons-id` · `X-timestamp` (Unix epoch DETIK UTC) ·
 * `X-signature` = base64(HMAC-SHA256(`${consId}&${timestamp}`, consSecret)) ·
 * `user_key` (lowercase). Timestamp yang dipakai header HARUS sama dengan yang
 * dipakai derive kunci AES saat decode response (lihat decrypt.ts).
 *
 * Aturan: [docs/BPJS-WS-RULES.md](../../../../docs/BPJS-WS-RULES.md) R6.
 */

import { createHmac } from "node:crypto";

/** Unix epoch DETIK (UTC) sebagai string. */
export function nowUnixSeconds(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/** Pesan signature per spec: `${consId}&${timestamp}`. */
export function buildSignatureMessage(consId: string, timestamp: string): string {
  return `${consId}&${timestamp}`;
}

/** HMAC-SHA256(message, secret) → base64 (44 char dengan padding). */
export function signHmacSha256Base64(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("base64");
}

export interface BpjsHeaderInput {
  consId: string;
  consSecret: string;
  userKey: string;
  /** Unix epoch detik. Default = sekarang. */
  timestamp?: string;
}

export interface BpjsHeaders extends Record<string, string> {
  "X-cons-id": string;
  "X-timestamp": string;
  "X-signature": string;
  user_key: string;
  "Content-Type": string;
}

/** Bangun 4-header set + Content-Type. Mengembalikan timestamp yang dipakai (untuk decode). */
export function buildBpjsHeaders(input: BpjsHeaderInput): { headers: BpjsHeaders; timestamp: string } {
  const timestamp = input.timestamp ?? nowUnixSeconds();
  const signature = signHmacSha256Base64(buildSignatureMessage(input.consId, timestamp), input.consSecret);
  return {
    timestamp,
    headers: {
      "X-cons-id": input.consId,
      "X-timestamp": timestamp,
      "X-signature": signature,
      user_key: input.userKey,
      "Content-Type": "application/json; charset=utf-8",
    },
  };
}
