"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSkeletonDelay } from "@/components/master/shared";
import KasirHero from "./KasirHero";
import KasirTabs, { type KasirTabKey } from "./KasirTabs";
import DashboardPanel from "./DashboardPanel";
import QuickBayarPanel from "./quick/QuickBayarPanel";
import DepositAwalPanel from "./deposit/DepositAwalPanel";
import BukaShiftModal, { type BukaShiftInput } from "./modals/BukaShiftModal";
import TutupShiftModal, { type TutupShiftInput } from "./modals/TutupShiftModal";
import LaporanKasShiftModal from "./modals/LaporanKasShiftModal";
import SetoranFormModal from "./modals/SetoranFormModal";
import SetoranSlipPrintModal from "./modals/SetoranSlipPrintModal";
import type { ShiftRowAction } from "./RecentShiftsTable";
import KwitansiPrintModal from "../invoice/modals/KwitansiPrintModal";
import {
  KASIR_SHIFT_MOCK, getOpenShift, recentClosedShifts,
  type KasirShift, type ShiftMetodeBreakdown, type SetoranRecord,
} from "@/lib/billing/kasirShiftMock";
import { PASIEN_ADMISI_MOCK } from "@/lib/billing/depositMock";
import type { KwitansiContext } from "@/lib/billing/kwitansiContext";
import type { MetodeBayar } from "@/components/billing/invoice/invoiceShared";

/**
 * Kasir Counter Page — orchestrator untuk `/ehis-billing/pembayaran`.
 *
 * 3 tabs:
 *   - Dashboard (BL3.1) — monitor shift + breakdown + recent shifts
 *   - Quick Bayar (BL3.2) — search outstanding + terima pembayaran cepat
 *   - Deposit Awal (BL3.3) — pasien admisi pending + form deposit suggest
 *
 * State global: `shifts` (mutable list) + tab + modal. Payment yang masuk via
 * QuickBayar/Deposit otomatis akumulasi ke `activeShift.totalByMetode`.
 */
interface Props {
  /** Tab awal (dari deep-link ?tab=). Default dashboard. */
  initialTab?: KasirTabKey;
  /** Deep-link dari detail tagihan (?invoice=<kunjunganId>) — bayar tagihan langsung di Quick Bayar. */
  deepLinkInvoice?: string;
}

export default function KasirCounterPage({ initialTab, deepLinkInvoice: deepLinkProp }: Props = {}) {
  const ready = useSkeletonDelay(500);

  // Mock: anggap user session adalah "Sari Wulandari" (kasir-1 active)
  const SESSION_KASIR = "Sari Wulandari";

  const [shifts, setShifts] = useState<KasirShift[]>(KASIR_SHIFT_MOCK);
  const [activeTab, setActiveTab] = useState<KasirTabKey>(
    initialTab ?? (deepLinkProp ? "quick" : "dashboard"),
  );
  const [modal, setModal] = useState<"buka" | "tutup" | null>(null);
  // Counter untuk trigger re-render saat data mutated di mock store
  const [mutationTick, setMutationTick] = useState(0);
  // Kwitansi preview context (auto-buka setelah save QuickBayar / Deposit,
  // atau manual dari Recent Feed reprint button).
  const [kwitansiCtx, setKwitansiCtx] = useState<KwitansiContext | null>(null);
  // BL3.4 — Laporan Tutup Kas / Setoran Kas:
  // 1 state per target (action + shift) — kebab di RecentShiftsTable trigger 1 dari 3 modal.
  const [shiftActionState, setShiftActionState] = useState<{
    action: ShiftRowAction;
    shift: KasirShift;
  } | null>(null);

  const activeShift = useMemo(
    () => getOpenShift(shifts, SESSION_KASIR),
    [shifts],
  );

  const recents = useMemo(() => recentClosedShifts(shifts, 8), [shifts]);
  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  // Tab counts (badges)
  const tabCounts = useMemo(() => {
    if (!activeShift) return { dashboard: undefined, quick: undefined, deposit: undefined };
    void mutationTick;  // re-derive saat mock mutated
    return {
      dashboard: undefined,
      // Quick Bayar count = jumlah pembayaran nyata di feed (di dalam panel); tak pakai badge mock.
      quick: undefined,
      deposit: PASIEN_ADMISI_MOCK.length,
    };
  }, [activeShift, mutationTick]);

  // ── Mutations: shift ──
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
              supervisor: "dr. Indra (Supervisor Keuangan)",
            }
          : s,
      ),
    );
    console.log("[BL3.1] Tutup shift:", input);
  };

  // ── Mutations: setoran (dari kebab Recent Shifts → SetoranFormModal) ──
  const handleRecordSetoran = (shiftId: string, setoran: SetoranRecord) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, setoran } : s)),
    );
    // Auto-pivot ke print slip setelah save (mirror auto-print kwitansi di BL3.2/3.3).
    const updated = shifts.find((s) => s.id === shiftId);
    if (updated) {
      setShiftActionState({
        action: "setoran-slip",
        shift: { ...updated, setoran },
      });
    }
    console.log("[BL3.4] Setoran tercatat:", { shiftId, setoran });
  };

  // ── Kebab Recent Shifts dispatcher ──
  const handleShiftAction = (action: ShiftRowAction, shift: KasirShift) => {
    setShiftActionState({ action, shift });
  };

  // ── Mutations: payment accumulator (dari QuickBayar / Deposit) ──
  const handleAccumulate = (metode: MetodeBayar, nominal: number) => {
    if (!activeShift) return;
    setShifts((prev) =>
      prev.map((s) =>
        s.id === activeShift.id
          ? {
              ...s,
              totalByMetode: {
                ...s.totalByMetode,
                [metode]: s.totalByMetode[metode] + nominal,
              },
              totalTransaksi: s.totalTransaksi + 1,
            }
          : s,
      ),
    );
    setMutationTick((v) => v + 1);
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

            <KasirTabs
              active={activeTab}
              onChange={setActiveTab}
              hasActiveShift={!!activeShift}
              counts={tabCounts}
            />

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
              <AnimatePresence mode="wait">
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <DashboardPanel
                      activeShift={activeShift}
                      recents={recents}
                      shifts={shifts}
                      excludeKasir={SESSION_KASIR}
                      onBukaShift={() => setModal("buka")}
                      onTutupShift={() => setModal("tutup")}
                      onShiftAction={handleShiftAction}
                    />
                  </motion.div>
                )}
                {activeTab === "quick" && activeShift && (
                  <motion.div
                    key="quick"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <QuickBayarPanel
                      shift={activeShift}
                      onAccumulate={handleAccumulate}
                      onPrintKwitansi={setKwitansiCtx}
                      deepLinkInvoice={deepLinkProp}
                    />
                  </motion.div>
                )}
                {activeTab === "deposit" && activeShift && (
                  <motion.div
                    key="deposit"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <DepositAwalPanel
                      shift={activeShift}
                      onAccumulate={handleAccumulate}
                      onPrintKwitansi={setKwitansiCtx}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
      <KwitansiPrintModal
        open={kwitansiCtx !== null}
        detail={kwitansiCtx?.detail ?? null}
        payment={kwitansiCtx?.payment ?? null}
        onClose={() => setKwitansiCtx(null)}
      />

      {/* BL3.4 — Laporan Tutup Kas + Setoran */}
      <LaporanKasShiftModal
        open={shiftActionState?.action === "laporan"}
        shift={shiftActionState?.action === "laporan" ? shiftActionState.shift : null}
        onClose={() => setShiftActionState(null)}
      />
      <SetoranFormModal
        open={shiftActionState?.action === "setoran-form"}
        shift={shiftActionState?.action === "setoran-form" ? shiftActionState.shift : null}
        onClose={() => setShiftActionState(null)}
        onSubmit={handleRecordSetoran}
      />
      <SetoranSlipPrintModal
        open={shiftActionState?.action === "setoran-slip"}
        shift={shiftActionState?.action === "setoran-slip" ? shiftActionState.shift : null}
        onClose={() => setShiftActionState(null)}
      />
    </div>
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
      {/* Tabs placeholder */}
      <div className="flex gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-900/40">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      {/* Body 2-col placeholder */}
      <div className="grid flex-1 gap-4 px-6 pb-6 pt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
          <div className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
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
