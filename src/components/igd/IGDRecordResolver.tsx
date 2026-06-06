// Resolver rekam medis IGD (pola RJRecordResolver). Halaman /ehis-care/igd/:id
// memuat detail dari mock bila ada; bila id = UUID (kunjungan DB hasil pendaftaran),
// fetch GET /kunjungan/:id + GET /patients/:id lalu bangun IGDPatientDetail (klinis
// kosong — schema klinis belum ada). DPJP di-resolve dari master Dokter (dpjpId →
// namaTampil). notFound hanya SETELAH fetch selesai gagal.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { IGDPatientDetail } from "@/lib/data";
import { getKunjungan } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { getDokter } from "@/lib/api/dokter";
import { dtoToIGDPatientDetail } from "./igdDetailApi";
import PatientHeader from "./PatientHeader";
import IGDRecordTabs from "./IGDRecordTabs";

// id kunjungan DB = UUID; id demo/mock = "igd-1"/… → hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ResolverLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
    </div>
  );
}

export default function IGDRecordResolver({ id }: { id: string }) {
  const [patient, setPatient] = useState<IGDPatientDetail | null>(null);
  const [state, setState] = useState<"loading" | "done">("loading");

  // Fetch SEKALI per id. Guard set-state via !aborted (StrictMode-safe).
  useEffect(() => {
    if (!UUID_RE.test(id)) { setState("done"); return; } // non-UUID & tak ada di mock → notFound.
    const ac = new AbortController();
    setState("loading");
    (async () => {
      try {
        const k = await getKunjungan(id, ac.signal);
        if (ac.signal.aborted) return;
        // Hanya kunjungan IGD yang dibuka di modul ini.
        if (k.unit !== "IGD") { setPatient(null); return; }
        const p = await getPatient(k.pasien.id, ac.signal);
        if (ac.signal.aborted) return;
        // Resolve nama DPJP (dpjpId = Dokter.id). Gagal/tak ada → "—".
        let dpjpNama: string | undefined;
        if (k.dpjpId) {
          try {
            const d = await getDokter(k.dpjpId, ac.signal);
            dpjpNama = d.namaTampil;
          } catch { /* abaikan — fallback "—" */ }
        }
        if (ac.signal.aborted) return;
        setPatient(dtoToIGDPatientDetail(k, p, { dpjpNama }));
      } catch {
        if (!ac.signal.aborted) setPatient(null);
      } finally {
        if (!ac.signal.aborted) setState("done");
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (!patient) {
    if (state !== "done") return <ResolverLoading />;
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <PatientHeader patient={patient} />
      <IGDRecordTabs patient={patient} />
    </div>
  );
}
