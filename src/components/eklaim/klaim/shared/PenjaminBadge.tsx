"use client";

/**
 * PenjaminBadge — badge per tipe penjamin (BPJS · Asuransi · Jamkesda).
 *
 * Display: small icon-circle + nama panjang (truncate).
 * - BPJS    → emerald (associated dengan jaminan negara · safety)
 * - Asuransi → sky (formal · private)
 * - Jamkesda → amber (daerah · regional)
 */

import { Shield, Building2, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_TONE, type KlaimTone } from "../klaimBoardShared";
import type { Penjamin, TipePenjamin } from "@/lib/eklaim/eklaimShared";

interface Props {
  penjamin: Penjamin;
  size?: "xs" | "sm";
  /** Tampilkan nama lengkap di samping icon (default true). */
  withName?: boolean;
  className?: string;
}

const TIPE_CFG: Record<TipePenjamin, { tone: KlaimTone; icon: typeof Shield; short: string }> = {
  bpjs:     { tone: "emerald", icon: Shield,     short: "BPJS"     },
  asuransi: { tone: "sky",     icon: Building2,  short: "Asuransi" },
  jamkesda: { tone: "amber",   icon: MapPin,     short: "Jamkesda" },
};

export default function PenjaminBadge({
  penjamin,
  size = "sm",
  withName = true,
  className,
}: Props) {
  const cfg = TIPE_CFG[penjamin.tipe];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon;

  return (
    <div className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md ring-1",
          size === "xs" ? "h-5 w-5" : "h-5.5 w-5.5",
          tone.iconBg,
          tone.iconText,
          tone.chipRing,
        )}
        aria-label={cfg.short}
        title={cfg.short}
      >
        <Icon size={size === "xs" ? 10 : 11} strokeWidth={2.4} />
      </span>
      {withName && (
        <span className="min-w-0 truncate text-[12px] font-medium text-slate-700">
          {penjamin.nama}
        </span>
      )}
    </div>
  );
}
