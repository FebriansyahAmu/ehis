// API CPPT (browser) — tab CPPT, per-item. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/cppt                  (GET daftar · POST catatan)
//           /api/v1/kunjungan/:id/cppt/:itemId           (PATCH koreksi isi)
//           /api/v1/kunjungan/:id/cppt/:itemId/verify     (POST co-sign DPJP)
//           /api/v1/kunjungan/:id/cppt/:itemId/flag        (PATCH tindak lanjut)

import { api } from "@/lib/api/client";
import type {
  CpptItemInput,
  CpptItemUpdate,
  CpptEntryDTO,
  CpptDTO,
} from "@/lib/schemas/cppt/cppt";

export type { CpptItemInput, CpptItemUpdate, CpptEntryDTO, CpptDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/cppt`;
const item = (k: string, id: string) => `${base(k)}/${encodeURIComponent(id)}`;

export async function getCppt(kunjunganId: string, signal?: AbortSignal): Promise<CpptDTO> {
  const { data } = await api.get<CpptDTO>(base(kunjunganId), { signal });
  return data;
}

export async function addCppt(
  kunjunganId: string,
  input: CpptItemInput,
  signal?: AbortSignal,
): Promise<CpptEntryDTO> {
  const { data } = await api.post<CpptEntryDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** Koreksi isi catatan — membatalkan verifikasi DPJP sebelumnya. */
export async function updateCppt(
  kunjunganId: string,
  itemId: string,
  input: CpptItemUpdate,
  signal?: AbortSignal,
): Promise<CpptEntryDTO> {
  const { data } = await api.patch<CpptEntryDTO>(item(kunjunganId, itemId), input, { signal });
  return data;
}

/** Co-sign DPJP — verifikator & waktu ditetapkan server dari actor. */
export async function verifyCppt(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<CpptEntryDTO> {
  const { data } = await api.post<CpptEntryDTO>(`${item(kunjunganId, itemId)}/verify`, undefined, {
    signal,
  });
  return data;
}

export async function flagCppt(
  kunjunganId: string,
  itemId: string,
  flagged: boolean,
  signal?: AbortSignal,
): Promise<CpptEntryDTO> {
  const { data } = await api.patch<CpptEntryDTO>(
    `${item(kunjunganId, itemId)}/flag`,
    { flagged },
    { signal },
  );
  return data;
}
