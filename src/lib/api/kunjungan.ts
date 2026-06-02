// API kunjungan (browser). Tipe DI-REUSE dari schema server (`import type`) → kontrak
// FE↔BE selalu selaras, nol kode server ter-bundle. Endpoint: /api/v1/kunjungan.

import { api } from "@/lib/api/client";
import type {
  RegisterKunjunganInput,
  KunjunganDTO,
  KunjunganListItemDTO,
} from "@/lib/schemas/kunjungan";

export type { RegisterKunjunganInput, KunjunganDTO, KunjunganListItemDTO };

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

export interface ListKunjunganParams {
  unit?: string;
  status?: string;
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
