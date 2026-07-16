"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSkeletonDelay } from "@/components/master/shared";
import KasirHero from "./KasirHero";
import KasirTabs, { type KasirTabKey } from "./KasirTabs";
import DashboardPanel from "./DashboardPanel";
import type { ShiftKpiAgg } from "./ShiftKPIStrip";
import QuickBayarPanel from "./quick/QuickBayarPanel";
import DepositAwalPanel from "./deposit/DepositAwalPanel";
import BukaShiftModal, { type BukaShiftInput } from "./modals/BukaShiftModal";
import TutupShiftModal, { type TutupShiftInput } from "./modals/TutupShiftModal";
import LaporanKasShiftModal from "./modals/LaporanKasShiftModal";
import SetoranFormModal from "./modals/SetoranFormModal";
import SetoranSlipPrintModal from "./modals/SetoranSlipPrintModal";
import type { ShiftRowAction } from "./RecentShiftsTable";
import KwitansiPrintModal from "../invoice/modals/KwitansiPrintModal";
import type { CounterId, KasirShift, SetoranRecord } from "@/lib/billing/kasirShiftMock";
import { getPaymentSummary, type PaymentSummaryDTO } from "@/lib/api/billing/invoice";
import {
  getShiftBoard, openShift as apiOpenShift, closeShift as apiCloseShift,
  type ShiftDTO,
} from "@/lib/api/billing/shift";
import { listBillingKunjungan } from "@/lib/api/billing/projection";
import { toPendingAdmisi } from "./deposit/realAdmisi";
import type { PasienAdmisi } from "@/lib/billing/depositMock";
import type { KwitansiContext } from "@/lib/billing/kwitansiContext";

/** ShiftDTO (nyata, dari papan shift) → KasirShift (bentuk komponen kasir). */
function dtoToShift(d: ShiftDTO): KasirShift {
  return {
    id: d.id,
    counter: d.counter as CounterId,
    kasirNama: d.kasirNama,
    status: d.status,
    bukaAt: d.bukaAt,
    bukaSaldoAwal: d.bukaSaldoAwal,
    bukaCatatan: d.bukaCatatan ?? undefined,
    totalByMetode: d.totalByMetode,
    totalTransaksi: d.totalTransaksi,
    totalRefund: d.totalRefund,
    tutupAt: d.tutupAt ?? undefined,
    tutupSaldoAkhir: d.tutupSaldoAkhir ?? undefined,
    selisih: d.selisih ?? undefined,
    tutupCatatan: d.tutupCatatan ?? undefined,
    supervisor: d.supervisor ?? undefined,
  };
}

/**
 * Kasir Counter Page — orchestrator untuk `/ehis-billing/pembayaran`.
 *
 * 3 tabs:
 *   - Dashboard (BL3.1) — monitor shift + breakdown + recent shifts
 *   - Quick Bayar (BL3.2) — search outstanding + terima pembayaran cepat
 *   - Deposit Awal (BL3.3) — pasien admisi pending + form deposit suggest
 *
 * Shift = PERSIST (billing.shift) → di-fetch dari `getShiftBoard` tiap mount +
 * tiap mutasi (mutationTick), sehingga sesi kasir BERTAHAN lintas navigasi. Totals
 * shift Open = proyeksi billing.payment (live); dashboard KPI dari ringkasan hari ini.
 */
interface Props {
  /** Tab awal (dari deep-link ?tab=). Default dashboard. */
  initialTab?: KasirTabKey;
  /** Deep-link dari detail tagihan (?invoice=<kunjunganId>) — bayar tagihan langsung di Quick Bayar. */
  deepLinkInvoice?: string;
}

export default function KasirCounterPage({ initialTab, deepLinkInvoice: deepLinkProp }: Props = {}) {
  const ready = useSkeletonDelay(500);

  // Shift kasir NYATA & PERSIST (billing.shift) — di-fetch tiap mount → bertahan lintas navigasi.
  //   active       = shift Open milik user login ("shift saya")
  //   openShifts   = semua shift Open (occupancy + counter lain), totals live dari payment
  //   recents      = shift Closed terbaru (snapshot totals)
  const [active, setActive] = useState<KasirShift | null>(null);
  const [openShifts, setOpenShifts] = useState<KasirShift[]>([]);
  const [recents, setRecents] = useState<KasirShift[]>([]);
  // Ringkasan pembayaran NYATA (billing.payment) hari ini — untuk KPI lintas shift.
  const [todaySummary, setTodaySummary] = useState<PaymentSummaryDTO | null>(null);
  // Daftar pasien admisi pending deposit — NYATA (proyeksi billing: RI belum ada pembayaran).
  const [depositRows, setDepositRows] = useState<PasienAdmisi[]>([]);
  const [depositLoading, setDepositLoading] = useState(true);
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

  const activeShift = active;
  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  // ── Papan shift NYATA & PERSIST (re-fetch mount + tiap mutasi) → bertahan lintas navigasi ──
  useEffect(() => {
    const ac = new AbortController();
    getShiftBoard(ac.signal)
      .then((b) => {
        if (ac.signal.aborted) return;
        setActive(b.active ? dtoToShift(b.active) : null);
        setOpenShifts(b.open.map(dtoToShift));
        setRecents(b.recentClosed.map(dtoToShift));
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setActive(null); setOpenShifts([]); setRecents([]);
      });
    return () => ac.abort();
  }, [mutationTick]);

  // KPI hari ini (lintas shift) — semua pembayaran hari ini.
  useEffect(() => {
    const ac = new AbortController();
    const date = new Date().toISOString().slice(0, 10);
    getPaymentSummary({ date }, ac.signal)
      .then((s) => { if (!ac.signal.aborted) setTodaySummary(s); })
      .catch(() => { if (!ac.signal.aborted) setTodaySummary(null); });
    return () => ac.abort();
  }, [mutationTick]);

  // Daftar admisi pending deposit (RI belum bayar) — re-fetch tiap ada pembayaran (mutationTick).
  useEffect(() => {
    const ac = new AbortController();
    listBillingKunjungan(ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setDepositRows(toPendingAdmisi(rows)); })
      .catch(() => { if (!ac.signal.aborted) setDepositRows([]); })
      .finally(() => { if (!ac.signal.aborted) setDepositLoading(false); });
    return () => ac.abort();
  }, [mutationTick]);

  // KPI hari ini (dari pembayaran NYATA).
  const kpi = useMemo<ShiftKpiAgg>(() => {
    const s = todaySummary;
    const nonTunai = s ? s.byMetode.Transfer + s.byMetode.QRIS + s.byMetode.EDC + s.byMetode.Voucher : 0;
    return {
      totalTransaksi: s?.totalTransaksi ?? 0,
      totalTunai: s?.byMetode.Tunai ?? 0,
      totalNonTunai: nonTunai,
      totalRefund: s?.totalRefund ?? 0,
      countersAktif: openShifts.length,
    };
  }, [todaySummary, openShifts.length]);

  // Tab counts (badges)
  const tabCounts = useMemo(() => {
    if (!activeShift) return { dashboard: undefined, quick: undefined, deposit: undefined };
    return {
      dashboard: undefined,
      // Quick Bayar count = jumlah pembayaran nyata di feed (di dalam panel); tak pakai badge.
      quick: undefined,
      // Deposit count = pasien admisi RI menunggu deposit (NYATA).
      deposit: depositRows.length,
    };
  }, [activeShift, depositRows.length]);

  // ── Mutations: shift (PERSIST via API → refetch papan) ──
  const handleOpenShift = async (input: BukaShiftInput) => {
    try {
      await apiOpenShift({
        counter: input.counter,
        kasirPegawaiId: input.kasirPegawaiId,
        bukaSaldoAwal: input.bukaSaldoAwal,
        bukaCatatan: input.bukaCatatan,
      });
      setMutationTick((v) => v + 1);
    } catch (e) {
      console.error("[BL3.1] Buka shift gagal:", e);
    }
  };

  const handleCloseShift = async (input: TutupShiftInput) => {
    // Server snapshot totals dari billing.payment + hitung selisih (authoritative).
    try {
      await apiCloseShift(input.shiftId, {
        tutupSaldoAkhir: input.tutupSaldoAkhir,
        tutupCatatan: input.tutupCatatan,
      });
      setMutationTick((v) => v + 1);
    } catch (e) {
      console.error("[BL3.1] Tutup shift gagal:", e);
    }
  };

  // ── Setoran (dari kebab Recent Shifts → SetoranFormModal) → cetak slip ──
  // Catatan: setoran belum persist (follow-up) — hanya membuka slip cetak dari shift NYATA.
  const handleRecordSetoran = (shiftId: string, setoran: SetoranRecord) => {
    const target = recents.find((s) => s.id === shiftId);
    if (target) {
      setShiftActionState({ action: "setoran-slip", shift: { ...target, setoran } });
    }
  };

  // ── Kebab Recent Shifts dispatcher ──
  const handleShiftAction = (action: ShiftRowAction, shift: KasirShift) => {
    setShiftActionState({ action, shift });
  };

  // ── Pembayaran masuk (dari QuickBayar / Deposit) → refetch ringkasan NYATA ──
  // Total shift/hari tidak lagi diakumulasi client; di-derive dari billing.payment.
  const handleAccumulate = () => setMutationTick((v) => v + 1);

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
                      shifts={openShifts}
                      excludeKasir={activeShift?.kasirNama ?? ""}
                      kpi={kpi}
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
                      pending={depositRows}
                      loading={depositLoading}
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
        shifts={openShifts}
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
