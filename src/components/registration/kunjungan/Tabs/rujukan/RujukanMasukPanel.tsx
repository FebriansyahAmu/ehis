"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CalendarClock, CheckCircle2, FileX, RefreshCw,
  ScanSearch, Search, ShieldCheck,
} from "lucide-react";
import { RujukanCard } from "./RujukanCard";
import {
  type BpjsRujukanItem, type FetchState, type RujukanStatus,
  getIcdName, getRujukanStatus, getDaysRemaining, fmtDate,
  MOCK_RUJUKAN,
} from "./rujukanTypes";

// ─── Status chip config ───────────────────────────────────────

const STATUS_CHIP: Record<RujukanStatus, { chip: string; dot: string }> = {
  Aktif:           { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Kadaluarsa:      { chip: "bg-rose-50 text-rose-700 ring-rose-200",          dot: "bg-rose-500" },
  "Belum Berlaku": { chip: "bg-amber-50 text-amber-700 ring-amber-200",       dot: "bg-amber-500" },
};

// ─── Search hero ──────────────────────────────────────────────

function SearchHero({
  noBpjs, state, count, onFetch,
}: {
  noBpjs:  string;
  state:   FetchState;
  count:   number;
  onFetch: () => void;
}) {
  const loading = state === "loading";
  const done    = state === "success";
  const CTA     = loading ? RefreshCw : done ? RefreshCw : Search;

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {/* Subject */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-sky-100">
            <ScanSearch size={20} className="text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800">Cari Rujukan Peserta</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={11} className="shrink-0 text-sky-400" />
              <span className="text-slate-400">No. BPJS</span>
              <span className="truncate font-mono font-bold text-slate-700">{noBpjs}</span>
            </div>
          </div>
        </div>

        {/* CTA — enlarged, interactive */}
        <button
          type="button"
          onClick={onFetch}
          disabled={loading}
          className={cn(
            "group flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition active:scale-[0.97] disabled:opacity-60",
            "bg-sky-600 hover:bg-sky-700 sm:w-auto w-full",
          )}
        >
          <CTA size={14} className={cn("transition-transform", loading && "animate-spin", !loading && "group-hover:scale-110")} />
          {loading ? "Mencari…" : done ? "Perbarui Data" : "Cari Rujukan"}
        </button>
      </div>

      {/* Result meta strip */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-sky-100 bg-white/70"
          >
            <div className="flex items-center gap-2 px-4 py-2 text-[10.5px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-700">
                {count} rujukan
              </span>
              <span className="text-slate-400">ditemukan untuk peserta ini · sumber FKTP via BPJS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── List item (enlarged) ─────────────────────────────────────

function RujukanListItem({
  rujukan, selected, onClick,
}: {
  rujukan:  BpjsRujukanItem;
  selected: boolean;
  onClick:  () => void;
}) {
  const status = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const cfg    = STATUS_CHIP[status];
  const days   = getDaysRemaining(rujukan.tglrujukan_berakhir);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-150",
        selected
          ? "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40",
      )}
    >
      {/* Row 1 — no. rujukan + status */}
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
        <span className="flex-1 truncate font-mono text-[11px] font-bold tracking-wide text-slate-800">
          {rujukan.norujukan}
        </span>
        {selected ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
            <CheckCircle2 size={14} className="text-sky-500" />
          </motion.span>
        ) : (
          <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1", cfg.chip)}>
            {status}
          </span>
        )}
      </div>

      {/* Row 2 — diagnosa */}
      <div className="mt-1.5 flex items-center gap-1.5 pl-4">
        <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-700">
          {rujukan.diagppk}
        </span>
        <span className="truncate text-[10.5px] text-slate-500">{getIcdName(rujukan.diagppk)}</span>
      </div>

      {/* Row 3 — validity */}
      <div className="mt-1.5 flex items-center gap-1.5 pl-4 text-[9.5px] text-slate-400">
        <CalendarClock size={10} className="shrink-0" />
        <span>{fmtDate(rujukan.tglrujukan_awal)} — {fmtDate(rujukan.tglrujukan_berakhir)}</span>
        {status === "Aktif" && days >= 0 && (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-600 ring-1 ring-emerald-100">
            {days} hari lagi
          </span>
        )}
      </div>
    </button>
  );
}

// ─── List states ──────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-slate-100" />
        <div className="h-2.5 w-36 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-2 ml-4 h-2.5 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-1.5 ml-4 h-2 w-32 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

function EmptyListState() {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <FileX size={18} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500">Tidak ada rujukan</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Pasien datang tanpa rujukan FKTP aktif</p>
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
        <Search size={20} className="text-sky-400" />
      </div>
      <div>
        <p className="text-[11.5px] font-semibold text-slate-500">Belum ada pencarian</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Klik <span className="font-semibold text-sky-500">Cari Rujukan</span> untuk memuat data dari BPJS
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50">
        <AlertTriangle size={18} className="text-rose-500" />
      </div>
      <p className="text-[11px] font-semibold text-rose-600">Gagal memuat rujukan</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-rose-700"
      >
        Coba lagi
      </button>
    </div>
  );
}

// ─── Detail: select prompt ────────────────────────────────────

function SelectPrompt() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <ScanSearch size={20} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[11.5px] font-semibold text-slate-500">Pilih rujukan dari daftar</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Klik salah satu item untuk melihat detail lengkap</p>
      </div>
    </div>
  );
}

// ─── Detail: pilih footer ─────────────────────────────────────

function PilihRujukanFooter({
  rujukan, picked, onPilih,
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
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
          >
            <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-700">Dipilih untuk SEP Rawat Jalan</p>
              <p className="truncate font-mono text-[9.5px] text-emerald-500">{rujukan.norujukan}</p>
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
              "w-full rounded-xl py-2.5 text-[12px] font-bold transition active:scale-[0.98]",
              isAktif
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200/70 hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {isAktif ? "Pilih Rujukan untuk SEP Rawat Jalan" : `Tidak Dapat Dipilih — ${status}`}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RujukanMasukPanel ────────────────────────────────────────

export function RujukanMasukPanel({ noBpjs, onPick }: { noBpjs: string; onPick?: (r: BpjsRujukanItem) => void }) {
  const [fetchState,  setFetchState]  = useState<FetchState>("idle");
  const [rujukanList, setRujukanList] = useState<BpjsRujukanItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [pickedId,    setPickedId]    = useState<string | null>(null);

  const selectedRujukan = rujukanList.find((r) => r.idrujukan === selectedId) ?? null;

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

  const handleSelect = (id: string) => setSelectedId((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-3">
      {/* Prominent search zone */}
      <SearchHero noBpjs={noBpjs} state={fetchState} count={rujukanList.length} onFetch={handleFetch} />

      {/* Results */}
      <AnimatePresence mode="wait">
        {fetchState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <IdleState />
          </motion.div>
        )}

        {fetchState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2 rounded-2xl border border-slate-100 p-2">
            <SkeletonItem />
            <SkeletonItem />
          </motion.div>
        )}

        {fetchState === "empty" && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-200 bg-white">
            <EmptyListState />
          </motion.div>
        )}

        {fetchState === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-200 bg-white">
            <ErrorState onRetry={handleFetch} />
          </motion.div>
        )}

        {fetchState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_1fr]"
          >
            {/* List */}
            <div className="space-y-2">
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
            </div>

            {/* Detail */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <AnimatePresence mode="wait">
                {!selectedRujukan ? (
                  <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <SelectPrompt />
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedRujukan.idrujukan}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col"
                  >
                    <div className="p-4">
                      <RujukanCard rujukan={selectedRujukan} delay={0} />
                    </div>
                    <PilihRujukanFooter
                      rujukan={selectedRujukan}
                      picked={pickedId === selectedRujukan.idrujukan}
                      onPilih={() => { setPickedId(selectedRujukan.idrujukan); onPick?.(selectedRujukan); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
