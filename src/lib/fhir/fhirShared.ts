/**
 * FH0 — Tipe & konstanta bersama integrasi SatuSehat (FHIR R4).
 *
 * Aman diimpor client maupun server (TANPA secret, tanpa `server-only`). Transport ada di
 * `src/lib/fhir/server/*` (server-only). Aturan: [docs/FHIR-RULES.md](../../../docs/FHIR-RULES.md).
 */

import { Ok, Err, type Result } from "@/lib/eklaim/eklaimShared";

export { Ok, Err };
export type { Result };

export type SatuSehatMode = "mock" | "sandbox" | "prod";

/** Keluarga endpoint SatuSehat (tiap target = path base berbeda di host yang sama). */
export type FhirTarget = "fhir" | "kfa" | "masterdata" | "kyc";

export type FhirMethod = "GET" | "POST" | "PUT" | "PATCH";

// ── Identifier & code system kanonik (R17) ─────────────────

export const FHIR_SYSTEM = {
  nik: "https://fhir.kemkes.go.id/id/nik",
  nikIbu: "https://fhir.kemkes.go.id/id/nik-ibu",
  ihsNumber: "https://fhir.kemkes.go.id/id/ihs-number",
  icd10: "http://hl7.org/fhir/sid/icd-10",
  icd9cm: "http://hl7.org/fhir/sid/icd-9-cm",
  loinc: "http://loinc.org",
  snomed: "http://snomed.info/sct",
  kfa: "http://sys-ids.kemkes.go.id/kfa",
  actCode: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
} as const;

/** Identifier system lokal milik RS: `http://sys-ids.kemkes.go.id/<jenis>/<orgId>`. */
export function orgIdentifierSystem(jenis: "encounter" | "location" | "organization" | "servicerequest" | "specimen" | "observation" | "diagnostic" | "prescription" | "medication" | "acsn" | "allergy" | "composition", orgId: string): string {
  return `http://sys-ids.kemkes.go.id/${jenis}/${orgId}`;
}

// ── FHIR ringkas ───────────────────────────────────────────

export interface FhirResourceBase {
  resourceType: string;
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string; profile?: string[] };
}

export interface OperationOutcomeIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  details?: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  diagnostics?: string;
  expression?: string[];
}

export interface OperationOutcome extends FhirResourceBase {
  resourceType: "OperationOutcome";
  issue: OperationOutcomeIssue[];
}

export interface BundleEntry<R extends FhirResourceBase = FhirResourceBase> {
  fullUrl?: string;
  resource?: R;
  request?: { method: FhirMethod; url: string };
  response?: { status: string; location?: string; etag?: string; lastModified?: string };
}

export interface Bundle<R extends FhirResourceBase = FhirResourceBase> extends FhirResourceBase {
  resourceType: "Bundle";
  type: "searchset" | "transaction" | "transaction-response" | "batch" | "batch-response" | "collection";
  total?: number;
  entry?: BundleEntry<R>[];
}

// ── Error jalur NORMAL (Result) ────────────────────────────
// Config error = fail-loud (throw `FhirConfigError` di server/errors.ts), BUKAN Result.

export type FhirErrorType =
  | "NetworkError" // timeout/DNS/koneksi — retryable
  | "OperationOutcome" // 4xx/5xx berisi OperationOutcome
  | "HttpError" // non-2xx tanpa OperationOutcome valid
  | "AuthError" // gagal token / 401
  | "RateLimited" // 429 atau cooldown token lokal
  | "CircuitOpen"; // circuit breaker terbuka — fail-fast

export interface FhirError {
  type: FhirErrorType;
  status?: number;
  message: string;
  issues?: OperationOutcomeIssue[];
  retryable: boolean;
}

export function isOperationOutcome(v: unknown): v is OperationOutcome {
  return !!v && typeof v === "object" && (v as { resourceType?: unknown }).resourceType === "OperationOutcome"
    && Array.isArray((v as { issue?: unknown }).issue);
}

/** Ringkas issue OperationOutcome → 1 baris (untuk pesan/toast; bukan untuk log PII). */
export function summarizeIssues(issues: OperationOutcomeIssue[] | undefined): string {
  if (!issues?.length) return "";
  return issues
    .map((i) => i.diagnostics || i.details?.text || i.code)
    .filter(Boolean)
    .join("; ");
}

/**
 * Datetime ISO-8601 **UTC** (`…+00:00`) — ketentuan umum playbook SatuSehat RJ/IGD/RI: waktu dikirim dalam
 * UTC+00 (WIB dikurangi 7 jam), contoh resmi `2023-08-23T10:35:00+00:00` (R6, FG-83). Detik dipertahankan,
 * milidetik dibuang.
 */
export function toFhirDateTime(d: Date): string {
  return `${d.toISOString().slice(0, 19)}+00:00`;
}

/**
 * JSON kanonik: key objek diurutkan rekursif (urutan array dipertahankan). Dipakai untuk hash deteksi
 * perubahan payload — hasil sama walau urutan properti di builder berubah (ARSITEKTUR §7).
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      return Object.keys(o).sort().reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = o[k];
        return acc;
      }, {});
    }
    return v;
  });
}
