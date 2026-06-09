// API Asesmen·Riwayat·Penyakit Keluarga (browser). Endpoint: /kunjungan/:id/asesmen/penyakit-keluarga.

import { api } from "@/lib/api/client";
import type { AsesmenPenyakitKeluargaInput, AsesmenPenyakitKeluargaDTO } from "@/lib/schemas/asesmenMedis/asesmenPenyakitKeluarga";

export type { AsesmenPenyakitKeluargaInput, AsesmenPenyakitKeluargaDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/penyakit-keluarga`;

export async function getPenyakitKeluarga(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<AsesmenPenyakitKeluargaDTO | null> {
  const { data } = await api.get<AsesmenPenyakitKeluargaDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function savePenyakitKeluarga(
  kunjunganId: string,
  input: AsesmenPenyakitKeluargaInput,
  signal?: AbortSignal,
): Promise<AsesmenPenyakitKeluargaDTO> {
  const { data } = await api.post<AsesmenPenyakitKeluargaDTO>(base(kunjunganId), input, { signal });
  return data;
}
