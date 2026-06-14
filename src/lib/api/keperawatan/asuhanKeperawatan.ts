// API asuhan keperawatan (browser) — tab Keperawatan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/asuhan-keperawatan (GET list · POST) + /:itemId (PATCH · DELETE).

import { api } from "@/lib/api/client";
import type {
  AsuhanKeperawatanInput, AsuhanKeperawatanUpdate, AsuhanKeperawatanDTO,
  EvaluasiInput, EvaluasiShiftDTO,
} from "@/lib/schemas/keperawatan/asuhanKeperawatan";

export type { AsuhanKeperawatanInput, AsuhanKeperawatanUpdate, AsuhanKeperawatanDTO, EvaluasiInput, EvaluasiShiftDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asuhan-keperawatan`;

/** GET — daftar asuhan keperawatan per kunjungan. */
export async function getAsuhanKeperawatan(kunjunganId: string, signal?: AbortSignal): Promise<AsuhanKeperawatanDTO[]> {
  const { data } = await api.get<AsuhanKeperawatanDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 diagnosa keperawatan. */
export async function createAsuhanKeperawatan(
  kunjunganId: string, input: AsuhanKeperawatanInput, signal?: AbortSignal,
): Promise<AsuhanKeperawatanDTO> {
  const { data } = await api.post<AsuhanKeperawatanDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — ubah 1 asuhan (edit / verify / evaluasi shift). */
export async function updateAsuhanKeperawatan(
  kunjunganId: string, itemId: string, input: AsuhanKeperawatanUpdate, signal?: AbortSignal,
): Promise<AsuhanKeperawatanDTO> {
  const { data } = await api.patch<AsuhanKeperawatanDTO>(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 asuhan (entered-in-error). */
export async function deleteAsuhanKeperawatan(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}

const evalBase = (k: string, itemId: string) =>
  `${base(k)}/${encodeURIComponent(itemId)}/evaluasi`;

/** GET — timeline evaluasi shift 1 asuhan. */
export async function getEvaluasiShift(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<EvaluasiShiftDTO[]> {
  const { data } = await api.get<EvaluasiShiftDTO[]>(evalBase(kunjunganId, itemId), { signal });
  return data;
}

/** POST — tambah 1 evaluasi shift. Mengembalikan DTO asuhan ter-refresh (evaluasi[] + statusLuaran). */
export async function addEvaluasiShift(
  kunjunganId: string, itemId: string, input: EvaluasiInput, signal?: AbortSignal,
): Promise<AsuhanKeperawatanDTO> {
  const { data } = await api.post<AsuhanKeperawatanDTO>(evalBase(kunjunganId, itemId), input, { signal });
  return data;
}
