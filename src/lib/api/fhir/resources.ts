// API konsol Resource & Kunjungan SatuSehat (browser). Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type {
  EncounterDetailDTO, EncounterListRowDTO, EncounterPageDTO, EncounterResourceDTO, EncounterJobDTO,
  PayloadStatus, ResourceDetailDTO, ResourcePageDTO, ResourceRowDTO, ResourceSummaryDTO,
  EncounterItemSyncDTO, EncounterItemOutcome,
  KUNJUNGAN_SYNC_FILTER, KUNJUNGAN_UNIT,
} from "@/lib/schemas/fhir/resources";

export type {
  EncounterDetailDTO, EncounterListRowDTO, EncounterPageDTO, EncounterResourceDTO, EncounterJobDTO,
  PayloadStatus, ResourceDetailDTO, ResourcePageDTO, ResourceRowDTO, ResourceSummaryDTO,
  EncounterItemSyncDTO, EncounterItemOutcome,
};
export type KunjunganSyncFilter = (typeof KUNJUNGAN_SYNC_FILTER)[number];
export type KunjunganUnit = (typeof KUNJUNGAN_UNIT)[number];

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function getResourceSummary(signal?: AbortSignal): Promise<ResourceSummaryDTO> {
  const { data } = await api.get<ResourceSummaryDTO>("/fhir/resources/summary", { signal });
  return data;
}

export async function listResources(
  p: { type: string; q?: string; page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<ResourcePageDTO> {
  const { data } = await api.get<ResourcePageDTO>(`/fhir/resources${qs(p)}`, { signal });
  return data;
}

export async function getResource(id: string, signal?: AbortSignal): Promise<ResourceDetailDTO> {
  const { data } = await api.get<ResourceDetailDTO>(`/fhir/resources/${id}`, { signal });
  return data;
}

export async function listEncounters(
  p: { q?: string; unit?: KunjunganUnit; sync?: KunjunganSyncFilter; page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<EncounterPageDTO> {
  const { data } = await api.get<EncounterPageDTO>(`/fhir/encounter${qs(p)}`, { signal });
  return data;
}

export async function getEncounterDetail(kunjunganId: string, signal?: AbortSignal): Promise<EncounterDetailDTO> {
  const { data } = await api.get<EncounterDetailDTO>(`/fhir/encounter/${kunjunganId}`, { signal });
  return data;
}

/** Kirim SATU resource milik kunjungan (kartu konsol). Prasyarat belum terkirim → outcome `blocked`. */
export async function sendEncounterItem(
  kunjunganId: string,
  item: { localType: string; localId: string },
): Promise<EncounterItemSyncDTO> {
  const { data } = await api.post<EncounterItemSyncDTO>(`/fhir/encounter/${kunjunganId}/item`, item);
  return data;
}
