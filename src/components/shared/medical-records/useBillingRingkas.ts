"use client";

// Hook bersama untuk BillingMiniWidget + BillingGateBanner (RI discharge).
// Ambil ringkas billing NYATA (status + sisa) via endpoint klinis /kunjungan/:id/billing/ringkas
// (gate clinical.rekammedis:read → dapat dibaca Dokter/Perawat, bukan hanya Kasir).
// Reaktif atas domain "order" (recordBus): order klinis baru/batal → sisa ter-refetch tanpa refresh.
// Pasien demo (non-UUID) → tidak ada billing (data null). Menggantikan billingStore mock (BL6).

import { useEffect, useState } from "react";
import { getBillingRingkas, type BillingRingkasDTO } from "@/lib/api/billing/invoice";
import { useRecordVersion } from "@/lib/realtime/recordBus";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BillingRingkasState {
  data: BillingRingkasDTO | null;
  loading: boolean;
  isPersisted: boolean;
}

/** Tiga keadaan tampilan yang dipakai kedua widget. */
export type BillingKind = "no-invoice" | "lunas" | "outstanding";

/** Turunkan keadaan tampilan dari ringkas: belum ada tagihan · lunas · masih ada sisa. */
export function billingKind(data: BillingRingkasDTO | null): BillingKind {
  if (!data || data.subtotal <= 0) return "no-invoice";
  if (data.sisa <= 0) return "lunas";
  return "outstanding";
}

export function useBillingRingkas(kunjunganId: string): BillingRingkasState {
  const isPersisted = UUID_RE.test(kunjunganId);
  const orderVersion = useRecordVersion(kunjunganId, "order", isPersisted);
  const [data, setData] = useState<BillingRingkasDTO | null>(null);
  const [loading, setLoading] = useState(isPersisted);

  useEffect(() => {
    if (!isPersisted) { setData(null); setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const r = await getBillingRingkas(kunjunganId, ac.signal);
        if (!ac.signal.aborted) setData(r);
      } catch {
        /* diam — widget advisory, kegagalan tak menghalangi rekam medis */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [kunjunganId, isPersisted, orderVersion]);

  return { data, loading, isPersisted };
}
