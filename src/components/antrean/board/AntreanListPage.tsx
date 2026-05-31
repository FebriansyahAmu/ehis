"use client";

// ANT2 — Tab Antrean List (Board Loket). Orchestrator: kontrol loket + tabel +
// filter status + pencarian + aksi baris. Reaktif dari antreanStore & loketStore.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkeletonDelay } from "@/components/master/shared";
import DensityToggle, { type DensityLevel } from "@/components/master/mapping/DensityToggle";
import { useAntreanStore, setStatus, batalAntrean, seedAntrean, emitTask } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import {
  useLoketStore,
  recordPanggil,
  recordPanggilUlang,
  logRespon,
  logBatal,
} from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";
import { PasienBaruModal, type PasienBaruPrefill } from "@/components/registration/pasien-baru/PasienBaruModal";
import { LoketControlBar } from "./LoketControlBar";
import { AntreanTable } from "./AntreanTable";
import { BatalModal, type BatalMode } from "./BatalModal";
import { STATUS_FILTERS } from "./boardShared";

/** Deep-link ke dashboard pasien + auto-buka Daftar Kunjungan RJ (ANT4). */
function daftarKunjunganUrl(noRM: string, kodebooking: string): string {
  return `/ehis-registration/pasien/${encodeURIComponent(noRM)}?daftar=rj&kodebooking=${encodeURIComponent(kodebooking)}`;
}

/** Prefill PasienBaruModal dari data antrean walk-in (kiosk). */
function prefillFromAntrean(rec: AntreanRecord): PasienBaruPrefill {
  return {
    nik: rec.pasien.nik,
    nama: rec.pasien.nama,
    tglLahir: rec.pasien.tglLahir,
    noHp: rec.pasien.kontak,
    penjamin:
      rec.caraBayar === "BPJS"
        ? { tipe: "BPJS_Non_PBI", nama: "BPJS Kesehatan Non-PBI", nomor: rec.noKartu }
        : undefined,
  };
}

interface Toast {
  id: number;
  text: string;
}

export function AntreanListPage() {
  const router = useRouter();
  const antrean = useAntreanStore();
  const loket = useLoketStore();
  const loaded = useSkeletonDelay(500);

  const [density, setDensity] = useState<DensityLevel>("comfortable");
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [batalTarget, setBatalTarget] = useState<AntreanRecord | null>(null);
  const [pasienBaruFor, setPasienBaruFor] = useState<AntreanRecord | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Seed contoh saat store kosong → board punya data untuk menampilkan layout.
  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const session = loket.session;

  const all = useMemo<AntreanRecord[]>(
    () => Object.values(antrean.byKode).sort((a, b) => a.angkaAntrean - b.angkaAntrean),
    [antrean.byKode],
  );

  // Filter: jenis sesi loket → status chip → pencarian (nama/RM/no antrean).
  const rows = useMemo(() => {
    const match = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((a) => {
      if (session && session.jenisPasien !== "Semua" && a.jenisPasien !== session.jenisPasien) return false;
      if (match.length > 0 && !match.includes(a.status)) return false;
      if (q) {
        const hay = `${a.nomorAntrean} ${a.pasien.nama} ${a.pasien.noRM ?? ""} ${a.dokter} ${a.poli}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, query, session]);

  const counts = useMemo(() => {
    const base = session && session.jenisPasien !== "Semua"
      ? all.filter((a) => a.jenisPasien === session.jenisPasien)
      : all;
    const map: Record<string, number> = {};
    for (const f of STATUS_FILTERS) {
      map[f.key] = f.match.length === 0 ? base.length : base.filter((a) => f.match.includes(a.status)).length;
    }
    return map;
  }, [all, session]);

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2600);
  };

  // ── Aksi ──────────────────────────────────────────────────

  const handlePanggil = (rec: AntreanRecord) => {
    setStatus(rec.kodebooking, "DipanggilAdmisi");
    recordPanggil(rec.kodebooking, rec.nomorAntrean);
    showToast(`Memanggil ${rec.nomorAntrean} — ${rec.pasien.nama}`);
  };

  // Panggil ulang: pasien sudah dipanggil tapi belum hadir → ulangi panggilan.
  const handlePanggilUlang = (rec: AntreanRecord) => {
    const n = recordPanggilUlang(rec.kodebooking, rec.nomorAntrean);
    showToast(`Panggil ulang ${rec.nomorAntrean} (ke-${n}) — ${rec.pasien.nama}`);
  };

  // ANT4 — Respon Kedatangan mencabang berdasarkan ada/tidaknya No. RM.
  const handleRespon = (rec: AntreanRecord) => {
    logRespon(rec.kodebooking, rec.pasien.nama);
    const norm = rec.pasien.noRM;
    if (norm) {
      // Lama → T3 (check-in). Baru-online (sudah punya norm) → T1 lalu T2.
      if (rec.jenisPasien === "Lama") {
        emitTask(rec.kodebooking, 3);
      } else {
        emitTask(rec.kodebooking, 1);
        emitTask(rec.kodebooking, 2);
      }
      router.push(daftarKunjunganUrl(norm, rec.kodebooking));
      return;
    }
    // Walk-in murni (belum punya norm) → daftar pasien baru dulu.
    setPasienBaruFor(rec);
  };

  // Walk-in selesai didaftarkan → terbit norm → T1+T2 → lanjut Daftar Kunjungan RJ.
  const handlePasienBaruSuccess = (noRM: string) => {
    const rec = pasienBaruFor;
    setPasienBaruFor(null);
    if (!rec) return;
    emitTask(rec.kodebooking, 1);
    emitTask(rec.kodebooking, 2);
    router.push(daftarKunjunganUrl(noRM, rec.kodebooking));
  };

  const handleBatalConfirm = (mode: BatalMode, alasan: string) => {
    if (!batalTarget) return;
    batalAntrean(batalTarget.kodebooking, mode === "TidakHadir" ? "TidakHadir" : "Batal");
    logBatal(batalTarget.nomorAntrean, alasan);
    showToast(`${batalTarget.nomorAntrean} dibatalkan (${mode === "TidakHadir" ? "tidak hadir" : "batal"})`);
    setBatalTarget(null);
  };

  if (!loaded) return <BoardSkeleton />;

  return (
    <div data-density={density} className="flex w-full flex-col gap-5 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800">
            <ListChecks className="h-6 w-6 text-sky-600" />
            Antrean List
          </h1>
          <p className="m-xs text-slate-500">Board loket admisi — antrean onsite (kiosk APM) & online (Mobile JKN).</p>
        </div>
        <DensityToggle density={density} onChange={setDensity} />
      </header>

      <LoketControlBar session={session} shiftLog={loket.shiftLog} />

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 m-tiny font-semibold transition",
                filter === f.key
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 m-mini font-bold tabular-nums",
                  filter === f.key ? "bg-white/20" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / No. RM / No. antrean…"
            className="w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 m-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      <AntreanTable
        rows={rows}
        loketAktif={session !== null}
        panggilan={loket.panggilan}
        onPanggil={handlePanggil}
        onPanggilUlang={handlePanggilUlang}
        onRespon={handleRespon}
        onBatal={setBatalTarget}
      />

      {batalTarget && (
        <BatalModal record={batalTarget} onConfirm={handleBatalConfirm} onClose={() => setBatalTarget(null)} />
      )}

      {/* ANT4 — walk-in murni: daftar pasien baru dulu, lalu lanjut Daftar Kunjungan RJ */}
      <PasienBaruModal
        open={pasienBaruFor !== null}
        prefill={pasienBaruFor ? prefillFromAntrean(pasienBaruFor) : undefined}
        onClose={() => setPasienBaruFor(null)}
        onSuccess={handlePasienBaruSuccess}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 m-sm font-semibold text-white shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-8 w-96 animate-pulse rounded-full bg-slate-100" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
