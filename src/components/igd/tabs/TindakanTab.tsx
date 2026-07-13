"use client";

// Tindakan IGD = adapter tipis atas shared TindakanTab (unit-agnostic). Tier tarif IGD,
// seed demo dari IGDPatientDetail.tindakan (pasien mock non-UUID). Recording persist ke
// medicalrecord.TindakanMedis via /kunjungan/:id/tindakan saat kunjunganId UUID.

import type { IGDPatientDetail } from "@/lib/data";
import SharedTindakanTab from "@/components/shared/medical-records/TindakanTab";

export default function TindakanTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedTindakanTab
      patient={{ kunjunganId: patient.id, seed: patient.tindakan }}
      jenisRuangan="IGD"
      unitLabel="IGD"
    />
  );
}
