"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Loader2, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { listRujukanKhusus } from "@/lib/bpjs/vClaimRujukan";
import type { RujukanKhususListItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import { fmtDate } from "./rujukanShared";

// ── Helpers ────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

// ── Row ────────────────────────────────────────────────

function KhususRow({ item, index }: { item: RujukanKhususListItem; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      className="border-b border-slate-100 last:border-0 transition-colors hover:bg-teal-50/30"
    >
      <td className="py-2.5 pl-4 pr-3">
        <p className="font-mono text-[11px] font-semibold text-slate-700">{item.idrujukan}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400 line-clamp-1">{item.norujukan}</p>
      </td>
      <td className="py-2.5 pr-3">
        <p className="text-xs font-semibold leading-tight text-slate-800">{item.nmpst}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.nokapst}</p>
      </td>
      <td className="py-2.5 pr-3">
        <span className="rounded-full bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200/80">
          {item.diagppk}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <p className="text-[10px] text-slate-600">{fmtDate(item.tglrujukan_awal)}</p>
        <div className="mt-0.5 flex items-center gap-1">
          <ChevronRight size={8} className="text-slate-300" />
          <p className="text-[10px] text-slate-400">{fmtDate(item.tglrujukan_berakhir)}</p>
        </div>
      </td>
    </motion.tr>
  );
}

// ── Types + constants ──────────────────────────────────

type ListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: RujukanKhususListItem[]; bulan: number; tahun: number }
  | { status: "error"; msg: string };

const BULAN_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const QUICK_PERIODS = [
  { label: "Mei 2026", bulan: 5, tahun: 2026 },
  { label: "Jun 2026", bulan: 6, tahun: 2026 },
  { label: "Jul 2026", bulan: 7, tahun: 2026 },
];

// ── Inner content (usable standalone or inside ReferensiPanel) ──

export function KhususContent() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [state, setState] = useState<ListState>({ status: "idle" });

  const handleLoad = useCallback(async () => {
    if (state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await listRujukanKhusus(bulan, tahun);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      const list = res.value.response?.rujukan ?? [];
      setState({ status: "loaded", list, bulan, tahun });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [bulan, tahun, state.status]);

  function applyQuick(b: number, t: number) {
    setBulan(b);
    setTahun(t);
    setState({ status: "idle" });
  }

  return (
    <>
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <List size={13} className="text-teal-500" strokeWidth={2.3} />
          <p className="text-xs font-bold text-slate-800">List Rujukan Khusus</p>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Rujukan kronik (kanker · dialisis · jantung) per bulan + tahun
        </p>
      </div>

      {/* Filter controls */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex gap-2">
          <select
            value={bulan}
            onChange={(e) => { setBulan(Number(e.target.value)); setState({ status: "idle" }); }}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          >
            {BULAN_LABELS.map((lbl, i) => (
              <option key={i + 1} value={i + 1}>{lbl}</option>
            ))}
          </select>
          <input
            type="number"
            value={tahun}
            min={2020}
            max={2099}
            onChange={(e) => { setTahun(Number(e.target.value)); setState({ status: "idle" }); }}
            className="w-22 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="button"
            onClick={handleLoad}
            disabled={state.status === "loading"}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-200/50 transition-all hover:bg-teal-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            {state.status === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <Search size={11} strokeWidth={2.5} />
            }
            Cari
          </button>
        </div>

        {/* Quick shortcuts */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {QUICK_PERIODS.map((p) => (
            <button key={`${p.bulan}-${p.tahun}`} type="button"
              onClick={() => applyQuick(p.bulan, p.tahun)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors",
                bulan === p.bulan && tahun === p.tahun
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5 py-12 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100">
                <List size={20} className="text-teal-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-slate-400">Pilih bulan + tahun dan klik Cari</p>
              <p className="text-[10px] text-slate-300">Coba bulan Mei 2026 untuk data mock</p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400"
            >
              <Loader2 size={13} className="animate-spin text-teal-400" />
              Mengambil rujukan khusus…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
            >{state.msg}</motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-xs text-slate-400">
                    Tidak ada rujukan khusus untuk {BULAN_LABELS[state.bulan - 1]} {state.tahun}.
                  </p>
                  <p className="mt-1 text-[10px] text-slate-300">Coba bulan Mei 2026 untuk data mock</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["ID / No Rujukan", "Nama / Kartu", "Diagnosa", "Periode"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {state.list.map((item, i) => (
                        <KhususRow key={item.idrujukan} item={item} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer badge */}
      {state.status === "loaded" && state.list.length > 0 && (
        <div className="shrink-0 border-t border-slate-100 bg-teal-50/60 px-4 py-2">
          <p className="text-[10px] font-medium text-teal-700">
            {state.list.length} rujukan khusus · {BULAN_LABELS[state.bulan - 1]} {state.tahun}
          </p>
        </div>
      )}
    </>
  );
}

// ── Standalone panel (outer shell) ─────────────────────

export default function ListRujukanKhususPanel() {
  return (
    <div className="flex h-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <KhususContent />
    </div>
  );
}
