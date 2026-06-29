// API anamnesis (browser). Tipe DI-REUSE dari schema server (`import type`) → kontrak
// FE↔BE selaras. Endpoint: /api/v1/kunjungan/:id/anamnesis (GET terbaru · POST simpan).

import { api } from "@/lib/api/client";
import type {
  AnamnesisInput, AnamnesisDTO, AnamnesisRiwayatDTO,
} from "@/lib/schemas/asesmenMedis/anamnesis";

export type { AnamnesisInput, AnamnesisDTO, AnamnesisRiwayatDTO };
export type { AnamnesisRiwayatEpisodeDTO } from "@/lib/schemas/asesmenMedis/anamnesis";

/** GET /kunjungan/:id/anamnesis — asesmen anamnesis terbaru (null bila belum ada). */
export async function getAnamnesis(kunjunganId: string, signal?: AbortSignal): Promise<AnamnesisDTO | null> {
  const { data } = await api.get<AnamnesisDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/anamnesis`,
    { signal },
  );
  return data;
}

/** POST /kunjungan/:id/anamnesis — simpan asesmen baru (append). */
export async function saveAnamnesis(
  kunjunganId: string,
  input: AnamnesisInput,
  signal?: AbortSignal,
): Promise<AnamnesisDTO> {
  const { data } = await api.post<AnamnesisDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/anamnesis`,
    input,
    { signal },
  );
  return data;
}

/** GET /kunjungan/:id/anamnesis-sebelumnya — anamnesis terbaru per kunjungan, lintas episode. */
export async function getRiwayatAnamnesis(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<AnamnesisRiwayatDTO> {
  const { data } = await api.get<AnamnesisRiwayatDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/anamnesis-sebelumnya`,
    { signal },
  );
  return data;
}
