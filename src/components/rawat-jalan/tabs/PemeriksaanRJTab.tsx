"use client";

// RJ Pemeriksaan Fisik — tipis: delegasi ke komponen shared (DB-wired), beda unit via props.
// kunjungan UUID → persist ke medicalrecord.PemeriksaanFisik (+ Anatomi + Penunjang); demo lokal.
import type { RJPatientDetail } from "@/lib/data";
import PemeriksaanFisikTab from "@/components/shared/medical-records/pemeriksaan/PemeriksaanFisikTab";

export default function PemeriksaanRJTab({ patient }: { patient: RJPatientDetail }) {
  return <PemeriksaanFisikTab kunjunganId={patient.id} dokterFallback={patient.dokter} />;
}
