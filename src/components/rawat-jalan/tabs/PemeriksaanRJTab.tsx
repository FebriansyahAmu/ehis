"use client";

import { useState } from "react";
import type { RJPatientDetail, PemeriksaanFisikEntry } from "@/lib/data";
import StatusFisikPane, {
  type PemeriksaanFormState,
  emptyFormState,
} from "@/components/shared/medical-records/pemeriksaan/StatusFisikPane";

function genId() { return `pf-rj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export default function PemeriksaanRJTab({ patient }: { patient: RJPatientDetail }) {
  const [saved, setSaved] = useState<PemeriksaanFisikEntry | undefined>(patient.pemeriksaanFisik);

  const initial: PemeriksaanFormState | undefined = saved
    ? (({ id: _id, ...rest }) => rest)(saved)
    : emptyFormState();

  function handleSave(data: PemeriksaanFormState) {
    setSaved({ id: saved?.id ?? genId(), ...data });
  }

  return (
    <StatusFisikPane initial={initial} onSave={handleSave} />
  );
}
