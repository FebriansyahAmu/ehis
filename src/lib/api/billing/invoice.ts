// API invoice + pembayaran (browser, Slice 2a). Tipe DI-REUSE dari schema.
// Endpoint di bawah /kunjungan/:id/billing/{invoice,payment} (gate billing.invoice / billing.kasir).

import { api } from "@/lib/api/client";
import type { PaymentInput, PaymentDTO, InvoiceStateDTO } from "@/lib/schemas/billing/payment";

export type { PaymentInput, PaymentDTO, InvoiceStateDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/billing`;

/** State invoice (proyeksi charge + invoice + payment + total/sisa/status). */
export async function getInvoiceState(kunjunganId: string, signal?: AbortSignal): Promise<InvoiceStateDTO> {
  const { data } = await api.get<InvoiceStateDTO>(`${base(kunjunganId)}/invoice`, { signal });
  return data;
}

/** Catat pembayaran (Kasir) → kembali state invoice ter-update. */
export async function recordPayment(
  kunjunganId: string,
  input: PaymentInput,
  signal?: AbortSignal,
): Promise<InvoiceStateDTO> {
  const { data } = await api.post<InvoiceStateDTO>(`${base(kunjunganId)}/payment`, input, { signal });
  return data;
}

/** Daftar pembayaran kunjungan. */
export async function listPayments(kunjunganId: string, signal?: AbortSignal): Promise<PaymentDTO[]> {
  const { data } = await api.get<PaymentDTO[]>(`${base(kunjunganId)}/payment`, { signal });
  return data;
}

/** Void 1 pembayaran → state invoice ter-update. */
export async function voidPayment(
  kunjunganId: string,
  paymentId: string,
  alasan: string,
  signal?: AbortSignal,
): Promise<InvoiceStateDTO> {
  const { data } = await api.post<InvoiceStateDTO>(
    `${base(kunjunganId)}/payment/${encodeURIComponent(paymentId)}/void`,
    { alasan },
    { signal },
  );
  return data;
}
