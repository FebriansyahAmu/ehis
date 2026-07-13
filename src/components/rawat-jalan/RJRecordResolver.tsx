// Resolver rekam medis RJ (pola KunjunganResolver registrasi). Halaman
// /ehis-care/rawat-jalan/:id memuat detail dari mock bila ada; bila id = UUID
// (kunjungan DB hasil pendaftaran), fetch GET /kunjungan/:id + GET /patients/:id
// lalu bangun RJPatientDetail. notFound hanya SETELAH fetch selesai gagal.
// Gate akses: order yang BELUM diterima poli (Registered/Queued) / dibatalkan → rekam ditolak.

"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { RJPatientDetail } from "@/lib/data";
import { getKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { listDpjpTersedia } from "@/lib/api/master/dpjpTersedia";
import { dtoToRJPatientDetail } from "./rjDetailApi";
import RJPatientHeader from "./RJPatientHeader";
import RJRecordTabs from "./RJRecordTabs";
import RecordGateScreen from "@/components/shared/RecordGateScreen";

// id kunjungan DB = UUID; id demo/mock = "rj-1"/… → hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Resolved {
  patient: RJPatientDetail;
  kunjungan: KunjunganDTO;
}

function ResolverLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
    </div>
  );
}

export default function RJRecordResolver({ id }: { id: string }) {
  const isUuid = UUID_RE.test(id); // non-UUID & tak ada di mock → notFound (di render, bukan efek).
  const [data, setData] = useState<Resolved | null>(null);
  const [state, setState] = useState<"loading" | "done">(isUuid ? "loading" : "done");

  // Fetch murni (tanpa setState) — dipakai load awal + refetch pasca-Selesaikan.
  const fetchDetail = useCallback(async (signal?: AbortSignal): Promise<Resolved | null> => {
    const k = await getKunjungan(id, signal);
    if (k.unit !== "RawatJalan") return null; // hanya kunjungan Rawat Jalan
    const [p, dokterList] = await Promise.all([
      getPatient(k.pasien.id, signal),
      k.dpjpId ? listDpjpTersedia(signal).catch(() => []) : Promise.resolve([]),
    ]);
    const dokterNama = k.dpjpId ? dokterList.find((d) => d.dokterId === k.dpjpId)?.nama : undefined;
    return { patient: dtoToRJPatientDetail(k, p, dokterNama), kunjungan: k };
  }, [id]);

  // Fetch SEKALI per id. Guard set-state via !aborted (StrictMode-safe); setState hanya di .then/.finally.
  useEffect(() => {
    if (!isUuid) return;
    const ac = new AbortController();
    fetchDetail(ac.signal)
      .then((res) => { if (!ac.signal.aborted) setData(res); })
      .catch(() => { if (!ac.signal.aborted) setData(null); })
      .finally(() => { if (!ac.signal.aborted) setState("done"); });
    return () => ac.abort();
  }, [isUuid, fetchDetail]);

  // Refetch ringan (tanpa layar loading) — dipanggil sesudah "Selesaikan" (rekam terkunci).
  const refetch = useCallback(() => {
    void fetchDetail().then((res) => { if (res) setData(res); }).catch(() => { /* pertahankan tampilan */ });
  }, [fetchDetail]);

  if (!data) {
    if (isUuid && state !== "done") return <ResolverLoading />;
    notFound();
  }
  const { patient, kunjungan } = data;

  // Gate akses: pasien HARUS diterima poli dulu ("Terima" di worklist RJ → InService) sebelum
  // rekam medis dibuka. Registered (order masuk) & Queued (dipanggil, belum diterima) ditolak;
  // Cancelled ditolak permanen. Menutup jalur URL langsung + "Buka Rekam Medis" registrasi.
  if (kunjungan.status === "Registered" || kunjungan.status === "Queued") {
    return (
      <RecordGateScreen
        variant="belum-diterima"
        nama={patient.name}
        noRm={patient.noRM}
        hint='Terima pasien melalui worklist Rawat Jalan (panggil pasien, lalu tombol "Terima"), setelah itu rekam medis dapat dibuka.'
        backHref="/ehis-care/rawat-jalan"
        backLabel="Ke Worklist Rawat Jalan"
      />
    );
  }
  if (kunjungan.status === "Cancelled") {
    return (
      <RecordGateScreen
        variant="dibatalkan"
        nama={patient.name}
        noRm={patient.noRM}
        backHref="/ehis-care/rawat-jalan"
        backLabel="Ke Worklist Rawat Jalan"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <RJPatientHeader patient={patient} onCompleted={refetch} />
      <RJRecordTabs patient={patient} />
    </div>
  );
}
