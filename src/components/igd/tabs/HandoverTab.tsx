"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedHandoverTab from "@/components/shared/medical-records/HandoverTab";

export default function HandoverTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedHandoverTab
      patient={{
        id: patient.id,
        name: patient.name,
        noRM: patient.noRM,
        subtitle: `${patient.diagnosa[0]?.namaDiagnosis ?? patient.complaint} · Triase ${patient.triage ?? "Belum"}`,
        badge: patient.doctor,
      }}
    />
  );
}
