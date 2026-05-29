"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, CalendarClock, Link2, ShieldAlert, ArrowRightLeft, Fingerprint } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { getSEP, deleteSEP } from "@/lib/bpjs/vClaimSEP";
import type { SEPRecordExt, BPJSError } from "@/lib/bpjs/bpjsShared";

import CariSEPPanel              from "./CariSEPPanel";
import SEPDetailCard             from "./SEPDetailCard";
import HapusSEPModal             from "./HapusSEPModal";
import UpdateTglPulangForm       from "./UpdateTglPulangForm";
import UpdateTglPulangList       from "./UpdateTglPulangList";
import SEPIntegrasiInaCBGCard    from "./SEPIntegrasiInaCBGCard";
import SuplesiJasaRaharjaForm    from "./SuplesiJasaRaharjaForm";
import DataIndukKecelakaanForm   from "./DataIndukKecelakaanForm";
import SEPInternalForm           from "./SEPInternalForm";
import SEPInternalList           from "./SEPInternalList";
import FingerprintPanel          from "./FingerprintPanel";
import FingerprintListPanel      from "./FingerprintListPanel";
import type { SEPResult } from "./sepShared";

// ── Types ──────────────────────────────────────────────────

type TabKey = "cari" | "update-tgl" | "integrasi" | "suplesi" | "internal" | "fingerprint";

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> }[] = [
  { key: "cari",        label: "Cari SEP",         Icon: FileText },
  { key: "update-tgl",  label: "Update Tgl Pulang", Icon: CalendarClock },
  { key: "integrasi",   label: "Integrasi E-Klaim", Icon: Link2 },
  { key: "suplesi",     label: "Suplesi JR",        Icon: ShieldAlert },
  { key: "internal",    label: "SEP Internal",      Icon: ArrowRightLeft },
  { key: "fingerprint", label: "Fingerprint",       Icon: Fingerprint },
];

// ── Error helper ───────────────────────────────────────────

function getErrMsg(err: BPJSError): string {
  if ("message" in err && typeof err.message === "string") return err.message;
  if (err.type === "EligibilityError")    return `Eligibility error: ${err.reason}`;
  if (err.type === "DuplicateClaimError") return `Duplikasi klaim: ${err.existingClaimId}`;
  if (err.type === "ConcurrencyError")    return "Konflik versi data";
  return "Terjadi kesalahan";
}

// ── Result panel header helpers ────────────────────────────

function resultLabel(r: SEPResult): string {
  if (r.status === "idle")    return "Detail SEP";
  if (r.status === "loading") return "Memuat data…";
  if (r.status === "found")   return r.sep.noSEP;
  return "Gagal Memuat";
}

function resultSub(r: SEPResult): string {
  if (r.status === "idle")    return "Masukkan No. SEP & klik Cari SEP";
  if (r.status === "loading") return "Menghubungi server V-Claim BPJS…";
  if (r.status === "found")   return `${r.sep.diagAwal} · ${r.sep.diagAwalNama ?? "—"}`;
  return "Periksa koneksi atau coba lagi";
}

// ── Page header ────────────────────────────────────────────

function PageHeader({ loading, activeTab, onTabChange }: {
  loading: boolean;
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-white">
      {/* Top row */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
          <FileText size={13} className="text-white" strokeWidth={2.4} />
        </div>
        <h1 className="flex-1 text-sm font-semibold text-slate-800">
          Surat Eligibilitas Peserta (SEP)
        </h1>
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600"
            >
              <Loader2 size={11} className="animate-spin" />
              V-Claim…
            </motion.div>
          )}
        </AnimatePresence>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          V-Claim 5.0
        </span>
      </div>

      {/* Tab bar — scrollable for 6 tabs */}
      <div className="overflow-x-auto border-t border-slate-100 px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-0.5">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === key
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Icon size={11} strokeWidth={2.3} className={activeTab === key ? "text-emerald-500" : ""} />
              {label}
              {activeTab === key && (
                <motion.div
                  layoutId="sep-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-emerald-50"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Result panel header ────────────────────────────────────

function ResultPanelHeader({ result }: { result: SEPResult }) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-white/80 px-5 py-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={result.status}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="truncate text-xs font-semibold text-slate-700">{resultLabel(result)}</p>
          <p className="truncate text-xs text-slate-400">{resultSub(result)}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col">
      <div className="h-20 shrink-0 border-b border-slate-100 bg-white" />
      <div className="grid min-h-0 flex-1 lg:grid-cols-12">
        <div className="h-full border-r border-slate-100 bg-white lg:col-span-5" />
        <div className="h-full bg-slate-50/30 lg:col-span-7" />
      </div>
    </div>
  );
}

// ── Inner page (reads searchParams) ───────────────────────

function SEPPageInner() {
  const loaded       = useSkeletonDelay(400);
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab]         = useState<TabKey>("cari");
  const [result, setResult]               = useState<SEPResult>({ status: "idle" });
  const [lastNoSEP, setLastNoSEP]         = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<SEPRecordExt | null>(null);
  const [updateRefresh, setUpdateRefresh] = useState(0);

  // Auto-switch to update-tgl tab if ?update=xxx in URL
  useEffect(() => {
    const noSEP = searchParams.get("update");
    if (noSEP) setActiveTab("update-tgl");
  }, [searchParams]);

  const initialUpdateNoSEP = searchParams.get("update") ?? undefined;

  const handleSearch = useCallback(async (noSEP: string) => {
    setLastNoSEP(noSEP);
    setResult({ status: "loading" });
    try {
      const res = await getSEP(noSEP);
      if (res.ok && res.value.response) {
        setResult({ status: "found", sep: res.value.response });
      } else if (res.ok) {
        setResult({
          status: "error",
          error: { type: "BPJSMetaError", code: "201", message: "SEP tidak ditemukan", endpoint: "", retryable: false },
        });
      } else {
        setResult({ status: "error", error: res.error });
      }
    } catch {
      setResult({
        status: "error",
        error: { type: "BPJSMetaError", code: "503", message: "Koneksi ke V-Claim gagal", endpoint: "", retryable: true },
      });
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastNoSEP) handleSearch(lastNoSEP);
  }, [lastNoSEP, handleSearch]);

  const handleDeleteOpen = useCallback((noSep: string) => {
    if (result.status === "found" && result.sep.noSEP === noSep) {
      setDeleteTarget(result.sep);
    }
  }, [result]);

  const handleDeleteConfirm = useCallback(async (noSep: string, _alasan: string) => {
    const res = await deleteSEP({ noSep, user: "operator.bpjs@rs-sakti.id" });
    if (!res.ok) throw new Error(getErrMsg(res.error));
  }, []);

  const handleDeleteClose = useCallback(() => setDeleteTarget(null), []);

  const handleDeleted = useCallback(() => {
    if (lastNoSEP) handleSearch(lastNoSEP);
  }, [lastNoSEP, handleSearch]);

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <PageHeader
          loading={result.status === "loading"}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <AnimatePresence mode="wait">
          {/* Tab: Cari SEP */}
          {activeTab === "cari" && (
            <motion.div
              key="cari"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12"
            >
              <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
                <CariSEPPanel onSubmit={handleSearch} busy={result.status === "loading"} />
              </aside>
              <main className="col-span-1 flex min-h-0 flex-col overflow-hidden bg-slate-50/20 lg:col-span-7">
                <ResultPanelHeader result={result} />
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <SEPDetailCard result={result} onRetry={handleRetry} onDelete={handleDeleteOpen} />
                </div>
              </main>
            </motion.div>
          )}

          {/* Tab: Update Tgl Pulang */}
          {activeTab === "update-tgl" && (
            <motion.div
              key="update-tgl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12"
            >
              <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Update Tanggal Pulang</h2>
                </div>
                <UpdateTglPulangForm
                  initialNoSEP={initialUpdateNoSEP}
                  onSuccess={() => setUpdateRefresh((n) => n + 1)}
                />
              </aside>
              <main className="col-span-1 overflow-y-auto bg-slate-50/20 lg:col-span-7">
                <UpdateTglPulangList refreshKey={updateRefresh} />
              </main>
            </motion.div>
          )}

          {/* Tab: Integrasi E-Klaim */}
          {activeTab === "integrasi" && (
            <motion.div
              key="integrasi"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="mx-auto max-w-lg py-4">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Integrasi SEP ↔ E-Klaim</h2>
                </div>
                <SEPIntegrasiInaCBGCard />
              </div>
            </motion.div>
          )}

          {/* Tab: Suplesi Jasa Raharja */}
          {activeTab === "suplesi" && (
            <motion.div
              key="suplesi"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12"
            >
              <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Suplesi Jasa Raharja</h2>
                </div>
                <SuplesiJasaRaharjaForm />
              </aside>
              <main className="col-span-1 overflow-y-auto bg-slate-50/20 lg:col-span-7">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Data Induk Kecelakaan</h2>
                </div>
                <DataIndukKecelakaanForm />
              </main>
            </motion.div>
          )}

          {/* Tab: SEP Internal */}
          {activeTab === "internal" && (
            <motion.div
              key="internal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12"
            >
              <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Cari SEP Internal</h2>
                </div>
                <SEPInternalForm />
              </aside>
              <main className="col-span-1 overflow-y-auto bg-slate-50/20 lg:col-span-7">
                <SEPInternalList onSelectSEP={(noSEP) => {
                  // Trigger left panel via shared state would require lifting state
                  // For now, user can copy noSEP to left panel manually
                  void noSEP;
                }} />
              </main>
            </motion.div>
          )}

          {/* Tab: Fingerprint */}
          {activeTab === "fingerprint" && (
            <motion.div
              key="fingerprint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12"
            >
              <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Cek Fingerprint Peserta</h2>
                </div>
                <FingerprintPanel />
              </aside>
              <main className="col-span-1 overflow-y-auto bg-slate-50/20 lg:col-span-7">
                <FingerprintListPanel />
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hapus SEP modal */}
      <HapusSEPModal
        sep={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
        onDeleted={handleDeleted}
      />
    </>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───

export default function SEPPage() {
  return (
    <Suspense fallback={<div className="flex h-full animate-pulse flex-col"><div className="h-20 shrink-0 border-b border-slate-100 bg-white" /><div className="flex-1 bg-slate-50/30" /></div>}>
      <SEPPageInner />
    </Suspense>
  );
}
