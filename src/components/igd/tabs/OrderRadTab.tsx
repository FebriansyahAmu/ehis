"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedOrderRadTab from "@/components/shared/medical-records/OrderRadTab";

export default function OrderRadTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedOrderRadTab
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
