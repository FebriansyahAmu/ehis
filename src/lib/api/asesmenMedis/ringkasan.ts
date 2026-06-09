// API ringkasan status Asesmen Medis (browser). Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/asesmen/ringkasan (GET — flag terisi per sub-menu).
// Dipanggil sekali saat tab Asesmen Medis dibuka → progress + indikator hijau SubNav
// langsung akurat tanpa harus membuka tiap sub-tab.

import { api } from "@/lib/api/client";
import type { AsesmenRingkasanDTO } from "@/lib/schemas/asesmenMedis/ringkasan";

export type { AsesmenRingkasanDTO };

/** GET — status terisi per sub-menu (anamnesis · riwayat · alergi · skrining · edukasi). */
export async function getAsesmenRingkasan(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<AsesmenRingkasanDTO> {
  const { data } = await api.get<AsesmenRingkasanDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/asesmen/ringkasan`,
    { signal },
  );
  return data;
}
