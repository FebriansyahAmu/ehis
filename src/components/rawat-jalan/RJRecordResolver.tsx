// Resolver rekam medis RJ (pola KunjunganResolver registrasi). Halaman
// /ehis-care/rawat-jalan/:id memuat detail dari mock bila ada; bila id = UUID
// (kunjungan DB hasil pendaftaran), fetch GET /kunjungan/:id + GET /patients/:id
// lalu bangun RJPatientDetail. notFound hanya SETELAH fetch selesai gagal.

"use client";

import { useCallback, useEffect, useState } from "react";
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
  const isUuid = UUID_RE.test(id); // non-UUID & tak ada di mock → notFound (di render, bukan efek).
  const [patient, setPatient] = useState<RJPatientDetail | null>(null);
  const [state, setState] = useState<"loading" | "done">(isUuid ? "loading" : "done");

  // Fetch murni (tanpa setState) — dipakai load awal + refetch pasca-Selesaikan.
  const fetchDetail = useCallback(async (signal?: AbortSignal): Promise<RJPatientDetail | null> => {
    const k = await getKunjungan(id, signal);
    if (k.unit !== "RawatJalan") return null; // hanya kunjungan Rawat Jalan
    const [p, dokterList] = await Promise.all([
      getPatient(k.pasien.id, signal),
      k.dpjpId ? listDpjpTersedia(signal).catch(() => []) : Promise.resolve([]),
    ]);
    const dokterNama = k.dpjpId ? dokterList.find((d) => d.dokterId === k.dpjpId)?.nama : undefined;
    return dtoToRJPatientDetail(k, p, dokterNama);
  }, [id]);

  // Fetch SEKALI per id. Guard set-state via !aborted (StrictMode-safe); setState hanya di .then/.finally.
  useEffect(() => {
    if (!isUuid) return;
    const ac = new AbortController();
    fetchDetail(ac.signal)
      .then((pt) => { if (!ac.signal.aborted) setPatient(pt); })
      .catch(() => { if (!ac.signal.aborted) setPatient(null); })
      .finally(() => { if (!ac.signal.aborted) setState("done"); });
    return () => ac.abort();
  }, [isUuid, fetchDetail]);

  // Refetch ringan (tanpa layar loading) — dipanggil sesudah "Selesaikan" (rekam terkunci).
  const refetch = useCallback(() => {
    void fetchDetail().then((pt) => { if (pt) setPatient(pt); }).catch(() => { /* pertahankan tampilan */ });
  }, [fetchDetail]);

  if (!patient) {
    if (isUuid && state !== "done") return <ResolverLoading />;
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <RJPatientHeader patient={patient} onCompleted={refetch} />
      <RJRecordTabs patient={patient} />
    </div>
  );
}
