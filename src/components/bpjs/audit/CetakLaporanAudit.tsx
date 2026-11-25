"use client";

// Cetak laporan audit A4: template dipasang lewat portal sebagai anak langsung <body> dengan kelas
// `.print-area` (konvensi globals.css — saat print hanya area ini yang tampil, warna dipertahankan,
// tabel mengalir ke halaman berikutnya), tersembunyi di layar. Dialog cetak peramban dibuka sesudah
// template terpasang; komponen dilepas lagi saat `afterprint`.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import AuditReportTemplate from "./AuditReportTemplate";

export default function CetakLaporanAudit({
  entries,
  periode,
  keterangan,
  onSelesai,
}: {
  entries: readonly BPJSAuditEntry[];
  periode: { from: string; to: string };
  keterangan?: string;
  onSelesai: () => void;
}) {
  useEffect(() => {
    const selesai = () => onSelesai();
    window.addEventListener("afterprint", selesai, { once: true });
    // Tunggu satu frame agar template (KOP + tabel) sudah tergambar sebelum dialog cetak terbuka.
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", selesai);
    };
  }, [onSelesai]);

  return createPortal(
    <div className="print-area hidden print:block" data-paper="A4" aria-hidden="true">
      <AuditReportTemplate entries={entries} periode={periode} keterangan={keterangan} />
    </div>,
    document.body,
  );
}
