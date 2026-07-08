// Resolver rekam medis RJ (pola KunjunganResolver registrasi). Halaman
// /ehis-care/rawat-jalan/:id memuat detail dari mock bila ada; bila id = UUID
// (kunjungan DB hasil pendaftaran), fetch GET /kunjungan/:id + GET /patients/:id
// lalu bangun RJPatientDetail. notFound hanya SETELAH fetch selesai gagal.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { RJPatientDetail } from "@/lib/data";
import { getKunjungan } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { listDpjpTersedia } from "@/lib/api/master/dpjpTersedia";
import { dtoToRJPatientDetail } from "./rjDetailApi";
import RJPatientHeader from "./RJPatientHeader";
import RJRecordTabs from "./RJRecordTabs";

// id kunjungan DB = UUID; id demo/mock = "rj-1"/… → hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ResolverLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
    </div>
  );
}

export default function RJRecordResolver({ id }: { id: string }) {
  const [patient, setPatient] = useState<RJPatientDetail | null>(null);
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
        // Hanya kunjungan Rawat Jalan yang dibuka di modul ini.
        if (k.unit !== "RawatJalan") { setPatient(null); return; }
        // Pasien + resolusi nama DPJP (dpjpId → nama) paralel — pola sama dgn board RJ.
        const [p, dokterList] = await Promise.all([
          getPatient(k.pasien.id, ac.signal),
          k.dpjpId ? listDpjpTersedia(ac.signal).catch(() => []) : Promise.resolve([]),
        ]);
        if (ac.signal.aborted) return;
        const dokterNama = k.dpjpId
          ? dokterList.find((d) => d.dokterId === k.dpjpId)?.nama
          : undefined;
        setPatient(dtoToRJPatientDetail(k, p, dokterNama));
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
      <RJPatientHeader patient={patient} />
      <RJRecordTabs patient={patient} />
    </div>
  );
}
