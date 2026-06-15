// API kunjungan (browser). Tipe DI-REUSE dari schema server (`import type`) → kontrak
// FE↔BE selalu selaras, nol kode server ter-bundle. Endpoint: /api/v1/kunjungan.

import { api } from "@/lib/api/client";
import type {
  RegisterKunjunganInput,
  KunjunganDTO,
  KunjunganListItemDTO,
  KunjunganActionName,
} from "@/lib/schemas/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";

export type { RegisterKunjunganInput, KunjunganDTO, KunjunganListItemDTO, KunjunganActionName };

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

/** GET /kunjungan/:id — detail (incl. rujukan + SEP untuk cetak). */
export async function getKunjungan(id: string, signal?: AbortSignal): Promise<KunjunganDTO> {
  const { data } = await api.get<KunjunganDTO>(`/kunjungan/${encodeURIComponent(id)}`, { signal });
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
    },
    { signal: opts?.signal },
  );
  return data;
}

export interface ListKunjunganParams {
  unit?: string;
  status?: string;
  patientId?: string;
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
