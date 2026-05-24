"use client";

import { useState } from "react";
import PrintModalShell from "../../invoice/modals/print/PrintModalShell";
import type { PaperSize } from "../../invoice/modals/print/printShared";
import SetoranSlipSheet from "../print/SetoranSlipSheet";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";

interface Props {
  open: boolean;
  shift: KasirShift | null;
  onClose: () => void;
}

/**
 * Cetak Slip Setoran (BL3.4) — A5 default (compact 1-halaman, mudah disimpan
 * di map arsip keuangan). A4 toggle untuk format dokumen resmi.
 */
export default function SetoranSlipPrintModal({ open, shift, onClose }: Props) {
  const [paper, setPaper] = useState<PaperSize>("A5");

  if (!shift) return null;

  return (
    <PrintModalShell
      open={open}
      title="Cetak Slip Setoran Kas"
      paper={paper}
      onPaperChange={setPaper}
      onClose={onClose}
    >
      <SetoranSlipSheet shift={shift} paper={paper} />
    </PrintModalShell>
  );
}
