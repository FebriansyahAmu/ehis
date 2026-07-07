"use client";

// RJ Rekonsiliasi Obat — tipis: delegasi ke komponen shared (DB-wired), beda unit via props.
// Struktur 3-fase identik IGD (Admisi/Transfer/Discharge). kunjungan UUID → persist ke
// medicalrecord.Rekonsiliasi (append-only per fase); pasien demo (non-UUID) → lokal saja.
import type { RJPatientDetail } from "@/lib/data";
import SharedRekonsiliasTab from "@/components/shared/medical-records/RekonsiliasTab";

export default function RekonsiliasTab({ patient }: { patient: RJPatientDetail }) {
  return <SharedRekonsiliasTab patient={patient} context="rj" />;
}
