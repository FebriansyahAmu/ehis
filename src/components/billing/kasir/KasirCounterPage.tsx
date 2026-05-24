"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSkeletonDelay } from "@/components/master/shared";
import KasirHero from "./KasirHero";
import ActiveShiftCard from "./ActiveShiftCard";
import EmptyShiftState from "./EmptyShiftState";
import ShiftKPIStrip from "./ShiftKPIStrip";
import ShiftMethodBreakdown from "./ShiftMethodBreakdown";
import RecentShiftsTable from "./RecentShiftsTable";
import BukaShiftModal, { type BukaShiftInput } from "./modals/BukaShiftModal";
import TutupShiftModal, { type TutupShiftInput } from "./modals/TutupShiftModal";
import {
  KASIR_SHIFT_MOCK, getOpenShift, recentClosedShifts,
  type KasirShift, type ShiftMetodeBreakdown,
} from "@/lib/billing/kasirShiftMock";

/**
 * Kasir Counter Page (BL3.1) — orchestrator untuk `/ehis-billing/pembayaran`.
 *
 * Layout:
 *   - KasirHero (full)
 *   - 2-col split:
 *     - Left (2fr): ActiveShiftCard atau EmptyShiftState · ShiftMethodBreakdown · RecentShiftsTable
 *     - Right (1fr): ShiftKPIStrip vertical
 *
 * State management: client-side useState saat ini (mock). Backend swap pakai
 * Zustand atau Server Actions saat ready.
 */
export default function KasirCounterPage() {
  const ready = useSkeletonDelay(500);

  // Mock: anggap user session adalah "Sari Wulandari" (kasir-1 active)
  const SESSION_KASIR = "Sari Wulandari";

  const [shifts, setShifts] = useState<KasirShift[]>(KASIR_SHIFT_MOCK);
  const [modal, setModal] = useState<"buka" | "tutup" | null>(null);

  const activeShift = useMemo(
    () => getOpenShift(shifts, SESSION_KASIR),
    [shifts],
  );

  const recents = useMemo(() => recentClosedShifts(shifts, 8), [shifts]);

  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  // ── Mutations ──
  const handleOpenShift = (input: BukaShiftInput) => {
    const newShift: KasirShift = {
      id: `shift-${Date.now()}`,
      counter: input.counter,
      kasirNama: input.kasirNama,
      status: "Open",
      bukaAt: new Date().toISOString().slice(0, 16),
      bukaSaldoAwal: input.bukaSaldoAwal,
      bukaCatatan: input.bukaCatatan,
      totalByMetode: emptyBreakdown(),
      totalTransaksi: 0,
      totalRefund: 0,
    };
    setShifts((prev) => [newShift, ...prev]);
    console.log("[BL3.1] Buka shift:", newShift);
  };

  const handleCloseShift = (input: TutupShiftInput) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.id === input.shiftId
          ? {
              ...s,
              status: "Closed",
              tutupAt: new Date().toISOString().slice(0, 16),
              tutupSaldoAkhir: input.tutupSaldoAkhir,
              selisih: input.selisih,
              tutupCatatan: input.tutupCatatan,
              supervisor: "dr. Indra (Supervisor Keuangan)",  // mock auto-fill
            }
          : s,
      ),
    );
    console.log("[BL3.1] Tutup shift:", input);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <KasirHero
              timestamp={timestamp}
              hasOpenShift={!!activeShift}
              onBukaShift={() => setModal("buka")}
              onTutupShift={() => setModal("tutup")}
            />

            {/* Body 2-col */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              {/* Left column */}
              <div className="space-y-4">
                {activeShift ? (
                  <>
                    <ActiveShiftCard
                      shift={activeShift}
                      onTutupShift={() => setModal("tutup")}
                    />
                    <ShiftMethodBreakdown breakdown={activeShift.totalByMetode} />
                  </>
                ) : (
                  <EmptyShiftState onBukaShift={() => setModal("buka")} />
                )}

                <RecentShiftsTable shifts={recents} />
              </div>

              {/* Right column */}
              <aside className="space-y-4">
                <ShiftKPIStrip />

                {/* Other-counters strip — counter Open milik kasir lain */}
                <OtherCountersStrip shifts={shifts} excludeKasir={SESSION_KASIR} />
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <BukaShiftModal
        open={modal === "buka"}
        shifts={shifts}
        defaultKasir="sari"
        onClose={() => setModal(null)}
        onOpenShift={handleOpenShift}
      />
      <TutupShiftModal
        open={modal === "tutup"}
        shift={activeShift}
        onClose={() => setModal(null)}
        onTutupShift={handleCloseShift}
      />
    </div>
  );
}

// ── Other counters strip (info only) ───────────────────

function OtherCountersStrip({
  shifts, excludeKasir,
}: {
  shifts: KasirShift[];
  excludeKasir: string;
}) {
  const others = shifts.filter((s) => s.status === "Open" && s.kasirNama !== excludeKasir);
  if (others.length === 0) return null;

  return (
    <section
      aria-label="Counter Lain"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <h3 className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
          Counter Lain (sedang aktif)
        </h3>
        <p className="text-[10px] text-slate-500">
          {others.length} kasir lain juga sedang shift
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {others.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                {s.kasirNama}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {s.counter} · {s.totalTransaksi} trx
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
              Open
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Helpers ────────────────────────────────────────────

function emptyBreakdown(): ShiftMetodeBreakdown {
  return { Tunai: 0, Transfer: 0, QRIS: 0, EDC: 0, Voucher: 0 };
}

function formatTimestamp(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const day = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${day} · ${hh}:${mm}`;
}

// ── Skeleton ───────────────────────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Hero placeholder */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      {/* Body 2-col placeholder */}
      <div className="grid flex-1 gap-4 px-6 pb-6 pt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
          <div className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
          <div className="h-72 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
