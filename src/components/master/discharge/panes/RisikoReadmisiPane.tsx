"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Plus, Trash2, Sparkles, Info, RotateCcw, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RisikoParameter, type RisikoRule, type RisikoLevel, type RisikoParameterKey,
  RISIKO_LEVEL_CFG, RISIKO_LEVEL_ORDER,
  emptyRisikoRule, computeRisikoLevel,
} from "@/lib/master/dischargeKlasifikasiMock";

interface Props {
  parameters: RisikoParameter[];
  rules: RisikoRule[];
  onRulesChange: (rules: RisikoRule[]) => void;
}

export default function RisikoReadmisiPane({ parameters, rules, onRulesChange }: Props) {
  // Live calculator state
  const [asesmen, setAsesmen] = useState<Partial<Record<RisikoParameterKey, string>>>({});

  const rulesByLevel = useMemo(() => {
    const grouped: Record<RisikoLevel, RisikoRule[]> = { RENDAH: [], SEDANG: [], TINGGI: [] };
    rules.forEach((r) => grouped[r.level].push(r));
    return grouped;
  }, [rules]);

  const computedLevel = useMemo(() => {
    if (Object.keys(asesmen).length === 0) return null;
    return computeRisikoLevel(asesmen, rules);
  }, [asesmen, rules]);

  // ── Handlers ────────────────────────────────────────────

  const handleAddRule = (parameter: RisikoParameterKey, value: string, level: RisikoLevel) => {
    onRulesChange([...rules, emptyRisikoRule(parameter, value, level)]);
  };

  const handleUpdateLevel = (id: string, level: RisikoLevel) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, level } : r)));
  };

  const handleDelete = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const handleReset = () => setAsesmen({});

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <ShieldAlert size={13} />
          </span>
          <h2 className="text-sm font-bold text-slate-800">Risiko Readmisi — Rule Engine</h2>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            {rules.length} rule · {parameters.length} parameter
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          Konfigurasi rule perhitungan risiko readmisi. Setiap rule mapping <strong className="text-slate-700">parameter × value → level</strong>. Higher priority wins (TINGGI &gt; SEDANG &gt; RENDAH).
        </p>
      </header>

      {/* Body — split: rule matrix (top) + live calculator (bottom) */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40">
        {/* Rule matrix per level */}
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {RISIKO_LEVEL_ORDER.map((level) => (
            <LevelColumn
              key={level}
              level={level}
              rules={rulesByLevel[level]}
              parameters={parameters}
              existingRules={rules}
              onAdd={handleAddRule}
              onUpdateLevel={handleUpdateLevel}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Live calculator */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <Sparkles size={13} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Live Calculator</h3>
                <p className="text-[10.5px] text-slate-500">Test rule dengan asesmen contoh — lihat level yang dihasilkan</p>
              </div>
              {Object.keys(asesmen).length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              {/* Parameter selectors */}
              <div className="grid gap-2 sm:grid-cols-3">
                {parameters.map((p) => (
                  <ParameterPicker
                    key={p.key}
                    parameter={p}
                    value={asesmen[p.key] ?? ""}
                    onChange={(v) => setAsesmen((prev) => ({ ...prev, [p.key]: v }))}
                  />
                ))}
              </div>

              {/* Arrow + result */}
              <ArrowRight size={20} className="hidden self-center text-slate-400 md:block" aria-hidden="true" />

              <ResultBadge level={computedLevel} />
            </div>

            {/* Triggered rules explainer */}
            {computedLevel && (
              <TriggeredRulesPanel asesmen={asesmen} rules={rules} parameters={parameters} />
            )}
          </div>

          {/* Info / hint */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-[10.5px] leading-snug text-slate-600">
            <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <p>
              <strong className="text-slate-700">Cara kerja:</strong> Saat perawat input asesmen di workflow,
              semua rule yang cocok dengan parameter+value akan dievaluasi. Level <strong className="text-rose-600">TINGGI</strong> menang
              dari <strong className="text-amber-600">SEDANG</strong> menang dari <strong className="text-emerald-600">RENDAH</strong>.
              Jika tidak ada rule yang cocok, default level adalah <strong className="text-emerald-600">RENDAH</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Level column ────────────────────────────────────────

interface LevelColumnProps {
  level: RisikoLevel;
  rules: RisikoRule[];
  parameters: RisikoParameter[];
  existingRules: RisikoRule[];
  onAdd: (param: RisikoParameterKey, value: string, level: RisikoLevel) => void;
  onUpdateLevel: (id: string, level: RisikoLevel) => void;
  onDelete: (id: string) => void;
}

function LevelColumn({
  level, rules, parameters, existingRules, onAdd, onUpdateLevel, onDelete,
}: LevelColumnProps) {
  const [adding, setAdding] = useState(false);
  const cfg = RISIKO_LEVEL_CFG[level];

  return (
    <article className={cn("flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm", cfg.border)}>
      {/* Header */}
      <header className={cn("flex items-center justify-between px-3 py-2", cfg.softBg)}>
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} aria-hidden="true" />
          <h3 className={cn("text-sm font-bold uppercase tracking-wide", cfg.softText)}>{level}</h3>
        </div>
        <span className={cn("rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold ring-1", cfg.ring, cfg.softText)}>
          {rules.length} rule
        </span>
      </header>

      {/* Rule list */}
      <ul className="flex flex-1 flex-col gap-1.5 p-3">
        <AnimatePresence initial={false}>
          {rules.map((rule) => {
            const param = parameters.find((p) => p.key === rule.parameter);
            if (!param) return null;
            return (
              <motion.li
                key={rule.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 transition hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold text-slate-700 truncate">{param.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    <span className="font-mono">=</span> <span className="font-semibold text-slate-700">{rule.value}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <LevelMiniDropdown current={level} onChange={(l) => onUpdateLevel(rule.id, l)} />
                  <button
                    type="button"
                    onClick={() => onDelete(rule.id)}
                    className="rounded p-0.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100"
                    aria-label="Hapus rule"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>

        {rules.length === 0 && !adding && (
          <p className="py-2 text-center text-[10px] text-slate-400">Belum ada rule</p>
        )}

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <AddRuleForm
                level={level}
                parameters={parameters}
                existingRules={existingRules}
                onSave={(p, v) => { onAdd(p, v, level); setAdding(false); }}
                onCancel={() => setAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-md border border-dashed bg-white px-2 py-1.5 text-[10.5px] font-semibold transition",
              cfg.border, cfg.softText, "hover:bg-slate-50",
            )}
          >
            <Plus size={11} />
            Tambah Rule
          </button>
        )}
      </ul>
    </article>
  );
}

// ── Add rule form ──────────────────────────────────────

function AddRuleForm({
  level, parameters, existingRules, onSave, onCancel,
}: {
  level: RisikoLevel;
  parameters: RisikoParameter[];
  existingRules: RisikoRule[];
  onSave: (p: RisikoParameterKey, v: string) => void;
  onCancel: () => void;
}) {
  const [paramKey, setParamKey] = useState<RisikoParameterKey>(parameters[0].key);
  const [value, setValue] = useState<string>("");

  const param = parameters.find((p) => p.key === paramKey)!;
  const usedValues = new Set(
    existingRules.filter((r) => r.parameter === paramKey).map((r) => r.value),
  );
  const availableOptions = param.options.filter((o) => !usedValues.has(o));

  const cfg = RISIKO_LEVEL_CFG[level];
  const canSave = value !== "";

  return (
    <div className={cn("rounded-md border p-2", cfg.border, cfg.softBg)}>
      <div className="flex flex-col gap-1.5">
        <select
          value={paramKey}
          onChange={(e) => { setParamKey(e.target.value as RisikoParameterKey); setValue(""); }}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        >
          {parameters.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        >
          <option value="">— Pilih nilai —</option>
          {availableOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {availableOptions.length === 0 && (
          <p className="text-[10px] italic text-slate-500">Semua nilai parameter ini sudah ada rule-nya.</p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 transition hover:bg-white"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave(paramKey, value)}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold text-white shadow-sm transition",
            canSave ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-300",
          )}
        >
          <Plus size={10} />
          Tambah
        </button>
      </div>
    </div>
  );
}

// ── Level mini dropdown (move rule between levels) ─────

function LevelMiniDropdown({
  current, onChange,
}: {
  current: RisikoLevel;
  onChange: (l: RisikoLevel) => void;
}) {
  const cfg = RISIKO_LEVEL_CFG[current];
  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as RisikoLevel)}
        className={cn(
          "appearance-none rounded-md border bg-white px-1.5 py-0.5 pr-4 text-[10px] font-bold uppercase outline-none transition focus:ring-1",
          cfg.border, cfg.softText, cfg.ring,
        )}
        aria-label="Pindah level"
      >
        {RISIKO_LEVEL_ORDER.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </div>
  );
}

// ── Parameter picker (calculator) ───────────────────────

function ParameterPicker({
  parameter, value, onChange,
}: {
  parameter: RisikoParameter;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {parameter.label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
      >
        <option value="">— Pilih nilai —</option>
        {parameter.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Result badge ───────────────────────────────────────

function ResultBadge({ level }: { level: RisikoLevel | null }) {
  if (!level) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hasil</p>
        <p className="mt-1 text-[11px] text-slate-400">Pilih minimal 1 parameter</p>
      </div>
    );
  }
  const cfg = RISIKO_LEVEL_CFG[level];
  return (
    <motion.div
      key={level}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 px-5 py-3 shadow-md",
        cfg.border, cfg.softBg,
      )}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-500">Risiko</p>
      <p className={cn("text-lg font-extrabold uppercase tracking-wider", cfg.softText)}>{level}</p>
    </motion.div>
  );
}

// ── Triggered rules panel ──────────────────────────────

function TriggeredRulesPanel({
  asesmen, rules, parameters,
}: {
  asesmen: Partial<Record<RisikoParameterKey, string>>;
  rules: RisikoRule[];
  parameters: RisikoParameter[];
}) {
  const triggered = rules.filter((r) => asesmen[r.parameter] === r.value);

  if (triggered.length === 0) {
    return (
      <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-[10.5px] italic text-slate-500 ring-1 ring-slate-200">
        Tidak ada rule yang cocok — default level <strong className="text-emerald-700">RENDAH</strong>.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        Rule yang Terpicu ({triggered.length})
      </p>
      <ul className="flex flex-col gap-1">
        {triggered.map((r) => {
          const param = parameters.find((p) => p.key === r.parameter);
          const cfg = RISIKO_LEVEL_CFG[r.level];
          return (
            <li key={r.id} className="flex items-center gap-2 text-[10.5px]">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
              <span className="text-slate-700">
                <strong>{param?.label}</strong>
                <span className="mx-1 text-slate-400">=</span>
                <span className="font-mono text-slate-700">{r.value}</span>
              </span>
              <ArrowRight size={10} className="text-slate-400" />
              <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.softBg, cfg.softText)}>
                {r.level}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
