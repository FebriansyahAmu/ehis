"use client";

// Rujuk Eksternal — cabang berdasarkan penjamin pasien:
//   Peserta JKN (BPJS_*) → RujukJknForm (payload resmi V-Claim Rujukan/insert · t_rujukan).
//   Non-JKN (Umum / Asuransi / Jamkesda) → RujukUmumForm (surat rujukan konvensional).

import type { RJPatientDetail } from "@/lib/data";
import RujukJknForm from "./RujukJknForm";
import RujukUmumForm from "./RujukUmumForm";

export default function RujukEksternalForm({
  patient,
  onSubmit,
}: {
  patient: RJPatientDetail;
  onSubmit: (r: { noRujukan?: string; noSep?: string }) => void;
}) {
  const isJkn = patient.penjamin.startsWith("BPJS");
  return isJkn ? (
    <RujukJknForm patient={patient} onSubmit={onSubmit} />
  ) : (
    <RujukUmumForm patient={patient} onSubmit={onSubmit} />
  );
}
