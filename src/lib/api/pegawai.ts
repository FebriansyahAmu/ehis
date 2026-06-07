// API master/pegawai (browser). Tipe DI-REUSE dari schema server (`import type` → nol
// kode server ter-bundle, kontrak FE↔BE selalu selaras). Endpoint: /api/v1/master/pegawai.

import { api } from "@/lib/api/client";
import type {
  CreatePegawaiInput, UpdatePegawaiInput, PegawaiDTO, PegawaiListItemDTO,
} from "@/lib/schemas/pegawai";
import type { PegawaiFormData } from "@/components/master/pengguna/penggunaShared";

export type { PegawaiDTO, PegawaiListItemDTO, UpdatePegawaiInput };

/** Buang string kosong → undefined (field opsional di Zod menolak "" pada beberapa kasus). */
const opt = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

/**
 * PegawaiFormData (wizard) → CreatePegawaiInput (kontrak server).
 * `isDokter` TIDAK dikirim — server menurunkannya dari `profesi`/practitionerId.
 * `tglMasuk` sudah dibuang dari form → tak dikirim.
 */
export function pegawaiFormToCreateInput(d: PegawaiFormData): CreatePegawaiInput {
  const k = d.kontakDarurat;
  return {
    nik: d.nik,
    nip: d.nip.trim(),
    namaLengkap: d.namaLengkap.trim(),
    gelarDepan: opt(d.gelarDepan),
    gelarBelakang: opt(d.gelarBelakang),
    jenisKelamin: d.jenisKelamin,
    agama: opt(d.agama),
    tempatLahir: opt(d.tempatLahir),
    tanggalLahir: opt(d.tanggalLahir),
    statusPegawai: d.statusPegawai,
    profesi: opt(d.profesi),
    unitKerja: opt(d.unitKerja),
    alamat: opt(d.alamat),
    noHp: opt(d.noHp),
    email: opt(d.email),
    kontakDarurat: k && k.nama.trim() ? [{ nama: k.nama, hubungan: k.hubungan, noHp: k.noHp }] : undefined,
  };
}

/** POST /master/pegawai — tambah pegawai (server dedup NIK/NIP). Mengembalikan DTO (mask NIK). */
export async function createPegawai(input: PegawaiFormData, signal?: AbortSignal): Promise<PegawaiDTO> {
  const { data } = await api.post<PegawaiDTO>("/master/pegawai", pegawaiFormToCreateInput(input), { signal });
  return data;
}

/** GET /master/pegawai/:id — detail lengkap (NIK tetap masked). */
export async function getPegawai(id: string, signal?: AbortSignal): Promise<PegawaiDTO> {
  const { data } = await api.get<PegawaiDTO>(`/master/pegawai/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** PATCH /master/pegawai/:id — ubah data pegawai (kirim expectedVersion utk guard). */
export async function updatePegawai(
  id: string,
  input: UpdatePegawaiInput,
  signal?: AbortSignal,
): Promise<PegawaiDTO> {
  const { data } = await api.patch<PegawaiDTO>(`/master/pegawai/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

export interface ListPegawaiParams {
  q?: string;
  status?: string;
  profesi?: string; // exact (mis. "Perawat") — picker tenaga
  aktif?: "true" | "false";
  cursor?: string;
  limit?: number;
}

/** GET /master/pegawai — list/cari (cursor pagination). */
export async function listPegawai(
  params: ListPegawaiParams = {},
  signal?: AbortSignal,
): Promise<{ items: PegawaiListItemDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<PegawaiListItemDTO[]>("/master/pegawai", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}
