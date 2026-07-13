"use client";

// Tindakan Rawat Jalan = adapter tipis atas shared TindakanTab. Tier tarif RAWAT_JALAN
// (bila belum di-seed di Tarif Matrix → harga null "Belum bertarif", graceful). Recording
// persist ke medicalrecord.TindakanMedis via /kunjungan/:id/tindakan saat kunjunganId UUID.

import type { RJPatientDetail } from "@/lib/data";
import SharedTindakanTab from "@/components/shared/medical-records/TindakanTab";

export default function TindakanTab({ patient }: { patient: RJPatientDetail }) {
  return (
    <SharedTindakanTab
      patient={{ kunjunganId: patient.id }}
      jenisRuangan="RAWAT_JALAN"
      unitLabel="Rawat Jalan"
    />
  );
}
