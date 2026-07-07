// API diagnosa (browser) — tab Diagnosa, per-item. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/diagnosa            (GET agregat · POST diagnosis)
//           /api/v1/kunjungan/:id/diagnosa/:itemId    (PATCH · DELETE)
//           /api/v1/kunjungan/:id/diagnosa/prosedur   (POST · DELETE /:itemId)

import { api } from "@/lib/api/client";
import type {
  DiagnosaItemInput,
  DiagnosaItemUpdate,
  ProsedurItemInput,
  DiagnosaItemDTO,
  ProsedurItemDTO,
  DiagnosaDTO,
  DiagnosaSebelumnyaDTO,
} from "@/lib/schemas/diagnosa/diagnosa";

export type {
  DiagnosaItemInput,
  DiagnosaItemUpdate,
  ProsedurItemInput,
  DiagnosaItemDTO,
  ProsedurItemDTO,
  DiagnosaDTO,
  DiagnosaSebelumnyaDTO,
};
export type {
  DiagnosaSebelumnyaEpisodeDTO,
  DiagnosaSebelumnyaItemDTO,
} from "@/lib/schemas/diagnosa/diagnosa";

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/diagnosa`;

export async function getDiagnosa(kunjunganId: string, signal?: AbortSignal): Promise<DiagnosaDTO> {
  const { data } = await api.get<DiagnosaDTO>(base(kunjunganId), { signal });
  return data;
}

/** GET /kunjungan/:id/diagnosa-sebelumnya — diagnosa lintas kunjungan sebelumnya (terbaru dulu). */
export async function getDiagnosaSebelumnya(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<DiagnosaSebelumnyaDTO> {
  const { data } = await api.get<DiagnosaSebelumnyaDTO>(
    `${base(kunjunganId)}-sebelumnya`,
    { signal },
  );
  return data;
}

/** Tambah 1 diagnosis ICD-10 — respons agregat (promosi Utama bisa menggeser baris lain). */
export async function addDiagnosa(
  kunjunganId: string,
  input: DiagnosaItemInput,
  signal?: AbortSignal,
): Promise<DiagnosaDTO> {
  const { data } = await api.post<DiagnosaDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** Ubah tipe/status/alasan/analisa — respons agregat. */
export async function updateDiagnosa(
  kunjunganId: string,
  itemId: string,
  input: DiagnosaItemUpdate,
  signal?: AbortSignal,
): Promise<DiagnosaDTO> {
  const { data } = await api.patch<DiagnosaDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`,
    input,
    { signal },
  );
  return data;
}

export async function deleteDiagnosa(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}

export async function addProsedur(
  kunjunganId: string,
  input: ProsedurItemInput,
  signal?: AbortSignal,
): Promise<ProsedurItemDTO> {
  const { data } = await api.post<ProsedurItemDTO>(`${base(kunjunganId)}/prosedur`, input, {
    signal,
  });
  return data;
}

export async function deleteProsedur(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/prosedur/${encodeURIComponent(itemId)}`, { signal });
}
