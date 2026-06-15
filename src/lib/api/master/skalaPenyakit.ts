// API master Skala Penyakit (browser). Tipe DI-REUSE dari schema skala-risiko (category-agnostic).
// Endpoint:
//   /api/v1/master/skala-penyakit      (GET list+filter · POST create — kode auto SP-NNNN)
//   /api/v1/master/skala-penyakit/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateSkalaRisikoInput, UpdateSkalaRisikoInput, SkalaRisikoQuery, SkalaRisikoDTO,
} from "@/lib/schemas/master/skalaRisiko";

/** GET — list terfilter (q/modul/status). */
export async function listSkalaPenyakit(query: SkalaRisikoQuery = {}, signal?: AbortSignal): Promise<SkalaRisikoDTO[]> {
  const { data } = await api.get<SkalaRisikoDTO[]>("/master/skala-penyakit", {
    query: { q: query.q, modul: query.modul, status: query.status, limit: query.limit },
    signal,
  });
  return data;
}

/** POST — tambah 1 skala (kode auto-gen SP-NNNN di server). */
export async function createSkalaPenyakit(input: CreateSkalaRisikoInput, signal?: AbortSignal): Promise<SkalaRisikoDTO> {
  const { data } = await api.post<SkalaRisikoDTO>("/master/skala-penyakit", input, { signal });
  return data;
}

/** PATCH — ubah 1 skala (parsial). */
export async function updateSkalaPenyakit(id: string, input: UpdateSkalaRisikoInput, signal?: AbortSignal): Promise<SkalaRisikoDTO> {
  const { data } = await api.patch<SkalaRisikoDTO>(`/master/skala-penyakit/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 skala. */
export async function deleteSkalaPenyakit(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/skala-penyakit/${encodeURIComponent(id)}`, { signal });
}
