// REG0.3 — Resolver pasien: merge patientMasterData (statis) + registrationStore.
// Server render pakai seed (deterministik, no hydration mismatch); setelah mount,
// resolve dari store (pasien baru + overlay kunjungan). notFound hanya bila tak
// ketemu di keduanya SETELAH store ter-hidrasi.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { patientMasterData } from "@/lib/data";
import { getMergedPatient, useRegistrationStore } from "@/lib/registration/registrationStore";
import PatientDashboard from "./PatientDashboard";

function ResolverLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
    </div>
  );
}

export default function PatientResolver({ id }: { id: string }) {
  useRegistrationStore();                 // reaktif terhadap perubahan store
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Pra-mount (termasuk SSR): hanya seed → markup konsisten server/client.
  const patient = mounted ? getMergedPatient(id) : patientMasterData[id];

  if (!patient) {
    if (!mounted) return <ResolverLoading />;   // tunggu store ter-hidrasi
    notFound();
  }

  return <PatientDashboard patient={patient} />;
}
