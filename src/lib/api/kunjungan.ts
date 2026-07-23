// API kunjungan (browser). Tipe DI-REUSE dari schema server (`import type`) → kontrak
// FE↔BE selalu selaras, nol kode server ter-bundle. Endpoint: /api/v1/kunjungan.

import { api } from "@/lib/api/client";
import type {
  RegisterKunjunganInput,
  ChangePenjaminInput,
  KunjunganDTO,
  KunjunganListItemDTO,
  KunjunganActionName,
} from "@/lib/schemas/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";

export type { RegisterKunjunganInput, ChangePenjaminInput, KunjunganDTO, KunjunganListItemDTO, KunjunganActionName };

export interface RegisterKunjunganResult {
  kunjungan: KunjunganDTO;
  /** Pesan sukses dari server (untuk toast). */
  message?: string;
}

/** POST /kunjungan — Pendaftaran Kunjungan Baru (RJ) + SEP (BPJS, mock terbit). */
export async function registerKunjungan(
  input: RegisterKunjunganInput,
  signal?: AbortSignal,
): Promise<RegisterKunjunganResult> {
  const r = await api.post<KunjunganDTO>("/kunjungan", input, { signal });
  return { kunjungan: r.data, message: r.message };
}

/** POST /kunjungan/:id/penjamin — Ubah Penjamin (ganti penjamin + BPJS terbitkan/ganti SEP). */
export async function changePenjamin(
  id: string,
  input: ChangePenjaminInput,
  signal?: AbortSignal,
): Promise<{ kunjungan: KunjunganDTO; message?: string }> {
  const r = await api.post<KunjunganDTO>(`/kunjungan/${encodeURIComponent(id)}/penjamin`, input, { signal });
  return { kunjungan: r.data, message: r.message };
}

/** GET /kunjungan/:id — detail (incl. rujukan + SEP untuk cetak). */
export async function getKunjungan(id: string, signal?: AbortSignal): Promise<KunjunganDTO> {
  const { data } = await api.get<KunjunganDTO>(`/kunjungan/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** GET /kunjungan/:id/diagnosa-utama — diagnosa UTAMA (primary) kunjungan (pra-isi rujukan kontrol). */
export async function getDiagnosaUtama(
  id: string,
  signal?: AbortSignal,
): Promise<{ kode: string | null; nama: string | null }> {
  const { data } = await api.get<{ kode: string | null; nama: string | null }>(
    `/kunjungan/${encodeURIComponent(id)}/diagnosa-utama`,
    { signal },
  );
  return data;
}

/** PATCH /kunjungan/:id/status — transisi worklist (call/recall/receive/complete/cancel…). */
export async function transitionKunjungan(
  id: string,
  action: KunjunganActionName,
  expectedVersion?: number,
  opts?: {
    bedId?: string;
    waktuSelesai?: string; // "YYYY-MM-DDTHH:mm" — complete/re-complete
    disposisi?: DisposisiInput; // wajib saat complete
    alasanReopen?: string; // opsional saat reopen
    resetSelesai?: boolean; // reopen "perbaikan menyeluruh": kosongkan tgl keluar (default false)
    signal?: AbortSignal;
  },
): Promise<KunjunganDTO> {
  const { data } = await api.patch<KunjunganDTO>(
    `/kunjungan/${encodeURIComponent(id)}/status`,
    {
      action,
      expectedVersion,
      bedId: opts?.bedId,
      waktuSelesai: opts?.waktuSelesai,
      disposisi: opts?.disposisi,
      alasanReopen: opts?.alasanReopen,
      resetSelesai: opts?.resetSelesai,
    },
    { signal: opts?.signal },
  );
  return data;
}

export interface ListKunjunganParams {
  unit?: string;
  status?: string;
  patientId?: string;
  dari?: string; // "YYYY-MM-DD" — filter periode (inklusif)
  sampai?: string; // "YYYY-MM-DD" — filter periode (inklusif)
  cursor?: string;
  limit?: number;
}

/** GET /kunjungan — worklist (cursor pagination). */
export async function listKunjungan(
  params: ListKunjunganParams,
  signal?: AbortSignal,
): Promise<{ items: KunjunganListItemDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<KunjunganListItemDTO[]>("/kunjungan", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}
