// API outbox SatuSehat (browser). Tipe DI-REUSE dari schema server (`import type`).
// Konsumen: konsol /ehis-fhir (FH9).

import { api } from "@/lib/api/client";
import type { OutboxItemDTO, OutboxRunDTO } from "@/lib/schemas/fhir/outbox";

export type { OutboxItemDTO, OutboxRunDTO };

export async function listOutbox(
  params: { status?: OutboxItemDTO["status"]; kunjunganId?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<OutboxItemDTO[]> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.kunjunganId) sp.set("kunjunganId", params.kunjunganId);
  if (params.limit !== undefined) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const { data } = await api.get<OutboxItemDTO[]>(`/fhir/outbox${q ? `?${q}` : ""}`, { signal });
  return data ?? [];
}

export async function runOutbox(limit = 10): Promise<OutboxRunDTO> {
  const { data } = await api.post<OutboxRunDTO>("/fhir/outbox/run", { limit });
  return data;
}

export async function retryOutboxJob(id: string): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>(`/fhir/outbox/${id}/retry`, {});
  return data;
}

/** Antre sinkron Encounter 1 kunjungan (backfill). */
export async function syncEncounterNow(kunjunganId: string): Promise<{ kunjunganId: string }> {
  const { data } = await api.post<{ kunjunganId: string }>(`/fhir/encounter/${kunjunganId}/sync`, {});
  return data;
}
