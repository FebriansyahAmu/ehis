// API Profil RS (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: /api/v1/master/profil-rs (GET/PUT) + /logo (POST/DELETE).

import { api } from "@/lib/api/client";
import type { UpsertRsProfilInput, RsProfilDTO } from "@/lib/schemas/master/profilRs";

export type { RsProfilDTO, UpsertRsProfilInput };

/** GET profil efektif (default bila belum disimpan). */
export async function getRsProfil(signal?: AbortSignal): Promise<RsProfilDTO> {
  const { data } = await api.get<RsProfilDTO>("/master/profil-rs", { signal });
  return data;
}

/** PUT simpan profil tekstual (upsert singleton). */
export async function saveRsProfil(input: UpsertRsProfilInput, signal?: AbortSignal): Promise<RsProfilDTO> {
  const { data } = await api.patch<RsProfilDTO>("/master/profil-rs", input, { signal });
  return data;
}

/** POST set/ganti logo (data URI base64). */
export async function uploadRsLogo(dataUrl: string, signal?: AbortSignal): Promise<RsProfilDTO> {
  const { data } = await api.post<RsProfilDTO>("/master/profil-rs/logo", { dataUrl }, { signal });
  return data;
}

/** DELETE hapus logo. */
export async function removeRsLogo(signal?: AbortSignal): Promise<RsProfilDTO> {
  const { data } = await api.del<RsProfilDTO>("/master/profil-rs/logo", { signal });
  return data;
}
