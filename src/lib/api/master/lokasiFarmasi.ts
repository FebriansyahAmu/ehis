// API master/lokasi-farmasi (browser) — Ruangan kategori Farmasi (depo/apotek) untuk dropdown
// tujuan resep. Gate clinical.resep:read (Dokter/Perawat). Selaras obatTersedia.ts.

import { api } from "@/lib/api/client";

export interface LokasiFarmasi {
  id: string; // UUID lokasi (= master.Location.id) — dipakai overlay stok inventory
  kode: string;
  nama: string;
}

/** GET /master/lokasi-farmasi — depo/apotek aktif (urut nama). */
export async function listLokasiFarmasi(signal?: AbortSignal): Promise<LokasiFarmasi[]> {
  const { data } = await api.get<LokasiFarmasi[]>("/master/lokasi-farmasi", { signal });
  return data;
}
