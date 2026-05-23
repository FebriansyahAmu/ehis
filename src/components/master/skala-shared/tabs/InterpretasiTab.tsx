"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, MoveUp, MoveDown, Gauge, AlertTriangle, Sparkles, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TextInput, NumberInput, TextArea, SectionGroup,
} from "@/components/master/shared";
import type {
  SkalaRecord, SkalaInterpretasi, SkalaTone,
} from "@/lib/master/skalaCommon";
import {
  TONE_CFG, TONE_OPTIONS, detectRangeIssues, findInterpretasi,
} from "../skalaConfig";

interface Props {
  draft: SkalaRecord;
  onPatch: (p: Partial<SkalaRecord>) => void;
}

function uid(): string {
  return `int-${Math.random().toString(36).slice(2, 8)}`;
}

export default function InterpretasiTab({ draft, onPatch }: Props) {
  const [previewScore, setPreviewScore] = useState<number>(0);

  const issues = useMemo(
    () => detectRangeIssues(draft.interpretasi, draft.totalMax),
    [draft.interpretasi, draft.totalMax],
  );

  const previewMatch = useMemo(
    () => findInterpretasi(draft.interpretasi, previewScore),
    [draft.interpretasi, previewScore],
  );

  const commit = (next: SkalaInterpretasi[]) => {
    onPatch({ interpretasi: [...next].sort((a, b) => a.min - b.min) });
  };

  const addRange = () => {
    const last = draft.interpretasi[draft.interpretasi.length - 1];
    const start = last ? Math.min(last.max + 1, draft.totalMax) : 0;
    const end = Math.min(start + 5, draft.totalMax);
    commit([
      ...draft.interpretasi,
      {
        id: uid(),
        min: start,
        max: end,
        label: "",
        tone: "amber",
        action: "",
      },
    ]);
  };

  const updateRange = (id: string, patch: Partial<SkalaInterpretasi>) => {
    commit(draft.interpretasi.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRange = (id: string) => {
    commit(draft.interpretasi.filter((r) => r.id !== id));
  };

  const moveRange = (id: string, dir: -1 | 1) => {
    const idx = draft.interpretasi.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= draft.interpretasi.length) return;
    const next = [...draft.interpretasi];
    [next[idx], next[target]] = [next[target], next[idx]];
    onPatch({ interpretasi: next });
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
      {/* Range editor (lebih lebar) */}
      <div className="lg:col-span-3">
        <SectionGroup
          title="Threshold Interpretasi"
          icon={<Gauge size={11} />}
          accent={{ bg: "bg-amber-50", text: "text-amber-700" }}
          desc="Definisikan range skor → label + action plan untuk klinisi"
          action={
            <button
              type="button"
              onClick={addRange}
              className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              <Plus size={11} />
              Tambah Range
            </button>
          }
        >
          {issues.length > 0 && <IssueBanner issues={issues} totalMax={draft.totalMax} />}

          {draft.interpretasi.length === 0 ? (
            <EmptyRange onAdd={addRange} />
          ) : (
            <ul className="mt-2 flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {draft.interpretasi.map((r, idx) => (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    <RangeCard
                      r={r}
                      totalMax={draft.totalMax}
                      isFirst={idx === 0}
                      isLast={idx === draft.interpretasi.length - 1}
                      onUpdate={(p) => updateRange(r.id, p)}
                      onRemove={() => removeRange(r.id)}
                      onMove={(d) => moveRange(r.id, d)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </SectionGroup>
      </div>

      {/* Preview panel */}
      <div className="lg:col-span-2">
        <PreviewPanel
          draft={draft}
          score={previewScore}
          onScoreChange={setPreviewScore}
          match={previewMatch}
        />
      </div>
    </div>
  );
}

// ── Range card ───────────────────────────────────────────

function RangeCard({
  r, totalMax, isFirst, isLast, onUpdate, onRemove, onMove,
}: {
  r: SkalaInterpretasi;
  totalMax: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (p: Partial<SkalaInterpretasi>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const tone = TONE_CFG[r.tone];

  return (
    <div className={cn(
      "rounded-xl border bg-white",
      tone.ring.replace("ring-", "border-"),
    )}>
      <header className={cn(
        "flex items-center gap-2 rounded-t-xl border-b px-3 py-2",
        tone.bg,
        tone.ring.replace("ring-", "border-"),
      )}>
        <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
        <div className="min-w-0 flex-1">
          <TextInput
            value={r.label}
            onChange={(v) => onUpdate({ label: v })}
            placeholder="Mis. Risiko Tinggi / Ketergantungan Sedang"
            maxW="max-w-none"
            accent="amber"
            className={cn("font-semibold", tone.text)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn title="Naik" disabled={isFirst} onClick={() => onMove(-1)}>
            <MoveUp size={11} />
          </IconBtn>
          <IconBtn title="Turun" disabled={isLast} onClick={() => onMove(1)}>
            <MoveDown size={11} />
          </IconBtn>
          <IconBtn title="Hapus range" onClick={onRemove} variant="danger">
            <Trash2 size={11} />
          </IconBtn>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        {/* Min/Max + Tone */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FieldLabel label="Skor Min">
            <NumberInput
              value={r.min}
              onChange={(v) => onUpdate({ min: v ?? 0 })}
              min={0}
              max={totalMax}
              maxW="max-w-[100px]"
              accent="amber"
            />
          </FieldLabel>
          <FieldLabel label="Skor Maks">
            <NumberInput
              value={r.max}
              onChange={(v) => onUpdate({ max: v ?? 0 })}
              min={0}
              max={totalMax}
              maxW="max-w-[100px]"
              accent="amber"
            />
          </FieldLabel>
          <FieldLabel label="Tone (warna)">
            <TonePicker value={r.tone} onChange={(t) => onUpdate({ tone: t })} />
          </FieldLabel>
        </div>

        {/* Action */}
        <FieldLabel label="Tindak Lanjut Klinis" hint="Petunjuk action plan saat skor masuk range ini">
          <TextArea
            value={r.action}
            onChange={(v) => onUpdate({ action: v })}
            placeholder="Mis. Reposisi tiap 2 jam, kasur antidekubitus, evaluasi 6 jam berikutnya."
            rows={2}
            accent="amber"
          />
        </FieldLabel>
      </div>
    </div>
  );
}

// ── Tone picker ──────────────────────────────────────────

function TonePicker({ value, onChange }: { value: SkalaTone; onChange: (v: SkalaTone) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {TONE_OPTIONS.map((t) => {
        const cfg = TONE_CFG[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            title={t}
            aria-label={`Warna ${t}`}
            className={cn(
              "h-6 w-6 rounded-md border transition outline-none focus-visible:ring-2",
              cfg.bar,
              active
                ? "border-slate-900 ring-2 ring-slate-300 scale-110"
                : "border-slate-200 hover:scale-105",
            )}
          />
        );
      })}
    </div>
  );
}

// ── Issue banner ─────────────────────────────────────────

function IssueBanner({
  issues, totalMax,
}: {
  issues: { type: "gap" | "overlap"; from: number; to: number }[];
  totalMax: number;
}) {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
      <div className="flex-1 text-[11px] leading-relaxed">
        <p className="font-semibold text-rose-800">
          {issues.length} masalah pada range (total max: {totalMax})
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {issues.slice(0, 4).map((iss, i) => (
            <li key={i} className="text-rose-700">
              {iss.type === "gap" ? "Kosong" : "Overlap"} skor{" "}
              <span className="font-mono font-bold">{iss.from}–{iss.to}</span>
            </li>
          ))}
          {issues.length > 4 && (
            <li className="text-rose-600">… dan {issues.length - 4} lagi</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────

function EmptyRange({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
      <Sparkles className="mx-auto mb-2 text-slate-400" size={20} />
      <p className="text-xs font-semibold text-slate-600">Belum ada threshold</p>
      <p className="mt-0.5 text-[10.5px] text-slate-500">
        Tambah range skor + label + action plan. Min 2 range untuk skala risiko biner (rendah/tinggi).
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
      >
        <Plus size={12} />
        Tambah Range Pertama
      </button>
    </div>
  );
}

// ── Preview ──────────────────────────────────────────────

function PreviewPanel({
  draft, score, onScoreChange, match,
}: {
  draft: SkalaRecord;
  score: number;
  onScoreChange: (v: number) => void;
  match: SkalaInterpretasi | null;
}) {
  const clamped = Math.max(0, Math.min(draft.totalMax, score));
  const tone = match ? TONE_CFG[match.tone] : null;
  const pct = draft.totalMax > 0 ? (clamped / draft.totalMax) * 100 : 0;

  return (
    <SectionGroup
      title="Preview Klinis"
      icon={<Eye size={11} />}
      accent={{ bg: "bg-sky-50", text: "text-sky-700" }}
      desc="Geser slider untuk simulasi skor & lihat hasil interpretasi"
    >
      <div className="flex flex-col gap-3">
        {/* Score slider */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Skor Simulasi
            </span>
            <span className="font-mono text-base font-black tabular-nums text-slate-900">
              {clamped}
              <span className="ml-1 text-[10px] font-medium text-slate-400">
                / {draft.totalMax}
              </span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, draft.totalMax)}
            step={1}
            value={clamped}
            onChange={(e) => onScoreChange(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={cn("h-full rounded-full", tone?.bar ?? "bg-slate-300")}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 280, damping: 25 }}
            />
          </div>
        </div>

        {/* Match card */}
        {match && tone ? (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-xl border p-3",
              tone.bg, tone.ring.replace("ring-", "border-"),
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
              <p className={cn("text-xs font-bold", tone.text)}>{match.label}</p>
              <span className="ml-auto font-mono text-[10px] font-semibold text-slate-500">
                {match.min}–{match.max}
              </span>
            </div>
            {match.action && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-700">
                {match.action}
              </p>
            )}
          </motion.div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[11px] text-slate-500">
              {draft.interpretasi.length === 0
                ? "Belum ada range — tambah di kiri untuk preview"
                : `Skor ${clamped} tidak masuk range manapun`}
            </p>
          </div>
        )}

        {/* Mini map all ranges */}
        {draft.interpretasi.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Peta Range
            </p>
            <div className="flex flex-col gap-1">
              {draft.interpretasi.map((r) => {
                const isMatch = match?.id === r.id;
                const cfg = TONE_CFG[r.tone];
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1 text-[10.5px] transition",
                      isMatch
                        ? cn(cfg.bg, cfg.ring.replace("ring-", "border-"), "ring-1", cfg.ring)
                        : "border-slate-100 bg-white",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    <span className="font-mono text-slate-500">
                      {r.min}–{r.max}
                    </span>
                    <span className={cn(
                      "flex-1 truncate font-medium",
                      isMatch ? cfg.text : "text-slate-700",
                    )}>
                      {r.label || <span className="italic text-slate-400">(tanpa label)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SectionGroup>
  );
}

// ── Small helpers ────────────────────────────────────────

function FieldLabel({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </div>
  );
}

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
