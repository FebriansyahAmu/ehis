// REG0.3 — Resolver kunjungan: sama seperti PatientResolver, tapi juga resolve
// KunjunganRecord by id (seed + overlay store).

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { patientMasterData } from "@/lib/data";
import { getMergedPatient, useRegistrationStore } from "@/lib/registration/registrationStore";
import KunjunganDetailPage from "./KunjunganDetailPage";

function ResolverLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
    </div>
  );
}

export default function KunjunganResolver({
  noRM,
  kunjunganId,
}: {
  noRM: string;
  kunjunganId: string;
}) {
  useRegistrationStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const patient = mounted ? getMergedPatient(noRM) : patientMasterData[noRM];

  if (!patient) {
    if (!mounted) return <ResolverLoading />;
    notFound();
  }

  const kunjungan = patient.riwayatKunjungan.find((k) => k.id === kunjunganId);
  if (!kunjungan) {
    if (!mounted) return <ResolverLoading />;
    notFound();
  }

  return <KunjunganDetailPage patient={patient} kunjungan={kunjungan} />;
}
