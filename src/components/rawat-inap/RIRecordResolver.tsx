// Resolver rekam medis Rawat Inap (pola IGDRecordResolver). Halaman /ehis-care/rawat-inap/:id
// memuat detail dari mock bila ada; bila id = UUID (kunjungan DB hasil admisi), fetch
// GET /kunjungan/:id + GET /patients/:id + master (tree ruangan/bed, alokasi bed aktif, Dokter)
// lalu bangun RawatInapPatientDetail (klinis kosong → mulai pengisian). DPJP/ruangan/bed/kelas
// diresolusi dari master. notFound hanya SETELAH fetch selesai gagal.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { RawatInapPatientDetail, RIKelas } from "@/lib/data";
import { getKunjungan, transitionKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { getPatient } from "@/lib/api/patients";
import { getDokter } from "@/lib/api/dokter";
import { getTree } from "@/lib/api/ruangan";
import { listActiveBedAllocations } from "@/lib/api/bedAllocation";
import type { LocationNode, BedSubRecord } from "@/components/master/ruangan/ruanganShared";
import { riRoomsFromTree, riKelasOf } from "./riLandingShared";
import { dtoToRawatInapPatientDetail } from "./riDetailApi";
import RIPatientHeader from "./RIPatientHeader";
import RIRecordTabs from "./RIRecordTabs";

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

// Lifecycle kunjungan (pola IGDRecordShell — dipakai lock + transisi complete).
interface Life {
  status: string;
  version: number;
  locked: boolean;
  selesaiAt: string | null;
}
const lifeFrom = (k: KunjunganDTO): Life => ({
  status: k.status,
  version: k.version,
  locked: !!k.lockedAt,
  selesaiAt: k.selesaiAt,
});

export default function RIRecordResolver({ id }: { id: string }) {
  const [patient, setPatient] = useState<RawatInapPatientDetail | null>(null);
  const [state, setState] = useState<"loading" | "done">("loading");
  const [life, setLife] = useState<Life>({ status: "InService", version: 0, locked: false, selesaiAt: null });

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
        setLife(lifeFrom(k));

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

  // Selesaikan kunjungan (persist Disposisi + kunci) dari tab Pasien Pulang.
  // Throw saat gagal → form pemanggil tetap terbuka (pola IGDRecordShell).
  async function handleComplete(disposisi: DisposisiInput, waktuSelesai: string) {
    try {
      const k = await transitionKunjungan(id, "complete", life.version, { waktuSelesai, disposisi });
      setLife(lifeFrom(k));
      toast.success("Kunjungan diselesaikan", "Rekam medis terkunci — tab Pasien Pulang tetap aktif");
    } catch (e) {
      toast.error("Gagal menyelesaikan kunjungan", e instanceof ApiError ? e.message : undefined);
      throw e;
    }
  }

  if (!patient) {
    if (state !== "done") return <ResolverLoading />;
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <RIPatientHeader patient={patient} />
      <RIRecordTabs patient={patient} locked={life.locked} onComplete={handleComplete} />
    </div>
  );
}
