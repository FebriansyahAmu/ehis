"use client";

/**
 * KlaimDetailPage — entry shell halaman `/ehis-eklaim/klaim/[id]` (EK3.1).
 *
 * Layout (no page-level scroll · banner sticky di atas):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ ClaimBannerHeader     (sticky · breadcrumb · status) │
 *   ├──────────────────────────────────────────────────────┤
 *   │ ClaimTabs             (sticky · 6 tab)               │
 *   ├──────────────────────────────────────────────────────┤
 *   │ Tab Content           (scroll area · TabPlaceholder) │
 *   └──────────────────────────────────────────────────────┘
 *
 * Skeleton 500ms via `useSkeletonDelay`, fade-in motion 0.2s.
 * 404 state via `ClaimNotFound` jika id URL tidak match `CLAIM_BOARD_MOCK`.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Scale,
  Send,
  History,
  ClipboardList,
} from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import ClaimBannerHeader from "./ClaimBannerHeader";
import ClaimTabs from "./ClaimTabs";
import TabPlaceholder from "./tabs/TabPlaceholder";
import BerkasTab from "./tabs/BerkasTab";
import CodingTab from "./tabs/CodingTab";
import ClaimNotFound from "./parts/ClaimNotFound";
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

  const claim = useMemo(
    () => CLAIM_BOARD_MOCK.find((c) => c.id === id || c.noKlaim === id),
    [id],
  );

  // Stub handlers untuk quick actions — EK3.5 akan replace dengan real handlers
  const handleSubmit = () => {
    console.info(`[Klaim ${claim?.noKlaim}] Submit ke BPJS — pending EK3.5`);
  };
  const handleGenerateBerkas = () => {
    console.info(`[Klaim ${claim?.noKlaim}] Generate Berkas — pending EK5`);
  };
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
      return (
        <TabPlaceholder
          icon={Scale}
          title="Grouper"
          phase="EK3.4"
          effort="1.5 hari"
          description="Tab Grouper akan menampilkan hasil iDRG (kode 7-digit numerik · MDC · severity · tarif per tingkat kompetensi RS · top-up CMG). Mode B untuk legacy INA-CBG (klaim pre-Okt 2025) dan Mode C Comparator (dual side-by-side opt-in, AD-19)."
          bullets={[
            "Mode A: iDRG Result Card — kode 7-digit + severity + tarif aktual + tarif per tingkat",
            "Breakdown Tarif RS vs iDRG (per kategori akomodasi/tindakan/lab/rad/obat/jasa)",
            "Top-Up CMG indicator (ICU >3 hari, obat mahal, prosthesis)",
            "Margin chip dengan persentase + chart bar emerald/rose",
            "Mode B: Legacy INA-CBG dengan banner kuning (klaim pre-Okt 2025)",
            "Mode C: Comparator side-by-side dengan watermark ESTIMASI · REFERENCE ONLY",
            "Tombol Re-Group dengan latency simulasi 500-1500ms",
          ]}
        />
      );

    case "submission":
      return (
        <TabPlaceholder
          icon={Send}
          title="Submission"
          phase="EK3.5"
          effort="1 hari"
          description="Tab Submission akan menampilkan eligibility check via V-Claim adapter, pre-submit checklist, batch picker, dan tombol Submit ke BPJS dengan feedback toast + timeline update."
          bullets={[
            "Eligibility check card (status SEP, kelas dijamin, plafon sisa, sisa hari rawat)",
            "Tombol Refresh Status (call vClaimAdapter.checkSEP)",
            "Pre-submit checklist (berkas lengkap · koding final · grouper resolved · eligibility valid)",
            "Batch picker (pilih batch open atau buat batch baru)",
            "Tombol Submit primary sky dengan disabled state explanation",
            "Result feedback — toast + status timeline auto-update",
            "Error handling: NetworkError retry, ValidationError per-field",
          ]}
        />
      );

    case "audit":
      return (
        <TabPlaceholder
          icon={History}
          title="Audit / Timeline"
          phase="EK3.6"
          effort="1 hari"
          description="Tab Audit akan menampilkan timeline vertikal lengkap semua event (create / edit-coding / upload-berkas / re-group / submit / verifikasi / banding / payment). Filter by actor / action / date range + export CSV per-klaim."
          bullets={[
            "Timeline vertikal dengan 10 event type (ClaimTimelineEntry discriminated union)",
            "Per-entry: timestamp · actor avatar · action chip · diff (before/after coding)",
            "Filter by actor / action type / date range",
            "Search free-text dalam komentar verifikator",
            "Export CSV per-klaim (RFC 4180 + BOM UTF-8)",
            "Print-friendly view dengan KOP RS",
          ]}
        />
      );
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
