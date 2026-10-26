// Kontrak onboarding SatuSehat (FH1): sinkron Organization/Location (resolve-first + create/PUT)
// dan resolve Practitioner (GET-only by NIK). Dipakai route + FE adapter (import type).

import { z } from "zod";

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

export interface OnboardingSummaryDTO {
  mode: "mock" | "sandbox" | "prod";
  orgId: string;
  perJenis: Record<OnboardingJenis, { lokal: number; terpetakan: number; belum: { localId: string; kode: string; nama: string }[] }>;
}
