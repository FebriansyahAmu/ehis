"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow, Plus, Trash2, Pencil, Check, X, ChevronRight, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PhaseDefinition, type PhaseTargetItem, type PhaseColor,
  PHASE_COLOR_CFG, emptyTargetItem,
} from "@/lib/master/dischargeKlasifikasiMock";
import PhaseHeaderEditor from "./PhaseHeaderEditor";

interface Props {
  phases: PhaseDefinition[];
  onChange: (phases: PhaseDefinition[]) => void;
}

export default function PhasePlanningPane({ phases, onChange }: Props) {
  const sortedPhases = [...phases].sort((a, b) => a.urutan - b.urutan);

  const handlePhasePatch = (id: string, patch: Partial<PhaseDefinition>) => {
    onChange(phases.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleTargetsChange = (phaseId: string, targets: PhaseTargetItem[]) => {
    onChange(phases.map((p) => (p.id === phaseId ? { ...p, targets } : p)));
  };

  const totalTargets = phases.reduce((sum, p) => sum + p.targets.length, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <Workflow size={13} />
          </span>
          <h2 className="text-sm font-bold text-slate-800">Phase Discharge Planning</h2>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            {sortedPhases.length} fase · {totalTargets} target
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          Tahapan discharge planning sesuai SNARS — visual timeline dari MRS sampai pasien pulang. Edit metadata fase (judul/standar/warna) dan kelola target per fase di bawah.
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
            DischargePlanTab (RI) — Workflow Steps
          </span>
        </div>
      </header>

      {/* Body — horizontal timeline */}
      <div className="flex-1 overflow-auto bg-slate-50/40 p-4">
        <div className="flex min-w-fit flex-col gap-3 lg:flex-row lg:items-stretch">
          {sortedPhases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              stepNumber={idx + 1}
              isLast={idx === sortedPhases.length - 1}
              onPatch={(patch) => handlePhasePatch(phase.id, patch)}
              onTargetsChange={(targets) => handleTargetsChange(phase.id, targets)}
            />
          ))}
        </div>

        {/* Legend / standar reference */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Referensi Standar</p>
          <div className="grid gap-2 text-[10.5px] text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
            <ReferenceItem code="SNARS ARK 5" label="Akses & Kesinambungan Layanan — perencanaan awal" color="sky" />
            <ReferenceItem code="SNARS HPK 2" label="Hak Pasien & Keluarga — keterlibatan dalam asuhan" color="emerald" />
            <ReferenceItem code="SNARS ARK 3" label="Akses & Kesinambungan Layanan — pemulangan terencana" color="amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Phase card ──────────────────────────────────────────

interface PhaseCardProps {
  phase: PhaseDefinition;
  stepNumber: number;
  isLast: boolean;
  onPatch: (patch: Partial<PhaseDefinition>) => void;
  onTargetsChange: (targets: PhaseTargetItem[]) => void;
}

function PhaseCard({ phase, stepNumber, isLast, onPatch, onTargetsChange }: PhaseCardProps) {
  const [editMeta, setEditMeta] = useState(false);
  const [addingTarget, setAddingTarget] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  const cfg = PHASE_COLOR_CFG[phase.color];

  const handleTargetAdd = (target: PhaseTargetItem) => {
    onTargetsChange([...phase.targets, target]);
    setAddingTarget(false);
  };

  const handleTargetUpdate = (id: string, patch: Partial<PhaseTargetItem>) => {
    onTargetsChange(phase.targets.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleTargetDelete = (id: string) => {
    const target = phase.targets.find((t) => t.id === id);
    if (!target) return;
    if (!confirm(`Hapus target "${target.label}"?`)) return;
    onTargetsChange(phase.targets.filter((t) => t.id !== id));
  };

  const handleTargetMove = (id: string, dir: "up" | "down") => {
    const idx = phase.targets.findIndex((t) => t.id === id);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= phase.targets.length) return;
    const arr = [...phase.targets];
    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
    onTargetsChange(arr);
  };

  return (
    <div className="relative flex flex-1 min-w-[280px] lg:max-w-[420px] flex-col">
      {/* Connector arrow (between phases) */}
      {!isLast && (
        <div
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 lg:flex"
          aria-hidden="true"
        >
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-2", cfg.ring)}>
            <ChevronRight size={14} className={cfg.softText} />
          </span>
        </div>
      )}

      <article
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition",
          cfg.border,
        )}
      >
        {/* Color stripe */}
        <div className={cn("h-1 w-full", cfg.stripe)} aria-hidden="true" />

        {/* Header */}
        <header className={cn("px-3 py-2.5", cfg.softBg)}>
          {editMeta ? (
            <PhaseHeaderEditor
              phase={phase}
              onSave={(patch) => { onPatch(patch); setEditMeta(false); }}
              onCancel={() => setEditMeta(false)}
            />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                    cfg.stripe,
                  )}>
                    {stepNumber}
                  </span>
                  <h3 className={cn("truncate text-[13px] font-bold", cfg.softText)}>
                    {phase.fase}
                  </h3>
                </div>
                <p className="mt-1 text-[10.5px] leading-snug text-slate-600">{phase.desc}</p>
                <span className={cn(
                  "mt-1.5 inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ring-1",
                  cfg.ring,
                  cfg.softText,
                )}>
                  {phase.standar}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditMeta(true)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Edit fase"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </header>

        {/* Target list */}
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Target ({phase.targets.length})
            </p>
            {!addingTarget && (
              <button
                type="button"
                onClick={() => setAddingTarget(true)}
                className={cn(
                  "flex items-center gap-1 rounded-md border border-dashed bg-white px-2 py-0.5 text-[10.5px] font-semibold transition",
                  cfg.border, cfg.softText, "hover:bg-slate-50",
                )}
              >
                <Plus size={11} />
                Tambah
              </button>
            )}
          </div>

          <AnimatePresence>
            {addingTarget && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <TargetInlineForm
                  phaseColor={phase.color}
                  initial={emptyTargetItem()}
                  onSave={handleTargetAdd}
                  onCancel={() => setAddingTarget(false)}
                  mode="create"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <ul className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {phase.targets.map((t, i) => (
                <TargetRow
                  key={t.id}
                  target={t}
                  isEditing={editTargetId === t.id}
                  phaseColor={phase.color}
                  canMoveUp={i > 0}
                  canMoveDown={i < phase.targets.length - 1}
                  onEditStart={() => { setEditTargetId(t.id); setAddingTarget(false); }}
                  onEditEnd={() => setEditTargetId(null)}
                  onUpdate={(patch) => handleTargetUpdate(t.id, patch)}
                  onDelete={() => handleTargetDelete(t.id)}
                  onMoveUp={() => handleTargetMove(t.id, "up")}
                  onMoveDown={() => handleTargetMove(t.id, "down")}
                />
              ))}
            </AnimatePresence>
          </ul>

          {phase.targets.length === 0 && !addingTarget && (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <p className="text-[11px] font-medium text-slate-400">Belum ada target</p>
              <p className="text-[10px] text-slate-300">Tambah target awal untuk fase ini</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

// ── Target row ──────────────────────────────────────────

interface TargetRowProps {
  target: PhaseTargetItem;
  isEditing: boolean;
  phaseColor: PhaseColor;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<PhaseTargetItem>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function TargetRow({
  target, isEditing, phaseColor, canMoveUp, canMoveDown,
  onEditStart, onEditEnd, onUpdate, onDelete, onMoveUp, onMoveDown,
}: TargetRowProps) {
  const cfg = PHASE_COLOR_CFG[phaseColor];

  if (isEditing) {
    return (
      <motion.li
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <TargetInlineForm
          phaseColor={phaseColor}
          initial={target}
          onSave={(updated) => { onUpdate(updated); onEditEnd(); }}
          onCancel={onEditEnd}
          mode="edit"
        />
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative flex items-start gap-2 rounded-md border bg-white px-2.5 py-1.5 transition hover:shadow-sm",
        cfg.border,
      )}
    >
      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-semibold leading-tight text-slate-800">{target.label}</p>
        {target.deskripsi && (
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{target.deskripsi}</p>
        )}
      </div>

      <div className="flex items-start gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
          aria-label="Naik"
        >
          <GripVertical size={10} />
        </button>
        <button
          type="button"
          onClick={onEditStart}
          className={cn("rounded p-0.5 text-slate-400 transition hover:bg-white", "hover:" + cfg.softText)}
          aria-label="Edit"
        >
          <Pencil size={10} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label="Hapus"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </motion.li>
  );
}

// ── Target inline form ──────────────────────────────────

function TargetInlineForm({
  phaseColor, initial, onSave, onCancel, mode,
}: {
  phaseColor: PhaseColor;
  initial: PhaseTargetItem;
  onSave: (t: PhaseTargetItem) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}) {
  const [draft, setDraft] = useState<PhaseTargetItem>(initial);
  const cfg = PHASE_COLOR_CFG[phaseColor];
  const canSave = draft.label.trim().length > 0;

  return (
    <div className={cn("rounded-md border bg-white p-2.5", cfg.border)}>
      <input
        type="text"
        value={draft.label}
        onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
        placeholder="Target / langkah aksi..."
        autoFocus
        className="mb-1.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
      />
      <textarea
        value={draft.deskripsi ?? ""}
        onChange={(e) => setDraft((p) => ({ ...p, deskripsi: e.target.value }))}
        placeholder="Catatan / penjelasan (opsional)"
        rows={2}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] text-slate-600 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
      />
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Batal"
        >
          <X size={12} />
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave(draft)}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition",
            canSave ? cn(cfg.stripe, "hover:opacity-90") : "cursor-not-allowed bg-slate-300",
          )}
        >
          <Check size={11} />
          {mode === "create" ? "Tambah" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

// ── Reference legend item ───────────────────────────────

function ReferenceItem({ code, label, color }: { code: string; label: string; color: PhaseColor }) {
  const cfg = PHASE_COLOR_CFG[color];
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2">
      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
      <div className="min-w-0">
        <p className={cn("text-[10.5px] font-bold", cfg.softText)}>{code}</p>
        <p className="text-[10px] leading-snug text-slate-500">{label}</p>
      </div>
    </div>
  );
}
