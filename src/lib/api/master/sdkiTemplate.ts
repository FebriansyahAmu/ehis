// API katalog keperawatan untuk KONSUMEN KLINIS (browser) — template asuhan di tab Keperawatan.
// Endpoint: /api/v1/master/sdki-template (GET, gate clinical.keperawatan:read). Bentuk = SdkiTemplateDTO
// (identik SdkiCatalogItem FE) → langsung dipakai CatalogPanel.

import { api } from "@/lib/api/client";
import type { SdkiTemplateDTO } from "@/lib/schemas/master/sdki";

export type { SdkiTemplateDTO };

/** GET — daftar template asuhan keperawatan (diagnosa SDKI Aktif). */
export async function listSdkiTemplate(signal?: AbortSignal): Promise<SdkiTemplateDTO[]> {
  const { data } = await api.get<SdkiTemplateDTO[]>("/master/sdki-template", { signal });
  return data;
}
