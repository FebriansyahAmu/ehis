"use client";

import type { RawatInapPatientDetail } from "@/lib/data";
import SharedOrderLabTab from "@/components/shared/medical-records/OrderLabTab";

export default function OrderLabTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedOrderLabTab
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
