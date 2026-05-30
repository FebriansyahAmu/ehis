"use client";

/**
 * BL6.2 — Discharge Gating Banner.
 *
 * Tampilkan status tagihan pasien sebelum finalisasi discharge:
 *   - **Sisa > 0** → banner rose dengan CTA "Selesaikan di Kasir". Submit
 *     finalize discharge tetap boleh (jangan hard-block UI), tapi user dapat
 *     warning visual jelas. Backend nanti enforce via API constraint.
 *   - **Lunas (sisa = 0)** → banner emerald "Tagihan lunas — siap pulang".
 *   - **Penjamin BPJS/Asuransi dengan klaim approved** → banner sky "Klaim
 *     disetujui — sisa selisih ditanggung penjamin".
 *   - **Invoice tidak ditemukan** → banner slate "Belum ada tagihan tercatat"
 *     (informatif saja, tidak gating).
 *
 * Reactive: subscribe ke billingStore via `useInvoiceDetail` → setiap charge
 * ingest baru (lab/rad/farmasi/akomodasi) langsung update angka di sini.
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, ShieldCheck, Receipt, ExternalLink, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  findActiveInvoiceForPasien, useInvoiceDetail,
} from "@/lib/billing/billingStore";
import {
  grandTotal, sisaTagihan,
} from "@/lib/billing/invoiceCalc";
import { fmtRupiah, fmtRupiahShort } from "@/lib/master/penjaminMock";

interface Props {
  noRM: string;
}

type GateState =
  | { kind: "no-invoice" }
  | { kind: "lunas";        invoiceId: string; total: number }
  | { kind: "outstanding";  invoiceId: string; sisa: number; total: number; dibayar: number }
  | { kind: "klaim";        invoiceId: string; sisa: number; penjamin: string };

export default function BillingGateBanner({ noRM }: Props) {
  // Resolve invoice via store (memoized).
  const invoiceId = useMemo(
    () => findActiveInvoiceForPasien(noRM)?.invoiceId ?? null,
    [noRM],
  );
  // Subscribe reaktif — re-render saat charge ingest atau payment baru.
  const detail = useInvoiceDetail(invoiceId ?? "");

  const state: GateState = useMemo(() => {
    if (!invoiceId || !detail) return { kind: "no-invoice" };
    const total = grandTotal(detail);
    const sisa = sisaTagihan(detail);

    if (sisa <= 0) return { kind: "lunas", invoiceId, total };

    // Klaim approved (BPJS/Asuransi) → sisa adalah selisih yang ditanggung pasien
    const isPenjamin = detail.penjamin.tipe !== "umum";
    const klaimApproved =
      detail.status === "Klaim Disetujui" || detail.status === "Proses Klaim";
    if (isPenjamin && klaimApproved) {
      return { kind: "klaim", invoiceId, sisa, penjamin: detail.penjamin.nama };
    }

    return { kind: "outstanding", invoiceId, sisa, total, dibayar: detail.dibayar };
  }, [invoiceId, detail]);

  return (
    <div className="shrink-0 px-4 pt-3">
      <BannerSwitch state={state} />
    </div>
  );
}

// ── Render switch ───────────────────────────────────────

function BannerSwitch({ state }: { state: GateState }) {
  switch (state.kind) {
    case "no-invoice":
      return (
        <BannerShell
          tone="slate"
          icon={Info}
          title="Belum ada tagihan tercatat"
          desc="Discharge boleh dilanjutkan. Charge biasanya muncul otomatis setelah modul klinis (Lab/Rad/Farmasi) menutup order."
        />
      );

    case "lunas":
      return (
        <BannerShell
          tone="emerald"
          icon={CheckCircle2}
          title="Tagihan lunas — siap pulang"
          desc={`Total Rp ${fmtRupiah(state.total).replace("Rp ", "")} sudah dibayar penuh.`}
          deepLink={`/ehis-billing/tagihan/${state.invoiceId}`}
        />
      );

    case "klaim":
      return (
        <BannerShell
          tone="sky"
          icon={ShieldCheck}
          title={`Klaim ${state.penjamin} dalam proses`}
          desc={`Sisa Rp ${fmtRupiah(state.sisa).replace("Rp ", "")} ditanggung penjamin. Discharge boleh — konfirmasi ke kasir untuk berkas klaim.`}
          deepLink={`/ehis-billing/tagihan/${state.invoiceId}`}
          eklaimHref={`/ehis-eklaim/klaim?invoice=${state.invoiceId}`}
        />
      );

    case "outstanding":
      return (
        <BannerShell
          tone="rose"
          icon={AlertTriangle}
          title={`Sisa tagihan Rp ${fmtRupiahShort(state.sisa)}`}
          desc={`Dari total Rp ${fmtRupiahShort(state.total)}, sudah dibayar Rp ${fmtRupiahShort(state.dibayar)}. Selesaikan di Kasir sebelum pasien pulang.`}
          deepLink={`/ehis-billing/tagihan/${state.invoiceId}`}
          required
        />
      );
  }
}

// ── Shared shell ────────────────────────────────────────

interface ShellProps {
  tone:       "rose" | "emerald" | "sky" | "slate";
  icon:       React.ComponentType<{ size?: number; className?: string }>;
  title:      string;
  desc:       string;
  deepLink?:  string;
  eklaimHref?: string;
  required?:  boolean;
}

const TONE_CFG: Record<ShellProps["tone"], {
  bg: string; border: string; iconBg: string; iconText: string;
  titleText: string; descText: string; ctaCls: string;
}> = {
  rose:    { bg: "bg-rose-50",    border: "border-rose-300",    iconBg: "bg-rose-100",    iconText: "text-rose-600",    titleText: "text-rose-900",    descText: "text-rose-700",    ctaCls: "border-rose-300 text-rose-700 hover:bg-rose-100"       },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-600", titleText: "text-emerald-900", descText: "text-emerald-700", ctaCls: "border-emerald-300 text-emerald-700 hover:bg-emerald-100" },
  sky:     { bg: "bg-sky-50",     border: "border-sky-200",     iconBg: "bg-sky-100",     iconText: "text-sky-600",     titleText: "text-sky-900",     descText: "text-sky-700",     ctaCls: "border-sky-300 text-sky-700 hover:bg-sky-100"             },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   iconBg: "bg-slate-100",   iconText: "text-slate-500",   titleText: "text-slate-700",   descText: "text-slate-500",   ctaCls: "border-slate-300 text-slate-600 hover:bg-slate-100"       },
};

function BannerShell({ tone, icon: Icon, title, desc, deepLink, eklaimHref, required }: ShellProps) {
  const cfg = TONE_CFG[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-2.5",
        cfg.bg, cfg.border,
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.iconBg)}>
        <Icon size={14} className={cfg.iconText} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-[12.5px] font-bold", cfg.titleText)}>{title}</p>
          {required && (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
              Perlu Aksi
            </span>
          )}
        </div>
        <p className={cn("mt-0.5 text-[11px] leading-relaxed", cfg.descText)}>{desc}</p>
      </div>
      {deepLink && (
        <Link
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group flex shrink-0 items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[11px] font-semibold shadow-xs transition",
            cfg.ctaCls,
          )}
        >
          <Receipt size={11} />
          Buka Billing
          <ExternalLink size={10} className="transition group-hover:translate-x-0.5" />
        </Link>
      )}
      {eklaimHref && (
        <Link
          href={eklaimHref}
          className="group flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 shadow-xs transition hover:bg-teal-50"
        >
          <ExternalLink size={10} />
          Cek E-Klaim
        </Link>
      )}
    </div>
  );
}
