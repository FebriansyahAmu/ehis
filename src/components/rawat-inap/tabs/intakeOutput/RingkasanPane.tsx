"use client";

import { useState } from "react";
import { Pencil, Check, Info, AlertTriangle } from "lucide-react";
import type { IOEntry, IOTargetDPJP, RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { calcIWL, fmtVol, balanceBadge, INTAKE_CHIP, OUTPUT_CHIP } from "./ioShared";

// ── Types ───────────────────────────────────────────────────

interface Props {
  entries:        IOEntry[];
  patient:        RawatInapPatientDetail;
  targetDPJP?:    IOTargetDPJP;
  onTargetChange: (t: IOTargetDPJP) => void;
}

type ShiftView = "Pagi" | "Siang" | "Malam" | "Total";
const SHIFT_VIEWS: ShiftView[] = ["Total", "Pagi", "Siang", "Malam"];

// ── Small helpers ────────────────────────────────────────────

function sumVol(entries: IOEntry[], tipe: "intake" | "output"): number {
  return entries.filter((e) => e.tipe === tipe).reduce((s, e) => s + e.volume, 0);
}

function byCategory(entries: IOEntry[], tipe: "intake" | "output"): Record<string, number> {
  return entries
    .filter((e) => e.tipe === tipe)
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.kategori] = (acc[e.kategori] ?? 0) + e.volume;
      return acc;
    }, {});
}

// ── Category card ────────────────────────────────────────────

function CatCard({ label, volume, chip }: { label: string; volume: number; chip: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", chip)}>{label}</span>
      <span className="text-xs font-bold text-slate-700">{fmtVol(volume)}</span>
    </div>
  );
}

// ── Balance card ─────────────────────────────────────────────

function BalanceCard({ intake, output, iwl }: { intake: number; output: number; iwl: number }) {
  const balance = intake - output - iwl;
  const { label, cls } = balanceBadge(balance);
  const isPositive = balance > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance Cairan</p>
      </div>
      <div className="px-4 py-4 space-y-2">
        {[
          { label: "Total Intake",  value: intake,  cls: "text-sky-600"   },
          { label: "Total Output",  value: output,  cls: "text-amber-600" },
          { label: "IWL",          value: iwl,     cls: "text-slate-500" },
        ].map(({ label, value, cls: c }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className={cn("font-medium", c)}>{label}</span>
            <span className="font-bold text-slate-700">{fmtVol(value)}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</p>
            <p className={cn("text-2xl font-black", isPositive ? "text-amber-600" : balance < -200 ? "text-sky-600" : "text-emerald-600")}>
              {isPositive ? "+" : ""}{fmtVol(balance)}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", cls)}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// ── IWL widget ───────────────────────────────────────────────

function IWLWidget({
  bb, suhu, iwlOverride, onOverride,
}: {
  bb?: number; suhu: number; iwlOverride: number | null; onOverride: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState("");

  const iwlAuto = bb != null ? calcIWL(bb, suhu) : null;
  const iwl     = iwlOverride ?? iwlAuto ?? 0;

  function startEdit() { setDraft(String(iwl)); setEditing(true); }
  function saveEdit() {
    const v = parseInt(draft, 10);
    onOverride(isNaN(v) || v < 0 ? null : v);
    setEditing(false);
  }
  function reset() { onOverride(null); setEditing(false); }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IWL (Insensible Water Loss)</p>
        {bb != null ? (
          <p className="mt-0.5 text-[11px] text-slate-500">
            BB {bb}kg · Suhu {suhu}°C → {fmtVol(iwlAuto!)} / 24 jam
            {iwlOverride !== null && (
              <span className="ml-2 text-amber-600">(dioverride manual)</span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-amber-600 flex items-center gap-1">
            <AlertTriangle size={11} /> BB belum tersedia — isi manual
          </p>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-20 rounded border border-indigo-300 bg-white px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <span className="text-xs text-slate-400">mL</span>
          <button type="button" onClick={saveEdit} className="cursor-pointer text-indigo-600 hover:text-indigo-800">
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
            {fmtVol(iwl)}
          </span>
          <button type="button" onClick={startEdit} className="cursor-pointer text-slate-400 hover:text-slate-700 transition" title="Edit IWL">
            <Pencil size={12} />
          </button>
          {iwlOverride !== null && (
            <button type="button" onClick={reset} className="cursor-pointer text-xs text-amber-600 hover:text-amber-800 transition">reset</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Target DPJP card ─────────────────────────────────────────

function TargetCard({
  targetDPJP, todayIntake, onEdit,
}: {
  targetDPJP: IOTargetDPJP; todayIntake: number; onEdit: () => void;
}) {
  const { restriksiIntake, targetBalance, catatan, updatedBy } = targetDPJP;
  const pct = restriksiIntake ? Math.min(100, Math.round((todayIntake / restriksiIntake) * 100)) : null;
  const sisa = restriksiIntake ? Math.max(0, restriksiIntake - todayIntake) : null;
  const barColor = pct == null ? "" : pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-500";

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Target / Instruksi DPJP</p>
        <button type="button" onClick={onEdit} className="cursor-pointer text-indigo-400 hover:text-indigo-700 transition" title="Edit target">
          <Pencil size={12} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {restriksiIntake && (
          <div className="rounded-lg bg-white px-3 py-2 text-center ring-1 ring-indigo-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-400">Restriksi Intake</p>
            <p className="text-sm font-black text-indigo-700">{fmtVol(restriksiIntake)}<span className="text-[10px] font-normal text-indigo-400"> /24 jam</span></p>
          </div>
        )}
        {targetBalance !== undefined && (
          <div className="rounded-lg bg-white px-3 py-2 text-center ring-1 ring-indigo-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-400">Target Balance</p>
            <p className={cn("text-sm font-black", targetBalance < 0 ? "text-sky-700" : "text-amber-700")}>
              {targetBalance > 0 ? "+" : ""}{fmtVol(targetBalance)}<span className="text-[10px] font-normal text-slate-400"> /24 jam</span>
            </p>
          </div>
        )}
      </div>

      {pct !== null && sisa !== null && (
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-medium text-indigo-500">
            <span>Intake hari ini: {fmtVol(todayIntake)}</span>
            <span className={pct >= 100 ? "text-rose-600 font-bold" : pct >= 80 ? "text-amber-600 font-bold" : ""}>
              {pct >= 100 ? "BATAS TERLAMPAUI" : `Sisa ${fmtVol(sisa)} (${100 - pct}%)`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {catatan && (
        <p className="flex items-start gap-1.5 text-[11px] text-indigo-600">
          <Info size={11} className="mt-0.5 shrink-0" />
          {catatan}
        </p>
      )}
      {updatedBy && (
        <p className="text-[10px] text-indigo-400">Oleh: {updatedBy}</p>
      )}
    </div>
  );
}

// ── Target edit form ─────────────────────────────────────────

function TargetForm({
  initial, onSave, onCancel,
}: {
  initial: IOTargetDPJP;
  onSave: (t: IOTargetDPJP) => void;
  onCancel: () => void;
}) {
  const [restriksi,      setRestriksi]      = useState(String(initial.restriksiIntake ?? ""));
  const [targetBalance,  setTargetBalance]  = useState(String(initial.targetBalance ?? ""));
  const [catatan,        setCatatan]        = useState(initial.catatan ?? "");

  function handleSave() {
    const r = parseInt(restriksi, 10);
    const b = parseInt(targetBalance, 10);
    onSave({
      ...initial,
      restriksiIntake: isNaN(r) ? undefined : r,
      targetBalance:   isNaN(b) ? undefined : b,
      catatan:         catatan || undefined,
    });
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-xs space-y-3">
      <p className="text-xs font-bold text-indigo-700">Edit Target / Instruksi DPJP</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-500">Restriksi Intake (mL/24h)</p>
          <input type="number" value={restriksi} onChange={(e) => setRestriksi(e.target.value)} placeholder="—" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-500">Target Balance (mL/24h, negatif = defisit)</p>
          <input type="number" value={targetBalance} onChange={(e) => setTargetBalance(e.target.value)} placeholder="—" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" />
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold text-slate-500">Catatan DPJP</p>
        <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Instruksi DPJP..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition">Simpan</button>
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition">Batal</button>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────

export default function RingkasanPane({ entries, patient, targetDPJP, onTargetChange }: Props) {
  const [shiftView,    setShiftView]    = useState<ShiftView>("Total");
  const [iwlOverride,  setIwlOverride]  = useState<number | null>(null);
  const [editingTarget,setEditingTarget]= useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Filter by today, then by shift if not Total
  const todayAll = entries.filter((e) => e.tanggal === today);
  const filtered = shiftView === "Total" ? todayAll : todayAll.filter((e) => e.shift === shiftView);

  const bb   = patient.vitalSigns.beratBadan;
  const suhu = patient.vitalSigns.suhu;
  const iwlDay = bb != null ? calcIWL(bb, suhu) : 0;
  const iwlForView = shiftView === "Total" ? (iwlOverride ?? iwlDay) : Math.round((iwlOverride ?? iwlDay) / 3);

  const totalIntake = sumVol(filtered, "intake");
  const totalOutput = sumVol(filtered, "output");
  const intakeByCat = byCategory(filtered, "intake");
  const outputByCat = byCategory(filtered, "output");

  const todayIntakeTotal = sumVol(todayAll, "intake");

  return (
    <div className="flex flex-col gap-4">

      {/* Shift selector */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
        {SHIFT_VIEWS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setShiftView(s)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all",
              shiftView === s ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {s === "Total" ? "Hari Ini" : s}
          </button>
        ))}
      </div>

      {/* Intake + Output columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Intake */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-sky-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Intake (Masuk)</p>
            <span className="text-sm font-black text-sky-700">{fmtVol(totalIntake)}</span>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {Object.entries(intakeByCat).length > 0 ? (
              Object.entries(intakeByCat).map(([k, v]) => (
                <CatCard key={k} label={k} volume={v} chip={INTAKE_CHIP[k] ?? "bg-slate-100 text-slate-600"} />
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">Tidak ada data intake</p>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-amber-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Output (Keluar)</p>
            <span className="text-sm font-black text-amber-700">{fmtVol(totalOutput)}</span>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {Object.entries(outputByCat).length > 0 ? (
              Object.entries(outputByCat).map(([k, v]) => (
                <CatCard key={k} label={k} volume={v} chip={OUTPUT_CHIP[k] ?? "bg-slate-100 text-slate-600"} />
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">Tidak ada data output</p>
            )}
          </div>
        </div>
      </div>

      {/* IWL */}
      <IWLWidget bb={bb} suhu={suhu} iwlOverride={iwlOverride} onOverride={setIwlOverride} />

      {/* Balance */}
      <BalanceCard intake={totalIntake} output={totalOutput} iwl={iwlForView} />

      {/* Target DPJP */}
      {editingTarget ? (
        <TargetForm
          initial={targetDPJP ?? {}}
          onSave={(t) => { onTargetChange(t); setEditingTarget(false); }}
          onCancel={() => setEditingTarget(false)}
        />
      ) : targetDPJP ? (
        <TargetCard
          targetDPJP={targetDPJP}
          todayIntake={todayIntakeTotal}
          onEdit={() => setEditingTarget(true)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingTarget(true)}
          className="cursor-pointer rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 py-3 text-xs font-medium text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
        >
          + Tambahkan target / instruksi DPJP
        </button>
      )}
    </div>
  );
}
