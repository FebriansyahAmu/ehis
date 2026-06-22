"use client";

import SharedDaftarOrderTab from "@/components/shared/medical-records/DaftarOrderTab";
import type { RawatInapPatientDetail } from "@/lib/data";

export default function DaftarOrderTab({ patient }: { patient: RawatInapPatientDetail }) {
  return (
    <SharedDaftarOrderTab
      patient={{
        noRM:        patient.noRM,
        name:        patient.name,
        dpjp:        patient.dpjp,
        kunjunganId: patient.id,
        konteks:     "rawat-inap",
      }}
    />
  );
}
