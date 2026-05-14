"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedInformedConsentTab from "@/components/shared/medical-records/InformedConsentTab";

export default function InformedConsentTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedInformedConsentTab
      patient={{ name: patient.name, noRM: patient.noRM }}
    />
  );
}
