"use client";

// Satu baris log panggilan BPJS (dipakai Audit trail & Beranda BPJS): ikon hasil, metode + endpoint,
// waktu · aktor (+ arti kode bila gagal), durasi bernada, layanan. Klik → Sheet detail.
// Komponen shadcn: Item · Badge.

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Item } from "@/components/ui/item";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import { NADA_METODE, artiKode, fmtDurasi, jamLokal, layananDari, nadaDurasi } from "./auditShared";

const NADA_TEKS_DURASI: Partial<Record<BadgeTone, string>> = { rose: "text-rose-700", amber: "text-amber-800" };

export default function BarisAudit({
  e,
  index,
  onBuka,
  waktu,
}: {
  e: BPJSAuditEntry;
  index: number;
  onBuka: () => void;
  /** Teks waktu (bawaan: jam lokal — cocok untuk daftar per hari). */
  waktu?: ReactNode;
}) {
  const nadaDur = nadaDurasi(e.durationMs);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: Math.min(index, 8) * 0.02 }}>
      {/* scroll-mt: baris yang menerima fokus tidak tertutup judul hari yang lengket (WCAG 2.4.11). */}
      <Item asChild size="sm" className="relative w-full scroll-mt-10 flex-nowrap items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50 sm:items-center">
        <button type="button" onClick={onBuka} aria-haspopup="dialog">
          <span
            aria-hidden="true"
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", e.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}
          >
            {e.success ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2 text-xs">
              <span className="sr-only">{e.success ? "Berhasil," : "Gagal,"}</span>
              <BadgeNada tone={NADA_METODE[e.method]} className="shrink-0 px-1 text-[10px] tabular-nums">
                {e.method}
              </BadgeNada>
              <span className="truncate font-medium tabular-nums" title={e.endpoint}>
                {e.endpoint}
              </span>
            </span>
            <span className="line-clamp-1 text-[11px] text-muted-foreground tabular-nums">
              {waktu ?? jamLokal(e.timestamp)} · {e.actor} · {e.actorRole}
              {!e.success && (
                <span className="text-rose-700">
                  {" "}
                  · kode {e.responseCode} {artiKode(e.responseCode).toLowerCase()}
                </span>
              )}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-0.5 text-right tabular-nums">
            <span className={cn("text-xs font-medium", nadaDur ? NADA_TEKS_DURASI[nadaDur] : "text-foreground")}>{fmtDurasi(e.durationMs)}</span>
            <span className="text-[11px] text-muted-foreground">{layananDari(e.endpoint)}</span>
          </span>
        </button>
      </Item>
    </motion.li>
  );
}
