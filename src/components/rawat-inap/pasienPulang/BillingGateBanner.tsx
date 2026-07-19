"use client";

/**
 * Discharge Gating Banner (RI) — status tagihan pasien sebelum finalisasi pulang.
 *
 * DATA NYATA (P2, 2026-07-19): baca ringkas billing via `useBillingRingkas`
 * (`/kunjungan/:id/billing/ringkas`, gate clinical.rekammedis:read) — reaktif atas domain "order".
 * Menggantikan billingStore mock lama (key by noRM). Deep-link ke view proyeksi nyata.
 *
 *   - **Sisa > 0 (Umum)** → banner rose "Selesaikan di Kasir" (warning visual; discharge tak di-hard-block).
 *   - **Sisa > 0 (BPJS/Asuransi/Jamkesda)** → banner sky "sisa ditanggung penjamin — konfirmasi kasir".
 *   - **Lunas (sisa = 0)** → banner emerald "Tagihan lunas — siap pulang".
 *   - **Belum ada tagihan / demo** → banner slate informatif (tidak gating).
 */

import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, ShieldCheck, Receipt, ExternalLink, Info, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, fmtRupiahShort } from "@/lib/master/penjaminMock";
import { useBillingRingkas } from "@/components/shared/medical-records/useBillingRingkas";

interface Props {
  kunjunganId: string;
  /** Kompatibilitas call-site; billing di-resolve via kunjunganId. */
  noRM?: string;
}

type GateState =
  | { kind: "loading" }
  | { kind: "no-invoice" }
  | { kind: "lunas";        total: number }
  | { kind: "outstanding";  sisa: number; total: number; dibayar: number }
  | { kind: "klaim";        sisa: number; penjamin: string };

export default function BillingGateBanner({ kunjunganId }: Props) {
  const { data, loading } = useBillingRingkas(kunjunganId);

  const href = `/ehis-billing/tagihan/kunjungan/${encodeURIComponent(kunjunganId)}`;
  const eklaimHref = `/ehis-eklaim/klaim?kunjungan=${encodeURIComponent(kunjunganId)}`;

  const state: GateState = ((): GateState => {
    if (loading) return { kind: "loading" };
    if (!data || data.subtotal <= 0) return { kind: "no-invoice" };
    if (data.sisa <= 0) return { kind: "lunas", total: data.grandTotal };
    const isPenjamin = data.penjaminTipe.toLowerCase() !== "umum";
    if (isPenjamin) return { kind: "klaim", sisa: data.sisa, penjamin: data.penjaminTipe };
    return { kind: "outstanding", sisa: data.sisa, total: data.grandTotal, dibayar: data.dibayar };
  })();

  return (
    <div className="shrink-0 px-4 pt-3">
      <BannerSwitch state={state} href={href} eklaimHref={eklaimHref} />
    </div>
  );
}

// ── Render switch ───────────────────────────────────────

function BannerSwitch({ state, href, eklaimHref }: { state: GateState; href: string; eklaimHref: string }) {
  switch (state.kind) {
    case "loading":
      return (
        <BannerShell
          tone="slate"
          icon={Loader2}
          spin
          title="Memuat status tagihan…"
          desc="Menarik ringkas biaya order & pembayaran pasien."
        />
      );

    case "no-invoice":
      return (
        <BannerShell
          tone="slate"
          icon={Info}
          title="Belum ada tagihan tercatat"
          desc="Discharge boleh dilanjutkan. Charge muncul otomatis setelah ada order klinis bertarif."
        />
      );

    case "lunas":
      return (
        <BannerShell
          tone="emerald"
          icon={CheckCircle2}
          title="Tagihan lunas — siap pulang"
          desc={`Total Rp ${fmtRupiah(state.total).replace("Rp ", "")} sudah dibayar penuh.`}
          deepLink={href}
        />
      );

    case "klaim":
      return (
        <BannerShell
          tone="sky"
          icon={ShieldCheck}
          title={`Penjamin ${state.penjamin} — sisa Rp ${fmtRupiahShort(state.sisa)}`}
          desc="Sisa ditanggung/diklaim penjamin. Discharge boleh — konfirmasi ke kasir untuk berkas klaim."
          deepLink={href}
          eklaimHref={eklaimHref}
        />
      );

    case "outstanding":
      return (
        <BannerShell
          tone="rose"
          icon={AlertTriangle}
          title={`Sisa tagihan Rp ${fmtRupiahShort(state.sisa)}`}
          desc={`Dari total Rp ${fmtRupiahShort(state.total)}, sudah dibayar Rp ${fmtRupiahShort(state.dibayar)}. Selesaikan di Kasir sebelum pasien pulang.`}
          deepLink={href}
          required
        />
      );
  }
}

// ── Shared shell ────────────────────────────────────────

interface ShellProps {
  tone:        "rose" | "emerald" | "sky" | "slate";
  icon:        React.ComponentType<{ size?: number; className?: string }>;
  spin?:       boolean;
  title:       string;
  desc:        string;
  deepLink?:   string;
  eklaimHref?: string;
  required?:   boolean;
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

function BannerShell({ tone, icon: Icon, spin, title, desc, deepLink, eklaimHref, required }: ShellProps) {
  const cfg = TONE_CFG[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-2.5",
        cfg.bg, cfg.border,
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.iconBg)}>
        <Icon size={14} className={cn(cfg.iconText, spin && "animate-spin")} />
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
