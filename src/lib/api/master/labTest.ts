// API master Katalog Laboratorium (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/lab-test      (GET list+cursor · POST create)
//   /api/v1/master/lab-test/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateLabTestInput, UpdateLabTestInput, LabTestQuery, LabTestDTO,
} from "@/lib/schemas/master/labTest";

export type { CreateLabTestInput, UpdateLabTestInput, LabTestQuery, LabTestDTO };

export interface LabTestListPage {
  items: LabTestDTO[];
  cursor: string | null;
}

/** GET — list terfilter (q/kategori/status) + keyset cursor. */
export async function listLabTest(query: LabTestQuery = {}, signal?: AbortSignal): Promise<LabTestListPage> {
  const { data, meta } = await api.get<LabTestDTO[]>("/master/lab-test", {
    query: { q: query.q, kategori: query.kategori, status: query.status, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 tes (+parameter). */
export async function createLabTest(input: CreateLabTestInput, signal?: AbortSignal): Promise<LabTestDTO> {
  const { data } = await api.post<LabTestDTO>("/master/lab-test", input, { signal });
  return data;
}

/** PATCH — ubah 1 tes (parsial; parameters = replace-all). */
export async function updateLabTest(id: string, input: UpdateLabTestInput, signal?: AbortSignal): Promise<LabTestDTO> {
  const { data } = await api.patch<LabTestDTO>(`/master/lab-test/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 tes. */
export async function deleteLabTest(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/lab-test/${encodeURIComponent(id)}`, { signal });
}
