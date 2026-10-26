import "server-only";

/**
 * FH0 — SatuSehat connector config (SERVER-ONLY). Pola [bpjs/server/config.ts](../../bpjs/server/config.ts).
 *
 * Sumber tunggal kredensial + base URL + mode. Dibaca dari `process.env`, divalidasi Zod,
 * **fail-fast** bila kurang saat mode != mock. TIDAK BOLEH ter-import dari komponen client.
 *
 * Aturan: [docs/FHIR-RULES.md](../../../../docs/FHIR-RULES.md) R1/R13.
 */

import { z } from "zod";
import type { FhirTarget, SatuSehatMode } from "../fhirShared";
import { FhirConfigError } from "./errors";

/** String kosong di env = tidak di-set → default/optional berlaku (deklaratif, belum diisi). */
const blankToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

/** Host resmi per environment (TODO-FHIR §0). Bisa di-override via SATUSEHAT_BASE_URL. */
const DEFAULT_HOST: Record<Exclude<SatuSehatMode, "mock">, string> = {
  sandbox: "https://api-satusehat-stg.dto.kemkes.go.id",
  prod: "https://api-satusehat.kemkes.go.id",
};

/** Path base per target (relatif host). */
const TARGET_PATH: Record<FhirTarget, string> = {
  fhir: "/fhir-r4/v1",
  kfa: "/kfa-v2",
  masterdata: "/masterdata/v1",
  kyc: "/kyc/v1",
};

const EnvSchema = z.object({
  SATUSEHAT_MODE: blankToUndef(z.enum(["mock", "sandbox", "prod"]).default("mock")),
  SATUSEHAT_CLIENT_ID: blankToUndef(z.string().trim().min(1).optional()),
  SATUSEHAT_CLIENT_SECRET: blankToUndef(z.string().trim().min(1).optional()),
  /** Organization ID RS (IHS) dari DevHub — dipakai serviceProvider & identifier system lokal. */
  SATUSEHAT_ORG_ID: blankToUndef(z.string().trim().min(1).optional()),
  SATUSEHAT_BASE_URL: blankToUndef(z.string().url().optional()),
  SATUSEHAT_REQUEST_TIMEOUT_MS: blankToUndef(z.coerce.number().int().positive().default(20_000)),
  /** FH7: bundle = 1 Bundle transaction per kunjungan (default) · single = POST/PUT per resource. */
  SATUSEHAT_SYNC_MODE: blankToUndef(z.enum(["bundle", "single"]).default("bundle")),
});

export interface SatuSehatConfig {
  mode: SatuSehatMode;
  clientId: string;
  clientSecret: string;
  orgId: string;
  /** Host tanpa trailing slash; kosong saat mock. */
  host: string;
  requestTimeoutMs: number;
  /** FH7 — cara kirim job kunjungan: 1 Bundle transaction (default) atau per resource. */
  syncMode: "bundle" | "single";
}

let cached: SatuSehatConfig | null = null;

export function getSatuSehatConfig(): SatuSehatConfig {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new FhirConfigError(`Env SatuSehat tidak valid: ${issues}`);
  }
  const e = parsed.data;
  const mode = e.SATUSEHAT_MODE;

  if (mode === "mock") {
    // Placeholder — callSatuSehat menolak jalan di mode mock (adapter mock dipakai di service).
    cached = {
      mode,
      clientId: e.SATUSEHAT_CLIENT_ID ?? "mock-client",
      clientSecret: e.SATUSEHAT_CLIENT_SECRET ?? "mock-secret",
      orgId: e.SATUSEHAT_ORG_ID ?? "mock-org",
      host: "",
      requestTimeoutMs: e.SATUSEHAT_REQUEST_TIMEOUT_MS,
      syncMode: e.SATUSEHAT_SYNC_MODE,
    };
    return cached;
  }

  const missing: string[] = [];
  if (!e.SATUSEHAT_CLIENT_ID) missing.push("SATUSEHAT_CLIENT_ID");
  if (!e.SATUSEHAT_CLIENT_SECRET) missing.push("SATUSEHAT_CLIENT_SECRET");
  if (!e.SATUSEHAT_ORG_ID) missing.push("SATUSEHAT_ORG_ID");
  if (missing.length) {
    throw new FhirConfigError(`SATUSEHAT_MODE=${mode} tetapi env wajib hilang: ${missing.join(", ")}`);
  }

  cached = {
    mode,
    clientId: e.SATUSEHAT_CLIENT_ID!,
    clientSecret: e.SATUSEHAT_CLIENT_SECRET!,
    orgId: e.SATUSEHAT_ORG_ID!,
    host: (e.SATUSEHAT_BASE_URL ?? DEFAULT_HOST[mode]).replace(/\/+$/, ""),
    requestTimeoutMs: e.SATUSEHAT_REQUEST_TIMEOUT_MS,
    syncMode: e.SATUSEHAT_SYNC_MODE,
  };
  return cached;
}

/** URL absolut untuk target + path relatif. */
export function satuSehatUrl(target: FhirTarget, path: string): string {
  const { host } = getSatuSehatConfig();
  if (!path) return `${host}${TARGET_PATH[target]}`;
  // Path diawali "?" (mis. Bundle POST ke root) tetap menempel ke base.
  const rel = path.startsWith("?") ? path : `/${path.replace(/^\/+/, "")}`;
  return `${host}${TARGET_PATH[target]}${rel}`;
}

/** URL endpoint token OAuth2 (R5). */
export function satuSehatTokenUrl(): string {
  return `${getSatuSehatConfig().host}/oauth2/v1/accesstoken?grant_type=client_credentials`;
}

/** Reset cache config — untuk test (ganti env lalu re-load). */
export function resetSatuSehatConfigCache(): void {
  cached = null;
}

export function isSatuSehatMockMode(): boolean {
  return getSatuSehatConfig().mode === "mock";
}

/**
 * Kelengkapan config TANPA melempar — untuk panel status (nilai rahasia tak pernah dikembalikan).
 */
export function describeSatuSehatConfig(): {
  mode: SatuSehatMode | "invalid";
  host: string;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasOrgId: boolean;
  error?: string;
} {
  const raw = {
    hasClientId: !!process.env.SATUSEHAT_CLIENT_ID?.trim(),
    hasClientSecret: !!process.env.SATUSEHAT_CLIENT_SECRET?.trim(),
    hasOrgId: !!process.env.SATUSEHAT_ORG_ID?.trim(),
  };
  try {
    const c = getSatuSehatConfig();
    return { mode: c.mode, host: c.host, ...raw };
  } catch (e) {
    return { mode: "invalid", host: "", ...raw, error: (e as Error).message };
  }
}
