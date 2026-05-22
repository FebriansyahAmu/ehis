"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Stethoscope, Activity, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DokterRecord,
  DOKTER_MOCK, newDokterId,
} from "./dokterShared";
import DokterList from "./DokterList";
import DokterDetail from "./DokterDetail";

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-3 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Bone className="h-[560px] w-full rounded-2xl lg:w-[380px]" />
        <Bone className="h-[560px] flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconCls: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Empty Detail ───────────────────────────────────────────

function EmptyDetail({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[500px] flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-4 ring-teal-100">
        <MousePointer2 size={22} className="text-teal-600" />
      </span>
      <div className="max-w-xs">
        <p className="text-sm font-bold text-slate-800">Pilih dokter di kiri</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Atau tambah dokter baru dengan verifikasi NIK ke SatuSehat untuk auto-populate
          nama, STR, dan kualifikasi spesialisasi.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        Tambah Dokter Baru
      </button>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function DokterPage() {
  const [dokters, setDokters] = useState<DokterRecord[]>(DOKTER_MOCK);
  const [selectedId, setSelectedId] = useState<string | null>("dr-001");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const selected = selectedId ? dokters.find((d) => d.id === selectedId) ?? null : null;

  const stats = useMemo(() => {
    const total = dokters.length;
    const active = dokters.filter((d) => d.status === "Aktif").length;
    const cuti = dokters.filter((d) => d.status === "Cuti").length;
    const spesialis = dokters.filter((d) => d.spesialis && d.spesialis !== "Umum").length;
    return { total, active, cuti, spesialis };
  }, [dokters]);

  const handleSave = (next: DokterRecord) => {
    setDokters((prev) => prev.map((d) => (d.id === next.id ? next : d)));
  };

  const handleDelete = (target: DokterRecord) => {
    if (!confirm(`Hapus "${target.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDokters((prev) => prev.filter((d) => d.id !== target.id));
    if (selectedId === target.id) setSelectedId(null);
  };

  const handleAdd = () => {
    const newDokter: DokterRecord = {
      id: newDokterId(),
      nik: "",
      nama: "Dokter Baru",
      spesialis: "Umum",
      noSIP: "",
      email: "",
      telp: "",
      poliAssignment: [],
      jadwal: [],
      status: "Aktif",
    };
    setDokters((prev) => [newDokter, ...prev]);
    setSelectedId(newDokter.id);
  };

  return (
    <AnimatePresence mode="wait">
      {!loaded ? (
        <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
          <PageSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-full flex-col gap-4 p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-600">
                EHIS Master
              </p>
              <h1 className="mt-0.5 text-base font-bold text-slate-900">Dokter & Nakes</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Daftar tenaga kesehatan rumah sakit — identitas, profesi (STR/SIP),
                penugasan unit, dan jadwal praktik.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={UserCog}
              label="Total Tenaga Kesehatan"
              value={`${stats.total}`}
              sub={`${stats.active} aktif · ${stats.cuti} cuti`}
              iconCls="bg-teal-100 text-teal-600"
              delay={0}
            />
            <StatCard
              icon={Stethoscope}
              label="Dokter Spesialis"
              value={`${stats.spesialis}`}
              sub={`${stats.total - stats.spesialis} dokter umum`}
              iconCls="bg-sky-100 text-sky-600"
              delay={0.07}
            />
            <StatCard
              icon={Activity}
              label="Sedang Bertugas"
              value={`${stats.active}`}
              sub="status Aktif hari ini"
              iconCls="bg-emerald-100 text-emerald-600"
              delay={0.14}
            />
          </div>

          {/* Two-panel */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <DokterList
              dokters={dokters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={handleAdd}
            />
            <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="px-5 py-5">
                <AnimatePresence mode="wait">
                  {!selected ? (
                    <EmptyDetail key="empty" onAdd={handleAdd} />
                  ) : (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      <DokterDetail
                        dokter={selected}
                        onSave={handleSave}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
