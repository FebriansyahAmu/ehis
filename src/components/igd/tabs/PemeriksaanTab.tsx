"use client";

// IGD Pemeriksaan Fisik — tipis: delegasi ke komponen shared (DB-wired), beda unit via props.
import type { IGDPatientDetail } from "@/lib/data";
import PemeriksaanFisikTab from "@/components/shared/medical-records/pemeriksaan/PemeriksaanFisikTab";

export default function PemeriksaanTab({ patient }: { patient: IGDPatientDetail }) {
  return <PemeriksaanFisikTab kunjunganId={patient.id ?? ""} dokterFallback={patient.doctor} />;
}
