// API roster petugas Radiologi (browser) — pegawai ter-assign (SDM Assignment) ke Location
// Radiologi. Dipakai cek penerima/verifikator ter-assign (Verifikasi Identitas). Endpoint:
// GET /api/v1/rad/orders/:id/petugas. Selaras api/lab/labRoster.ts.

import { api } from "@/lib/api/client";
import type { RadPetugasDTO } from "@/lib/schemas/rad/radOrder";

export type { RadPetugasDTO };

/** GET — roster petugas Rad utk satu order (pegawai aktif ter-assign ke Radiologi). */
export async function getRadRoster(radId: string, signal?: AbortSignal): Promise<RadPetugasDTO[]> {
  const { data } = await api.get<RadPetugasDTO[]>(`/rad/orders/${encodeURIComponent(radId)}/petugas`, { signal });
  return data;
}
