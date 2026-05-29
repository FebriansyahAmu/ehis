"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Loader2, Search, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { listUpdateTglPulang } from "@/lib/bpjs/vClaimSEP";
import type { UpdateTglPulangListItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import { jnsLabel } from "./sepShared";

// ── Helpers ────────────────────────────────────────────────

const MONTH_OPTIONS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function currentBulanTahun() {
  const now = new Date();
  return { bulan: now.getMonth() + 1, tahun: now.getFullYear() };
}

function fmtDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

// ── Row ────────────────────────────────────────────────────

function Row({ item, index }: { item: UpdateTglPulangListItem; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className="group border-b border-slate-100 last:border-0"
    >
      <td className="py-2.5 pr-3">
        <p className="font-mono text-xs font-medium text-slate-700">{item.noSep}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.noKartu}</p>
      </td>
      <td className="py-2.5 pr-3">
        <p className="text-xs font-medium text-slate-700">{item.nama}</p>
        <span className={cn(
          "mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-semibold",
          item.jnsPelayanan === "1" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700",
        )}>
          {jnsLabel(item.jnsPelayanan)}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-xs text-slate-500">{fmtDate(item.tglSep)}</td>
      <td className="py-2.5 pr-3">
        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {fmtDate(item.tglPulang)}
        </span>
      </td>
      <td className="py-2.5 text-xs text-slate-500">{item.user}</td>
    </motion.tr>
  );
}

// ── Component ──────────────────────────────────────────────

interface UpdateTglPulangListProps {
  /** Increment to trigger a re-fetch externally (e.g. after form submit). */
  refreshKey?: number;
}

export default function UpdateTglPulangList({ refreshKey: _refreshKey }: UpdateTglPulangListProps) {
  const def = currentBulanTahun();
  const [bulan, setBulan]   = useState(def.bulan);
  const [tahun, setTahun]   = useState(def.tahun);
  const [filter, setFilter] = useState("");

  type ListState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; list: UpdateTglPulangListItem[] }
    | { status: "error"; msg: string };

  const [state, setState] = useState<ListState>({ status: "idle" });

  const handleLoad = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await listUpdateTglPulang(bulan, tahun, filter.trim());
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      setState({ status: "loaded", list: res.value.response?.list ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [bulan, tahun, filter]);

  const tahunOptions = Array.from({ length: 5 }, (_, i) => def.tahun - i);

  return (
    <div className="flex flex-col gap-4 p-5">

      {/* Section header */}
      <div className="flex items-center gap-2">
        <List size={13} className="text-emerald-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Riwayat Update Tanggal Pulang</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {MONTH_OPTIONS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {tahunOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter No. SEP / No. Kartu…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 placeholder:font-sans placeholder:text-slate-300 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="button"
          onClick={handleLoad}
          disabled={state.status === "loading"}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200/50 transition-all hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
        >
          {state.status === "loading"
            ? <Loader2 size={12} className="animate-spin" />
            : <Search size={12} strokeWidth={2.5} />
          }
          Muat
        </button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
              <CalendarClock size={22} className="text-slate-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Pilih bulan/tahun dan klik Muat untuk melihat riwayat</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={14} className="animate-spin text-emerald-400" />
            Mengambil data dari V-Claim…
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p
            key="err"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >
            {state.msg}
          </motion.p>
        )}

        {state.status === "loaded" && (
          <motion.div
            key="loaded"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {state.list.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Tidak ada data update tanggal pulang untuk periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {["No. SEP / Kartu", "Pasien", "Tgl. SEP", "Tgl. Pulang", "Oleh"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {state.list.map((item, i) => (
                      <Row key={item.noSep} item={item} index={i} />
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[10px] text-slate-400">
                  {state.list.length} entri · {MONTH_OPTIONS[bulan - 1]} {tahun}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
