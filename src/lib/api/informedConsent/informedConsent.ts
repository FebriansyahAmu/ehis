// API informed consent (browser) — tab IC, per-item. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/consent (GET list · POST) · /:itemId (DELETE soft).

import { api } from "@/lib/api/client";
import type {
  InformedConsentInput, InformedConsentDTO, InformedConsentDetailDTO,
} from "@/lib/schemas/informedConsent/informedConsent";

export type { InformedConsentInput, InformedConsentDTO, InformedConsentDetailDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/consent`;

export async function getInformedConsent(kunjunganId: string, signal?: AbortSignal): Promise<InformedConsentDTO[]> {
  const { data } = await api.get<InformedConsentDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** GET /:itemId — detail penuh (+ TTD image) untuk cetak/preview. */
export async function getInformedConsentDetail(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<InformedConsentDetailDTO> {
  const { data } = await api.get<InformedConsentDetailDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`,
    { signal },
  );
  return data;
}

export async function addInformedConsent(
  kunjunganId: string,
  input: InformedConsentInput,
  signal?: AbortSignal,
): Promise<InformedConsentDTO> {
  const { data } = await api.post<InformedConsentDTO>(base(kunjunganId), input, { signal });
  return data;
}

export async function deleteInformedConsent(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
