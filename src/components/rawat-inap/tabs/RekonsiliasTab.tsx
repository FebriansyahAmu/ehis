"use client";

import type { RawatInapPatientDetail } from "@/lib/data";
import SharedRekonsiliasTab from "@/components/shared/medical-records/RekonsiliasTab";

export default function RekonsiliasTab({ patient }: { patient: RawatInapPatientDetail }) {
  return <SharedRekonsiliasTab patient={patient} context="ri" />;
}
