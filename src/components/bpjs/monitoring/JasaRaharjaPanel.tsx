"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CalendarDays, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringJasaRaharja } from "@/lib/bpjs/vClaimMonitoring";
import type { JasaRaharjaMonitoringItem, JnsPelayananKode, BPJSError } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, fmtRupiah, jnsChipCls, jnsLabel, dijaminChipCls,
} from "./monitoringShared";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "loaded";
      list: JasaRaharjaMonitoringItem[];
      tglMulai: string;
      tglAkhir: string;
      totalDijamin: number;
      totalDibayar: number;
    }
  | { status: "error"; msg: string };

// ── Sub-components ─────────────────────────────────────

function JnsToggle({
  value,
  onChange,
}: {
  value: JnsPelayananKode;
  onChange: (v: JnsPelayananKode) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5">
      {(["1", "2"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg px-3 py-1 text-[11px] font-bold transition-all",
            value === opt
              ? "bg-white text-amber-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {opt === "1" ? "R.Inap" : "R.Jalan"}
        </button>
      ))}
    </div>
  );
}

function JRCard({
  item,
  index,
}: {
  item: JasaRaharjaMonitoringItem;
  index: number;
}) {
  const { sep, jasaRaharja } = item;
  const dijamin = jasaRaharja.ketStatusDijamin === "Dijamin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.05 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Card header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="font-mono text-[11px] font-bold text-slate-800">{sep.noSEP}</span>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span>{fmtDate(sep.tglSEP)}</span>
          <ArrowRight size={9} />
          <span>{fmtDate(sep.tglPlgSEP)}</span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", jnsChipCls(sep.jnsPelayanan))}>
          {jnsLabel(sep.jnsPelayanan)}
        </span>
        <span className="rounded-lg bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200/60">
          {sep.diagnosa}
        </span>
        <span className="text-[10px] text-slate-400">Poli: {sep.poli}</span>
        <span className={cn(
          "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold",
          dijaminChipCls(jasaRaharja.ketStatusDijamin),
        )}>
          {jasaRaharja.ketStatusDijamin}
        </span>
      </div>

      {/* Card body */}
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        {/* Peserta section */}
        <div className="border-b border-slate-100 px-4 py-3 sm:border-b-0 sm:border-r">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Peserta</p>
          <p className="text-xs font-bold text-slate-800">{sep.peserta.nama}</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{sep.peserta.noKartu}</p>
          {sep.peserta.noMR && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              MR: <span className="font-mono text-slate-600">{sep.peserta.noMR}</span>
            </p>
          )}
        </div>

        {/* Jasa Raharja section */}
        <div className="px-4 py-3">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Jasa Raharja</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">No. Register</span>
              <span className="font-mono text-[10px] font-semibold text-slate-700">{jasaRaharja.noRegister}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Tgl Kejadian</span>
              <span className="text-[10px] text-slate-700">{fmtDate(jasaRaharja.tglKejadian)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Status Dikirim</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold",
                jasaRaharja.ketStatusDikirim === "Sukses"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600",
              )}>
                {jasaRaharja.ketStatusDikirim}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
              <div className="text-center">
                <p className="text-[9px] text-slate-400">Dijamin</p>
                <p className="text-[10px] font-bold text-slate-700">{fmtRupiah(jasaRaharja.biayaDijamin)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">Plafon</p>
                <p className="text-[10px] font-bold text-slate-700">{fmtRupiah(jasaRaharja.plafon)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">Dibayar</p>
                <p className={cn("text-[10px] font-bold", dijamin ? "text-emerald-600" : "text-slate-400")}>
                  {fmtRupiah(jasaRaharja.jmlDibayar)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────

export default function JasaRaharjaPanel() {
  const [jns, setJns] = useState<JnsPelayananKode>("1");
  const [tglMulai, setTglMulai] = useState("2026-04-01");
  const [tglAkhir, setTglAkhir] = useState("2026-05-30");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (state.status === "loading") return;
      setState({ status: "loading" });
      try {
        const res = await monitoringJasaRaharja(jns, tglMulai, tglAkhir);
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const list = res.value.response ?? [];
        const totalDijamin = list.reduce((s, j) => s + Number(j.jasaRaharja.biayaDijamin), 0);
        const totalDibayar = list.reduce((s, j) => s + Number(j.jasaRaharja.jmlDibayar), 0);
        setState({ status: "loaded", list, tglMulai, tglAkhir, totalDijamin, totalDibayar });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [jns, tglMulai, tglAkhir, state.status],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600">Jenis</span>
            <JnsToggle value={jns} onChange={setJns} />
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
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <button
            type="submit"
            disabled={state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-amber-200/60 transition-all hover:bg-amber-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            {state.status === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5 py-14 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
                <ShieldAlert size={20} className="text-rose-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-slate-400">Pilih jenis pelayanan & periode</p>
              <p className="text-[10px] text-slate-300">Data klaim jaminan kecelakaan Jasa Raharja</p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"
            >
              <Loader2 size={14} className="animate-spin text-amber-400" />
              Memuat data Jasa Raharja…
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
                    Tidak ada data Jasa Raharja pada periode ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.list.map((item, i) => (
                    <JRCard key={item.sep.noSEP} item={item} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary footer */}
      {state.status === "loaded" && state.list.length > 0 && (
        <div className="shrink-0 border-t border-slate-100 bg-rose-50/50 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-4 text-[10px]">
            <span className="font-bold text-rose-700">{state.list.length} klaim JR</span>
            <span className="text-slate-500">
              Total Dijamin: <span className="font-semibold text-slate-700">{fmtRupiah(String(state.totalDijamin))}</span>
            </span>
            <span className="text-slate-500">
              Total Dibayar: <span className="font-semibold text-emerald-600">{fmtRupiah(String(state.totalDibayar))}</span>
            </span>
            <span className="ml-auto text-[10px] text-slate-400">
              {fmtDate(state.tglMulai)} — {fmtDate(state.tglAkhir)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
