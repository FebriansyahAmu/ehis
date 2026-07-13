"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X, CreditCard, Phone, Stethoscope, FileText,
  ChevronRight, Hash, CheckCircle2, Lock, Undo2, AlertTriangle, LogIn, LogOut,
} from "lucide-react";
import type { RJPatientDetail, RJStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { getDiagnosa } from "@/lib/api/diagnosa/diagnosa";
import { transitionKunjungan } from "@/lib/api/kunjungan";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";
import { useRecordVersion } from "@/lib/realtime/recordBus";
import TotalTagihanWidget from "@/components/shared/medical-records/TotalTagihanWidget";
import { STATUS_CFG, POLI_CFG, PENJAMIN_CFG } from "./rjShared";
import { useRJQueue, selesaikanPoli, bukaKembaliPoli } from "@/lib/rawat-jalan/rjQueueStore";
import SelesaikanDialog from "@/components/igd/selesai/SelesaikanDialog";
import BatalSelesaiRJDialog, { type ReopenMode } from "./BatalSelesaiRJDialog";

// id kunjungan DB = UUID; id demo/mock ("rj-1") → diagnosa gate baca prop lokal.
const HDR_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Header status config ───────────────────────────────────

const HEADER_STATUS: Record<RJStatus, {
  stripe: string; topBar: string; identityWash: string; avatarRing: string; pulse?: boolean;
}> = {
  Menunggu_Skrining: { stripe: "bg-amber-400",   topBar: "bg-amber-50/50",   identityWash: "from-amber-50/30",   avatarRing: "ring-amber-200"   },
  Skrining:          { stripe: "bg-sky-500",      topBar: "bg-sky-50/50",     identityWash: "from-sky-50/30",     avatarRing: "ring-sky-200"     },
  Menunggu_Dokter:   { stripe: "bg-orange-500",   topBar: "bg-orange-50/50",  identityWash: "from-orange-50/30",  avatarRing: "ring-orange-200"  },
  Sedang_Diperiksa:  { stripe: "bg-sky-500",      topBar: "bg-sky-50/50",     identityWash: "from-sky-50/30",     avatarRing: "ring-sky-200",   pulse: true },
  Selesai:           { stripe: "bg-emerald-500",  topBar: "bg-emerald-50/40", identityWash: "from-emerald-50/20", avatarRing: "ring-emerald-200" },
};

// ── Date helpers ──────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const pad2 = (n: number) => String(n).padStart(2, "0");

/** ISO date "2025-05-15" → "15 Mei 2025" (split string; hindari shift zona). */
function fmtTglIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const idx = Number(mo) - 1;
  return `${Number(d)} ${MONTHS_SHORT[idx] ?? mo} ${y}`;
}

/** ISO datetime DB (wall-clock UTC, konvensi repo) → { tgl, jam }. */
function fmtKeluarIso(iso: string): { tgl: string; jam: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    tgl: `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    jam: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`,
  };
}

/** Timestamp finalize demo (Date.now, client) → { tgl, jam } lokal. */
function fmtKeluarTs(ts: number): { tgl: string; jam: string } {
  const d = new Date(ts);
  return {
    tgl: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    jam: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

// ── InfoChip ──────────────────────────────────────────────

function InfoChip({ icon: Icon, value, cls }: {
  icon: IconComponent; value: React.ReactNode; cls: string;
}) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs shadow-sm ring-1",
      cls,
    )}>
      <Icon size={11} className="shrink-0" />
      {value}
    </span>
  );
}

// ── Widget 1: Antrian (compact) ───────────────────────────

function AntrianCard({ nomor, status }: { nomor: number; status: RJStatus }) {
  const sc = STATUS_CFG[status];
  return (
    <div className="relative flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-linear-to-br from-slate-700 to-slate-900 px-1.5 py-1.5 shadow-sm">
      <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-300">
        <Hash size={8} /> Antre
      </span>
      <p className="text-2xl font-black leading-none text-white tabular-nums">{nomor || "—"}</p>
      <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", sc.dot, status !== "Selesai" && "animate-pulse")} />
    </div>
  );
}

// ── Widget 2: DPJP (read-only) ────────────────────────────

function DPJPCard({ dokter }: { dokter: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center rounded-lg bg-linear-to-br from-emerald-600 to-emerald-700 px-2.5 py-1.5 shadow-sm">
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-200">
        <Stethoscope size={9} /> DPJP
      </span>
      <p className="mt-0.5 truncate text-sm font-bold leading-tight text-white">{dokter}</p>
    </div>
  );
}

// ── Widget 3: Masuk → Keluar (read-only) ──────────────────

function WaktuCard({ tglMasuk, jamMasuk, keluar }: {
  tglMasuk: string; jamMasuk: string; keluar: { tgl: string; jam: string } | null;
}) {
  return (
    <div className="flex w-56 shrink-0 flex-col justify-center gap-1 rounded-lg bg-linear-to-br from-slate-700 to-slate-900 px-2.5 py-1.5 shadow-sm">
      <div className="flex w-full items-center gap-1.5">
        <LogIn size={11} className="shrink-0 text-emerald-300" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/90">Masuk</span>
        <span className="ml-auto whitespace-nowrap text-xs font-semibold text-white tabular-nums">{fmtTglIso(tglMasuk)} · {jamMasuk}</span>
      </div>
      <div className="h-px bg-white/10" />
      <div className="flex w-full items-center gap-1.5">
        <LogOut size={11} className="shrink-0 text-rose-300" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-rose-300/90">Keluar</span>
        {keluar ? (
          <span className="ml-auto whitespace-nowrap text-xs font-semibold text-white tabular-nums">{keluar.tgl} · {keluar.jam}</span>
        ) : (
          <span className="ml-auto text-[11px] italic text-slate-400">Masih diperiksa</span>
        )}
      </div>
    </div>
  );
}

// ── Finalize & Lock (ANT-RJ) ───────────────────────────────

function FinalizeControl({ patient, selesaiJam, onCompleted }: {
  patient: RJPatientDetail; selesaiJam: string | null; onCompleted?: () => void;
}) {
  const queue = useRJQueue();
  const entry = queue[patient.id];
  const dbLocked = !!patient.lockedAt;               // real DB (kunjungan Completed)
  const demoLocked = entry?.locked ?? false;         // demo (queue store)
  const locked = dbLocked || demoLocked;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batalOpen, setBatalOpen] = useState(false);

  // Diagnosa (gate Selesaikan): pasien DB (UUID) → hitung dari domain Condition DB, reaktif atas
  // penyimpanan di tab Diagnosa (recordBus). Pasien demo → dari prop lokal snapshot.
  const isPersisted = HDR_UUID_RE.test(patient.id);
  const diagVer = useRecordVersion(patient.id, "diagnosa", isPersisted);
  const [dbHasDiagnosa, setDbHasDiagnosa] = useState(false);
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getDiagnosa(patient.id, ac.signal)
      .then((dto) => setDbHasDiagnosa(dto.items.some((i) => !!i.kodeIcd10?.trim())))
      .catch(() => { /* diam — biarkan gate apa adanya */ });
    return () => ac.abort();
  }, [patient.id, isPersisted, diagVer]);

  const hasDiagnosa = isPersisted
    ? dbHasDiagnosa
    : (patient.diagnosa ?? []).some((d) => !!d.kodeIcd10?.trim());

  // Selesaikan → DB (kunjungan complete) utk pasien nyata; demo → store lokal.
  async function handleComplete(disposisi: DisposisiInput, waktuSelesai: string) {
    try {
      await transitionKunjungan(patient.id, "complete", patient.version, { waktuSelesai, disposisi });
      toast.success("Kunjungan diselesaikan", "Rekam medis terkunci");
      onCompleted?.();
    } catch (e) {
      toast.error("Gagal menyelesaikan kunjungan", e instanceof ApiError ? e.message : undefined);
      throw e; // dialog tetap terbuka
    }
  }

  // Batalkan Selesai (reopen) — dua mode. "menyeluruh" mengosongkan tgl keluar (resetSelesai).
  async function handleReopen(mode: ReopenMode, alasan: string) {
    if (!isPersisted) {
      bukaKembaliPoli(patient.id, mode === "menyeluruh");
      toast.info("Penyelesaian dibatalkan", "Pasien demo — perubahan tidak tersimpan");
      return;
    }
    try {
      await transitionKunjungan(patient.id, "reopen", patient.version, {
        alasanReopen: alasan.trim() || undefined,
        resetSelesai: mode === "menyeluruh",
      });
      toast.success(
        "Penyelesaian dibatalkan",
        mode === "menyeluruh"
          ? "Rekam medis dibuka — tetapkan tanggal keluar baru saat menyelesaikan ulang"
          : "Rekam medis dibuka untuk perbaikan input (tanggal keluar dipertahankan)",
      );
      onCompleted?.();
    } catch (e) {
      toast.error("Gagal membatalkan penyelesaian", e instanceof ApiError ? e.message : undefined);
      throw e; // dialog tetap terbuka
    }
  }

  // Pasca "batal selesai — perbaikan pengimputan": tak terkunci TAPI tgl keluar masih ada
  // (selesaiAt dipertahankan) → disposisi lama tetap berlaku. Selesaikan ULANG = kunci ulang
  // LANGSUNG (tanpa form disposisi). "menyeluruh" mengosongkan selesaiAt → jalur form biasa.
  const reopenedKoreksi = isPersisted && !locked && !!patient.selesaiAt;

  // Selesaikan kembali langsung (tanpa disposisi baru) — server pertahankan disposisi terakhir.
  async function handleRelock() {
    try {
      await transitionKunjungan(patient.id, "complete", patient.version, {});
      toast.success("Kunjungan diselesaikan kembali", "Disposisi dipertahankan · rekam medis terkunci");
      onCompleted?.();
    } catch (e) {
      toast.error("Gagal menyelesaikan kunjungan", e instanceof ApiError ? e.message : undefined);
    }
  }

  if (locked) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <Lock size={10} /> Terkunci{selesaiJam ? ` · ${selesaiJam}` : ""}
        </span>
        {/* Batalkan Selesai (reopen) — DB (UUID) & demo; dua mode + high alert. */}
        <button
          type="button"
          onClick={() => setBatalOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <Undo2 size={11} /> Batalkan Selesai
        </button>
        {batalOpen && (
          <BatalSelesaiRJDialog
            patientName={patient.name}
            selesaiAt={patient.selesaiAt ?? null}
            onSubmit={handleReopen}
            onClose={() => setBatalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {!hasDiagnosa && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200"
          title="Diagnosa Utama (Pasti) wajib diisi sebelum kunjungan dapat diselesaikan (syarat klaim)."
        >
          <AlertTriangle size={10} /> Diagnosa belum lengkap
        </span>
      )}
      <button
        type="button"
        disabled={!hasDiagnosa}
        onClick={() => {
          if (!isPersisted) return selesaikanPoli(patient.id);        // demo → store lokal (langsung)
          if (reopenedKoreksi) return void handleRelock();            // perbaikan input → kunci ulang langsung
          setDialogOpen(true);                                        // pertama / menyeluruh → form disposisi
        }}
        title={
          !hasDiagnosa ? "Lengkapi diagnosa ICD-10 dahulu"
          : reopenedKoreksi ? "Kunci ulang — disposisi terakhir dipertahankan (perbaikan input)"
          : "Selesaikan & kunci kunjungan"
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition active:scale-95",
          hasDiagnosa
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "cursor-not-allowed bg-slate-100 text-slate-400",
        )}
      >
        <CheckCircle2 size={12} /> {reopenedKoreksi ? "Selesaikan Kembali" : "Selesaikan"}
      </button>

      {dialogOpen && (
        <SelesaikanDialog
          patientName={patient.name}
          onSubmit={handleComplete}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RJPatientHeader({ patient, onCompleted }: {
  patient: RJPatientDetail; onCompleted?: () => void;
}) {
  const hdr = HEADER_STATUS[patient.status];
  const sc  = STATUS_CFG[patient.status];
  const pc  = POLI_CFG[patient.poli];
  const pj  = PENJAMIN_CFG[patient.penjamin];

  // Keluar/lock — REAL dari DB (kunjungan selesaiAt/lockedAt); fallback store demo (pasien contoh).
  const queue = useRJQueue();
  const demoEntry = queue[patient.id];
  const keluar: { tgl: string; jam: string } | null =
    patient.selesaiAt ? fmtKeluarIso(patient.selesaiAt)
    : (demoEntry?.locked && demoEntry.selesaiAt) ? fmtKeluarTs(demoEntry.selesaiAt)
    : null;
  const selesaiJam = keluar?.jam ?? null;

  const initials = patient.name
    .split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  const penjaminLabel = pj.label + (patient.noBpjs ? ` · ${patient.noBpjs}` : "");

  return (
    <header className="shrink-0 shadow-sm">
      <div className="flex">

        {/* ── Status stripe ── */}
        <div className={cn("w-1.5 shrink-0", hdr.stripe)}>
          {hdr.pulse && (
            <div className="flex h-full items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Breadcrumb */}
          <div className={cn(
            "flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 md:px-4",
            hdr.topBar,
          )}>
            <Link href="/ehis-care/rawat-jalan"
              className="text-xs text-slate-400 transition hover:text-slate-600">
              Rawat Jalan
            </Link>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className={cn("rounded-lg px-1.5 py-0.5 text-[9px] font-bold", pc.badge)}>
              {pc.label}
            </span>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className="font-mono text-xs font-semibold text-slate-500">{patient.noRM}</span>

            <span className={cn(
              "ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              sc.badge,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.dot,
                patient.status !== "Selesai" && "animate-pulse"
              )} />
              {sc.label}
            </span>

            {patient.noBpjs && (
              <Link
                href={`/ehis-eklaim/klaim?pasien=${encodeURIComponent(patient.noRM)}`}
                className="hidden items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200 transition hover:bg-teal-100 sm:flex"
                title="Lihat klaim pasien di E-Klaim"
              >
                E-Klaim ↗
              </Link>
            )}
            <div className="ml-auto flex items-center gap-2">
              <TotalTagihanWidget kunjunganId={patient.id} noRM={patient.noRM} />
              <FinalizeControl patient={patient} selesaiJam={selesaiJam} onCompleted={onCompleted} />
              <Link
                href="/ehis-care/rawat-jalan"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
                aria-label="Tutup"
              >
                <X size={12} />
              </Link>
            </div>
          </div>

          {/* Identity section */}
          <div className="relative bg-white">
            <div className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-r",
              hdr.identityWash, "to-transparent"
            )} />

            <div className="relative grid grid-cols-1 gap-2 px-3 py-2 md:grid-cols-[1fr_480px] md:gap-3 md:px-4">

              {/* Left: avatar + name + info chips */}
              <motion.div
                className="flex flex-col gap-1.5"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ring-2",
                    hdr.avatarRing,
                    patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                  )}>
                    {initials}
                    {hdr.pulse && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
                      {patient.name}
                    </h1>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{patient.age} thn</span>
                      <span className="text-slate-300">·</span>
                      <span>{patient.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{patient.noRM}</span>
                    </p>
                  </div>
                </div>

                {/* Info chips (compact — tanpa Alamat, + No. SEP) */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <InfoChip
                    icon={CreditCard}
                    value={penjaminLabel}
                    cls="bg-emerald-50 ring-emerald-200 text-emerald-800"
                  />
                  {patient.noSep && (
                    <InfoChip
                      icon={FileText}
                      value={<>SEP <span className="font-mono font-semibold">{patient.noSep}</span></>}
                      cls="bg-sky-50 ring-sky-200 text-sky-800"
                    />
                  )}
                  <InfoChip
                    icon={Phone}
                    value={`${patient.namaKeluarga} (${patient.hubunganKeluarga})`}
                    cls="bg-amber-50 ring-amber-200 text-amber-800"
                  />
                </div>
              </motion.div>

              {/* Right: 3 widget — Antrian · DPJP · Masuk→Keluar */}
              <motion.div
                className="hidden gap-2 md:flex"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              >
                <AntrianCard nomor={patient.nomorAntrian} status={patient.status} />
                <DPJPCard dokter={patient.dokter} />
                <WaktuCard tglMasuk={patient.tanggalKunjungan} jamMasuk={patient.waktuDaftar} keluar={keluar} />
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
