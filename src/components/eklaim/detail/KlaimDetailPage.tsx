"use client";

/**
 * KlaimDetailPage — entry shell halaman `/ehis-eklaim/klaim/[id]` (EK3.1+).
 *
 * Layout (no page-level scroll · banner sticky di atas):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ ClaimBannerHeader     (sticky · breadcrumb · status) │
 *   ├──────────────────────────────────────────────────────┤
 *   │ ClaimTabs             (sticky · 6 tab)               │
 *   ├──────────────────────────────────────────────────────┤
 *   │ Tab Content           (scroll area)                  │
 *   └──────────────────────────────────────────────────────┘
 *
 * Skeleton 500ms via `useSkeletonDelay`, fade-in motion 0.2s.
 * 404 state via `ClaimNotFound` jika id URL tidak match `CLAIM_BOARD_MOCK`.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import ClaimBannerHeader from "./ClaimBannerHeader";
import ClaimTabs from "./ClaimTabs";
import TabPlaceholder from "./tabs/TabPlaceholder";
import BerkasTab from "./tabs/BerkasTab";
import CodingTab from "./tabs/CodingTab";
import GrouperTab from "./tabs/GrouperTab";
import SubmissionTab from "./tabs/SubmissionTab";
import AuditTab from "./tabs/AuditTab";
import ClaimNotFound from "./parts/ClaimNotFound";
import BerkasGeneratorModal from "@/components/eklaim/berkas/BerkasGeneratorModal";
import {
  findTab,
  type ClaimDetailTab,
} from "./claimDetailShared";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  /** Klaim ID dari URL `/ehis-eklaim/klaim/[id]`. */
  id: string;
  /** Optional initial tab dari `?tab=` query — future use. */
  initialTab?: string;
}

export default function KlaimDetailPage({ id, initialTab }: Props) {
  const ready = useSkeletonDelay(500);
  const [activeTab, setActiveTab] = useState<ClaimDetailTab>(() => findTab(initialTab));
  const [berkasGenOpen, setBerkasGenOpen] = useState(false);

  const claim = useMemo(
    () => CLAIM_BOARD_MOCK.find((c) => c.id === id || c.noKlaim === id),
    [id],
  );

  // ── Quick action handlers ─────────────────────────────
  const handleSubmit = () => {
    console.info(`[Klaim ${claim?.noKlaim}] Submit ke BPJS — pending EK5`);
  };

  const handleGenerateBerkas = () => setBerkasGenOpen(true);

  const handlePrintResume = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : !claim ? (
          <motion.div
            key="not-found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-4 sm:px-6"
          >
            <ClaimNotFound id={id} />
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ClaimBannerHeader
              claim={claim}
              onSubmit={handleSubmit}
              onGenerateBerkas={handleGenerateBerkas}
              onPrintResume={handlePrintResume}
            />

            <ClaimTabs active={activeTab} onChange={setActiveTab} />

            {/* Tab content area — scroll independent */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {renderTab(activeTab, claim)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* EK5 — Berkas Generator Modal */}
            <BerkasGeneratorModal
              open={berkasGenOpen}
              onClose={() => setBerkasGenOpen(false)}
              claim={claim}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab Content Router ────────────────────────────────

function renderTab(tab: ClaimDetailTab, claim: ClaimRecord) {
  switch (tab) {
    case "ringkasan":
      return (
        <TabPlaceholder
          icon={ClipboardList}
          title="Ringkasan"
          phase="EK3.1+"
          effort="bersamaan EK3.2+"
          description="Tab Ringkasan akan menampilkan ikhtisar klaim: identitas + diagnosa primer + tindakan utama + grouper highlight + status timeline + quick stats (LOS, Margin, Approval ETA). Jadi landing pertama saat coder/verifikator buka klaim."
          bullets={[
            "Card identitas + DPJP + Coder ownership",
            "Diagnosa primer & sekunder list (ICD-10-IM) — read-only ringkas",
            "Tindakan/prosedur (ICD-9-CM-IM) — read-only ringkas",
            "Grouper preview card (iDRG kode + tarif aktual vs Tarif RS)",
            "Margin chip (untung/rugi vs Tarif RS) dengan tooltip detail",
            "Status timeline detail vertikal (5 ev terakhir dari audit)",
          ]}
        />
      );

    case "berkas":
      return <BerkasTab claim={claim} />;

    case "koding":
      return <CodingTab claim={claim} />;

    case "grouper":
      return <GrouperTab claim={claim} />;

    case "submission":
      return <SubmissionTab claim={claim} />;

    case "audit":
      return <AuditTab claim={claim} />;
  }
}

// ── Skeleton Shell ─────────────────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Banner placeholder (compact ~130px) */}
      <div className="relative border-b border-slate-200 bg-linear-to-br from-white via-teal-50/20 to-sky-50/20 px-4 py-3 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-teal-200 via-sky-200 to-emerald-200" />
        <div className="space-y-2">
          {/* Row 1 — breadcrumb + status */}
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-teal-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="ml-auto h-6 w-28 animate-pulse rounded-lg bg-emerald-100" />
          </div>
          {/* Row 2 — avatar + identity + tarif/berkas */}
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-linear-to-br from-teal-200 to-sky-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-1">
                <div className="h-4 w-16 animate-pulse rounded bg-emerald-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-teal-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-emerald-100" />
                <div className="h-4 w-10 animate-pulse rounded bg-sky-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-amber-100" />
              </div>
            </div>
            <div className="hidden h-12 w-44 shrink-0 animate-pulse rounded-lg bg-linear-to-br from-teal-100 to-emerald-100 sm:block" />
            <div className="hidden h-12 w-28 shrink-0 animate-pulse rounded-lg bg-amber-100 sm:block" />
          </div>
          {/* Row 3 — timeline + actions */}
          <div className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-white/60 px-2 py-1.5">
            <div className="h-5 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-1">
              <div className="h-6 w-24 animate-pulse rounded bg-sky-200" />
              <div className="h-6 w-20 animate-pulse rounded bg-teal-100" />
              <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav placeholder */}
      <div className="border-b border-slate-200 bg-white px-2 sm:px-4">
        <div className="flex gap-1 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-32 animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      </div>

      {/* Tab content placeholder */}
      <div className="flex-1 px-4 py-5 sm:px-6">
        <div className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
      </div>
    </motion.div>
  );
}
