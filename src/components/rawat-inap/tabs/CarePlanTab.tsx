"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, X, ShieldCheck, Info } from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  PHASE_DEFS, emptyCarePlan,
  type CarePlanData, type PhaseId, type MasalahEntry,
} from "./carePlan/carePlanShared";
import PhaseSection from "./carePlan/PhaseSection";

function uid() { return Math.random().toString(36).slice(2, 8); }

// ── Progress header ───────────────────────────────────────────

function ProgressHeader({ doneCount }: { doneCount: number }) {
  const pct     = Math.round((doneCount / 3) * 100);
  const allDone = doneCount === 3;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        allDone ? "bg-emerald-100" : "bg-indigo-100",
      )}>
        <ClipboardList size={14} className={allDone ? "text-emerald-600" : "text-indigo-600"} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Rencana Asuhan Terintegrasi</span>
          <motion.span
            key={doneCount}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
            )}
          >
            {doneCount}/3 fase selesai
          </motion.span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", allDone ? "bg-emerald-400" : "bg-indigo-400")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{pct}%</span>
    </div>
  );
}

// ── Masalah Aktif panel ───────────────────────────────────────

function MasalahPanel({
  list, onChange,
}: { list: MasalahEntry[]; onChange: (l: MasalahEntry[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const teks = input.trim();
    if (!teks) return;
    onChange([...list, { id: uid(), teks, oleh: "Petugas", waktu: new Date().toISOString() }]);
    setInput("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Masalah / Diagnosis Aktif
        </span>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {list.length}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-slate-50 px-4">
        <AnimatePresence initial={false}>
          {list.map((m, i) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 py-2"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600">
                {i + 1}
              </span>
              <span className="flex-1 text-xs text-slate-700">{m.teks}</span>
              <button
                type="button"
                onClick={() => onChange(list.filter((x) => x.id !== m.id))}
                className="shrink-0 text-slate-300 transition hover:text-rose-500"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {list.length === 0 && (
          <p className="py-3 text-center text-[11px] text-slate-400">Belum ada masalah ditambahkan</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Tambah masalah / diagnosis aktif, tekan Enter..."
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Sign-off banner ───────────────────────────────────────────

function SignOffBanner({
  verified, verifiedBy, verifiedAt, onVerify,
}: {
  verified:   boolean;
  verifiedBy: string;
  verifiedAt: string;
  onVerify:   (by: string) => void;
}) {
  const [name, setName] = useState("");

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 shadow-xs"
      >
        <ShieldCheck size={15} className="shrink-0 text-emerald-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-800">RAT Diverifikasi DPJP</p>
          <p className="text-[11px] text-emerald-600">
            {verifiedBy} · {new Date(verifiedAt).toLocaleString("id-ID")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 shadow-xs">
        <ShieldCheck size={14} className="shrink-0 text-amber-500" />
        <span className="text-xs font-semibold text-amber-800">Semua fase selesai — Verifikasi DPJP diperlukan</span>
        <div className="ml-auto flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onVerify(name.trim())}
            placeholder="Nama DPJP..."
            className="h-7 rounded-lg border border-amber-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={() => name.trim() && onVerify(name.trim())}
            className="h-7 rounded-lg bg-amber-500 px-3 text-[11px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
            disabled={!name.trim()}
          >
            Verifikasi & TTD
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function CarePlanTab({ patient }: { patient: RawatInapPatientDetail }) {
  const [open, setOpen] = useState<PhaseId | null>("admisi");
  const [plan, setPlan] = useState<CarePlanData>(emptyCarePlan());

  const doneCount = PHASE_DEFS.filter((d) => plan.phases[d.id].status === "selesai").length;
  const allDone   = doneCount === 3;

  function handleVerify(by: string) {
    setPlan((p) => ({
      ...p,
      dpjpVerified:   true,
      dpjpVerifiedAt: new Date().toISOString(),
      dpjpVerifiedBy: by,
    }));
  }

  return (
    <div className="flex flex-col gap-3">

      <ProgressHeader doneCount={doneCount} />

      <MasalahPanel
        list={plan.masalahList}
        onChange={(l) => setPlan((p) => ({ ...p, masalahList: l }))}
      />

      {/* Fase accordion card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

        {/* Compliance note */}
        <div className="flex items-start gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-[10px] text-slate-400">
            SNARS PP 1 — Rencana asuhan terintegrasi wajib dibuat bersama seluruh PPA dan diverifikasi DPJP sebagai ketua tim
          </p>
        </div>

        {PHASE_DEFS.map((def, idx) => (
          <div key={def.id} className={cn(idx > 0 && "border-t border-slate-100")}>
            <PhaseSection
              def={def}
              data={plan.phases[def.id]}
              onChange={(d) => setPlan((p) => ({ ...p, phases: { ...p.phases, [def.id]: d } }))}
              isOpen={open === def.id}
              onToggle={() => setOpen((prev) => (prev === def.id ? null : def.id))}
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {allDone && (
          <SignOffBanner
            verified={plan.dpjpVerified}
            verifiedBy={plan.dpjpVerifiedBy}
            verifiedAt={plan.dpjpVerifiedAt}
            onVerify={handleVerify}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
