"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CriticalFinding, type CriticalKategori, CRITICAL_KATEGORI_LIST } from "./radShared";

// ── Single finding confirm row ────────────────────────────

function FindingRow({
  finding, onChange,
}: {
  finding: CriticalFinding;
  onChange: (f: CriticalFinding) => void;
}) {
  const upd = (patch: Partial<CriticalFinding>) => onChange({ ...finding, ...patch });
  const isReady = finding.metode && finding.namaDokter?.trim() && finding.pelapor?.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 transition-all",
        finding.confirmed
          ? "border-emerald-300 bg-emerald-50"
          : "border-rose-200 bg-rose-50",
      )}
    >
      {/* Finding header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500">
          <AlertTriangle size={13} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-800">{finding.kategori}</p>
          <p className="text-[11px] text-rose-600">{finding.deskripsi}</p>
        </div>
        {finding.confirmed && (
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
        )}
      </div>

      {/* Confirmation form */}
      {!finding.confirmed && (
        <div className="flex flex-col gap-2.5">
          {/* Metode */}
          <div>
            <p className="mb-1 text-[10px] font-bold text-slate-600">Metode Pelaporan *</p>
            <div className="flex flex-wrap gap-1.5">
              {(["Telepon", "SMS", "WhatsApp", "Langsung"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => upd({ metode: m })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                    finding.metode === m
                      ? "border-rose-400 bg-rose-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-rose-200",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Dokter + pelapor + jam */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-0.5 block text-[10px] font-bold text-slate-500">Nama Dokter Penerima *</label>
              <input type="text" placeholder="dr. ..."
                value={finding.namaDokter ?? ""}
                onChange={(e) => upd({ namaDokter: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold text-slate-500">Pelapor (SpRad) *</label>
              <input type="text" placeholder="dr. Sp.Rad"
                value={finding.pelapor ?? ""}
                onChange={(e) => upd({ pelapor: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold text-slate-500">Jam Lapor</label>
              <input type="time"
                value={finding.jamLapor ?? ""}
                onChange={(e) => upd({ jamLapor: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
              />
            </div>
          </div>

          {/* Confirm button */}
          <button
            type="button"
            disabled={!isReady}
            onClick={() => upd({ confirmed: true })}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold transition-all",
              isReady
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            <CheckCircle2 size={13} />
            Konfirmasi Pelaporan Temuan Ini
          </button>
        </div>
      )}

      {finding.confirmed && (
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Via {finding.metode}
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            ke {finding.namaDokter}
          </span>
          {finding.jamLapor && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Jam {finding.jamLapor}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Modal ────────────────────────────────────────────

interface Props {
  findings: CriticalFinding[];
  onConfirmAll: (findings: CriticalFinding[]) => void;
  onCancel: () => void;
}

export default function CriticalFindingModal({ findings, onConfirmAll, onCancel }: Props) {
  const [local, setLocal] = useState<CriticalFinding[]>(findings);

  const updateFinding = (idx: number, f: CriticalFinding) =>
    setLocal((prev) => { const next = [...prev]; next[idx] = f; return next; });

  const allConfirmed = local.every((f) => f.confirmed);
  const confirmedCount = local.filter((f) => f.confirmed).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 pt-10 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-2xl rounded-3xl border border-rose-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-3xl bg-rose-600 px-5 py-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Temuan Kritis Radiologi</p>
              <p className="text-[12px] text-rose-200">
                Wajib konfirmasi semua sebelum menerbitkan laporan · SNARS AP 6.1 · JCI AOP.6
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5">
              <span className="text-sm font-black">{confirmedCount}/{local.length}</span>
              <span className="text-[10px] text-rose-200">Dikonfirmasi</span>
            </div>
          </div>

          {/* Warning bar */}
          <div className="flex items-center gap-2 bg-rose-50 px-5 py-2.5">
            <Phone size={13} className="shrink-0 text-rose-600" />
            <p className="text-[11px] text-rose-700 font-medium">
              Setiap temuan kritis WAJIB dikomunikasikan langsung ke DPJP dalam 30 menit.
              Modal ini tidak dapat ditutup sebelum semua temuan dikonfirmasi.
            </p>
          </div>

          {/* Findings */}
          <div className="flex flex-col gap-3 p-5">
            {local.map((f, i) => (
              <FindingRow
                key={f.id}
                finding={f}
                onChange={(upd) => updateFinding(i, upd)}
              />
            ))}
          </div>

          {/* Progress */}
          <div className="px-5 pb-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", allConfirmed ? "bg-emerald-500" : "bg-rose-500")}
                animate={{ width: `${local.length > 0 ? (confirmedCount / local.length) * 100 : 0}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X size={14} />
              Kembali ke Laporan
            </button>

            <button
              type="button"
              disabled={!allConfirmed}
              onClick={() => onConfirmAll(local)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all",
                allConfirmed
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              <CheckCircle2 size={15} />
              Semua Dikonfirmasi — Terbitkan Laporan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Selector helper (used in EkspertasiPane) ──────────────

export function CriticalFindingSelector({
  selected, onChange,
}: {
  selected: CriticalKategori[];
  onChange: (list: CriticalKategori[]) => void;
}) {
  const toggle = (k: CriticalKategori) =>
    onChange(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {CRITICAL_KATEGORI_LIST.map((k) => {
          const active = selected.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2.5 text-left text-[11px] font-medium transition-all",
                active
                  ? "border-rose-300 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-rose-200",
              )}
            >
              <div className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                active ? "border-rose-500 bg-rose-500" : "border-slate-300",
              )}>
                {active && <CheckCircle2 size={9} className="text-white" />}
              </div>
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
