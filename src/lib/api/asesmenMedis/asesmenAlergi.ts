// API alergi (browser) — MODEL PER-ITEM, per-aksi. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/asesmen/alergi (GET daftar+NKA · POST tambah · PATCH NKA)
//           /api/v1/kunjungan/:id/asesmen/alergi/:itemId (DELETE).

import { api } from "@/lib/api/client";
import type { AlergiItemInput, AlergiItemDTO, AlergiDTO } from "@/lib/schemas/asesmenMedis/asesmenAlergi";

export type { AlergiItemInput, AlergiItemDTO, AlergiDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/alergi`;

/** GET — daftar alergi aktif + assertion NKA. */
export async function getAlergi(kunjunganId: string, signal?: AbortSignal): Promise<AlergiDTO> {
  const { data } = await api.get<AlergiDTO>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 alergen. */
export async function addAlergi(
  kunjunganId: string,
  input: AlergiItemInput,
  signal?: AbortSignal,
): Promise<AlergiItemDTO> {
  const { data } = await api.post<AlergiItemDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete 1 alergen. */
export async function deleteAlergi(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}

/** PATCH — set assertion NKA (true menolak bila masih ada alergi aktif). */
export async function setAlergiNka(
  kunjunganId: string,
  nka: boolean,
  signal?: AbortSignal,
): Promise<AlergiDTO> {
  const { data } = await api.patch<AlergiDTO>(base(kunjunganId), { nka }, { signal });
  return data;
}
