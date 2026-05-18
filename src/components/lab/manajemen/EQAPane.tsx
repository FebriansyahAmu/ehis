"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, AlertTriangle, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type EQAProvider, type EQASiklus, EQA_PROVIDERS, EQA_STATUS_CFG } from "./manajemenShared";

// ── Provider Summary Card ─────────────────────────────────

function ProviderCard({ provider, active, onClick }: {
  provider: EQAProvider; active: boolean; onClick: () => void;
}) {
  const lulus      = provider.siklus.filter((s) => s.status === "Lulus").length;
  const tidakLulus = provider.siklus.filter((s) => s.status === "Tidak Lulus").length;
  const pending    = provider.siklus.filter((s) => s.status === "Pending").length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3.5 text-left transition-all",
        active
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : tidakLulus > 0
            ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50"
            : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[12px] font-bold text-slate-800">{provider.singkatan}</p>
          <p className="text-[10px] text-slate-400">{provider.nama}</p>
          <p className="text-[10px] text-slate-400">Tahun {provider.tahun}</p>
        </div>
        <div className="shrink-0">
          {tidakLulus > 0
            ? <AlertTriangle size={15} className="text-rose-500" />
            : pending > 0
              ? <Clock size={15} className="text-amber-500" />
              : <CheckCircle2 size={15} className="text-emerald-500" />}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {lulus} Lulus
        </span>
        {tidakLulus > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-rose-600">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> {tidakLulus} Tidak Lulus
          </span>
        )}
        {pending > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {pending} Pending
          </span>
        )}
      </div>
    </button>
  );
}

// ── Deviasi Bar ───────────────────────────────────────────

function DeviasiBar({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  const color = abs > 10 ? "#f43f5e" : abs > 5 ? "#f59e0b" : "#10b981";
  const pos   = pct >= 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("absolute top-0 h-full rounded-full", pos ? "left-1/2" : "right-1/2")}
          style={{ width: `${Math.min(abs * 2, 50)}%`, backgroundColor: color }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-400" />
      </div>
      <span className="text-[10px] tabular-nums" style={{ color }}>
        {pos ? "+" : ""}{pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Siklus Table ──────────────────────────────────────────

function SiklusTable({ siklus }: { siklus: EQASiklus[] }) {
  const grouped = siklus.reduce<Record<string, EQASiklus[]>>((acc, s) => {
    acc[s.siklus] = [...(acc[s.siklus] ?? []), s];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([nama, items]) => {
        const hasReject = items.some((i) => i.status === "Tidak Lulus");
        const isPending = items.every((i) => i.status === "Pending");
        return (
          <div key={nama} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className={cn(
              "flex items-center justify-between border-b border-slate-100 px-4 py-2.5",
              hasReject ? "bg-rose-50" : isPending ? "bg-slate-50" : "bg-emerald-50/60",
            )}>
              <p className="text-[12px] font-bold text-slate-700">{nama}</p>
              <div className="flex items-center gap-1.5">
                {items[0] && <span className="text-[10px] text-slate-400">{items[0].tanggal}</span>}
                {hasReject && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">Ada Gagal</span>}
                {!hasReject && !isPending && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Lulus Semua</span>}
                {isPending && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">Belum Dikerjakan</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-left font-semibold text-slate-400">Parameter</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-400">Nilai RS</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-400">Target</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-400">Deviasi</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <motion.tr
                      key={item.parameter}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "border-b border-slate-50 last:border-0",
                        item.status === "Tidak Lulus" ? "bg-rose-50/60" : "",
                      )}
                    >
                      <td className="px-3 py-2 font-medium text-slate-700">{item.parameter}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                        {item.status === "Pending" ? "—" : `${item.nilaiRS} ${item.satuan}`}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{item.nilaiTarget} {item.satuan}</td>
                      <td className="px-3 py-2">
                        {item.status === "Pending" ? <span className="text-slate-300">—</span> : <DeviasiBar pct={item.deviasi} />}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", EQA_STATUS_CFG[item.status].badge)}>
                          {item.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function EQAPane() {
  const [selectedId, setSelectedId] = useState<string>(EQA_PROVIDERS[0].id);
  const provider = EQA_PROVIDERS.find((p) => p.id === selectedId)!;

  const totalLulus      = EQA_PROVIDERS.flatMap((p) => p.siklus).filter((s) => s.status === "Lulus").length;
  const totalTidakLulus = EQA_PROVIDERS.flatMap((p) => p.siklus).filter((s) => s.status === "Tidak Lulus").length;

  return (
    <div className="relative">

      {/* Dimmed content — not interactive */}
      <div className="pointer-events-none select-none opacity-30">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[240px_1fr]">

      {/* Left — provider list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
          <Award size={14} className="text-sky-600 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-sky-800">EQA / Proficiency Testing</p>
            <p className="text-[10px] text-sky-600">ISO 15189 §5.6.4</p>
          </div>
        </div>

        {/* Overall summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-700">{totalLulus}</p>
            <p className="text-[10px] text-emerald-600">Lulus</p>
          </div>
          <div className={cn("rounded-lg border p-2.5 text-center", totalTidakLulus > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50")}>
            <p className={cn("text-lg font-bold", totalTidakLulus > 0 ? "text-rose-700" : "text-slate-400")}>{totalTidakLulus}</p>
            <p className={cn("text-[10px]", totalTidakLulus > 0 ? "text-rose-600" : "text-slate-400")}>Tidak Lulus</p>
          </div>
        </div>

        <div className="space-y-2">
          {EQA_PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id} provider={p}
              active={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>

        {/* Guide */}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Kriteria Kelulusan</p>
          <div className="space-y-1.5 text-[10px] text-slate-500">
            <p>• Deviasi ≤ ±5%: Lulus (A)</p>
            <p>• Deviasi 5–10%: Lulus Bersyarat (B)</p>
            <p>• Deviasi &gt; 10%: Tidak Lulus (C)</p>
          </div>
          <p className="mt-2 text-[9px] text-slate-400">ISO 15189:2022 §5.6.4 · PNPME-BLK</p>
        </div>
      </div>

      {/* Right — siklus detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          <div>
            <p className="text-sm font-bold text-slate-900">{provider.nama}</p>
            <p className="text-[11px] text-slate-400">Tahun {provider.tahun} · {provider.siklus.length} siklus parameter</p>
          </div>
          <SiklusTable siklus={provider.siklus} />
          {provider.siklus.some((s) => s.status === "Tidak Lulus") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3"
            >
              <AlertTriangle size={14} className="mt-0.5 text-rose-600 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-rose-800">Tindak Lanjut Diperlukan</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Parameter tidak lulus EQA wajib dilakukan investigasi: cek kalibrator, metode, dan reagen. Laporkan ke Ka. Lab dan buat CAPA (Corrective Action & Preventive Action) dalam 14 hari.
                </p>
                <p className="mt-1 text-[10px] text-rose-500">ISO 15189:2022 §5.6.4 · PMK 43/2013</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      </div> {/* end grid */}
      </div> {/* end dimmed wrapper */}

      {/* Disabled overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-sm"
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <Lock size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">Fitur Belum Diaktifkan</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            RS belum terdaftar pada program EQA / Proficiency Testing.
            Fitur ini tersedia dan siap digunakan setelah pendaftaran ke <span className="font-semibold text-slate-600">PNPME-BLK</span> atau program EQA lainnya.
          </p>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cara Mendaftar</p>
            <div className="space-y-1 text-[10px] text-slate-500">
              <p>1. Hubungi BBLK terdekat (Jakarta / Surabaya / Makassar)</p>
              <p>2. Daftarkan laboratorium RS via website PNPME-BLK</p>
              <p>3. Pilih program: Hematologi · Kimia Klinik · Urinalisis</p>
              <p>4. Aktifkan tab ini setelah terdaftar</p>
            </div>
          </div>
          <p className="mt-3 text-[9px] text-slate-400">ISO 15189:2022 §5.6.4 · SNARS AP 5</p>
        </motion.div>
      </div>

    </div>
  );
}
