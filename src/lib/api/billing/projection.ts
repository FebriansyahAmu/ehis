// API proyeksi billing (browser) — charge invoice diproyeksikan dari order klinis 1 kunjungan.
// Endpoint: GET /api/v1/kunjungan/:id/billing (gate billing.invoice:read). Tipe DI-REUSE dari schema.

import { api } from "@/lib/api/client";
import type {
  BillingProjectionDTO, BillingChargeDTO, BillingKunjunganRowDTO,
} from "@/lib/schemas/billing/projection";

export type { BillingProjectionDTO, BillingChargeDTO, BillingKunjunganRowDTO };

export async function getBillingProjection(
  kunjunganId: string,
  signal?: AbortSignal,
): Promise<BillingProjectionDTO> {
  const { data } = await api.get<BillingProjectionDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/billing`,
    { signal },
  );
  return data;
}

/** Worklist tagihan kunjungan (proyeksi order) untuk modul billing. */
export async function listBillingKunjungan(
  signal?: AbortSignal,
): Promise<BillingKunjunganRowDTO[]> {
  const { data } = await api.get<BillingKunjunganRowDTO[]>("/billing/kunjungan", { signal });
  return data;
}
