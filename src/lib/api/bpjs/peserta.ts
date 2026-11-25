// API client (browser) — cek kepesertaan V-Claim lewat BFF. Tipe DI-REUSE dari schema server.
// POST (bukan GET) agar nomor kartu/NIK ada di body, bukan di URL.

import { api } from "@/lib/api/client";
import type { CekPesertaInput, PesertaCekDTO, SumberPeserta } from "@/lib/schemas/bpjs/peserta";

export type { CekPesertaInput, PesertaCekDTO, SumberPeserta };

/** POST /bpjs/peserta/cek — hasil ditemukan atau galat bisnis BPJS; galat lain dilempar (ApiError). */
export async function cekPesertaBpjs(input: CekPesertaInput, signal?: AbortSignal): Promise<PesertaCekDTO> {
  const { data } = await api.post<PesertaCekDTO>("/bpjs/peserta/cek", input, { signal });
  return data;
}
