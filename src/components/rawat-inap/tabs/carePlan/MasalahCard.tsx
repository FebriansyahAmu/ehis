"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ShieldCheck, Target, Clock, Activity, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import GoalForm from "./GoalForm";
import {
  ppaDef, GOAL_STATUS_CFG, MASALAH_STATUS_CFG, MASALAH_STATUS_OPTS,
  SUMBER_CFG, FASE_CFG, PRIORITAS_CFG,
  type CarePlanMasalahDTO, type CarePlanGoalDTO, type GoalInput,
  type MasalahStatusDTO,
} from "./carePlanShared";

const MASALAH_STATUS_OPTIONS = MASALAH_STATUS_OPTS.map((s) => ({ value: s, label: MASALAH_STATUS_CFG[s].label }));

interface Props {
  masalah: CarePlanMasalahDTO;
  canVerify: boolean;
  readOnly?: boolean;
  onAddGoal: (input: GoalInput) => Promise<void>;
  onUpdateGoal: (goalId: string, input: GoalInput) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onSetStatus: (status: MasalahStatusDTO) => Promise<void>;
  onVerify: (verified: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
}

// ── Goal row ──────────────────────────────────────────────────────────────────
function GoalRow({
  goal, readOnly, onEdit, onDelete,
}: {
  goal: CarePlanGoalDTO;
  readOnly?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ppa = ppaDef(goal.ppa);
  const st = GOAL_STATUS_CFG[goal.status];
  const Icon = ppa.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      className={cn(
        "group flex gap-2.5 rounded-lg border p-2.5 transition-colors",
        goal.status === "Tercapai" ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white",
      )}
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", ppa.cls)}>
        <Icon size={13} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", ppa.cls)}>{ppa.label}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold", st.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} /> {st.label}
          </span>
          {goal.targetWaktu && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
              <Clock size={10} /> {goal.targetWaktu}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-snug text-slate-700">{goal.target}</p>

        {goal.indikator && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
            <Activity size={10} /> {goal.indikator}
          </p>
        )}
        {goal.evaluasi && (
          <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-[10px] italic text-slate-500">{goal.evaluasi}</p>
        )}
      </div>

      {!readOnly && (
        <div className="flex shrink-0 items-start gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="text-slate-300 transition hover:text-sky-500"><Pencil size={12} /></button>
          <button type="button" onClick={onDelete} className="text-slate-300 transition hover:text-rose-500"><Trash2 size={12} /></button>
        </div>
      )}
    </motion.div>
  );
}

// ── Masalah card ──────────────────────────────────────────────────────────────
export default function MasalahCard({
  masalah, canVerify, readOnly,
  onAddGoal, onUpdateGoal, onDeleteGoal, onSetStatus, onVerify, onDelete,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const mst = MASALAH_STATUS_CFG[masalah.status];
  const tercapai = masalah.goals.filter((g) => g.status === "Tercapai").length;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-xs",
        masalah.verified ? "border-emerald-200" : "border-slate-200",
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", mst.cls)}>{mst.label}</span>
              <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", SUMBER_CFG[masalah.sumber].cls)}>
                {SUMBER_CFG[masalah.sumber].label}{masalah.refKode ? ` · ${masalah.refKode}` : ""}
              </span>
              {masalah.fase && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", FASE_CFG[masalah.fase].cls)}>
                  {FASE_CFG[masalah.fase].label}
                </span>
              )}
              {masalah.prioritas && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", PRIORITAS_CFG[masalah.prioritas].cls)}>
                  {PRIORITAS_CFG[masalah.prioritas].label}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-800">{masalah.masalah}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {masalah.pencatat} · {masalah.goals.length} goal{masalah.goals.length ? ` · ${tercapai} tercapai` : ""}
            </p>
          </div>

          {!readOnly && (
            <div className="flex shrink-0 items-center gap-1">
              {!confirmDel ? (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                  title="Hapus masalah"
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => run(onDelete)}
                    disabled={busy}
                    className="flex h-6 items-center gap-1 rounded-md bg-rose-500 px-2 text-[10px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
                  >
                    <Check size={11} /> Hapus
                  </button>
                  <button type="button" onClick={() => setConfirmDel(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X size={13} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <AnimatePresence initial={false}>
          {masalah.goals.map((g) =>
            editGoalId === g.id ? (
              <GoalForm
                key={g.id}
                initial={g}
                busy={busy}
                onCancel={() => setEditGoalId(null)}
                onSubmit={(input) => run(async () => { await onUpdateGoal(g.id, input); setEditGoalId(null); })}
              />
            ) : (
              <GoalRow
                key={g.id}
                goal={g}
                readOnly={readOnly}
                onEdit={() => { setEditGoalId(g.id); setAdding(false); }}
                onDelete={() => run(() => onDeleteGoal(g.id))}
              />
            ),
          )}
        </AnimatePresence>

        {masalah.goals.length === 0 && !adding && (
          <p className="py-1.5 text-center text-[11px] text-slate-400">Belum ada goal — tambahkan target outcome per PPA</p>
        )}

        <AnimatePresence>
          {adding && (
            <GoalForm
              key="add"
              busy={busy}
              onCancel={() => setAdding(false)}
              onSubmit={(input) => run(async () => { await onAddGoal(input); setAdding(false); })}
            />
          )}
        </AnimatePresence>

        {!readOnly && !adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditGoalId(null); }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-[11px] font-semibold text-slate-400 transition hover:border-sky-300 hover:text-sky-500"
          >
            <Plus size={13} /> Tambah Goal
          </button>
        )}
      </div>

      {/* Footer: status masalah + verifikasi DPJP */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Target size={12} className="text-slate-400" />
            <div className="w-40">
              <Select
                value={masalah.status}
                onChange={(v) => run(() => onSetStatus(v as MasalahStatusDTO))}
                options={MASALAH_STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="ml-auto">
            {masalah.verified ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck size={11} /> Diverifikasi {masalah.verifiedBy}
                </span>
                {canVerify && (
                  <button
                    type="button"
                    onClick={() => run(() => onVerify(false))}
                    disabled={busy}
                    className="rounded-md p-1 text-slate-300 transition hover:text-rose-500"
                    title="Batalkan verifikasi"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : canVerify ? (
              <button
                type="button"
                onClick={() => run(() => onVerify(true))}
                disabled={busy}
                className="flex h-7 items-center gap-1 rounded-lg bg-amber-500 px-3 text-[11px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                <ShieldCheck size={12} /> Verifikasi DPJP
              </button>
            ) : (
              <span className="text-[10px] italic text-slate-400">Menunggu verifikasi DPJP</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
