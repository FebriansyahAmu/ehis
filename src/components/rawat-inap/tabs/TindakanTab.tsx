"use client";

// Tindakan Rawat Inap = adapter tipis atas shared TindakanTab. Tier tarif = kelas kamar pasien
// (RAWAT_INAP:<kelas>; ICU/HCU → ICU). Recording persist ke medicalrecord.TindakanMedis via
// /kunjungan/:id/tindakan saat kunjunganId UUID (gate clinical.tindakan + careUnit RI).

import type { RawatInapPatientDetail, RIKelas } from "@/lib/data";
import SharedTindakanTab from "@/components/shared/medical-records/TindakanTab";

/** RIKelas → tier "Jenis Ruangan" Tarif Matrix. VIP/Kelas_1..3 match langsung; ICU/HCU → ICU;
 *  Isolasi tak ber-tarif tindakan (→ harga null, graceful "Belum bertarif"). */
function riTarifTier(kelas: RIKelas): string {
  if (kelas === "ICU" || kelas === "HCU") return "ICU";
  return `RAWAT_INAP:${kelas}`;
}

export default function TindakanTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedTindakanTab
      patient={{ kunjunganId: patient.id }}
      jenisRuangan={riTarifTier(patient.kelas)}
      unitLabel="Rawat Inap"
    />
  );
}
