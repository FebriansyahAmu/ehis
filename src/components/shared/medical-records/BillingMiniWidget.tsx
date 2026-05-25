"use client";

/**
 * BL6.3 — Mini Billing Widget.
 *
 * Compact 1-line summary tagihan pasien aktif untuk PatientBanner (IGD/RI/RJ).
 * Reactive via `useInvoiceDetail` — auto-update saat charge ingest jalan.
 *
 * Tampilan:
 *   - Invoice ditemukan + sisa > 0 → chip rose "Sisa Rp X.XM" + Receipt icon + ChevronRight
 *   - Invoice ditemukan + lunas    → chip emerald "Lunas Rp X.XM"
 *   - Invoice tidak ditemukan      → chip slate "Belum ada tagihan" (read-only, no link)
 *
 * Klik widget → deep-link `/ehis-billing/tagihan/[id]` `target=_blank`
 * (preserve context modul klinis).
 *
 * Compact mode (`compact={true}`): single icon + sisa nominal, untuk header
 * strip yang sempit. Default mode: 2-row card untuk sidebar.
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  Receipt, ChevronRight, CheckCircle2, AlertCircle, FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  findActiveInvoiceForPasien, useInvoiceDetail,
} from "@/lib/billing/billingStore";
import {
  grandTotal, sisaTagihan,
} from "@/lib/billing/invoiceCalc";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";

interface Props {
  noRM:     string;
  /** Compact: single inline chip. Default: 2-row card. */
  compact?: boolean;
}

type WidgetState =
  | { kind: "no-invoice" }
  | { kind: "lunas";       invoiceId: string; total: number }
  | { kind: "outstanding"; invoiceId: string; total: number; sisa: number };

export default function BillingMiniWidget({ noRM, compact = false }: Props) {
  const invoiceId = useMemo(
    () => findActiveInvoiceForPasien(noRM)?.invoiceId ?? null,
    [noRM],
  );
  const detail = useInvoiceDetail(invoiceId ?? "");

  const state: WidgetState = useMemo(() => {
    if (!invoiceId || !detail) return { kind: "no-invoice" };
    const total = grandTotal(detail);
    const sisa = sisaTagihan(detail);
    if (sisa <= 0) return { kind: "lunas", invoiceId, total };
    return { kind: "outstanding", invoiceId, total, sisa };
  }, [invoiceId, detail]);

  return compact ? <CompactChip state={state} /> : <CardWidget state={state} />;
}

// ── Compact (chip inline) ───────────────────────────────

function CompactChip({ state }: { state: WidgetState }) {
  if (state.kind === "no-invoice") {
    return (
      <span
        title="Belum ada tagihan tercatat untuk pasien ini"
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-semibold text-slate-500 ring-1 ring-slate-200"
      >
        <FileQuestion size={11} />
        Belum ada tagihan
      </span>
    );
  }

  const isLunas = state.kind === "lunas";
  const Icon = isLunas ? CheckCircle2 : AlertCircle;
  const label = isLunas
    ? `Lunas · ${fmtRupiahShort(state.total)}`
    : `Sisa Rp ${fmtRupiahShort(state.sisa)}`;
  const tone = isLunas
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
    : "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100";

  return (
    <Link
      href={`/ehis-billing/tagihan/${state.invoiceId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={isLunas ? "Tagihan lunas — buka di Billing" : "Sisa tagihan — buka di Billing"}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold ring-1 transition",
        tone,
      )}
    >
      <Icon size={11} />
      <span className="font-mono tabular-nums">{label}</span>
      <ChevronRight size={10} className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}

// ── Card (2-row sidebar) ────────────────────────────────

function CardWidget({ state }: { state: WidgetState }) {
  if (state.kind === "no-invoice") {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center">
        <FileQuestion size={16} className="mx-auto text-slate-300" />
        <p className="mt-1 text-[10.5px] font-semibold text-slate-500">Belum ada tagihan</p>
        <p className="mt-0.5 text-[9.5px] text-slate-400">
          Charge akan muncul setelah modul klinis menutup order
        </p>
      </div>
    );
  }

  const isLunas = state.kind === "lunas";
  const tone = isLunas
    ? { card: "border-emerald-200 bg-emerald-50/40", text: "text-emerald-700", label: "text-emerald-600" }
    : { card: "border-rose-200 bg-rose-50/40",       text: "text-rose-700",    label: "text-rose-600"    };

  return (
    <Link
      href={`/ehis-billing/tagihan/${state.invoiceId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block rounded-xl border px-3 py-2.5 transition hover:shadow-sm",
        tone.card,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Receipt size={12} className={tone.label} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", tone.label)}>
            {isLunas ? "Tagihan Lunas" : "Sisa Tagihan"}
          </span>
        </div>
        <ChevronRight size={11} className={cn("transition group-hover:translate-x-0.5", tone.label)} />
      </div>
      <p className={cn("mt-1 font-mono text-lg font-bold tabular-nums leading-tight", tone.text)}>
        {fmtRupiahShort(isLunas ? state.total : state.sisa)}
      </p>
      <p className="mt-0.5 text-[9.5px] text-slate-500">
        {isLunas
          ? "Sudah dibayar penuh"
          : `Dari total ${fmtRupiahShort(state.total)} · buka untuk detail`}
      </p>
    </Link>
  );
}
