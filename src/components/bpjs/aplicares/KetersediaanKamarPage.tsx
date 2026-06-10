"use client";

/**
 * BP7.3 — Ketersediaan Kamar (Bed Sync Status).
 *
 * Route: /ehis-bpjs/aplicares/ketersediaan
 * Accent: pink · Adapters: listKamar · updateKamar · setMaintenance
 *
 * - Table per ruangan (derive dari APLICARES_KAMAR_MOCK ← RUANGAN_MOCK)
 * - Per-row aksi: Force Sync (updateKamar) · Maintenance toggle (setMaintenance)
 * - Cross-link: klik nama ruang → /ehis-master/ruangan?id={kodeRuang}
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble, CheckCircle2, Layers, Activity,
  RotateCw, Wrench, ExternalLink, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listKamar, updateKamar, setMaintenance } from "@/lib/bpjs/aplicaresAdapter";
import type { AplicaresKamarRecord } from "@/lib/bpjs/bpjsShared";
import { kelasBPJSChipCls } from "./aplicaresShared";
import BedSyncStatusBanner from "./BedSyncStatusBanner";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-5 w-64" />
        <Bone className="h-2.5 w-96" />
      </div>
      <Bone className="h-12 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Bone className="h-96 rounded-2xl" />
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: IconComponent; label: string; value: string;
  sub: string; iconCls: string; delay?: number;
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
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-normal leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] font-normal text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Occupancy Bar ──────────────────────────────────────

function OccupancyBar({ terisi, kapasitas }: { terisi: number; kapasitas: number }) {
  const pct = kapasitas > 0 ? Math.min(1, terisi / kapasitas) : 0;
  const barCls =
    pct >= 0.9 ? "bg-rose-400" :
    pct >= 0.7 ? "bg-amber-400" :
    "bg-emerald-400";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", barCls)} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-slate-400">{Math.round(pct * 100)}%</span>
    </div>
  );
}

// ── Maintenance Modal ──────────────────────────────────

function MaintenanceModal({
  open, row, onClose, onConfirm,
}: {
  open: boolean;
  row: AplicaresKamarRecord | null;
  onClose: () => void;
  onConfirm: (alasan: string) => void;
}) {
  const [alasan, setAlasan] = useState("");

  useEffect(() => {
    if (open) setAlasan("");
  }, [open]);

  const isActivating = row ? !row.flagMaintenance : true;
  const valid = !isActivating || alasan.trim().length >= 10;

  return (
    <AnimatePresence>
      {open && row && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
      {open && row && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-600">
                  Aplicares · Maintenance
                </p>
                <h2 className="text-sm font-bold text-slate-900">
                  {isActivating ? "Set Maintenance" : "Nonaktifkan Maintenance"}
                </h2>
                <p className="font-mono text-[10px] text-slate-400">
                  {row.namaRuang} · {row.kodeRuang}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {isActivating ? (
                <>
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    Mengaktifkan maintenance akan mengatur{" "}
                    <strong>tersedia = 0</strong> untuk ruang ini di Aplicares BPJS.
                  </p>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Alasan Maintenance <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    placeholder="Misal: Renovasi sarana · Disinfeksi · Kerusakan AC…"
                    className={cn(
                      "mt-1.5 w-full resize-none rounded-lg border px-3 py-2 text-[11px]",
                      "text-slate-800 outline-none transition",
                      "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
                      alasan.trim().length > 0 && alasan.trim().length < 10
                        ? "border-rose-300"
                        : "border-slate-200",
                    )}
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {alasan.trim().length} / 10 char minimum
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-700">
                  Nonaktifkan maintenance untuk ruang{" "}
                  <strong>{row.namaRuang}</strong>?
                  Bed tersedia akan dikembalikan ke kapasitas normal (
                  {row.kapasitas} bed).
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => valid && onConfirm(alasan)}
                disabled={!valid}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[11px] font-semibold text-white transition",
                  isActivating
                    ? "bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                <Wrench size={11} />
                {isActivating ? "Aktifkan Maintenance" : "Nonaktifkan"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Page ───────────────────────────────────────────────

export default function KetersediaanKamarPage() {
  const [loaded,          setLoaded]          = useState(false);
  const [rows,            setRows]            = useState<AplicaresKamarRecord[]>([]);
  const [lastSyncTime,    setLastSyncTime]    = useState<string | null>(null);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [maintenanceRow,  setMaintenanceRow]  = useState<AplicaresKamarRecord | null>(null);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [syncingId,       setSyncingId]       = useState<string | null>(null);

  async function fetchKamar() {
    const res = await listKamar();
    if (res.ok && res.value.response) {
      setRows([...res.value.response]);
      setLastSyncTime(new Date().toISOString());
    }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      await fetchKamar();
      setLoaded(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  async function handleForceRefresh() {
    setIsRefreshing(true);
    await fetchKamar();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  async function handleForceSync(row: AplicaresKamarRecord) {
    setSyncingId(row.kodeRuang);
    await updateKamar({
      kdKelas: row.kdKelas,
      kodeRuang: row.kodeRuang,
      namaRuang: row.namaRuang,
      kapasitas: row.kapasitas,
      tersedia:  row.tersedia,
    });
    setRows((prev) =>
      prev.map((r) =>
        r.kodeRuang === row.kodeRuang
          ? { ...r, lastSyncISO: new Date().toISOString() }
          : r,
      ),
    );
    setTimeout(() => setSyncingId(null), 1200);
  }

  async function handleMaintenanceConfirm(alasan: string) {
    const row = maintenanceRow;
    if (!row) return;
    const isActivating = !row.flagMaintenance;
    setModalOpen(false);
    setMaintenanceRow(null);
    await setMaintenance({
      kdKelas:   row.kdKelas,
      kodeRuang: row.kodeRuang,
      namaRuang: row.namaRuang,
      kapasitas: row.kapasitas,
      aktif:     isActivating,
      alasan:    isActivating ? alasan : undefined,
    });
    setRows((prev) =>
      prev.map((r) =>
        r.kodeRuang === row.kodeRuang
          ? {
              ...r,
              flagMaintenance: isActivating,
              tersedia: isActivating ? 0 : r.kapasitas,
              lastSyncISO: new Date().toISOString(),
            }
          : r,
      ),
    );
  }

  function openMaintenanceModal(row: AplicaresKamarRecord) {
    setMaintenanceRow(row);
    setModalOpen(true);
  }

  const totalKapasitas  = rows.reduce((s, r) => s + r.kapasitas, 0);
  const totalTersedia   = rows.reduce((s, r) => s + r.tersedia,  0);
  const totalTerisi     = rows.reduce((s, r) => s + r.terisi,    0);
  const hunianPct       = totalKapasitas > 0 ? Math.round((totalTerisi / totalKapasitas) * 100) : 0;
  const maintenanceCount = rows.filter((r) => r.flagMaintenance).length;

  const pageContent = (
    <motion.div
      key="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 p-6"
    >
      {/* Header */}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-600">
          EHIS BPJS · Aplicares
        </p>
        <h1 className="mt-0.5 text-base font-bold text-slate-900">Ketersediaan Kamar</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Sinkronisasi status bed ke{" "}
          <span className="font-semibold">Aplicares BPJS</span> per ruang rawat inap.
          PMK 4/2018 — transparansi kapasitas publik.
        </p>
      </div>

      {/* Sync Status Banner */}
      <BedSyncStatusBanner
        lastSyncISO={lastSyncTime}
        onForceRefresh={handleForceRefresh}
        isRefreshing={isRefreshing}
      />

      {/* StatCards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BedDouble} label="Total Kapasitas" value={String(totalKapasitas)}
          sub={`${rows.length} ruang rawat`}
          iconCls="bg-pink-100 text-pink-600" delay={0}
        />
        <StatCard
          icon={CheckCircle2} label="Tersedia" value={String(totalTersedia)}
          sub={`${totalKapasitas > 0 ? Math.round((totalTersedia / totalKapasitas) * 100) : 0}% dari kapasitas`}
          iconCls="bg-emerald-100 text-emerald-600" delay={0.06}
        />
        <StatCard
          icon={Layers} label="Terisi" value={String(totalTerisi)}
          sub={`${hunianPct}% tingkat hunian`}
          iconCls="bg-amber-100 text-amber-700" delay={0.12}
        />
        <StatCard
          icon={Activity} label="Maintenance" value={`${maintenanceCount} ruang`}
          sub={`${rows.length - maintenanceCount} operasional`}
          iconCls="bg-rose-100 text-rose-600" delay={0.18}
        />
      </div>

      {/* Table Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Panel header */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <BedDouble size={13} className="text-pink-500" />
          <span className="text-[11px] font-semibold text-slate-700">Daftar Ruang Rawat</span>
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
            {rows.length} ruang
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  "Kelas BPJS", "Nama Ruang", "Kapasitas",
                  "Terisi", "Tersedia", "Maintenance", "Last Sync", "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((row) => (
                  <motion.tr
                    key={row.kodeRuang}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "border-b border-slate-50 transition-colors",
                      row.flagMaintenance
                        ? "bg-amber-50/40"
                        : syncingId === row.kodeRuang
                          ? "bg-emerald-50/50"
                          : "hover:bg-pink-50/30",
                    )}
                  >
                    {/* Kelas BPJS */}
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold",
                        kelasBPJSChipCls(row.kdKelas),
                      )}>
                        {row.kdKelas}
                      </span>
                    </td>

                    {/* Nama Ruang — cross-link ke master ruangan */}
                    <td className="px-4 py-2.5">
                      <a
                        href={`/ehis-master/ruangan?id=${row.kodeRuang}`}
                        className="flex items-center gap-1 font-semibold text-slate-700 transition-colors hover:text-pink-600"
                        title="Buka di Master Ruangan"
                      >
                        {row.namaRuang}
                        <ExternalLink size={9} className="shrink-0 text-slate-400" />
                      </a>
                      <span className="mt-0.5 block font-mono text-[9px] text-slate-400">
                        {row.kodeRuang}
                      </span>
                    </td>

                    {/* Kapasitas */}
                    <td className="px-4 py-2.5 font-mono text-slate-700">{row.kapasitas}</td>

                    {/* Terisi + bar */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-semibold text-slate-700">{row.terisi}</span>
                        <OccupancyBar terisi={row.terisi} kapasitas={row.kapasitas} />
                      </div>
                    </td>

                    {/* Tersedia badge */}
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums",
                        row.tersedia > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}>
                        {row.tersedia} bed
                      </span>
                    </td>

                    {/* Maintenance */}
                    <td className="px-4 py-2.5">
                      {row.flagMaintenance ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Wrench size={9} />
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Last Sync */}
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">
                      {new Date(row.lastSyncISO).toLocaleTimeString("id-ID", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleForceSync(row)}
                          disabled={syncingId === row.kodeRuang}
                          title="Force Sync ke Aplicares"
                          className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <RotateCw
                            size={10}
                            className={syncingId === row.kodeRuang ? "animate-spin" : ""}
                          />
                          Sync
                        </button>
                        <button
                          onClick={() => openMaintenanceModal(row)}
                          title={row.flagMaintenance ? "Nonaktifkan Maintenance" : "Set Maintenance"}
                          className={cn(
                            "flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition",
                            row.flagMaintenance
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-amber-600 hover:bg-amber-50",
                          )}
                        >
                          <Wrench size={10} />
                          {row.flagMaintenance ? "Restore" : "Maint."}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[11px] text-slate-400">
                    Tidak ada data kamar — klik{" "}
                    <strong>Force Refresh</strong> untuk memuat dari Aplicares.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2">
          <span className="text-[10px] text-slate-400">
            {rows.length} ruang · {totalTersedia} bed tersedia · Hunian {hunianPct}%
          </span>
          <span className="text-[10px] text-slate-400">
            Auto-sync setiap 5 menit (backend)
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : pageContent}
      </AnimatePresence>

      {/* Modal lives outside AnimatePresence to avoid mode="wait" multi-child warning */}
      <MaintenanceModal
        open={modalOpen}
        row={maintenanceRow}
        onClose={() => { setModalOpen(false); setMaintenanceRow(null); }}
        onConfirm={handleMaintenanceConfirm}
      />
    </>
  );
}
