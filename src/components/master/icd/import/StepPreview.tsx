"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Copy, ChevronRight, ChevronDown, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedFile, ValidationSummary } from "./importHelpers";
import type { IcdJenis } from "@/lib/master/icdMock";
import { JENIS_CFG } from "../icdShared";

interface Props {
  parsed: ParsedFile;
  jenis: IcdJenis;
  summary: ValidationSummary | null;
}

export default function StepPreview({ parsed, jenis, summary }: Props) {
  if (!summary) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Tidak ada data untuk dipreview.
      </p>
    );
  }

  const jnsCfg = JENIS_CFG[jenis];

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <section>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          Ringkasan Validasi
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard
            label="Total Baris"
            value={summary.totalRows}
            icon={Database}
            tone="slate"
          />
          <SummaryCard
            label="Akan Diimport"
            value={summary.validRows}
            icon={CheckCircle2}
            tone="emerald"
          />
          <SummaryCard
            label="Duplikat"
            value={summary.duplicateRows}
            icon={Copy}
            tone="amber"
            hint="Kode sudah ada"
          />
          <SummaryCard
            label="Error"
            value={summary.invalidRows}
            icon={AlertTriangle}
            tone="rose"
            hint="Field wajib kosong"
          />
        </div>
      </section>

      {/* Target info */}
      <div className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        jnsCfg.bg,
      )}>
        <jnsCfg.icon size={14} className={jnsCfg.text} />
        <p className="text-[11px]">
          <span className={cn("font-semibold", jnsCfg.text)}>{jnsCfg.label}</span>
          <span className="ml-2 text-slate-600">
            · file: <strong className="text-slate-800">{parsed.fileName}</strong>
            {parsed.truncated && (
              <span className="ml-1 text-amber-700">(truncated, hanya {parsed.rows.length} baris di-validasi)</span>
            )}
          </span>
        </p>
      </div>

      {/* Errors collapsible */}
      {summary.errors.length > 0 && (
        <CollapsibleList
          title={`${summary.errors.length} Baris dengan Error`}
          tone="rose"
          icon={AlertTriangle}
          defaultOpen
        >
          <ul className="divide-y divide-rose-100">
            {summary.errors.slice(0, 15).map((err) => (
              <li key={err.rowIdx} className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                <span className="rounded bg-rose-100 px-1.5 py-0 font-mono text-[10px] text-rose-700">
                  baris {err.rowIdx + 2}
                </span>
                <span className="text-slate-700">{err.reason}</span>
              </li>
            ))}
            {summary.errors.length > 15 && (
              <li className="px-3 py-1.5 text-center text-[10.5px] text-slate-500">
                … dan {summary.errors.length - 15} error lainnya
              </li>
            )}
          </ul>
        </CollapsibleList>
      )}

      {/* Duplicates collapsible */}
      {summary.duplicates.length > 0 && (
        <CollapsibleList
          title={`${summary.duplicates.length} Baris Duplikat (akan di-skip)`}
          tone="amber"
          icon={Copy}
          defaultOpen={false}
        >
          <ul className="divide-y divide-amber-100">
            {summary.duplicates.slice(0, 15).map((d) => (
              <li key={d.rowIdx} className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                <span className="rounded bg-amber-100 px-1.5 py-0 font-mono text-[10px] text-amber-700">
                  baris {d.rowIdx + 2}
                </span>
                <span className="font-mono text-slate-700">{d.kode}</span>
                <span className="text-slate-500">— sudah ada di katalog</span>
              </li>
            ))}
            {summary.duplicates.length > 15 && (
              <li className="px-3 py-1.5 text-center text-[10.5px] text-slate-500">
                … dan {summary.duplicates.length - 15} duplikat lainnya
              </li>
            )}
          </ul>
        </CollapsibleList>
      )}

      {/* Accepted preview */}
      <CollapsibleList
        title={`Preview ${Math.min(15, summary.acceptedItems.length)} dari ${summary.acceptedItems.length} Kode yang Akan Diimport`}
        tone="emerald"
        icon={CheckCircle2}
        defaultOpen
      >
        {summary.acceptedItems.length === 0 ? (
          <p className="px-3 py-3 text-center text-[11px] text-slate-500">
            Tidak ada baris valid untuk di-import. Periksa error/mapping di langkah sebelumnya.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px]">
              <thead className="bg-emerald-50/50">
                <tr>
                  <th className="border-r border-emerald-100 px-2 py-1 text-left text-[9px] font-semibold uppercase text-emerald-700">Kode</th>
                  <th className="border-r border-emerald-100 px-2 py-1 text-left text-[9px] font-semibold uppercase text-emerald-700">Display</th>
                  <th className="border-r border-emerald-100 px-2 py-1 text-left text-[9px] font-semibold uppercase text-emerald-700">Versi</th>
                  <th className="border-r border-emerald-100 px-2 py-1 text-left text-[9px] font-semibold uppercase text-emerald-700">Chapter</th>
                  <th className="px-2 py-1 text-left text-[9px] font-semibold uppercase text-emerald-700">CBG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {summary.acceptedItems.slice(0, 15).map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30">
                    <td className="border-r border-emerald-50 px-2 py-1 font-mono font-semibold text-slate-800">
                      {item.kode}
                    </td>
                    <td className="border-r border-emerald-50 px-2 py-1 text-slate-700">{item.nama}</td>
                    <td className="border-r border-emerald-50 px-2 py-1 font-mono text-slate-600">{item.version}</td>
                    <td className="border-r border-emerald-50 px-2 py-1 text-slate-600">
                      {item.chapter ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-2 py-1 font-mono text-emerald-700">
                      {item.inaCbg ?? <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleList>

      {/* Final hint */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-sky-600" />
        <div className="flex-1 text-[10.5px]">
          <p className="font-semibold text-sky-800">Siap untuk Import</p>
          <p className="mt-0.5 text-sky-700">
            Klik <strong>Import {summary.acceptedItems.length} kode</strong> di bawah untuk menambahkan ke katalog.
            Data tersimpan di sesi ini saja — backend persistence aktif saat database siap.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, tone, hint,
}: {
  label: string;
  value: number;
  icon: IconComponent;
  tone: "slate" | "emerald" | "amber" | "rose";
  hint?: string;
}) {
  const tones = {
    slate:   { bg: "bg-slate-50",   text: "text-slate-700",   ring: "ring-slate-200",   iconBg: "bg-slate-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", iconBg: "bg-emerald-100" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   iconBg: "bg-amber-100" },
    rose:    { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    iconBg: "bg-rose-100" },
  };
  const cfg = tones[tone];
  return (
    <div className={cn("rounded-lg border border-slate-200 px-3 py-2", value > 0 ? cfg.bg : "bg-white")}>
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cfg.iconBg, cfg.text)}>
          <Icon size={12} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={cn("text-lg font-black leading-none", value > 0 ? cfg.text : "text-slate-400")}>
            {value}
          </p>
        </div>
      </div>
      {hint && <p className="mt-1 text-[9.5px] text-slate-500">{hint}</p>}
    </div>
  );
}

// ── Collapsible list ─────────────────────────────────────

function CollapsibleList({
  title, tone, icon: Icon, defaultOpen, children,
}: {
  title: string;
  tone: "rose" | "amber" | "emerald";
  icon: IconComponent;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tones = {
    rose:    { border: "border-rose-200",    bg: "bg-rose-50/40",    head: "bg-rose-50",    text: "text-rose-800",    icon: "text-rose-600" },
    amber:   { border: "border-amber-200",   bg: "bg-amber-50/40",   head: "bg-amber-50",   text: "text-amber-800",   icon: "text-amber-600" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/40", head: "bg-emerald-50", text: "text-emerald-800", icon: "text-emerald-600" },
  };
  const cfg = tones[tone];
  return (
    <div className={cn("overflow-hidden rounded-lg border", cfg.border, cfg.bg)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:opacity-90",
          cfg.head,
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={13} className={cfg.icon} />
          <p className={cn("text-[11px] font-bold uppercase tracking-wide", cfg.text)}>{title}</p>
        </div>
        {open ? <ChevronDown size={12} className={cfg.icon} /> : <ChevronRight size={12} className={cfg.icon} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
