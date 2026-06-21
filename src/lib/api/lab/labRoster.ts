// API roster petugas Lab (browser) — pegawai ter-assign (SDM Assignment) ke Location
// Laboratorium. Dipakai cek penerima/analis & dropdown validator. Endpoint:
// GET /api/v1/lab/orders/:id/petugas.

import { api } from "@/lib/api/client";
import type { LabPetugasDTO } from "@/lib/schemas/lab/labOrder";

export type { LabPetugasDTO };

/** GET — roster petugas Lab utk satu order (pegawai aktif ter-assign ke Laboratorium). */
export async function getLabRoster(labId: string, signal?: AbortSignal): Promise<LabPetugasDTO[]> {
  const { data } = await api.get<LabPetugasDTO[]>(`/lab/orders/${encodeURIComponent(labId)}/petugas`, { signal });
  return data;
}
