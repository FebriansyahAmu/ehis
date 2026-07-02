// API Konsultasi (browser) — sisi peminta (tab klinis) + sisi konsultan (worklist RJ).
// Tipe DI-REUSE dari schema server.
// Endpoint peminta : /api/v1/kunjungan/:id/konsultasi (GET · POST) + /:itemId (DELETE batal)
//                    + /:itemId/selesai (POST konfirmasi read-back DPJP).
// Endpoint konsultan: /api/v1/konsultasi (GET worklist) + /:id (GET) + /:id/terima + /:id/jawab.

import { api } from "@/lib/api/client";
import type {
  KonsultasiCreateInput, KonsultasiJawabInput,
  KonsultasiDTO, KonsultasiWorklistDTO,
} from "@/lib/schemas/konsultasi/konsultasi";
import type { KonsultanDTO } from "@/lib/schemas/penugasanRuangan";

export type { KonsultasiCreateInput, KonsultasiJawabInput, KonsultasiDTO, KonsultasiWorklistDTO, KonsultanDTO };

/** GET /master/konsultan-tersedia — dokter aktif ter-assign ke ruangan poli (picker konsultan). */
export async function listKonsultanTersedia(signal?: AbortSignal): Promise<KonsultanDTO[]> {
  const { data } = await api.get<KonsultanDTO[]>("/master/konsultan-tersedia", { signal });
  return data;
}

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/konsultasi`;

// ── Sisi peminta ──────────────────────────────────────────────────────────────

export async function listKonsultasi(kunjunganId: string, signal?: AbortSignal): Promise<KonsultasiDTO[]> {
  const { data } = await api.get<KonsultasiDTO[]>(base(kunjunganId), { signal });
  return data;
}

export async function createKonsultasi(
  kunjunganId: string, input: KonsultasiCreateInput, signal?: AbortSignal,
): Promise<KonsultasiDTO> {
  const { data } = await api.post<KonsultasiDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** Konfirmasi selesai (read-back DPJP peminta). */
export async function selesaiKonsultasi(kunjunganId: string, itemId: string): Promise<KonsultasiDTO> {
  const { data } = await api.post<KonsultasiDTO>(`${base(kunjunganId)}/${encodeURIComponent(itemId)}/selesai`, {});
  return data;
}

/** Batalkan permintaan — hanya saat masih Terkirim. */
export async function batalKonsultasi(kunjunganId: string, itemId: string): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`);
}

// ── Sisi konsultan (worklist) ─────────────────────────────────────────────────

export async function listKonsultasiWorklist(
  status: "aktif" | "semua" | "Terkirim" | "Diterima" | "Dijawab" | "Selesai" = "aktif",
  signal?: AbortSignal,
): Promise<KonsultasiWorklistDTO[]> {
  const { data } = await api.get<KonsultasiWorklistDTO[]>(`/konsultasi?status=${status}`, { signal });
  return data;
}

export async function getKonsultasi(id: string, signal?: AbortSignal): Promise<KonsultasiWorklistDTO> {
  const { data } = await api.get<KonsultasiWorklistDTO>(`/konsultasi/${encodeURIComponent(id)}`, { signal });
  return data;
}

export async function terimaKonsultasi(id: string): Promise<KonsultasiWorklistDTO> {
  const { data } = await api.post<KonsultasiWorklistDTO>(`/konsultasi/${encodeURIComponent(id)}/terima`, {});
  return data;
}

export async function jawabKonsultasi(id: string, input: KonsultasiJawabInput): Promise<KonsultasiWorklistDTO> {
  const { data } = await api.post<KonsultasiWorklistDTO>(`/konsultasi/${encodeURIComponent(id)}/jawab`, input, {});
  return data;
}
