// API master/bmhp-tersedia (browser) — katalog BMHP ter-assign ke lokasi Farmasi untuk tab Order BMHP.
// Gate clinical.tindakan (Dokter/Perawat). Tipe DI-REUSE dari schema server. Selaras obatTersedia.ts.

import { api } from "@/lib/api/client";
import type { BmhpTersediaQuery, BmhpTersediaDTO } from "@/lib/schemas/master/bmhpTersedia";

export type { BmhpTersediaQuery, BmhpTersediaDTO };

/** GET /master/bmhp-tersedia — BMHP tersedia di depo Farmasi (opsional difilter lokasi). */
export async function listBmhpTersedia(
  params: BmhpTersediaQuery = {},
  signal?: AbortSignal,
): Promise<BmhpTersediaDTO[]> {
  const { data } = await api.get<BmhpTersediaDTO[]>("/master/bmhp-tersedia", {
    query: { ruanganKode: params.ruanganKode },
    signal,
  });
  return data;
}
