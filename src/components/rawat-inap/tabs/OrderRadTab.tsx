"use client";

import type { RawatInapPatientDetail } from "@/lib/data";
import SharedOrderRadTab from "@/components/shared/medical-records/OrderRadTab";

export default function OrderRadTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedOrderRadTab
      patient={{
        doctor:       patient.dpjp,
        name:         patient.name,
        noRM:         patient.noRM,
        age:          patient.age,
        gender:       patient.gender,
        tglOrder:     patient.tglMasuk,
        unitPengirim: "Rawat Inap",
      }}
    />
  );
}
