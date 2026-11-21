// API onboarding / Prerequisites SatuSehat (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: GET /api/v1/fhir/onboarding · POST /api/v1/fhir/onboarding/:jenis ·
// GET /api/v1/fhir/onboarding/:jenis/items[/:localId]. Konsumen: konsol /ehis-fhir (FH9).

import { api } from "@/lib/api/client";
import type {
  OnboardingItemSendDTO, OnboardingJenis, OnboardingRunDTO, OnboardingSummaryDTO,
  PrereqItemDetailDTO, PrereqItemDTO, PrereqItemPageDTO, PrereqJenis,
} from "@/lib/schemas/fhir/onboarding";

export type {
  OnboardingItemSendDTO, OnboardingJenis, OnboardingRunDTO, OnboardingSummaryDTO,
  PrereqItemDetailDTO, PrereqItemDTO, PrereqItemPageDTO, PrereqJenis,
};

export async function getOnboardingSummary(signal?: AbortSignal): Promise<OnboardingSummaryDTO> {
  const { data } = await api.get<OnboardingSummaryDTO>("/fhir/onboarding", { signal });
  return data;
}

/** Jalankan sinkron 1 jenis. Urutan: organization → location; practitioner bebas. */
export async function runOnboarding(jenis: OnboardingJenis, opts: { force?: boolean } = {}): Promise<OnboardingRunDTO> {
  const { data } = await api.post<OnboardingRunDTO>(`/fhir/onboarding/${jenis}`, opts);
  return data;
}

export interface PrereqItemsParams {
  q?: string;
  status?: "semua" | "terpetakan" | "belum";
  page?: number;
  pageSize?: number;
}

/** Daftar data lokal 1 langkah Prerequisites + status peta IHS. */
export async function listPrereqItems(jenis: PrereqJenis, p: PrereqItemsParams, signal?: AbortSignal): Promise<PrereqItemPageDTO> {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status) sp.set("status", p.status);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  const qs = sp.toString();
  const { data } = await api.get<PrereqItemPageDTO>(`/fhir/onboarding/${jenis}/items${qs ? `?${qs}` : ""}`, { signal });
  return data;
}

/**
 * Kirim/cari 1 data ke SatuSehat. `force` = kirim ulang (PUT) walau tak berubah / cari ulang IHS.
 * Penolakan SatuSehat → `item.outcome = "failed"` (bukan exception); exception = konflik/validasi/jaringan EHIS.
 */
export async function sendPrereqItem(
  jenis: PrereqJenis,
  localId: string,
  opts: { force?: boolean } = {},
): Promise<OnboardingItemSendDTO> {
  const { data } = await api.post<OnboardingItemSendDTO>(`/fhir/onboarding/${jenis}/items/${localId}/sync`, opts);
  return data;
}

/** Detail mentah 1 data: master lokal · peta · payload FHIR / request GET. */
export async function getPrereqItem(jenis: PrereqJenis, localId: string, signal?: AbortSignal): Promise<PrereqItemDetailDTO> {
  const { data } = await api.get<PrereqItemDetailDTO>(`/fhir/onboarding/${jenis}/items/${localId}`, { signal });
  return data;
}
