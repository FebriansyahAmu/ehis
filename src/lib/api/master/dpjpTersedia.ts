// API master/dpjp-tersedia (browser) — dokter RS + kode DPJP BPJS ter-map untuk picker
// kodeDokter payload BPJS (RencanaKontrol/insert dsb). Gate clinical.rekammedis:read.
// Tipe DI-REUSE dari schema server. Selaras obatTersedia.ts.

import { api } from "@/lib/api/client";
import type { DpjpTersediaDTO } from "@/lib/schemas/bpjs/dpjpMapping";

export type { DpjpTersediaDTO };

/** GET /master/dpjp-tersedia — dokter + kode DPJP BPJS (null = belum di-map). */
export async function listDpjpTersedia(signal?: AbortSignal): Promise<DpjpTersediaDTO[]> {
  const { data } = await api.get<DpjpTersediaDTO[]>("/master/dpjp-tersedia", { signal });
  return data;
}
