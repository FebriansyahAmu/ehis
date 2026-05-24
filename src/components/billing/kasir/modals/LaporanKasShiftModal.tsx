"use client";

import { useState } from "react";
import PrintModalShell from "../../invoice/modals/print/PrintModalShell";
import type { PaperSize } from "../../invoice/modals/print/printShared";
import LaporanKasShiftSheet from "../print/LaporanKasShiftSheet";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";

interface Props {
  open: boolean;
  shift: KasirShift | null;
  onClose: () => void;
}

/**
 * Cetak Laporan Tutup Kas (BL3.4) — A4 default (dokumen arsip resmi).
 * Bisa toggle A5 untuk fit ke printer struk kasir kalau perlu kompak.
 */
export default function LaporanKasShiftModal({ open, shift, onClose }: Props) {
  const [paper, setPaper] = useState<PaperSize>("A4");

  if (!shift) return null;

  return (
    <PrintModalShell
      open={open}
      title="Cetak Laporan Tutup Kas"
      paper={paper}
      onPaperChange={setPaper}
      onClose={onClose}
    >
      <LaporanKasShiftSheet shift={shift} paper={paper} />
    </PrintModalShell>
  );
}
