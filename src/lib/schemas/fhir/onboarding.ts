// Kontrak onboarding SatuSehat (FH1): sinkron Organization/Location (resolve-first + create/PUT)
// dan resolve Practitioner (GET-only by NIK). Dipakai route + FE adapter (import type).

import { z } from "zod";
import type { PayloadStatus } from "./resources";

export const ONBOARDING_JENIS = ["organization", "location", "practitioner"] as const;
export type OnboardingJenis = (typeof ONBOARDING_JENIS)[number];

export const OnboardingParams = z.object({ jenis: z.enum(ONBOARDING_JENIS) });

export const OnboardingRunInput = z.object({
  /** Practitioner: resolve ulang yang sudah terpetakan (mis. setelah koreksi NIK). Default false. */
  force: z.boolean().optional(),
});
export type OnboardingRunInput = z.infer<typeof OnboardingRunInput>;

export type OnboardingOutcome = "created" | "updated" | "resolved" | "unchanged" | "skipped" | "failed";

export interface OnboardingItemResult {
  localId: string;
  kode: string;
  nama: string;
  outcome: OnboardingOutcome;
  ihsId?: string;
  message?: string;
}

export interface OnboardingRunDTO {
  jenis: OnboardingJenis;
  mode: "mock" | "sandbox" | "prod";
  total: number;
  counts: Record<OnboardingOutcome, number>;
  /** Hanya item yang berubah/gagal/dilewati — `unchanged` diringkas di counts. */
  items: OnboardingItemResult[];
  durationMs: number;
}

// ── Data & detail mentah per langkah Prerequisites (konsol) ──────────────────────

/** Langkah 2–5 Playbook: Organization · Location · Practitioner · Patient. */
export const PREREQ_JENIS = ["organization", "location", "practitioner", "patient"] as const;
export type PrereqJenis = (typeof PREREQ_JENIS)[number];

export const PrereqItemsParams = z.object({ jenis: z.enum(PREREQ_JENIS) });
export const PrereqItemParams = PrereqItemsParams.extend({ localId: z.string().uuid() });

export const PrereqItemsQuery = z.object({
  q: z.string().trim().max(60).optional(),
  status: z.enum(["semua", "terpetakan", "belum"]).default("semua"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});
export type PrereqItemsQuery = z.infer<typeof PrereqItemsQuery>;

export interface PrereqItemDTO {
  localId: string;
  kode: string;
  nama: string;
  /** Keterangan singkat (tipe unit, ruangan + unit, profesi, NIK ada/tidak). */
  sub: string | null;
  aktif: boolean;
  ihsId: string | null;
  lastSyncAt: string | null;
}

export interface PrereqItemPageDTO {
  jenis: PrereqJenis;
  total: number;
  page: number;
  pageSize: number;
  rows: PrereqItemDTO[];
}

export interface PrereqItemDetailDTO {
  jenis: PrereqJenis;
  resourceType: string;
  localId: string;
  kode: string;
  nama: string;
  /** Data master lokal apa adanya (NIK dimasker). */
  local: Record<string, unknown>;
  /** Baris peta ResourceMap di mode aktif (null = belum terpetakan). */
  map: { id: string; ihsId: string; versionId: string | null; hash: string | null; lastSyncAt: string } | null;
  /** Payload FHIR yang dibangun builder kirim (Organization/Location). Null untuk GET-only. */
  payload: unknown | null;
  payloadStatus: PayloadStatus | null;
  payloadNote: string | null;
  /** Request SatuSehat yang akan/telah dipakai (NIK dimasker). */
  request: { method: "GET" | "POST" | "PUT"; path: string } | null;
}

export interface OnboardingSummaryDTO {
  mode: "mock" | "sandbox" | "prod";
  orgId: string;
  perJenis: Record<OnboardingJenis, { lokal: number; terpetakan: number; belum: { localId: string; kode: string; nama: string }[] }>;
  /** Langkah 5 Playbook (Nomor IHS Pasien) — resolve per pasien/batch lewat halaman Pasien & NIK. */
  pasien: { total: number; viaNik: number; terpetakan: number };
}
