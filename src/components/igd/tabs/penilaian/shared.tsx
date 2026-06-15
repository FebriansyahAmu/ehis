"use client";

// Primitives bersama untuk tab Penilaian (IGD). Diekstrak dari PenilaianTab agar panel
// terpisah (mis. SkalaRisikoPanel) bisa reuse tanpa import siklik. Murni presentasional.

import { useRef, useEffect, type ReactNode } from "react";
import { Calendar, User, FileText, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkalaRisikoDTO } from "@/lib/schemas/master/skalaRisiko";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const NOTE_DATE_FMT = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

// Konteks panel — sebagian sub-menu butuh kunjungan + sesi login + unit (mis. Fisik/Skala persist ke BE).
export type PanelCtx = { kunjunganId: string; isPersisted: boolean; perawat: string; modul: string };

// ── Styles ─────────────────────────────────────────────────────
export const inputCls =
  "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
export const textareaCls =
  "w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

// ── Auto-resize textarea ───────────────────────────────────────
export function AutoTextarea({
  value, onChange, placeholder, className, minRows = 3,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.max(ref.current.scrollHeight, minRows * 26)}px`;
  }, [value, minRows]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ overflow: "hidden" }}
      className={cn(textareaCls, className)}
    />
  );
}

// ── Shared primitives ──────────────────────────────────────────
export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

export function SectionHead({
  icon: Icon, title, subtitle, iconCls = "text-slate-400",
}: {
  icon: LucideIcon; title: string; subtitle?: string; iconCls?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
      <Icon size={12} className={iconCls} />
      <div>
        <p className="text-xs font-bold text-slate-700">{title}</p>
        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Pill({
  label, score, selected, onClick,
}: {
  label: string; score?: number; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        selected
          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600",
      )}
    >
      {score !== undefined && (
        <span className={cn("font-mono text-[10px] font-bold leading-none", selected ? "text-indigo-600" : "text-slate-400")}>
          {score}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

export function SaveBtn({
  label = "Simpan", onClick, disabled, loading,
}: {
  label?: string; onClick?: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "Menyimpan…" : label}
    </button>
  );
}

export function ScoreBar({
  total, max, allFilled, level,
}: {
  total: number; max: number; allFilled: boolean;
  level: { label: string; cls: string; barCls: string } | null;
}) {
  const pct = allFilled && max > 0 ? Math.round((total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
      <div className="flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Total Skor</span>
          <span className={cn("font-mono text-sm font-bold", allFilled ? "text-slate-800" : "text-slate-400")}>
            {allFilled ? `${total} / ${max}` : `— / ${max}`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn("h-full rounded-full transition-all duration-500", level?.barCls ?? "bg-indigo-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {level && (
        <span className={cn("shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold", level.cls)}>
          {level.label}
        </span>
      )}
    </div>
  );
}

// ── Previous notes panel ───────────────────────────────────────
export type NoteEntry = { date: string; author: string; content: string; tag?: string };

export function NoteCard({ note }: { note: NoteEntry }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-xs">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={10} className="text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-500">{note.date}</span>
        </div>
        {note.tag && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-500 ring-1 ring-indigo-100">
            {note.tag}
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-600">{note.content}</p>
      <div className="mt-1.5 flex items-center gap-1">
        <User size={9} className="text-slate-300" />
        <span className="text-[10px] text-slate-400">{note.author}</span>
      </div>
    </div>
  );
}

export function HistoryPanel({ title, notes }: { title: string; notes: NoteEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-2">
        <Clock size={11} className="text-emerald-500" />
        <p className="text-[11px] font-semibold text-slate-600">Riwayat {title}</p>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileText size={20} className="text-slate-200" />
          <p className="text-[11px] text-slate-400">Belum ada catatan sebelumnya</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note, i) => <NoteCard key={i} note={note} />)}
        </div>
      )}
    </div>
  );
}

// ── Two-panel layout ───────────────────────────────────────────
export function TwoPanel({ form, history }: { form: ReactNode; history: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
      <div className="min-w-0 flex-1">{form}</div>
      <div className="shrink-0 lg:w-68 xl:w-72">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">{history}</div>
      </div>
    </div>
  );
}

// ── Utility ────────────────────────────────────────────────────
export const toggleItem = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

// ── Mesin skoring skala (master-driven) — dipakai SkalaRisikoPanel · Jantung · Kanker ──
// Instrumen = SkalaRisikoDTO (kategori Risiko/Penyakit identik bentuk). Single source skoring.
export type ScaleInstrument = SkalaRisikoDTO;
export type ScaleScores = Record<string, number | null>;
export interface ScaleJawaban { itemId: string; itemLabel: string; score: number; optionLabel: string; }
export interface ScaleResult {
  total: number;
  allFilled: boolean;
  interp: SkalaRisikoDTO["interpretasi"][number] | null;
  level: { label: string; cls: string; barCls: string } | null;
  jawaban: ScaleJawaban[];
}

// Tone master (emerald/yellow/amber/orange/rose/red/sky) → kelas badge + bar (purge-safe).
export const TONE_MAP: Record<string, { cls: string; barCls: string }> = {
  emerald: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" },
  yellow:  { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",    barCls: "bg-yellow-500"  },
  amber:   { cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   },
  orange:  { cls: "bg-orange-50 text-orange-700 border-orange-200",     barCls: "bg-orange-500"  },
  rose:    { cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    },
  red:     { cls: "bg-red-50 text-red-700 border-red-300",             barCls: "bg-red-600"     },
  sky:     { cls: "bg-sky-50 text-sky-700 border-sky-200",             barCls: "bg-sky-500"     },
};

/** Hitung total + interpretasi + jawaban dari pilihan user (sum_items & select_value). */
export function computeScale(ins: ScaleInstrument, scores: ScaleScores): ScaleResult {
  const items = ins.items;
  const allFilled = items.length > 0 && items.every((it) => scores[it.id] != null);
  const total = items.reduce((sum, it) => sum + (scores[it.id] ?? 0), 0);
  const interp = allFilled ? ins.interpretasi.find((r) => total >= r.min && total <= r.max) ?? null : null;
  const level = interp ? { label: interp.label, ...(TONE_MAP[interp.tone] ?? TONE_MAP.sky) } : null;
  const jawaban: ScaleJawaban[] = items.map((it) => {
    const sc = scores[it.id];
    const opt = it.options.find((o) => o.score === sc);
    return { itemId: it.id, itemLabel: it.label, score: sc ?? 0, optionLabel: opt?.label ?? "" };
  });
  return { total, allFilled, interp, level, jawaban };
}

/** Render 1 instrumen skala (items×opsi + skor live + interpretasi). Controlled. */
export function ScaleField({
  instrument, scores, onScore,
}: {
  instrument: ScaleInstrument; scores: ScaleScores; onScore: (itemId: string, score: number) => void;
}) {
  const { total, allFilled, interp, level } = computeScale(instrument, scores);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-700">{instrument.nama}</p>
        {instrument.arah === "lower_is_worse" && (
          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-amber-200">
            skor rendah = risiko tinggi
          </span>
        )}
      </div>
      {instrument.items.map((item) => (
        <div key={item.id}>
          {instrument.items.length > 1 && <Label>{item.label}</Label>}
          <div className="flex flex-wrap gap-1.5">
            {item.options.map((opt) => (
              <Pill
                key={`${item.id}-${opt.score}-${opt.label}`}
                label={opt.detail ? `${opt.label} · ${opt.detail}` : opt.label}
                score={opt.score}
                selected={scores[item.id] === opt.score}
                onClick={() => onScore(item.id, opt.score)}
              />
            ))}
          </div>
        </div>
      ))}
      <ScoreBar total={total} max={instrument.totalMax} allFilled={allFilled} level={level} />
      {interp?.action && (
        <p className={cn("rounded-md border px-2 py-1 text-[10px] leading-snug", level?.cls)}>
          <span className="font-semibold">Tindak lanjut:</span> {interp.action}
        </p>
      )}
    </div>
  );
}
