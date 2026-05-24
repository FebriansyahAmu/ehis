"use client";

import { useState } from "react";
import PrintModalShell from "./print/PrintModalShell";
import KwitansiSheet from "./print/KwitansiSheet";
import type { PaperSize } from "./print/printShared";
import type { InvoiceDetail, PaymentRecord } from "../invoiceShared";

interface Props {
  open: boolean;
  detail: InvoiceDetail | null;
  payment: PaymentRecord | null;
  onClose: () => void;
}

/**
 * Cetak Kwitansi per-payment — A5 default (compact 1-halaman),
 * A4 toggle untuk arsip resmi.
 */
export default function KwitansiPrintModal({ open, detail, payment, onClose }: Props) {
  const [paper, setPaper] = useState<PaperSize>("A5");

  if (!detail || !payment) return null;

  return (
    <PrintModalShell
      open={open}
      title="Cetak Kwitansi"
      paper={paper}
      onPaperChange={setPaper}
      onClose={onClose}
    >
      <KwitansiSheet detail={detail} payment={payment} paper={paper} />
    </PrintModalShell>
  );
}
