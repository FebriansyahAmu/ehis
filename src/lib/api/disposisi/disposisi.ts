// API disposisi (browser) — tab Pasien Pulang (outcome episode). Tipe DI-REUSE dari schema.
// Baca disposisi terbaru (berlaku). PENULISAN via transitionKunjungan(action "complete").

import { api } from "@/lib/api/client";
import type { DisposisiInput, DisposisiDTO } from "@/lib/schemas/disposisi/disposisi";

export type { DisposisiInput, DisposisiDTO };

/** GET — disposisi terbaru (berlaku) per kunjungan; null bila belum diselesaikan. */
export async function getDisposisi(kunjunganId: string, signal?: AbortSignal): Promise<DisposisiDTO | null> {
  const { data } = await api.get<DisposisiDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/disposisi`,
    { signal },
  );
  return data;
}
