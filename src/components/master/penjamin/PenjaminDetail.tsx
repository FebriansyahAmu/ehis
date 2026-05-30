"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Trash2, BadgeCheck, IdCard, Layers3, FileText, ShieldCheck, AlertTriangle, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PenjaminRecord } from "@/lib/master/penjaminStore";
import { TIPE_CFG, STATUS_CFG, isPenjaminValid, penjaminInitials } from "./penjaminShared";

import IdentitasPane     from "./panes/IdentitasPane";
import KelasCoveragePane from "./panes/KelasCoveragePane";
import KontrakPane       from "./panes/KontrakPane";
import BPJSPane          from "./panes/BPJSPane";

type Tab = "identitas" | "kelas" | "kontrak" | "bpjs";

interface Props {
  draft: PenjaminRecord;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (p: Partial<PenjaminRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function PenjaminDetail({
  draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete,
}: Props) {
  const [tab, setTab] = useState<Tab>("identitas");
  const valid = isPenjaminValid(draft);
  const tipeCfg = TIPE_CFG[draft.tipe];
  const statCfg = STATUS_CFG[draft.status];

  // Auto-switch off BPJS tab when tipe is no longer BPJS
  if (tab === "bpjs" && draft.tipe !== "BPJS") {
    setTimeout(() => setTab("identitas"), 0);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1",
              tipeCfg.bg, tipeCfg.text, tipeCfg.ring,
            )}>
              {penjaminInitials(draft.nama || "??")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-slate-900">
                  {draft.nama || "(Penjamin Baru)"}
                </p>
                {isNew && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                    Baru
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-slate-400">{draft.kode || "—"}</span>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  tipeCfg.bg, tipeCfg.text,
                )}>
                  {tipeCfg.short}
                </span>
                <span className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  statCfg.bg, statCfg.text,
                )}>
                  <span className={cn("h-1 w-1 rounded-full", statCfg.dot)} />
                  {statCfg.label}
                </span>
                {draft.kelas.length > 0 && (
                  <span className="text-[10px] text-slate-500">
                    · {draft.kelas.length} kelas penjamin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            {!isNew && draft.tipe !== "Umum" && (
              <Link
                href={`/ehis-eklaim/klaim?penjamin=${encodeURIComponent(draft.kode)}`}
                className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
                title="Lihat klaim dari penjamin ini di E-Klaim"
              >
                <ExternalLink size={11} /> E-Klaim
              </Link>
            )}
            {!isNew && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 size={11} /> Hapus
              </button>
            )}
            <button
              onClick={onCancel}
              disabled={!isDirty}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={!isDirty || !valid}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
            >
              <Save size={11} /> Simpan
            </button>
          </div>
        </div>

        {/* Dirty / Valid banner */}
        <AnimatePresence>
          {(isDirty || !valid) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden"
            >
              {!valid ? (
                <div className="flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">
                  <AlertTriangle size={10} />
                  Kode & nama wajib diisi
                </div>
              ) : isDirty ? (
                <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
                  <BadgeCheck size={10} />
                  Perubahan belum tersimpan
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-100 px-5">
        <div className="flex gap-1">
          <TabBtn icon={IdCard}      label="Identitas"           active={tab === "identitas"} onClick={() => setTab("identitas")} />
          <TabBtn icon={Layers3}     label="Kelas & Coverage"    active={tab === "kelas"}     onClick={() => setTab("kelas")} count={draft.kelas.length} />
          <TabBtn icon={FileText}    label="Kontrak / PKS"       active={tab === "kontrak"}   onClick={() => setTab("kontrak")}   warn={!draft.kontrak && draft.tipe !== "Umum"} />
          {draft.tipe === "BPJS" && (
            <TabBtn icon={ShieldCheck} label="BPJS Config"       active={tab === "bpjs"}      onClick={() => setTab("bpjs")} />
          )}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-5"
          >
            {tab === "identitas" && <IdentitasPane     draft={draft} onPatch={onPatch} />}
            {tab === "kelas"     && <KelasCoveragePane draft={draft} onPatch={onPatch} />}
            {tab === "kontrak"   && <KontrakPane       draft={draft} onPatch={onPatch} />}
            {tab === "bpjs"      && <BPJSPane          draft={draft} onPatch={onPatch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── TabBtn ────────────────────────────────────────────────

function TabBtn({
  icon: Icon, label, active, onClick, count, warn,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  warn?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-semibold transition",
        active
          ? "border-emerald-500 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon size={13} />
      {label}
      {count != null && count > 0 && (
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
        )}>
          {count}
        </span>
      )}
      {warn && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      )}
    </button>
  );
}
