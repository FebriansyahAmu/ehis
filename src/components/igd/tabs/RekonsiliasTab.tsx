"use client";

import type { IGDPatientDetail } from "@/lib/data";
import SharedRekonsiliasTab from "@/components/shared/medical-records/RekonsiliasTab";

export default function RekonsiliasTab({ patient }: { patient: IGDPatientDetail }) {
  return <SharedRekonsiliasTab patient={patient} context="igd" />;
}
