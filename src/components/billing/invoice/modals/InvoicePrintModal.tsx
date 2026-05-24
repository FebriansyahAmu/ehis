"use client";

import { useState } from "react";
import PrintModalShell from "./print/PrintModalShell";
import InvoiceSheet from "./print/InvoiceSheet";
import type { PaperSize } from "./print/printShared";
import type { InvoiceDetail } from "../invoiceShared";

interface Props {
  open: boolean;
  detail: InvoiceDetail | null;
  onClose: () => void;
}

/**
 * Cetak Struk Tagihan (full invoice) — A5 default (struk kasir),
 * A4 toggle untuk surat resmi.
 *
 * Toolbar di luar `.print-area` (`.no-print`), sheet di dalam `.print-area`.
 * `window.print()` di-trigger dari toolbar Cetak button (lihat PrintModalShell).
 */
export default function InvoicePrintModal({ open, detail, onClose }: Props) {
  const [paper, setPaper] = useState<PaperSize>("A5");

  if (!detail) return null;

  return (
    <PrintModalShell
      open={open}
      title="Cetak Struk Tagihan"
      paper={paper}
      onPaperChange={setPaper}
      onClose={onClose}
    >
      <InvoiceSheet detail={detail} paper={paper} />
    </PrintModalShell>
  );
}
