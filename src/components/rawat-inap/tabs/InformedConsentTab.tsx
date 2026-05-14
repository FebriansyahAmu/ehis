"use client";

import type { RawatInapPatientDetail } from "@/lib/data";
import SharedInformedConsentTab from "@/components/shared/medical-records/InformedConsentTab";

export default function InformedConsentTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedInformedConsentTab
      patient={{ name: patient.name, noRM: patient.noRM }}
    />
  );
}
