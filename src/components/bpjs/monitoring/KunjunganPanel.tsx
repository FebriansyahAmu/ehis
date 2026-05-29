"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CalendarDays, Download, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringKunjungan } from "@/lib/bpjs/vClaimMonitoring";
import type { KunjunganMonitoringItem, JnsPelayananKode, BPJSError } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, jnsChipCls, jnsLabel, kelasChipCls,
  today, exportCsv, SAMPLE_KUNJUNGAN_DATES,
} from "./monitoringShared";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: KunjunganMonitoringItem[]; tgl: string; jns: "R.Inap" | "R.Jalan" }
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

function EmptyState() {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-2.5 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
        <MousePointerClick size={20} className="text-amber-200" strokeWidth={1.5} />
      </div>
      <p className="text-xs font-medium text-slate-400">Pilih tanggal SEP & jenis pelayanan</p>
      <p className="text-[10px] text-slate-300">Klik Cari untuk menampilkan data kunjungan</p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────

export default function KunjunganPanel() {
  const [tglSEP, setTglSEP] = useState("2026-05-01");
  const [jns, setJns] = useState<JnsPelayananKode>("1");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (state.status === "loading") return;
      setState({ status: "loading" });
      try {
        const res = await monitoringKunjungan(tglSEP, jns);
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const list = res.value.response ?? [];
        setState({ status: "loaded", list, tgl: tglSEP, jns: jns === "1" ? "R.Inap" : "R.Jalan" });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [tglSEP, jns, state.status],
  );

  function handleExport() {
    if (state.status !== "loaded") return;
    const header = ["No. SEP", "No. Kartu", "Nama", "Diagnosa", "Jenis Pelayanan", "Kelas Rawat", "Poli", "Tgl Pulang SEP"];
    const rows = state.list.map((item) => [
      item.noSep,
      item.noKartu,
      item.nama,
      item.diagnosa,
      item.jnsPelayanan,
      item.kelasRawat,
      item.poli ?? "",
      item.tglPlgSep,
    ]);
    exportCsv([header, ...rows], `kunjungan_${state.tgl}.csv`);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={13} className="text-amber-500" strokeWidth={2} />
            <span className="text-[11px] font-semibold text-slate-600">Tgl SEP</span>
            <input
              type="date"
              value={tglSEP}
              max={today()}
              onChange={(e) => setTglSEP(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600">Jenis</span>
            <JnsToggle value={jns} onChange={setJns} />
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

          {state.status === "loaded" && state.list.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100"
            >
              <Download size={11} strokeWidth={2.5} />
              Export CSV
            </button>
          )}

          {/* Dev quick dates */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300">Sample:</span>
            {SAMPLE_KUNJUNGAN_DATES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setTglSEP(d); }}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors",
                  tglSEP === d
                    ? "bg-amber-100 text-amber-700"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {d.slice(5)}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.status === "idle" && <EmptyState />}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400"
            >
              <Loader2 size={14} className="animate-spin text-amber-400" />
              Memuat data kunjungan…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
            >
              {state.msg}
            </motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xs text-slate-400">
                    Tidak ada kunjungan {state.jns} pada tanggal {fmtDate(state.tgl)}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-225 text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["No. SEP", "No. Kartu", "Nama", "Diagnosa", "Jenis", "Kelas", "Poli", "Tgl Pulang"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.list.map((item, i) => (
                        <motion.tr
                          key={item.noSep}
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.13, delay: i * 0.03 }}
                          className="border-b border-slate-50 last:border-0 transition-colors hover:bg-amber-50/20"
                        >
                          <td className="py-2.5 pl-4 pr-3 font-mono text-[10px] font-semibold text-slate-700">
                            {item.noSep}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[10px] text-slate-500">
                            {item.noKartu}
                          </td>
                          <td className="py-2.5 pr-3 text-xs font-semibold text-slate-800">
                            {item.nama}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="rounded-lg bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200/60">
                              {item.diagnosa}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", jnsChipCls(item.jnsPelayanan))}>
                              {jnsLabel(item.jnsPelayanan)}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", kelasChipCls(item.kelasRawat))}>
                              Kls {item.kelasRawat}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-[11px] text-slate-500">
                            {item.poli ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 pr-4 text-[11px] text-slate-500">
                            {fmtDate(item.tglPlgSep)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary footer */}
      {state.status === "loaded" && state.list.length > 0 && (
        <div className="shrink-0 border-t border-slate-100 bg-amber-50/60 px-4 py-2">
          <p className="text-[10px] font-medium text-amber-700">
            {state.list.length} kunjungan ·{" "}
            <span className="text-amber-500">{state.jns}</span> ·{" "}
            {fmtDate(state.tgl)}
          </p>
        </div>
      )}
    </div>
  );
}
