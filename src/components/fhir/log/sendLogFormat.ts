// Format & nada tampilan log pengiriman SatuSehat (murni, tanpa React).

import type { Tone } from "../fhirShared";
import type { SendLogRowDTO } from "@/lib/api/fhir/sendLog";

export const METHOD_TONE: Record<string, Tone> = { GET: "teal", POST: "sky", PUT: "amber", PATCH: "amber", DELETE: "rose" };

/** 2xx hijau · 4xx kuning (payload/validasi) · 5xx/ERR merah (server/jaringan). */
export function statusTone(r: Pick<SendLogRowDTO, "success" | "status">): Tone {
  if (r.success) return "emerald";
  const n = Number(r.status);
  return Number.isFinite(n) && n >= 400 && n < 500 ? "amber" : "rose";
}

export function statusLabel(r: Pick<SendLogRowDTO, "status" | "errorType">): string {
  if (r.status === "ERR") return r.errorType ? `Gagal · ${r.errorType}` : "Gagal";
  return `HTTP ${r.status}`;
}

const TARGET_BASE: Record<string, string> = {
  fhir: "/fhir-r4/v1",
  kfa: "/kfa-v2",
  masterdata: "/masterdata/v1",
  kyc: "/kyc/v1",
};

/** Path relatif host SatuSehat. Log lama (tanpa path) → template endpoint. */
export function fullPath(r: Pick<SendLogRowDTO, "target" | "path" | "endpoint">): string {
  const base = TARGET_BASE[r.target] ?? "";
  if (r.path === null) return `${base}/${r.endpoint}`;
  if (!r.path) return base || "/"; // Bundle transaction → POST ke root base
  return `${base}${r.path.startsWith("?") ? "" : "/"}${r.path.replace(/^\/+/, "")}`;
}

export function fmtDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} dtk`;
}

export function fmtBytes(n: number | null): string | null {
  if (n === null) return null;
  return n < 1024 ? `${n} B` : `${(n / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB`;
}

/** Entry ke-`index` (1-based) dari Bundle; null bila bentuk tak sesuai. */
export function bundleEntry(body: unknown, index: number | null): unknown {
  if (!index || !body || typeof body !== "object") return null;
  const entry = (body as { entry?: unknown }).entry;
  return Array.isArray(entry) ? (entry[index - 1] ?? null) : null;
}
