"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedHandoverTab from "@/components/shared/medical-records/HandoverTab";

export default function HandoverTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedHandoverTab
      patient={{
        name: patient.name,
        noRM: patient.noRM,
        subtitle: `${patient.diagnosa[0]?.namaDiagnosis ?? patient.complaint} · Triase ${patient.triage}`,
        badge: patient.doctor,
        vitalSigns: {
          tdSistolik: patient.vitalSigns.tdSistolik,
          tdDiastolik: patient.vitalSigns.tdDiastolik,
          nadi: patient.vitalSigns.nadi,
          suhu: patient.vitalSigns.suhu,
          spo2: patient.vitalSigns.spo2,
          skalaNyeri: patient.vitalSigns.skalaNyeri,
        },
      }}
    />
  );
}
