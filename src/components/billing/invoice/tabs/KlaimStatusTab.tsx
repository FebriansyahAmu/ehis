"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  getClaimStatusForInvoice,
  eklaimDeepLink,
} from "@/lib/billing/claimReadCache";
import type { InvoiceDetail } from "../invoiceShared";
import ClaimStatusCard from "./klaim/ClaimStatusCard";
import InaCbgPreview from "./klaim/InaCbgPreview";
import SepInfoCard from "./klaim/SepInfoCard";
import BerkasChecklistMini from "./klaim/BerkasChecklistMini";
import DeepLinkCta from "./klaim/DeepLinkCta";
import KlaimEmptyState from "./klaim/KlaimEmptyState";

interface Props {
  detail: InvoiceDetail;
  /** Optional: handler navigasi ke E-Klaim (router.push). Default: log only. */
  onOpenEklaim?: (href: string) => void;
}

/**
 * Tab 3 — Klaim Penjamin (read-only · BL2.4-lite).
 *
 * Source of truth `ClaimRecord` ada di modul `/ehis-eklaim` (belum dibangun).
 * Di sini hanya **read-only cross-modul awareness**: status chip, INA-CBG preview,
 * SEP info, berkas progress + deep-link CTA.
 *
 * Workflow penuh (submit, banding, generator berkas, kalkulator INA-CBG)
 * di-host di `/ehis-eklaim`.
 */
export default function KlaimStatusTab({ detail, onOpenEklaim }: Props) {
  const claim = useMemo(
    () => getClaimStatusForInvoice(detail.id),
    [detail.id],
  );

  // ── Fallback: belum ada claim record → empty state CTA ──
  if (!claim) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 py-4">
            <KlaimEmptyState detail={detail} />
          </div>
        </div>
      </div>
    );
  }

  const deepHref = eklaimDeepLink(claim, detail.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5 px-5 py-4"
        >
          {/* Row 1 — Status header (full width) */}
          <ClaimStatusCard claim={claim} />

          {/* Row 2 — INA-CBG preview (full width) */}
          <InaCbgPreview inaCbg={claim.inaCbg} />

          {/* Row 3 — 2-col: SEP info + Berkas checklist */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <SepInfoCard claim={claim} />
            <BerkasChecklistMini berkas={claim.berkas} />
          </div>

          {/* Row 4 — Deep link CTA (full width, prominent) */}
          <DeepLinkCta
            href={deepHref}
            noKlaim={claim.noKlaim}
            variant="existing"
            onClick={onOpenEklaim}
          />

          {/* Footnote read-only marker */}
          <p className="pb-2 text-center text-[10.5px] text-slate-400">
            Tab ini <strong>read-only</strong>. Semua aksi edit/submit/banding di{" "}
            <span className="font-mono text-slate-500">/ehis-eklaim</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
