// Isi log pengiriman SatuSehat: redaksi identitas pribadi → potong → enkripsi (simpan) / dekripsi (baca).
//
// Lapis perlindungan (UU PDP · OWASP Logging): (1) NIK/KK/paspor dimasker SEBELUM disimpan — juga di
// URL pencarian (self-link Bundle searchset memuat `…/id/nik|<nik>`); (2) body dienkripsi AES-256-GCM;
// (3) dipangkas setelah masa retensi; (4) dibaca hanya lewat endpoint ber-RBAC + log akses rekam medis.
// Murni (tanpa DB) → mudah diuji.

import { decryptPii, encryptPii, maskPii } from "@/lib/crypto/pii";

/** Batas simpan per body (karakter JSON). Bundle per kunjungan umumnya < 100 KB. */
export const MAX_BODY_CHARS = 512 * 1024;

const PII_SYSTEM = /\/id\/(?:nik|nik-ibu|kk|paspor|passport)$/i;
/**
 * `…/id/nik|3201…` di dalam string (URL/link), termasuk bentuk ter-encode penuh
 * `…%2Fid%2Fnik%7C3201…` (path pencarian dibangun dengan encodeURIComponent).
 */
const PII_IN_TEXT = /((?:\/|%2F)id(?:\/|%2F)(?:nik|nik-ibu|kk|paspor|passport)(?:\||%7C))([A-Za-z0-9]+)/gi;
const MAX_DEPTH = 64;

export function redactText(s: string): string {
  return s.replace(PII_IN_TEXT, (_, prefix: string, value: string) => prefix + maskPii(value));
}

/** Salinan dalam dengan nilai identifier pribadi dimasker. Input tidak diubah. */
export function redactIdentifiers(v: unknown, depth = 0): unknown {
  if (typeof v === "string") return redactText(v);
  if (!v || typeof v !== "object" || depth > MAX_DEPTH) return v;
  if (Array.isArray(v)) return v.map((x) => redactIdentifiers(x, depth + 1));
  const o = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(o)) out[k] = redactIdentifiers(x, depth + 1);
  if (typeof o.system === "string" && PII_SYSTEM.test(o.system) && typeof o.value === "string") {
    out.value = maskPii(o.value);
  }
  return out;
}

export interface SealedBody {
  enc: string;
  bytes: number;
  truncated: boolean;
}

/** null/undefined = tak ada body (GET, respons kosong). */
export function sealBody(body: unknown): SealedBody | null {
  if (body === undefined || body === null) return null;
  const text = JSON.stringify(redactIdentifiers(body));
  if (text === undefined) return null;
  const truncated = text.length > MAX_BODY_CHARS;
  const kept = truncated ? text.slice(0, MAX_BODY_CHARS) : text;
  return { enc: encryptPii(kept), bytes: Buffer.byteLength(text, "utf8"), truncated };
}

/** Body tersimpan → JSON (utuh) atau teks (terpotong / rusak). */
export function openBody(enc: string | null, truncated: boolean): unknown {
  if (!enc) return null;
  const text = decryptPii(enc);
  if (truncated) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
