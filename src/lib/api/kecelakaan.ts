// API Data Kecelakaan (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: /api/v1/kunjungan/:id/kecelakaan.

import { api } from "@/lib/api/client";
import type {
  UpsertKecelakaanInput, KecelakaanDTO, SepJaminanSyncDTO, SuplesiKandidatDTO,
} from "@/lib/schemas/kecelakaan/kecelakaan";
import { emitRecordChange } from "@/lib/realtime/recordBus";

export type { UpsertKecelakaanInput, KecelakaanDTO, SepJaminanSyncDTO, SuplesiKandidatDTO };

/** GET /kunjungan/:id/kecelakaan — data kecelakaan (null bila belum ada). */
export async function getKecelakaan(kunjunganId: string, signal?: AbortSignal): Promise<KecelakaanDTO | null> {
  const { data } = await api.get<KecelakaanDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan`,
    { signal },
  );
  return data;
}

/** POST /kunjungan/:id/kecelakaan — simpan/ganti data kecelakaan (upsert). */
export async function saveKecelakaan(
  kunjunganId: string,
  input: UpsertKecelakaanInput,
  signal?: AbortSignal,
): Promise<{ data: KecelakaanDTO; message?: string }> {
  const r = await api.post<KecelakaanDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan`,
    input,
    { signal },
  );
  return { data: r.data, message: r.message };
}

/** POST /kunjungan/:id/kecelakaan/sync-sep — salin jaminan kecelakaan ke SEP aktif. */
export async function syncKecelakaanToSep(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<{ data: SepJaminanSyncDTO; message?: string }> {
  const r = await api.post<SepJaminanSyncDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan/sync-sep`,
    {},
    { signal },
  );
  emitRecordChange(kunjunganId, "order"); // SEP berubah → segarkan widget terkait
  return { data: r.data, message: r.message };
}

/** GET /kunjungan/:id/kecelakaan/suplesi-kandidat — SEP KLL terbit pasien (kandidat suplesi). */
export async function listSuplesiKandidat(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<SuplesiKandidatDTO[]> {
  const { data } = await api.get<SuplesiKandidatDTO[]>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan/suplesi-kandidat`,
    { signal },
  );
  return data ?? [];
}
