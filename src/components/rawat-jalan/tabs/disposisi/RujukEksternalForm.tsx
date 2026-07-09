"use client";

// Rujuk Eksternal — cabang berdasarkan penjamin pasien:
//   Peserta JKN (BPJS_*) → RujukJknForm (payload resmi V-Claim Rujukan/insert · t_rujukan).
//   Non-JKN (Umum / Asuransi / Jamkesda) → RujukUmumForm (surat rujukan konvensional).

import type { RJPatientDetail } from "@/lib/data";
import RujukJknForm from "./RujukJknForm";
import RujukUmumForm from "./RujukUmumForm";
import type { DisposisiResult } from "./shared";

export default function RujukEksternalForm({
  patient,
  onSubmit,
}: {
  patient: RJPatientDetail;
  onSubmit: (r: DisposisiResult) => void;
}) {
  const isJkn = patient.penjamin.startsWith("BPJS");
  return isJkn ? (
    <RujukJknForm patient={patient} onSubmit={onSubmit} />
  ) : (
    <RujukUmumForm patient={patient} onSubmit={onSubmit} />
  );
}
