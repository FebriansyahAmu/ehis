"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedInformedConsentTab from "@/components/shared/medical-records/InformedConsentTab";

export default function InformedConsentTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedInformedConsentTab
      patient={{ id: patient.id, name: patient.name, noRM: patient.noRM, dpjp: patient.doctor }}
    />
  );
}
