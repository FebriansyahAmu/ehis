// API master Status Enum (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/status-enum           (GET list+filter · POST create — kode auto <PREFIX>-NNN)
//   /api/v1/master/status-enum/:id        (PATCH · DELETE)
//   /api/v1/master/status-enum-tersedia   (GET konsumsi klinis — gate clinical.rekammedis:read)

import { api } from "@/lib/api/client";
import type {
  CreateEnumEntryInput, UpdateEnumEntryInput, EnumQuery, EnumEntryDTO, EnumGroupKeyEnum,
} from "@/lib/schemas/master/statusEnum";

export type { CreateEnumEntryInput, UpdateEnumEntryInput, EnumQuery, EnumEntryDTO };

/** GET — list terfilter (q/groupKey/status). */
export async function listStatusEnum(query: EnumQuery = {}, signal?: AbortSignal): Promise<EnumEntryDTO[]> {
  const { data } = await api.get<EnumEntryDTO[]>("/master/status-enum", {
    query: { q: query.q, groupKey: query.groupKey, status: query.status, limit: query.limit },
    signal,
  });
  return data;
}

/** GET (konsumsi klinis) — entri AKTIF untuk dropdown. Gate `clinical.rekammedis:read`. */
export async function listStatusEnumTersedia(
  query: { groupKey?: EnumGroupKeyEnum; q?: string } = {},
  signal?: AbortSignal,
): Promise<EnumEntryDTO[]> {
  const { data } = await api.get<EnumEntryDTO[]>("/master/status-enum-tersedia", {
    query: { groupKey: query.groupKey, q: query.q },
    signal,
  });
  return data;
}

/** POST — tambah 1 entri (kode auto-gen di server). */
export async function createStatusEnum(input: CreateEnumEntryInput, signal?: AbortSignal): Promise<EnumEntryDTO> {
  const { data } = await api.post<EnumEntryDTO>("/master/status-enum", input, { signal });
  return data;
}

/** PATCH — ubah 1 entri (parsial). */
export async function updateStatusEnum(id: string, input: UpdateEnumEntryInput, signal?: AbortSignal): Promise<EnumEntryDTO> {
  const { data } = await api.patch<EnumEntryDTO>(`/master/status-enum/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 entri. */
export async function deleteStatusEnum(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/status-enum/${encodeURIComponent(id)}`, { signal });
}
