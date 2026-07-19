"use client";

/**
 * Mini Billing Widget — chip ringkas sisa tagihan pasien aktif untuk header rekam medis (RI).
 *
 * DATA NYATA (P2, 2026-07-19): baca `/kunjungan/:id/billing/ringkas` (gate clinical.rekammedis:read)
 * via `useBillingRingkas` — reaktif atas domain "order" (order klinis baru/batal → sisa ter-update).
 * Menggantikan billingStore mock lama (yang key by noRM). Deep-link ke view proyeksi nyata
 * `/ehis-billing/tagihan/kunjungan/[kid]`.
 *
 * Berbeda dari `TotalTagihanWidget` (di sebelahnya): itu = ESTIMASI biaya order (Tindakan/Resep/…);
 * ini = SISA BAYAR nyata (grandTotal incl. akomodasi + adjustment − pembayaran).
 *
 * Tampilan:
 *   - subtotal 0 / demo (non-UUID) → chip slate "Belum ada tagihan" (read-only)
 *   - sisa > 0  → chip rose "Sisa Rp X" + deep-link
 *   - lunas     → chip emerald "Lunas · Rp X"
 *
 * Compact mode (`compact`): single chip untuk header strip. Default: card 2-row untuk sidebar.
 */

import Link from "next/link";
import {
  Receipt, ChevronRight, CheckCircle2, AlertCircle, FileQuestion, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import { useBillingRingkas, billingKind } from "./useBillingRingkas";

interface Props {
  kunjunganId: string;
  /** Dipertahankan untuk kompatibilitas call-site + judul; billing di-resolve via kunjunganId. */
  noRM?:    string;
  /** Compact: single inline chip. Default: 2-row card. */
  compact?: boolean;
}

export default function BillingMiniWidget({ kunjunganId, compact = false }: Props) {
  const { data, loading } = useBillingRingkas(kunjunganId);
  const kind = billingKind(data);
  const href = `/ehis-billing/tagihan/kunjungan/${encodeURIComponent(kunjunganId)}`;

  return compact
    ? <CompactChip kind={kind} loading={loading} sisa={data?.sisa ?? 0} grand={data?.grandTotal ?? 0} href={href} />
    : <CardWidget  kind={kind} loading={loading} sisa={data?.sisa ?? 0} grand={data?.grandTotal ?? 0} href={href} />;
}

interface ViewProps {
  kind:    ReturnType<typeof billingKind>;
  loading: boolean;
  sisa:    number;
  grand:   number;
  href:    string;
}

// ── Compact (chip inline) ───────────────────────────────

function CompactChip({ kind, loading, sisa, grand, href }: ViewProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-semibold text-slate-400 ring-1 ring-slate-200">
        <Loader2 size={11} className="animate-spin" />
        <span className="hidden sm:inline">Tagihan…</span>
      </span>
    );
  }

  if (kind === "no-invoice") {
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

  const isLunas = kind === "lunas";
  const Icon = isLunas ? CheckCircle2 : AlertCircle;
  const label = isLunas ? `Lunas · ${fmtRupiahShort(grand)}` : `Sisa Rp ${fmtRupiahShort(sisa)}`;
  const tone = isLunas
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
    : "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100";

  return (
    <Link
      href={href}
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

function CardWidget({ kind, loading, sisa, grand, href }: ViewProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center">
        <Loader2 size={16} className="mx-auto animate-spin text-slate-300" />
        <p className="mt-1 text-[10.5px] font-semibold text-slate-400">Memuat tagihan…</p>
      </div>
    );
  }

  if (kind === "no-invoice") {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center">
        <FileQuestion size={16} className="mx-auto text-slate-300" />
        <p className="mt-1 text-[10.5px] font-semibold text-slate-500">Belum ada tagihan</p>
        <p className="mt-0.5 text-[9.5px] text-slate-400">
          Charge akan muncul setelah ada order klinis bertarif
        </p>
      </div>
    );
  }

  const isLunas = kind === "lunas";
  const tone = isLunas
    ? { card: "border-emerald-200 bg-emerald-50/40", text: "text-emerald-700", label: "text-emerald-600" }
    : { card: "border-rose-200 bg-rose-50/40",       text: "text-rose-700",    label: "text-rose-600"    };

  return (
    <Link
      href={href}
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
        {fmtRupiahShort(isLunas ? grand : sisa)}
      </p>
      <p className="mt-0.5 text-[9.5px] text-slate-500">
        {isLunas
          ? "Sudah dibayar penuh"
          : `Dari total ${fmtRupiahShort(grand)} · buka untuk detail`}
      </p>
    </Link>
  );
}
