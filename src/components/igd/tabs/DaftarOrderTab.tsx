"use client";

import SharedDaftarOrderTab from "@/components/shared/medical-records/DaftarOrderTab";
import type { IGDPatientDetail } from "@/lib/data";

export default function DaftarOrderTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <SharedDaftarOrderTab
      patient={{
        noRM:        patient.noRM,
        name:        patient.name,
        kunjunganId: patient.id,
        konteks:     "igd",
      }}
    />
  );
}
