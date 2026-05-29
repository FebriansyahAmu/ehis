"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Loader2 } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { getPesertaByKartu, getPesertaByNik } from "@/lib/bpjs/vClaimKepesertaan";

import CekPesertaForm from "./CekPesertaForm";
import PesertaDetailCard from "./PesertaDetailCard";
import type { KepesertaanResult, SearchMode } from "./kepesertaanShared";

// ── Result panel header helpers ────────────────────────────

function resultLabel(r: KepesertaanResult): string {
  if (r.status === "idle")    return "Hasil Pencarian";
  if (r.status === "loading") return "Memuat data…";
  if (r.status === "found")   return r.peserta.nama;
  return "Gagal Memuat";
}

function resultSub(r: KepesertaanResult): string {
  if (r.status === "idle")    return "Masukkan nomor & klik Cek Kepesertaan";
  if (r.status === "loading") return "Menghubungi server V-Claim BPJS…";
  if (r.status === "found")   return `No. Kartu · ${r.peserta.noKartu}`;
  return "Periksa koneksi atau coba lagi";
}

// ── Page header ────────────────────────────────────────────

function PageHeader({ loading }: { loading: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500">
        <UserCheck size={13} className="text-white" strokeWidth={2.4} />
      </div>
      <h1 className="flex-1 text-sm font-semibold text-slate-800">Cek Status Kepesertaan</h1>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600"
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
  );
}

// ── Result panel header ────────────────────────────────────

function ResultPanelHeader({ result }: { result: KepesertaanResult }) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-white/80 px-5 py-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={result.status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
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
      <div className="h-13 shrink-0 border-b border-slate-100 bg-white" />
      <div className="grid min-h-0 flex-1 lg:grid-cols-12">
        <div className="lg:col-span-5 h-full border-r border-slate-100 bg-white" />
        <div className="lg:col-span-7 h-full bg-slate-50/30" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function KepesertaanPage() {
  const loaded = useSkeletonDelay(400);

  const [result, setResult]         = useState<KepesertaanResult>({ status: "idle" });
  const [lastSearch, setLastSearch] = useState<{ mode: SearchMode; value: string; tgl: string } | null>(null);

  const handleSubmit = useCallback(async (mode: SearchMode, value: string, tgl: string) => {
    setLastSearch({ mode, value, tgl });
    setResult({ status: "loading" });
    try {
      const res = mode === "kartu"
        ? await getPesertaByKartu(value, tgl)
        : await getPesertaByNik(value, tgl);

      if (res.ok && res.value.response) {
        setResult({ status: "found", peserta: res.value.response });
      } else if (res.ok) {
        setResult({
          status: "error",
          error: { type: "BPJSMetaError", code: "201", message: "Peserta tidak ditemukan", endpoint: "", retryable: false },
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
    if (lastSearch) handleSubmit(lastSearch.mode, lastSearch.value, lastSearch.tgl);
  }, [lastSearch, handleSubmit]);

  if (!loaded) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <PageHeader loading={result.status === "loading"} />

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12">
        {/* LEFT — form */}
        <aside className="col-span-1 overflow-y-auto border-b border-slate-100 bg-white lg:col-span-5 lg:border-b-0 lg:border-r">
          <CekPesertaForm
            onSubmit={handleSubmit}
            busy={result.status === "loading"}
          />
        </aside>

        {/* RIGHT — result */}
        <main className="col-span-1 flex min-h-0 flex-col overflow-hidden bg-slate-50/20 lg:col-span-7">
          <ResultPanelHeader result={result} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PesertaDetailCard result={result} onRetry={handleRetry} />
          </div>
        </main>
      </div>
    </motion.div>
  );
}
