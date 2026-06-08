// API Asesmen·Riwayat·Penyakit Dahulu (browser). Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/asesmen/penyakit-dahulu (GET terbaru · POST simpan).

import { api } from "@/lib/api/client";
import type { AsesmenPenyakitDahuluInput, AsesmenPenyakitDahuluDTO } from "@/lib/schemas/asesmenMedis/asesmenPenyakitDahulu";

export type { AsesmenPenyakitDahuluInput, AsesmenPenyakitDahuluDTO };

const base = (kunjunganId: string) =>
  `/kunjungan/${encodeURIComponent(kunjunganId)}/asesmen/penyakit-dahulu`;

/** GET — riwayat penyakit dahulu terbaru (null bila belum ada). */
export async function getPenyakitDahulu(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<AsesmenPenyakitDahuluDTO | null> {
  const { data } = await api.get<AsesmenPenyakitDahuluDTO | null>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan riwayat penyakit dahulu (append). */
export async function savePenyakitDahulu(
  kunjunganId: string,
  input: AsesmenPenyakitDahuluInput,
  signal?: AbortSignal,
): Promise<AsesmenPenyakitDahuluDTO> {
  const { data } = await api.post<AsesmenPenyakitDahuluDTO>(base(kunjunganId), input, { signal });
  return data;
}
