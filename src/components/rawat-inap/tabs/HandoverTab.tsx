"use client";

import type { RawatInapPatientDetail } from "@/lib/data";
import SharedHandoverTab from "@/components/shared/medical-records/HandoverTab";

export default function HandoverTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedHandoverTab
      patient={{
        id: patient.id,
        name: patient.name,
        noRM: patient.noRM,
        subtitle: `${patient.diagnosis} · Hari ke-${patient.hariKe} · ${patient.ruangan} ${patient.noBed}`,
        badge: patient.dpjp,
      }}
    />
  );
}
