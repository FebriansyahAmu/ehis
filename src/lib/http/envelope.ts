// Response envelope (FLOWS §4) — bentuk SERAGAM untuk semua endpoint.
//   Sukses : { ok: true,  data, meta? }
//   Gagal  : { ok: false, error: { code, message, details? } }

import type { ErrorCode } from "@/lib/errors/appError";

export interface Meta {
  cursor?: string | null;
  total?: number;
}

export type Envelope<T> =
  | { ok: true; data: T; message?: string; meta?: Meta }
  | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };

/** `message` = teks human-readable aman untuk user (mis. driver toast sukses). */
export function success<T>(data: T, message?: string, meta?: Meta): Envelope<T> {
  const env: { ok: true; data: T; message?: string; meta?: Meta } = { ok: true, data };
  if (message) env.message = message;
  if (meta) env.meta = meta;
  return env;
}

export function failure(code: ErrorCode, message: string, details?: unknown): Envelope<never> {
  return { ok: false, error: details === undefined ? { code, message } : { code, message, details } };
}
