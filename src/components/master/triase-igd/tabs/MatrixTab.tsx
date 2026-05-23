"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, MoveUp, MoveDown, Settings, Layers, Activity, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput, SectionGroup } from "@/components/master/shared";
import {
  type TriaseRecord, type TriaseLevel, type TriaseParameter, type TriaseLevelTone,
  TRIASE_TONE_CFG, TRIASE_TONE_OPTIONS,
} from "@/lib/master/triaseMock";

interface Props {
  draft: TriaseRecord;
  onPatch: (p: Partial<TriaseRecord>) => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function MatrixTab({ draft, onPatch }: Props) {
  const [showLevelEditor, setShowLevelEditor] = useState(false);

  const isEmpty = draft.levels.length === 0 || draft.parameters.length === 0;

  // ── Level handlers ────────────────────────────────────
  const updateLevels = (next: TriaseLevel[]) => {
    onPatch({ levels: next });
  };

  const addLevel = () => {
    const num = draft.levels.length + 1;
    updateLevels([
      ...draft.levels,
      {
        id: uid("lv"),
        kode: `lvl${num}`,
        label: `Level ${num}`,
        tone: "slate",
        responsTime: "",
        prioritas: num,
        deskripsi: "",
      },
    ]);
  };

  const updateLevel = (id: string, patch: Partial<TriaseLevel>) => {
    updateLevels(draft.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLevel = (id: string) => {
    const lvl = draft.levels.find((l) => l.id === id);
    if (!lvl) return;
    if (!confirm(`Hapus level "${lvl.label}"? Semua sel matrix di kolom ini ikut terhapus.`)) return;
    // Cleanup values di parameters
    const nextParams = draft.parameters.map((p) => {
      const { [lvl.kode]: _removed, ...rest } = p.values;
      void _removed;
      return { ...p, values: rest };
    });
    onPatch({
      levels: draft.levels.filter((l) => l.id !== id),
      parameters: nextParams,
    });
  };

  const moveLevel = (id: string, dir: -1 | 1) => {
    const idx = draft.levels.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= draft.levels.length) return;
    const next = [...draft.levels];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateLevels(next);
  };

  // ── Parameter handlers ────────────────────────────────
  const updateParams = (next: TriaseParameter[]) => {
    onPatch({ parameters: next });
  };

  const addParameter = () => {
    updateParams([
      ...draft.parameters,
      {
        id: uid("pa"),
        kode: `param${draft.parameters.length + 1}`,
        label: "",
        values: {},
      },
    ]);
  };

  const updateParameter = (id: string, patch: Partial<TriaseParameter>) => {
    updateParams(draft.parameters.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeParameter = (id: string) => {
    const p = draft.parameters.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Hapus parameter "${p.label || p.kode}"?`)) return;
    updateParams(draft.parameters.filter((x) => x.id !== id));
  };

  const moveParameter = (id: string, dir: -1 | 1) => {
    const idx = draft.parameters.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= draft.parameters.length) return;
    const next = [...draft.parameters];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateParams(next);
  };

  const setCell = (paramId: string, levelKode: string, value: string) => {
    const next = draft.parameters.map((p) => {
      if (p.id !== paramId) return p;
      return { ...p, values: { ...p.values, [levelKode]: value } };
    });
    updateParams(next);
  };

  // ── Pre-derived ────────────────────────────────────────
  const filledStats = useMemo(() => {
    const total = draft.levels.length * draft.parameters.length;
    let filled = 0;
    draft.parameters.forEach((p) => {
      draft.levels.forEach((l) => {
        const v = p.values[l.kode];
        if (v && v.trim().length > 0 && v !== "—") filled++;
      });
    });
    return { total, filled };
  }, [draft.levels, draft.parameters]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-amber-800">
            <Info size={12} /> Matrix Triase
          </span>
          <span className="text-slate-600">
            <strong className="font-mono text-slate-800">{filledStats.filled}</strong>
            <span className="text-slate-400"> / {filledStats.total}</span> sel terisi
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLevelEditor((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition",
              showLevelEditor
                ? "border-amber-500 bg-amber-100 text-amber-800"
                : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
            )}
          >
            <Settings size={11} />
            Edit Level
          </button>
          <button
            type="button"
            onClick={addParameter}
            className="flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Plus size={11} />
            Parameter
          </button>
        </div>
      </div>

      {/* Level editor (collapsible) */}
      <AnimatePresence initial={false}>
        {showLevelEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <LevelEditor
              levels={draft.levels}
              onAdd={addLevel}
              onUpdate={updateLevel}
              onRemove={removeLevel}
              onMove={moveLevel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matrix table */}
      <SectionGroup
        title="Kriteria per Parameter"
        icon={<Activity size={11} />}
        accent={{ bg: "bg-rose-50", text: "text-rose-700" }}
        desc="Klik sel untuk edit deskripsi kriteria klinis"
      >
        {isEmpty ? (
          <EmptyMatrix
            hasLevels={draft.levels.length > 0}
            hasParams={draft.parameters.length > 0}
            onAddLevel={() => { setShowLevelEditor(true); addLevel(); }}
            onAddParameter={addParameter}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[140px] border-b border-r border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Parameter
                  </th>
                  {draft.levels.map((lvl) => {
                    const tone = TRIASE_TONE_CFG[lvl.tone];
                    return (
                      <th
                        key={lvl.id}
                        className={cn(
                          "min-w-[150px] border-b border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide",
                          tone.headerBg, tone.headerText,
                        )}
                      >
                        <div className="flex flex-col">
                          <span>{lvl.label || lvl.kode}</span>
                          {lvl.responsTime && (
                            <span className="text-[9px] font-medium opacity-80">
                              {lvl.responsTime}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="w-10 border-b border-slate-200 bg-slate-50" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {draft.parameters.map((param, idx) => (
                  <MatrixRow
                    key={param.id}
                    param={param}
                    levels={draft.levels}
                    isFirst={idx === 0}
                    isLast={idx === draft.parameters.length - 1}
                    onUpdateParameter={(p) => updateParameter(param.id, p)}
                    onRemove={() => removeParameter(param.id)}
                    onMove={(d) => moveParameter(param.id, d)}
                    onCellChange={(levelKode, v) => setCell(param.id, levelKode, v)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionGroup>
    </div>
  );
}

// ── Level editor ─────────────────────────────────────────

function LevelEditor({
  levels, onAdd, onUpdate, onRemove, onMove,
}: {
  levels: TriaseLevel[];
  onAdd: () => void;
  onUpdate: (id: string, p: Partial<TriaseLevel>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white">
      <header className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          <Layers size={11} />
          Definisi Level Urgensi
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
        >
          <Plus size={11} />
          Tambah Level
        </button>
      </header>

      <div className="flex flex-col gap-2 p-3">
        {levels.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-[10.5px] text-slate-500">
            Belum ada level. Tambah min 2 level untuk membangun matrix triase.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {levels.map((lvl, idx) => (
              <motion.div
                key={lvl.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <LevelRow
                  level={lvl}
                  isFirst={idx === 0}
                  isLast={idx === levels.length - 1}
                  onUpdate={(p) => onUpdate(lvl.id, p)}
                  onRemove={() => onRemove(lvl.id)}
                  onMove={(d) => onMove(lvl.id, d)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function LevelRow({
  level, isFirst, isLast, onUpdate, onRemove, onMove,
}: {
  level: TriaseLevel;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (p: Partial<TriaseLevel>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const tone = TRIASE_TONE_CFG[level.tone];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
      {/* Tone chip + picker */}
      <ToneSwatch tone={level.tone} onChange={(t) => onUpdate({ tone: t })} />

      {/* Kode (mono) */}
      <div className="w-[100px] shrink-0">
        <TextInput
          value={level.kode}
          onChange={(v) => onUpdate({ kode: v.toLowerCase().replace(/\s+/g, "") })}
          placeholder="kode"
          className="font-mono"
          maxW="max-w-none"
          accent="amber"
        />
      </div>

      {/* Label */}
      <div className="min-w-[140px] flex-1">
        <TextInput
          value={level.label}
          onChange={(v) => onUpdate({ label: v })}
          placeholder="Nama level (Resusitasi)"
          maxW="max-w-none"
          accent="amber"
        />
      </div>

      {/* Respons time */}
      <div className="w-[140px] shrink-0">
        <TextInput
          value={level.responsTime}
          onChange={(v) => onUpdate({ responsTime: v })}
          placeholder="< 10 menit"
          maxW="max-w-none"
          accent="amber"
        />
      </div>

      {/* Preview chip */}
      <span className={cn(
        "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        tone.headerBg, tone.headerText,
      )}>
        {level.label || "—"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <IconBtn title="Naik" disabled={isFirst} onClick={() => onMove(-1)}>
          <MoveUp size={11} />
        </IconBtn>
        <IconBtn title="Turun" disabled={isLast} onClick={() => onMove(1)}>
          <MoveDown size={11} />
        </IconBtn>
        <IconBtn title="Hapus level" onClick={onRemove} variant="danger">
          <Trash2 size={11} />
        </IconBtn>
      </div>
    </div>
  );
}

function ToneSwatch({ tone, onChange }: { tone: TriaseLevelTone; onChange: (t: TriaseLevelTone) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = TRIASE_TONE_CFG[tone];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-7 w-7 rounded-md border-2 border-slate-200 transition hover:scale-105",
          cfg.headerBg,
        )}
        title={`Warna: ${tone}`}
        aria-label={`Pilih warna level (saat ini ${tone})`}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {TRIASE_TONE_OPTIONS.map((t) => {
              const tc = TRIASE_TONE_CFG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onChange(t); setOpen(false); }}
                  className={cn(
                    "h-6 w-6 rounded transition",
                    tc.headerBg,
                    t === tone ? "ring-2 ring-slate-700" : "hover:scale-110",
                  )}
                  title={t}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Matrix row ───────────────────────────────────────────

function MatrixRow({
  param, levels, isFirst, isLast, onUpdateParameter, onRemove, onMove, onCellChange,
}: {
  param: TriaseParameter;
  levels: TriaseLevel[];
  isFirst: boolean;
  isLast: boolean;
  onUpdateParameter: (p: Partial<TriaseParameter>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onCellChange: (levelKode: string, v: string) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/40">
      {/* Sticky first col — parameter editor */}
      <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-1.5 align-top">
        <div className="flex flex-col gap-1">
          <TextInput
            value={param.label}
            onChange={(v) => onUpdateParameter({ label: v })}
            placeholder="Nama parameter"
            maxW="max-w-none"
            accent="rose"
            className="text-[11.5px] font-semibold"
          />
          <TextInput
            value={param.kode}
            onChange={(v) => onUpdateParameter({ kode: v.toLowerCase().replace(/\s+/g, "") })}
            placeholder="kode"
            maxW="max-w-none"
            className="font-mono text-[10px]"
            accent="rose"
          />
        </div>
      </td>

      {/* Cells per level */}
      {levels.map((lvl) => {
        const value = param.values[lvl.kode] ?? "";
        return (
          <td key={lvl.id} className="border-r border-slate-100 p-1 align-top">
            <textarea
              value={value}
              onChange={(e) => onCellChange(lvl.kode, e.target.value)}
              rows={2}
              placeholder="Kriteria klinis…"
              className={cn(
                "w-full rounded border border-slate-100 bg-white px-1.5 py-1 text-[11px] leading-snug text-slate-700 outline-none transition",
                "placeholder:text-slate-300",
                "focus:border-rose-300 focus:ring-2 focus:ring-rose-100",
                "resize-y",
              )}
            />
          </td>
        );
      })}

      {/* Row actions */}
      <td className="px-1 py-1 align-top">
        <div className="flex flex-col items-center gap-0.5">
          <IconBtn title="Naik" disabled={isFirst} onClick={() => onMove(-1)}>
            <MoveUp size={11} />
          </IconBtn>
          <IconBtn title="Turun" disabled={isLast} onClick={() => onMove(1)}>
            <MoveDown size={11} />
          </IconBtn>
          <IconBtn title="Hapus parameter" onClick={onRemove} variant="danger">
            <Trash2 size={11} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

// ── Empty matrix ─────────────────────────────────────────

function EmptyMatrix({
  hasLevels, hasParams, onAddLevel, onAddParameter,
}: {
  hasLevels: boolean;
  hasParams: boolean;
  onAddLevel: () => void;
  onAddParameter: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
      <Layers className="mx-auto mb-2 text-slate-400" size={20} />
      <p className="text-xs font-semibold text-slate-600">Matrix belum lengkap</p>
      <p className="mt-0.5 text-[10.5px] text-slate-500">
        Butuh minimal 2 level urgensi (kolom) dan 1 parameter (baris).
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {!hasLevels && (
          <button
            type="button"
            onClick={onAddLevel}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            <Plus size={12} />
            Tambah Level
          </button>
        )}
        {!hasParams && (
          <button
            type="button"
            onClick={onAddParameter}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Plus size={12} />
            Tambah Parameter
          </button>
        )}
      </div>
    </div>
  );
}

// ── IconBtn ──────────────────────────────────────────────

function IconBtn({
  children, onClick, disabled, title, variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md border transition outline-none focus-visible:ring-2",
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
          : variant === "danger"
            ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 focus-visible:ring-rose-200"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 focus-visible:ring-slate-200",
      )}
    >
      {children}
    </button>
  );
}
