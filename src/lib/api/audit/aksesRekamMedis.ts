// API Jejak Akses rekam medis (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: GET /api/v1/audit/akses-rekam-medis · GET /api/v1/audit/akses-rekam-medis/pegawai.

import { api } from "@/lib/api/client";
import type {
  AksesJalur,
  AksesPegawaiOptionDTO,
  AksesRekamMedisDTO,
  AksesRekamMedisListDTO,
  AksesSubjekDTO,
} from "@/lib/schemas/audit/aksesRekamMedis";

export type { AksesJalur, AksesPegawaiOptionDTO, AksesRekamMedisDTO, AksesRekamMedisListDTO, AksesSubjekDTO };

export interface JejakAksesParams {
  noRm?: string;
  pegawaiId?: string;
  /** YYYY-MM-DD (WIB). */
  dari?: string;
  sampai?: string;
  cursor?: string;
  limit?: number;
}

function toQuery(p: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** GET /audit/akses-rekam-medis — riwayat akses per pasien ATAU per pegawai (keyset cursor). */
export async function listJejakAkses(p: JejakAksesParams, signal?: AbortSignal): Promise<AksesRekamMedisListDTO> {
  const { data } = await api.get<AksesRekamMedisListDTO>(`/audit/akses-rekam-medis${toQuery(p)}`, { signal });
  if (!data) throw new Error("Respons jejak akses kosong");
  return data;
}

/** GET /audit/akses-rekam-medis/pegawai?q= — cari pegawai (nama/NIP) untuk filter. */
export async function searchPegawaiJejak(q: string, signal?: AbortSignal): Promise<AksesPegawaiOptionDTO[]> {
  const { data } = await api.get<AksesPegawaiOptionDTO[]>(`/audit/akses-rekam-medis/pegawai${toQuery({ q })}`, {
    signal,
  });
  return data ?? [];
}
