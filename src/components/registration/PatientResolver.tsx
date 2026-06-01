// REG0.3 — Resolver pasien: merge patientMasterData (statis) + registrationStore +
// fallback API (pasien hasil pendaftaran DB, id = UUID). Server render pakai seed
// (deterministik, no hydration mismatch); setelah mount resolve dari store, lalu —
// bila tetap kosong — fetch /api/v1/patients/:id. notFound hanya bila tak ketemu
// di ketiganya SETELAH store ter-hidrasi & fetch selesai.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { patientMasterData, type PatientMaster } from "@/lib/data";
import { getMergedPatient, useRegistrationStore } from "@/lib/registration/registrationStore";
import { getPatient } from "@/lib/api/patients";
import { dtoToPatientMaster } from "./pasien-list/pasienListApi";
import PatientDashboard from "./PatientDashboard";

// id pasien DB = UUID; id demo/mock = "RM-2025-..." → hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const [apiPatient, setApiPatient] = useState<PatientMaster | null>(null);
  const [apiState, setApiState] = useState<"idle" | "loading" | "done">("idle");
  useEffect(() => setMounted(true), []);

  // Pra-mount (termasuk SSR): hanya seed → markup konsisten server/client.
  const local = mounted ? getMergedPatient(id) : patientMasterData[id];

  // Fallback: id UUID & tak ada di mock/store → fetch pasien DB. Effect jalan SEKALI
  // per id (deps [id] saja) — apiState/local TIDAK boleh jadi dep, kalau tidak
  // setApiState memicu re-run yang meng-abort fetch-nya sendiri (stuck di spinner).
  useEffect(() => {
    if (!UUID_RE.test(id) || getMergedPatient(id) || patientMasterData[id]) return;
    const ac = new AbortController();
    setApiState("loading");
    (async () => {
      try {
        const dto = await getPatient(id, ac.signal);
        if (!ac.signal.aborted) setApiPatient(dtoToPatientMaster(dto));
      } catch {
        if (ac.signal.aborted) return;
        setApiPatient(null);
      } finally {
        if (!ac.signal.aborted) setApiState("done");
      }
    })();
    return () => ac.abort();
  }, [id]);

  const patient = local ?? apiPatient;

  if (!patient) {
    // Tunggu store ter-hidrasi & (bila UUID) fetch API selesai sebelum notFound.
    if (!mounted) return <ResolverLoading />;
    if (UUID_RE.test(id) && apiState !== "done") return <ResolverLoading />;
    notFound();
  }

  return <PatientDashboard patient={patient} />;
}
