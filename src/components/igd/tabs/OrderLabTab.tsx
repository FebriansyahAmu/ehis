"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedOrderLabTab from "@/components/shared/medical-records/OrderLabTab";

export default function OrderLabTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedOrderLabTab
      patient={{
        kunjunganId:  patient.id,
        doctor:       patient.doctor,
        name:         patient.name,
        noRM:         patient.noRM,
        age:          patient.age,
        gender:       patient.gender,
        tglOrder:     patient.tglKunjungan,
        unitPengirim: "IGD",
      }}
    />
  );
}
