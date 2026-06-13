// API master Katalog Obat (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/obat      (GET list+cursor · POST create)
//   /api/v1/master/obat/:id  (PATCH · DELETE)
// ObatDTO = ObatRecord FE → konsumen langsung pakai ObatRecord (zero-map).

import { api } from "@/lib/api/client";
import type { ObatRecord } from "@/lib/master/obatMock";
import type {
  CreateObatInput, UpdateObatInput, ObatQuery, ObatDTO,
} from "@/lib/schemas/master/obat";

export type { CreateObatInput, UpdateObatInput, ObatQuery, ObatDTO };

export interface ObatListPage {
  items: ObatDTO[];
  cursor: string | null;
}

/** GET — list terfilter (q/kategori/status) + keyset cursor. */
export async function listObat(query: ObatQuery = {}, signal?: AbortSignal): Promise<ObatListPage> {
  const { data, meta } = await api.get<ObatDTO[]>("/master/obat", {
    query: { q: query.q, kategori: query.kategori, status: query.status, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil seluruh katalog obat sebagai ObatRecord[] (konsumen non-paginasi: mapping hub). */
export async function fetchAllObat(signal?: AbortSignal): Promise<ObatRecord[]> {
  const { items } = await listObat({ limit: 300 }, signal);
  return items;
}

/** POST — tambah 1 obat. */
export async function createObat(input: CreateObatInput, signal?: AbortSignal): Promise<ObatDTO> {
  const { data } = await api.post<ObatDTO>("/master/obat", input, { signal });
  return data;
}

/** PATCH — ubah 1 obat (parsial; kfa = replace utuh). */
export async function updateObat(id: string, input: UpdateObatInput, signal?: AbortSignal): Promise<ObatDTO> {
  const { data } = await api.patch<ObatDTO>(`/master/obat/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 obat. */
export async function deleteObat(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/obat/${encodeURIComponent(id)}`, { signal });
}
