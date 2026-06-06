"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Activity, Shield, Wallet, ArrowRight,
  UserPlus, CalendarDays, Clock, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patientMasterData } from "@/lib/data";
import { listKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import { PasienBaruModal } from "@/components/registration/pasien-baru/PasienBaruModal";

// ── Config ─────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  "Selesai":         "bg-slate-100 text-slate-500",
  "Dalam Perawatan": "bg-emerald-50 text-emerald-700",
  "Menunggu":        "bg-amber-50 text-amber-700",
  "Terdaftar":       "bg-sky-50 text-sky-700",
  "Dibatalkan":      "bg-slate-100 text-slate-400",
  "Kritis":          "bg-rose-50 text-rose-700",
};

const UNIT_STYLE: Record<string, string> = {
  "IGD":         "bg-rose-50 text-rose-600",
  "Rawat Jalan": "bg-sky-50 text-sky-600",
  "Rawat Inap":  "bg-teal-50 text-teal-600",
  "Farmasi":     "bg-emerald-50 text-emerald-600",
};

// ── Kunjungan Terkini (DB) — adapter worklist → baris tabel ─────────────────
// Feed lintas-unit, semua status, urut createdAt desc (default worklist). Ambil N teratas.
const RECENT_LIMIT = 8;
const ALL_STATUS = "Registered,Queued,InService,Completed,Closed,Billed,Claimed,Cancelled";

const UNIT_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
const STATUS_LABEL: Record<string, string> = {
  Registered: "Terdaftar", Queued: "Menunggu", InService: "Dalam Perawatan",
  Completed: "Selesai", Closed: "Selesai", Billed: "Selesai", Claimed: "Selesai",
  Cancelled: "Dibatalkan",
};

interface RecentVisit {
  id: string;
  name: string;
  noRM: string;
  unit: string;
  status: string;
  time: string;
}

function dtoToRecentVisit(d: KunjunganListItemDTO): RecentVisit {
  return {
    id: d.id,
    name: d.pasien.nama,
    noRM: d.pasien.noRm,
    unit: UNIT_LABEL[d.unit] ?? d.unit,
    status: STATUS_LABEL[d.status] ?? d.status,
    // waktuKunjungan disimpan apa-adanya (wall-clock dianggap UTC) → tampilkan UTC.
    time: new Date(d.waktuKunjungan).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
  };
}

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-3 w-28" />
        </div>
        <Bone className="h-8 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-0 overflow-hidden rounded-2xl lg:col-span-2">
          <Bone className="h-12 rounded-t-2xl" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="mt-px h-10 rounded-none" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Bone className="h-44 rounded-2xl" />
          <Bone className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  iconCls: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, sub, iconCls, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconCls)}>
          <Icon size={13} />
        </span>
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-black leading-none text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </motion.div>
  );
}

// ── Penjamin Distribution ──────────────────────────────────

interface PenjaminDistProps {
  bpjsCount: number;
  umumCount: number;
  total: number;
}

function PenjaminDist({ bpjsCount, umumCount, total }: PenjaminDistProps) {
  const bpjsPct = Math.round((bpjsCount / total) * 100);
  const umumPct = 100 - bpjsPct;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Segmented bar — animates as one unit expanding left→right */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="flex h-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          <div className="h-full bg-sky-500" style={{ width: `${bpjsPct}%` }} />
          <div className="h-full flex-1 bg-slate-300" />
        </motion.div>
      </div>

      {/* Legend cards */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { label: "BPJS / JKN", count: bpjsCount, pct: bpjsPct, dot: "bg-sky-500", bg: "bg-sky-50", num: "text-sky-700" },
          { label: "Umum",       count: umumCount,  pct: umumPct,  dot: "bg-slate-300", bg: "bg-slate-50", num: "text-slate-600" },
        ] as const).map(({ label, count, pct, dot, bg, num }) => (
          <div key={label} className={cn("rounded-xl p-3", bg)}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
              <span className="text-[10px] font-medium text-slate-500">{label}</span>
            </div>
            <p className={cn("text-xl font-black leading-none", num)}>{pct}%</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{count} dari {total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Visit Row ──────────────────────────────────────────────

function VisitRow({ p, index }: { p: RecentVisit; index: number }) {
  const initials = p.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.055, ease: "easeOut" }}
    >
      <Link
        href={`/ehis-registration/pasien/${encodeURIComponent(p.noRM)}`}
        className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-teal-50/60"
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[9px] font-black",
            p.unit === "IGD" ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700",
          )}
        >
          {initials}
        </div>

        {/* Name + RM */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-teal-700">
            {p.name}
          </p>
          <p className="font-mono text-[10px] text-slate-400">{p.noRM}</p>
        </div>

        {/* Badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-semibold", UNIT_STYLE[p.unit] ?? "bg-slate-50 text-slate-500")}>
            {p.unit}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", STATUS_STYLE[p.status] ?? "bg-slate-100 text-slate-500")}>
            {p.status}
          </span>
        </div>

        {/* Time */}
        <div className="flex shrink-0 items-center gap-1">
          <Clock size={9} className="text-slate-300" />
          <span className="text-[10px] text-slate-400">{p.time}</span>
        </div>

        <ChevronRight size={11} className="shrink-0 text-slate-300 transition-colors group-hover:text-teal-400" />
      </Link>
    </motion.div>
  );
}

// ── Quick Actions ──────────────────────────────────────────

interface QuickActionsProps {
  onDaftarBaru: () => void;
}

function QuickActions({ onDaftarBaru }: QuickActionsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold text-slate-800">Aksi Cepat</p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onDaftarBaru}
          className="flex items-center gap-2.5 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98]"
        >
          <UserPlus size={13} className="shrink-0" />
          Daftar Pasien Baru
        </button>
        <Link
          href="/ehis-registration/antrian"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <CalendarDays size={13} className="shrink-0" />
          Lihat Antrian
        </Link>
        <Link
          href="/ehis-registration/pasien"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <Users size={13} className="shrink-0" />
          Daftar Semua Pasien
        </Link>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function RegistrationBerandaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [recent, setRecent] = useState<RecentVisit[]>([]);
  const [recentError, setRecentError] = useState(false);
  const patients = useMemo(() => Object.values(patientMasterData), []);

  // Kunjungan Terkini dari DB (worklist lintas-unit). Skeleton sampai fetch tuntas.
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    listKunjungan({ status: ALL_STATUS, limit: RECENT_LIMIT }, ac.signal)
      .then(({ items }) => { if (!cancelled) setRecent(items.map(dtoToRecentVisit)); })
      .catch((e) => {
        if (!cancelled && !(e instanceof DOMException && e.name === "AbortError")) setRecentError(true);
      })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; ac.abort(); };
  }, []);

  const stats = useMemo(() => {
    const aktif = patients.filter((p) =>
      p.riwayatKunjungan.some((k) => k.status === "Aktif"),
    ).length;
    const bpjs = patients.filter((p) => p.penjamin.tipe.startsWith("BPJS")).length;
    const umum = patients.length - bpjs;
    return { total: patients.length, aktif, bpjs, umum };
  }, [patients]);

  const penjamin = useMemo(() => {
    const bpjsCount = patients.filter((p) => p.penjamin.tipe.startsWith("BPJS")).length;
    return { bpjsCount, umumCount: patients.length - bpjsCount };
  }, [patients]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5 p-6"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-slate-900">Beranda Registrasi</h1>
                <p className="mt-0.5 text-xs text-slate-400">{today}</p>
              </div>
              <Link
                href="/ehis-registration/pasien"
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
              >
                <Users size={12} />
                Semua Pasien
              </Link>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users}    label="Total Pasien"    value={stats.total} sub="terdaftar"         iconCls="bg-slate-100 text-slate-600"     delay={0}    />
              <StatCard icon={Activity} label="Aktif Sekarang"  value={stats.aktif} sub="kunjungan aktif"   iconCls="bg-emerald-100 text-emerald-600"  delay={0.07} />
              <StatCard icon={Shield}   label="Peserta BPJS"    value={stats.bpjs}  sub="dari total pasien" iconCls="bg-sky-100 text-sky-600"           delay={0.14} />
              <StatCard icon={Wallet}   label="Umum / Mandiri"  value={stats.umum}  sub="bayar mandiri"     iconCls="bg-amber-100 text-amber-600"      delay={0.21} />
            </div>

            {/* ── Two-column ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Left: recent visits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Kunjungan Terkini</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Aktivitas pendaftaran terbaru hari ini</p>
                  </div>
                  <Link
                    href="/ehis-registration/pasien"
                    className="flex items-center gap-1 text-[11px] font-medium text-teal-600 transition hover:text-teal-700"
                  >
                    Lihat Semua <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentError ? (
                    <p className="px-4 py-10 text-center text-xs text-slate-400">Gagal memuat kunjungan terkini.</p>
                  ) : recent.length === 0 ? (
                    <p className="px-4 py-10 text-center text-xs text-slate-400">Belum ada kunjungan terdaftar.</p>
                  ) : (
                    recent.map((p, i) => <VisitRow key={p.id} p={p} index={i} />)
                  )}
                </div>
              </motion.div>

              {/* Right: penjamin + quick actions */}
              <div className="flex flex-col gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-bold text-slate-800">Distribusi Penjamin</p>
                  <p className="mb-4 mt-0.5 text-[10px] text-slate-400">
                    Berdasarkan total pasien terdaftar
                  </p>
                  <PenjaminDist
                    bpjsCount={penjamin.bpjsCount}
                    umumCount={penjamin.umumCount}
                    total={patients.length}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                >
                  <QuickActions onDaftarBaru={() => setModalOpen(true)} />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PasienBaruModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
