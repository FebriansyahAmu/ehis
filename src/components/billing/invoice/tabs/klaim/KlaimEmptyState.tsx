"use client";

import { motion } from "framer-motion";
import { FileQuestion, ListChecks, Sparkles } from "lucide-react";
import DeepLinkCta from "./DeepLinkCta";
import { eklaimDeepLink } from "@/lib/billing/claimReadCache";
import type { InvoiceDetail } from "../../invoiceShared";

interface Props {
  detail: InvoiceDetail;
}

/**
 * Empty state ketika belum ada `ClaimRecord` untuk invoice (`getClaimStatusForInvoice → null`).
 * Biasanya berarti invoice baru, belum di-coding ICD, atau belum di-draft di EKLAIM.
 *
 * CTA primer: deep link ke `/ehis-eklaim/klaim/new?invoiceId=X`.
 */
export default function KlaimEmptyState({ detail }: Props) {
  const href = eklaimDeepLink(null, detail.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-4 px-1 py-2"
    >
      {/* Centered hero */}
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 to-white px-6 py-8 text-center dark:border-amber-900/40 dark:from-amber-950/15 dark:to-slate-900">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 24, delay: 0.08 }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-950/40"
        >
          <FileQuestion size={24} />
        </motion.div>

        <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
          Belum ada klaim tercatat
        </h3>
        <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
          Invoice <span className="font-mono text-slate-700 dark:text-slate-300">{detail.noTagihan}</span>{" "}
          ({detail.penjamin.nama}) belum di-coding atau di-draft sebagai klaim. Mulai proses di modul
          E-Klaim untuk submit ke V-Claim BPJS / portal asuransi.
        </p>

        {/* Pre-req hints */}
        <ul className="mt-3 inline-flex max-w-md flex-col gap-1 rounded-lg bg-white/70 px-3 py-2 text-left text-[11.5px] text-slate-600 ring-1 ring-amber-100 dark:bg-slate-900/40 dark:text-slate-400 dark:ring-amber-900/40">
          <PreReq label="Invoice difinalisasi (status ≥ Final)" />
          <PreReq label="Coding ICD-10 & ICD-9 lengkap" />
          <PreReq label="Berkas pendukung tersedia (resume medis, hasil penunjang)" />
        </ul>

        <p className="mt-3 inline-flex items-center gap-1 text-[10.5px] text-slate-400">
          <Sparkles size={11} />
          Lengkapi pre-requisite, lalu klik CTA di bawah
        </p>
      </div>

      {/* CTA */}
      <DeepLinkCta href={href} noKlaim={null} variant="new" />
    </motion.div>
  );
}

// ── Sub: pre-req item ──────────────────────────────────

function PreReq({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <ListChecks size={11} className="flex-none text-amber-600/80" />
      <span>{label}</span>
    </li>
  );
}
