// API onboarding SatuSehat (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: GET /api/v1/fhir/onboarding · POST /api/v1/fhir/onboarding/:jenis. Konsumen: konsol /ehis-fhir (FH9).

import { api } from "@/lib/api/client";
import type { OnboardingJenis, OnboardingRunDTO, OnboardingSummaryDTO } from "@/lib/schemas/fhir/onboarding";

export type { OnboardingJenis, OnboardingRunDTO, OnboardingSummaryDTO };

export async function getOnboardingSummary(signal?: AbortSignal): Promise<OnboardingSummaryDTO> {
  const { data } = await api.get<OnboardingSummaryDTO>("/fhir/onboarding", { signal });
  return data;
}

/** Jalankan sinkron 1 jenis. Urutan: organization → location; practitioner bebas. */
export async function runOnboarding(jenis: OnboardingJenis, opts: { force?: boolean } = {}): Promise<OnboardingRunDTO> {
  const { data } = await api.post<OnboardingRunDTO>(`/fhir/onboarding/${jenis}`, opts);
  return data;
}
