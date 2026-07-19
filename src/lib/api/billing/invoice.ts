// API invoice + pembayaran (browser, Slice 2a). Tipe DI-REUSE dari schema.
// Endpoint di bawah /kunjungan/:id/billing/{invoice,payment} (gate billing.invoice / billing.kasir).

import { api } from "@/lib/api/client";
import type {
  PaymentInput, PaymentDTO, InvoiceStateDTO, RecentPaymentDTO, PaymentSummaryDTO,
  InvoiceAdjustmentInput, BillingRingkasDTO,
} from "@/lib/schemas/billing/payment";

export type { PaymentInput, PaymentDTO, InvoiceStateDTO, RecentPaymentDTO, PaymentSummaryDTO, InvoiceAdjustmentInput, BillingRingkasDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/billing`;

/** State invoice (proyeksi charge + invoice + payment + total/sisa/status). */
export async function getInvoiceState(kunjunganId: string, signal?: AbortSignal): Promise<InvoiceStateDTO> {
  const { data } = await api.get<InvoiceStateDTO>(`${base(kunjunganId)}/invoice`, { signal });
  return data;
}

/**
 * Ringkas billing (status + sisa) untuk konsumen KLINIS — widget/gate discharge di rekam medis RI.
 * Gate klinis (clinical.rekammedis:read), bukan billing.invoice → dapat dibaca Dokter/Perawat.
 */
export async function getBillingRingkas(kunjunganId: string, signal?: AbortSignal): Promise<BillingRingkasDTO> {
  const { data } = await api.get<BillingRingkasDTO>(`${base(kunjunganId)}/ringkas`, { signal });
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

/** Set penyesuaian invoice level (diskon/materai/PPN) → state invoice ter-update. */
export async function setInvoiceAdjustment(
  kunjunganId: string,
  input: InvoiceAdjustmentInput,
  signal?: AbortSignal,
): Promise<InvoiceStateDTO> {
  const { data } = await api.patch<InvoiceStateDTO>(
    `${base(kunjunganId)}/invoice/adjustment`, input, { signal },
  );
  return data;
}

/** Daftar pembayaran kunjungan. */
export async function listPayments(kunjunganId: string, signal?: AbortSignal): Promise<PaymentDTO[]> {
  const { data } = await api.get<PaymentDTO[]>(`${base(kunjunganId)}/payment`, { signal });
  return data;
}

/** Pembayaran terbaru (feed Kasir), opsional per shift. */
export async function listRecentPayments(
  opts: { shiftId?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<RecentPaymentDTO[]> {
  const params = new URLSearchParams();
  if (opts.shiftId) params.set("shiftId", opts.shiftId);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const { data } = await api.get<RecentPaymentDTO[]>(`/billing/payments/recent${qs ? `?${qs}` : ""}`, { signal });
  return data;
}

/** Ringkasan pembayaran (Dashboard Kasir), per shift dan/atau tanggal (YYYY-MM-DD). */
export async function getPaymentSummary(
  opts: { shiftId?: string; date?: string } = {},
  signal?: AbortSignal,
): Promise<PaymentSummaryDTO> {
  const params = new URLSearchParams();
  if (opts.shiftId) params.set("shiftId", opts.shiftId);
  if (opts.date) params.set("date", opts.date);
  const qs = params.toString();
  const { data } = await api.get<PaymentSummaryDTO>(`/billing/payments/summary${qs ? `?${qs}` : ""}`, { signal });
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
