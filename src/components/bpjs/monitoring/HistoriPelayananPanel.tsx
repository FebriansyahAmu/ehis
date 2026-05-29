"use client";

import { useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CalendarDays, UserSearch, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringHistoriPelayanan } from "@/lib/bpjs/vClaimMonitoring";
import type { HistoriPelayananMonitoringItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, jnsChipCls, jnsLabel, kelasChipCls, daysBetween,
  SAMPLE_KARTU_HISTORI,
} from "./monitoringShared";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "loaded";
      list: HistoriPelayananMonitoringItem[];
      noKartu: string;
      tglMulai: string;
      tglAkhir: string;
    }
  | { status: "error"; msg: string };

// ── Timeline entry ─────────────────────────────────────

function HistoriEntry({
  item,
  index,
}: {
  item: HistoriPelayananMonitoringItem;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className="relative flex gap-3 pb-4 last:pb-0"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
          item.jnsPelayanan === "1"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700",
        )}>
          {item.jnsPelayanan === "1" ? "RI" : "RJ"}
        </div>
        <div className="mt-1 w-px flex-1 bg-slate-100 last:hidden" />
      </div>

      {/* Content */}
      <div className="mb-2 min-w-0 flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-slate-700">{item.noSep}</span>
            {item.kelasRawat && (
              <span className={cn("rounded-lg px-1.5 py-0.5 text-[9px] font-bold", kelasChipCls(item.kelasRawat))}>
                {item.kelasRawat}
              </span>
            )}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", jnsChipCls(item.jnsPelayanan))}>
              {jnsLabel(item.jnsPelayanan)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{fmtDate(item.tglSep)}</span>
            <ArrowRight size={9} />
            <span>{fmtDate(item.tglPlgSep)}</span>
          </div>
        </div>

        {/* Diagnosa */}
        <p className="mt-1.5 text-[11px] font-medium text-slate-700">{item.diagnosa}</p>

        {/* Poli */}
        {item.poli && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            Poli: <span className="text-slate-600">{item.poli}</span>
          </p>
        )}

        {/* Footer */}
        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-50 pt-2">
          {item.noRujukan && (
            <p className="text-[9px] text-slate-400">
              Rujukan: <span className="font-mono text-slate-500">{item.noRujukan}</span>
            </p>
          )}
          <p className="text-[9px] text-slate-400">
            PPK: <span className="text-slate-500">{item.ppkPelayanan}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────

export default function HistoriPelayananPanel() {
  const kartuId = useId();
  const [noKartu, setNoKartu] = useState("");
  const [tglMulai, setTglMulai] = useState("2026-04-01");
  const [tglAkhir, setTglAkhir] = useState("2026-05-30");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const periodeError =
    noKartu.length === 13 && tglMulai && tglAkhir && daysBetween(tglMulai, tglAkhir) > 90
      ? "Periode maksimal 90 hari"
      : null;

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (state.status === "loading") return;
      if (periodeError) return;
      if (!/^\d{13}$/.test(noKartu)) return;
      setState({ status: "loading" });
      try {
        const res = await monitoringHistoriPelayanan(noKartu, tglMulai, tglAkhir);
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const raw = res.value.response ?? [];
        const list = [...raw].sort((a, b) => b.tglSep.localeCompare(a.tglSep));
        setState({ status: "loaded", list, noKartu, tglMulai, tglAkhir });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [noKartu, tglMulai, tglAkhir, periodeError, state.status],
  );

  const firstItem = state.status === "loaded" ? state.list[0] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor={kartuId} className="text-[11px] font-semibold text-slate-600">
              No. Kartu
            </label>
            <input
              id={kartuId}
              type="text"
              value={noKartu}
              maxLength={13}
              placeholder="13 digit…"
              onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
              className={cn(
                "w-36 rounded-xl border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 transition focus:outline-none focus:ring-2",
                noKartu.length > 0 && noKartu.length !== 13
                  ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                  : "border-slate-200 focus:border-amber-300 focus:ring-amber-100",
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={13} className="text-amber-500" strokeWidth={2} />
            <span className="text-[11px] font-semibold text-slate-600">Periode</span>
            <input
              type="date"
              value={tglMulai}
              max={tglAkhir}
              onChange={(e) => setTglMulai(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <span className="text-[10px] text-slate-400">s/d</span>
            <input
              type="date"
              value={tglAkhir}
              min={tglMulai}
              onChange={(e) => setTglAkhir(e.target.value)}
              className={cn(
                "rounded-xl border bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2",
                periodeError
                  ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                  : "border-slate-200 focus:border-amber-300 focus:ring-amber-100",
              )}
            />
            {periodeError && (
              <span className="text-[10px] text-rose-500">{periodeError}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={state.status === "loading" || !/^\d{13}$/.test(noKartu) || !!periodeError}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-amber-200/60 transition-all hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>

          {/* Sample kartu chips */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300">Sample:</span>
            {SAMPLE_KARTU_HISTORI.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setNoKartu(k)}
                className={cn(
                  "rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                  noKartu === k ? "bg-amber-100 text-amber-700" : "text-slate-400 hover:text-slate-600",
                )}
              >
                {k.slice(-4)}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Peserta header (when loaded) */}
      <AnimatePresence>
        {state.status === "loaded" && firstItem && (
          <motion.div
            key="peserta-header"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="shrink-0 flex items-center gap-3 border-b border-slate-100 bg-amber-50/60 px-4 py-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <UserSearch size={13} className="text-amber-600" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{firstItem.namaPeserta}</p>
              <p className="font-mono text-[10px] text-slate-400">{firstItem.noKartu}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-500">
                {fmtDate(state.tglMulai)} — {fmtDate(state.tglAkhir)}
              </p>
              <p className="text-[10px] font-bold text-amber-600">
                {state.list.length} riwayat pelayanan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5 py-14 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                <UserSearch size={20} className="text-amber-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-slate-400">Masukkan No. Kartu & periode</p>
              <p className="text-[10px] text-slate-300">Periode maksimal 90 hari</p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"
            >
              <Loader2 size={14} className="animate-spin text-amber-400" />
              Memuat riwayat pelayanan…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
            >
              {state.msg}
            </motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-xs text-slate-400">
                    Tidak ada riwayat pelayanan dalam periode ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {state.list.map((item, i) => (
                    <HistoriEntry key={item.noSep} item={item} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
