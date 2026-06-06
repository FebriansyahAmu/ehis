// REG0.3 / G-A — Resolver kunjungan: seperti PatientResolver. Resolve pasien +
// KunjunganRecord by id. Urutan: (1) seed/SSR (deterministik), (2) store overlay,
// (3) fallback API — kunjungan hasil pendaftaran DB (id = UUID) di-fetch via
// GET /kunjungan/:id, konteks pasien via GET /patients/:id (kalau tak ada di store).
// notFound hanya bila tak ketemu di ketiganya SETELAH store ter-hidrasi & fetch selesai.

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { patientMasterData, type PatientMaster, type KunjunganRecord } from "@/lib/data";
import { getMergedPatient, useRegistrationStore } from "@/lib/registration/registrationStore";
import { getKunjungan } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { getDokter } from "@/lib/api/dokter";
import { dtoToPatientMaster } from "./pasien-list/pasienListApi";
import { dtoDetailToKunjunganRecord } from "./patient/kunjunganRiwayatApi";
import KunjunganDetailPage from "./KunjunganDetailPage";

// id kunjungan DB = UUID; id demo/mock = "rj-1"/"...". Hanya UUID yang di-fetch ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const [apiPatient, setApiPatient] = useState<PatientMaster | null>(null);
  const [apiKunjungan, setApiKunjungan] = useState<KunjunganRecord | null>(null);
  const [apiState, setApiState] = useState<"idle" | "loading" | "done">("idle");
  useEffect(() => setMounted(true), []);

  // Pra-mount (termasuk SSR): hanya seed → markup konsisten server/client.
  const localPatient = mounted ? getMergedPatient(noRM) : patientMasterData[noRM];
  const localKunjungan = localPatient?.riwayatKunjungan.find((k) => k.id === kunjunganId);

  // Fallback DB: kunjungan tak ada di mock/store → fetch. Effect jalan SEKALI per
  // (noRM, kunjunganId) — apiState/local TIDAK boleh jadi dep (memicu re-run yang
  // meng-abort fetch-nya sendiri). Guard set-state via !ac.signal.aborted (StrictMode-safe).
  useEffect(() => {
    const lp = getMergedPatient(noRM) ?? patientMasterData[noRM];
    if (lp?.riwayatKunjungan.find((k) => k.id === kunjunganId)) return;
    if (!UUID_RE.test(kunjunganId)) {
      setApiState("done"); // id non-UUID & tak ada di mock → biarkan notFound.
      return;
    }
    const ac = new AbortController();
    setApiState("loading");
    (async () => {
      try {
        const dto = await getKunjungan(kunjunganId, ac.signal);
        if (ac.signal.aborted) return;
        // G-C: resolve nama DPJP dari master Dokter (dpjpId = Dokter.id). RJ tanpa dpjpId →
        // skip (tetap "—"). Profil dokter tak ada / gagal → biarkan fallback "—".
        let dpjpNama: string | undefined;
        if (dto.dpjpId) {
          try {
            const d = await getDokter(dto.dpjpId, ac.signal);
            dpjpNama = d.namaTampil;
          } catch { /* abaikan — fallback "—" */ }
        }
        if (ac.signal.aborted) return;
        setApiKunjungan(dtoDetailToKunjunganRecord(dto, { dpjpNama }));
        // Konteks pasien untuk header/breadcrumb: pakai store kalau ada, else fetch.
        if (!lp) {
          const p = await getPatient(dto.pasien.id, ac.signal);
          if (!ac.signal.aborted) setApiPatient(dtoToPatientMaster(p));
        }
      } catch {
        if (ac.signal.aborted) return;
        setApiKunjungan(null);
      } finally {
        if (!ac.signal.aborted) setApiState("done");
      }
    })();
    return () => ac.abort();
  }, [noRM, kunjunganId]);

  const patient = localPatient ?? apiPatient;
  const kunjungan = localKunjungan ?? apiKunjungan;

  if (!patient || !kunjungan) {
    // Tunggu store ter-hidrasi & fetch API selesai sebelum notFound.
    if (!mounted) return <ResolverLoading />;
    if (apiState !== "done") return <ResolverLoading />;
    notFound();
  }

  return <KunjunganDetailPage patient={patient} kunjungan={kunjungan} />;
}
