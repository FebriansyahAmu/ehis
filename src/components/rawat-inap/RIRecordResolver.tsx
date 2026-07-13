// Resolver rekam medis Rawat Inap (pola IGDRecordResolver). Halaman /ehis-care/rawat-inap/:id
// memuat detail dari mock bila ada; bila id = UUID (kunjungan DB hasil admisi), fetch
// GET /kunjungan/:id + GET /patients/:id + master (tree ruangan/bed, alokasi bed aktif, Dokter)
// lalu bangun RawatInapPatientDetail (klinis kosong → mulai pengisian). DPJP/ruangan/bed/kelas
// diresolusi dari master. notFound hanya SETELAH fetch selesai gagal. Lifecycle (Selesaikan/
// Batal Selesai + lock) dimiliki RIRecordShell — kunjungan DB diteruskan sebagai initialKunjungan.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { RawatInapPatientDetail, RIKelas } from "@/lib/data";
import { getKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { getDokter } from "@/lib/api/dokter";
import { getTree } from "@/lib/api/ruangan";
import { listActiveBedAllocations } from "@/lib/api/bedAllocation";
import type { LocationNode, BedSubRecord } from "@/components/master/ruangan/ruanganShared";
import { riRoomsFromTree, riKelasOf } from "./riLandingShared";
import { dtoToRawatInapPatientDetail } from "./riDetailApi";
import RIRecordShell from "./RIRecordShell";
import RecordGateScreen from "@/components/shared/RecordGateScreen";

// id kunjungan DB = UUID; id demo/mock = "ri-1"/… → hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KELAS_SET = new Set<RIKelas>(["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi"]);

function ResolverLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
    </div>
  );
}

export default function RIRecordResolver({ id }: { id: string }) {
  const [patient, setPatient] = useState<RawatInapPatientDetail | null>(null);
  const [kunjungan, setKunjungan] = useState<KunjunganDTO | null>(null);
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
        // Hanya kunjungan Rawat Inap yang dibuka di modul ini.
        if (k.unit !== "RawatInap") { setPatient(null); return; }

        const [p, tree, allocs] = await Promise.all([
          getPatient(k.pasien.id, ac.signal),
          getTree(ac.signal).catch(() => [] as { type: string }[]),
          listActiveBedAllocations(undefined, ac.signal).catch(() => []),
        ]);
        if (ac.signal.aborted) return;

        // Resolve ruangan + kelas + bed dari master (best-effort).
        const rooms = riRoomsFromTree(tree);
        const bedByIdCode = new Map<string, BedSubRecord>();
        for (const r of rooms) for (const b of r.beds) bedByIdCode.set(b.id, b);
        const room: LocationNode | undefined = k.ruanganId
          ? rooms.find((r) => r.id === k.ruanganId)
          : undefined;
        const alloc = allocs.find((a) => a.kunjunganId === k.id);
        const bed = alloc ? bedByIdCode.get(alloc.bedId) : undefined;
        const kelas: RIKelas = room
          ? riKelasOf(room)
          : k.kelas && KELAS_SET.has(k.kelas as RIKelas) ? (k.kelas as RIKelas) : "Kelas_3";

        // Resolve nama + spesialis DPJP (dpjpId = Dokter.id). Gagal/tak ada → fallback.
        let dpjpNama: string | undefined;
        let spesialis: string | undefined;
        if (k.dpjpId) {
          try {
            const d = await getDokter(k.dpjpId, ac.signal);
            dpjpNama = d.namaTampil;
            spesialis = d.spesialisLabel;
          } catch { /* abaikan — fallback */ }
        }
        if (ac.signal.aborted) return;

        setKunjungan(k);
        setPatient(dtoToRawatInapPatientDetail(k, p, {
          dpjpNama,
          spesialis,
          ruanganNama: room?.name,
          noBed: bed?.kode,
          kelas,
        }));
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

  // Gate akses: order RI yang BELUM diterima bangsal (Registered) / sudah dibatalkan → rekam
  // medis tidak boleh dibuka (tutup jalur URL langsung + "Buka Rekam Medis" registrasi).
  // Pengisian klinis dimulai setelah "Terima Order" (Registered→InService) di worklist bangsal.
  if (kunjungan?.status === "Registered") {
    return (
      <RecordGateScreen
        variant="belum-diterima"
        nama={patient.name}
        noRm={patient.noRM}
        hint='Terima order melalui "Order Masuk — Menunggu Diterima" di worklist bangsal Rawat Inap, lalu rekam medis dapat dibuka.'
        backHref="/ehis-care/rawat-inap"
        backLabel="Ke Worklist Rawat Inap"
      />
    );
  }
  if (kunjungan?.status === "Cancelled") {
    return (
      <RecordGateScreen
        variant="dibatalkan"
        nama={patient.name}
        noRm={patient.noRM}
        backHref="/ehis-care/rawat-inap"
        backLabel="Ke Worklist Rawat Inap"
      />
    );
  }

  return <RIRecordShell patient={patient} initialKunjungan={kunjungan ?? undefined} />;
}
