// API master Skala Risiko (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/skala-risiko      (GET list+filter · POST create — kode auto SR-NNNN)
//   /api/v1/master/skala-risiko/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateSkalaRisikoInput, UpdateSkalaRisikoInput, SkalaRisikoQuery, SkalaRisikoDTO,
} from "@/lib/schemas/master/skalaRisiko";

export type { CreateSkalaRisikoInput, UpdateSkalaRisikoInput, SkalaRisikoQuery, SkalaRisikoDTO };

/** GET — list terfilter (q/modul/status). */
export async function listSkalaRisiko(query: SkalaRisikoQuery = {}, signal?: AbortSignal): Promise<SkalaRisikoDTO[]> {
  const { data } = await api.get<SkalaRisikoDTO[]>("/master/skala-risiko", {
    query: { q: query.q, modul: query.modul, status: query.status, limit: query.limit },
    signal,
  });
  return data;
}

/** POST — tambah 1 skala (kode auto-gen di server). */
export async function createSkalaRisiko(input: CreateSkalaRisikoInput, signal?: AbortSignal): Promise<SkalaRisikoDTO> {
  const { data } = await api.post<SkalaRisikoDTO>("/master/skala-risiko", input, { signal });
  return data;
}

/** PATCH — ubah 1 skala (parsial). */
export async function updateSkalaRisiko(id: string, input: UpdateSkalaRisikoInput, signal?: AbortSignal): Promise<SkalaRisikoDTO> {
  const { data } = await api.patch<SkalaRisikoDTO>(`/master/skala-risiko/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 skala. */
export async function deleteSkalaRisiko(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/skala-risiko/${encodeURIComponent(id)}`, { signal });
}
