import "server-only";

/**
 * BWS0.1 — BPJS connector config (SERVER-ONLY).
 *
 * Sumber tunggal kredensial + base URL + mode. Dibaca dari `process.env`,
 * divalidasi Zod, **fail-fast** bila kurang saat mode != mock. TIDAK BOLEH
 * ter-import dari komponen client (`import "server-only"` menjaga ini).
 *
 * Aturan: [docs/BPJS-WS-RULES.md](../../../../docs/BPJS-WS-RULES.md) R1/R13.
 * Roadmap: [TODO-BPJS-WS.md](../../../../TODO-BPJS-WS.md) BWS0.1.
 */

import { z } from "zod";
import { BpjsConfigError } from "./errors";

export type BpjsMode = "mock" | "sandbox" | "prod";
export type BpjsService = "vclaim" | "aplicares" | "antrean";

/**
 * Perlakukan string kosong/whitespace di env sebagai TIDAK di-set (undefined) → default/optional
 * berlaku. Membuat `.env` boleh punya `BPJS_CONS_ID=""` (deklaratif, belum diisi) tanpa memicu
 * error validasi (min(1)/url()/enum). Diisi saat kredensial tersedia.
 */
const blankToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

const EnvSchema = z.object({
  // `.optional()` / `.default()` di DALAM blankToUndef agar `undefined` hasil preprocess diterima.
  BPJS_MODE: blankToUndef(z.enum(["mock", "sandbox", "prod"]).default("mock")),
  BPJS_CONS_ID: blankToUndef(z.string().trim().min(1).optional()),
  BPJS_CONS_SECRET: blankToUndef(z.string().trim().min(1).optional()),
  BPJS_USER_KEY: blankToUndef(z.string().trim().min(1).optional()),
  BPJS_KODE_PPK: blankToUndef(z.string().trim().optional()),
  BPJS_VCLAIM_BASE_URL: blankToUndef(z.string().url().optional()),
  BPJS_APLICARES_BASE_URL: blankToUndef(z.string().url().optional()),
  BPJS_ANTREAN_BASE_URL: blankToUndef(z.string().url().optional()),
  // user_key per service — fallback ke BPJS_USER_KEY bila kosong.
  BPJS_APLICARES_USER_KEY: blankToUndef(z.string().trim().optional()),
  BPJS_ANTREAN_USER_KEY: blankToUndef(z.string().trim().optional()),
  BPJS_TIMESTAMP_TOLERANCE_SEC: blankToUndef(z.coerce.number().int().positive().default(300)),
  BPJS_REQUEST_TIMEOUT_MS: blankToUndef(z.coerce.number().int().positive().default(15_000)),
});

export interface ServiceEndpoint {
  baseUrl: string;
  userKey: string;
}

export interface BpjsConfig {
  mode: BpjsMode;
  consId: string;
  consSecret: string;
  kodePpk: string;
  timestampToleranceSec: number;
  requestTimeoutMs: number;
  /** Per-service base URL + user_key. baseUrl kosong = service belum dikonfigurasi. */
  services: Record<BpjsService, ServiceEndpoint>;
}

let cached: BpjsConfig | null = null;

/**
 * Muat + validasi config dari env (di-cache). Saat mode != mock, kredensial inti
 * (consId/secret/userKey) + base URL V-Claim WAJIB ada → `BpjsConfigError`.
 */
export function getBpjsConfig(): BpjsConfig {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new BpjsConfigError(`Env BPJS tidak valid: ${issues}`);
  }
  const e = parsed.data;
  const mode = e.BPJS_MODE;

  if (mode === "mock") {
    // Placeholder — callBpjs menolak jalan di mode mock (adapter mock dipakai di service).
    cached = {
      mode,
      consId: e.BPJS_CONS_ID ?? "mock-cons",
      consSecret: e.BPJS_CONS_SECRET ?? "mock-secret",
      kodePpk: e.BPJS_KODE_PPK ?? "00000000",
      timestampToleranceSec: e.BPJS_TIMESTAMP_TOLERANCE_SEC,
      requestTimeoutMs: e.BPJS_REQUEST_TIMEOUT_MS,
      services: {
        vclaim: { baseUrl: e.BPJS_VCLAIM_BASE_URL ?? "", userKey: e.BPJS_USER_KEY ?? "mock-key" },
        aplicares: { baseUrl: e.BPJS_APLICARES_BASE_URL ?? "", userKey: e.BPJS_APLICARES_USER_KEY ?? e.BPJS_USER_KEY ?? "mock-key" },
        antrean: { baseUrl: e.BPJS_ANTREAN_BASE_URL ?? "", userKey: e.BPJS_ANTREAN_USER_KEY ?? e.BPJS_USER_KEY ?? "mock-key" },
      },
    };
    return cached;
  }

  // mode sandbox/prod → kredensial inti wajib.
  const missing: string[] = [];
  if (!e.BPJS_CONS_ID) missing.push("BPJS_CONS_ID");
  if (!e.BPJS_CONS_SECRET) missing.push("BPJS_CONS_SECRET");
  if (!e.BPJS_USER_KEY) missing.push("BPJS_USER_KEY");
  if (!e.BPJS_VCLAIM_BASE_URL) missing.push("BPJS_VCLAIM_BASE_URL");
  if (missing.length) {
    throw new BpjsConfigError(`BPJS_MODE=${mode} tetapi env wajib hilang: ${missing.join(", ")}`);
  }

  cached = {
    mode,
    consId: e.BPJS_CONS_ID!,
    consSecret: e.BPJS_CONS_SECRET!,
    kodePpk: e.BPJS_KODE_PPK ?? "",
    timestampToleranceSec: e.BPJS_TIMESTAMP_TOLERANCE_SEC,
    requestTimeoutMs: e.BPJS_REQUEST_TIMEOUT_MS,
    services: {
      vclaim: { baseUrl: e.BPJS_VCLAIM_BASE_URL!, userKey: e.BPJS_USER_KEY! },
      // aplicares/antrean opsional — baseUrl kosong → ditolak saat dipanggil.
      aplicares: { baseUrl: e.BPJS_APLICARES_BASE_URL ?? "", userKey: e.BPJS_APLICARES_USER_KEY ?? e.BPJS_USER_KEY! },
      antrean: { baseUrl: e.BPJS_ANTREAN_BASE_URL ?? "", userKey: e.BPJS_ANTREAN_USER_KEY ?? e.BPJS_USER_KEY! },
    },
  };
  return cached;
}

/** Reset cache config — untuk test (ganti env lalu re-load). */
export function resetBpjsConfigCache(): void {
  cached = null;
}

/** True bila mode mock (service pakai adapter mock, bukan HTTP nyata). */
export function isBpjsMockMode(): boolean {
  return getBpjsConfig().mode === "mock";
}
