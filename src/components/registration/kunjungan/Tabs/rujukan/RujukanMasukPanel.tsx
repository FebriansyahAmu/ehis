"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, FileX, RefreshCw, Search, ShieldCheck,
} from "lucide-react";
import { RujukanCard } from "./RujukanCard";
import {
  type BpjsRujukanItem, type FetchState,
  getIcdName, getRujukanStatus, fmtDate,
  MOCK_RUJUKAN,
} from "./rujukanTypes";

// ─── Status dot ───────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  Aktif:           "bg-emerald-400",
  Kadaluarsa:      "bg-rose-400",
  "Belum Berlaku": "bg-amber-400",
};

// ─── Left panel: compact list item ───────────────────────────

function RujukanListItem({
  rujukan,
  selected,
  onClick,
}: {
  rujukan:  BpjsRujukanItem;
  selected: boolean;
  onClick:  () => void;
}) {
  const status = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-2.5 py-2 text-left transition-all duration-150",
        selected
          ? "border-sky-300 bg-sky-50 shadow-sm shadow-sky-100"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
            <span className="truncate font-mono text-[9.5px] font-bold tracking-wide text-slate-700">
              {rujukan.norujukan}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 pl-3">
            <span className="rounded bg-sky-50 px-1 py-0.5 font-mono text-[8.5px] font-bold text-sky-600">
              {rujukan.diagppk}
            </span>
            <span className="truncate text-[9px] text-slate-400">
              {getIcdName(rujukan.diagppk)}
            </span>
          </div>
          <p className="mt-0.5 pl-3 text-[8.5px] text-slate-300">
            {fmtDate(rujukan.tglrujukan_awal)} — {fmtDate(rujukan.tglrujukan_berakhir)}
          </p>
        </div>
        {selected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5 shrink-0">
            <CheckCircle2 size={11} className="text-sky-500" />
          </motion.div>
        )}
      </div>
    </button>
  );
}

// ─── Left panel states ────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="rounded-lg border border-transparent px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-slate-100" />
        <div className="h-2 w-32 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-1 ml-3 h-2 w-20 animate-pulse rounded bg-slate-100" />
      <div className="mt-0.5 ml-3 h-1.5 w-28 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

function EmptyListState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <FileX size={16} className="text-slate-300" />
      <div>
        <p className="text-[10px] font-semibold text-slate-400">Tidak ada rujukan</p>
        <p className="mt-0.5 text-[9px] text-slate-300">Pasien datang tanpa rujukan aktif</p>
      </div>
    </div>
  );
}

function IdleListState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-[9.5px] text-slate-300">
        Klik <span className="font-semibold text-sky-500">Cari</span> untuk memuat
      </p>
    </div>
  );
}

function ErrorListState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <AlertTriangle size={14} className="text-rose-400" />
      <p className="text-[10px] font-semibold text-rose-600">Gagal memuat</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-[10px] font-semibold text-sky-600 hover:underline"
      >
        Coba lagi
      </button>
    </div>
  );
}

// ─── Right panel: select prompt ───────────────────────────────

function SelectPrompt({ hasData }: { hasData: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Search size={16} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500">
          {hasData ? "Pilih rujukan dari daftar" : "Muat data rujukan terlebih dahulu"}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {hasData
            ? "Klik item di kiri untuk melihat detail"
            : "Klik tombol Cari untuk mengambil data dari BPJS"
          }
        </p>
      </div>
    </div>
  );
}

// ─── Right panel: pilih rujukan footer ───────────────────────

function PilihRujukanFooter({
  rujukan,
  picked,
  onPilih,
}: {
  rujukan: BpjsRujukanItem;
  picked:  boolean;
  onPilih: () => void;
}) {
  const status  = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const isAktif = status === "Aktif";

  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <AnimatePresence mode="wait">
        {picked ? (
          <motion.div
            key="picked"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
          >
            <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold text-emerald-700">Dipilih untuk SEP Rawat Jalan</p>
              <p className="truncate font-mono text-[9px] text-emerald-500">{rujukan.norujukan}</p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onPilih}
            disabled={!isAktif}
            title={!isAktif ? `Rujukan ${status} — tidak dapat dipilih` : undefined}
            className={cn(
              "w-full rounded-lg py-2 text-[11px] font-bold transition active:scale-95",
              isAktif
                ? "bg-sky-600 text-white hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {isAktif
              ? "Pilih Rujukan untuk SEP Rawat Jalan"
              : `Tidak Dapat Dipilih — Rujukan ${status}`
            }
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RujukanMasukPanel ────────────────────────────────────────

export function RujukanMasukPanel({ noBpjs }: { noBpjs: string }) {
  const [fetchState,  setFetchState]  = useState<FetchState>("idle");
  const [rujukanList, setRujukanList] = useState<BpjsRujukanItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [pickedId,    setPickedId]    = useState<string | null>(null);

  const selectedRujukan = rujukanList.find(r => r.idrujukan === selectedId) ?? null;
  const isLoading       = fetchState === "loading";

  const handleFetch = () => {
    setFetchState("loading");
    setSelectedId(null);
    setPickedId(null);
    setTimeout(() => {
      if (MOCK_RUJUKAN.length > 0) {
        setRujukanList(MOCK_RUJUKAN);
        setFetchState("success");
      } else {
        setFetchState("empty");
      }
    }, 1200);
  };

  const handleSelect = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex min-h-65">

        {/* ── Left: compact list ── */}
        <div className="flex w-52.5 shrink-0 flex-col border-r border-slate-100">

          {/* Header */}
          <div className="border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-700">Rujukan Masuk</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <ShieldCheck size={9} className="text-sky-400" />
                  <span className="truncate font-mono text-[9px] text-slate-400">{noBpjs}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFetch}
                disabled={isLoading}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
              >
                {isLoading
                  ? <RefreshCw size={9} className="animate-spin" />
                  : <Search size={9} />
                }
                {fetchState === "success" ? "Perbarui" : "Cari"}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-1.5">
            <AnimatePresence mode="wait">
              {fetchState === "idle" && <IdleListState key="idle" />}

              {fetchState === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-0.5"
                >
                  <SkeletonItem />
                  <SkeletonItem />
                </motion.div>
              )}

              {fetchState === "success" && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-0.5"
                >
                  {rujukanList.map((r, i) => (
                    <motion.div
                      key={r.idrujukan}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <RujukanListItem
                        rujukan={r}
                        selected={selectedId === r.idrujukan}
                        onClick={() => handleSelect(r.idrujukan)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {fetchState === "empty" && <EmptyListState key="empty" />}
              {fetchState === "error"  && <ErrorListState key="error" onRetry={handleFetch} />}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: card detail + pilih button ── */}
        <div className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {!selectedRujukan ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-1 items-center justify-center"
              >
                <SelectPrompt hasData={fetchState === "success"} />
              </motion.div>
            ) : (
              <motion.div
                key={selectedRujukan.idrujukan}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex-1 p-4">
                  <RujukanCard rujukan={selectedRujukan} delay={0} />
                </div>
                <PilihRujukanFooter
                  rujukan={selectedRujukan}
                  picked={pickedId === selectedRujukan.idrujukan}
                  onPilih={() => setPickedId(selectedRujukan.idrujukan)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
