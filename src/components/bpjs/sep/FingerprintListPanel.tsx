"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Loader2, Search, Fingerprint } from "lucide-react";

import { cn } from "@/lib/utils";
import { listFingerPrint } from "@/lib/bpjs/vClaimSEP";
import type { FingerPrintListItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import { findPesertaByKartu } from "@/lib/bpjs/mock/pesertaMock";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

// ── Row ────────────────────────────────────────────────────

function Row({ item, index }: { item: FingerPrintListItem; index: number }) {
  const peserta = findPesertaByKartu(item.noKartu);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className="border-b border-slate-100 last:border-0"
    >
      <td className="py-2.5 pl-3 pr-3">
        <p className="font-mono text-[11px] font-medium text-slate-700">{item.noKartu}</p>
        {peserta && (
          <p className="mt-0.5 text-[10px] text-slate-500">{peserta.nama}</p>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <p className="font-mono text-[11px] text-slate-600">{item.noSEP}</p>
      </td>
      <td className="py-2.5 pr-3">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          peserta
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-500",
        )}>
          {peserta?.statusPeserta.keterangan ?? "—"}
        </span>
      </td>
    </motion.tr>
  );
}

// ── Component ──────────────────────────────────────────────

type ListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: FingerPrintListItem[]; tgl: string }
  | { status: "error"; msg: string };

const QUICK_DATES = [
  { label: "01 Mei 2026", value: "2026-05-01" },
  { label: "10 Mei 2026", value: "2026-05-10" },
  { label: "17 Mei 2026", value: "2026-05-17" },
];

export default function FingerprintListPanel() {
  const [tglPelayanan, setTglPelayanan] = useState(new Date().toISOString().slice(0, 10));
  const [state, setState]               = useState<ListState>({ status: "idle" });

  const handleLoad = useCallback(async () => {
    if (state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await listFingerPrint(tglPelayanan);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      setState({ status: "loaded", list: res.value.response?.list ?? [], tgl: tglPelayanan });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [tglPelayanan, state.status]);

  function fmtDate(s: string) {
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <List size={13} className="text-indigo-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Riwayat Fingerprint per Tanggal</p>
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        <input
          type="date"
          value={tglPelayanan}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setTglPelayanan(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={handleLoad}
          disabled={state.status === "loading"}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200/50 transition-all hover:bg-indigo-600 disabled:cursor-wait disabled:opacity-60"
        >
          {state.status === "loading"
            ? <Loader2 size={11} className="animate-spin" />
            : <Search size={11} strokeWidth={2.5} />
          }
          Muat
        </button>
      </div>

      {/* Quick date shortcuts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_DATES.map((d) => (
          <button key={d.value} type="button"
            onClick={() => { setTglPelayanan(d.value); }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors",
              tglPelayanan === d.value
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2.5 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
              <Fingerprint size={20} className="text-indigo-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Pilih tanggal dan klik Muat untuk lihat riwayat fingerprint</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={13} className="animate-spin text-indigo-400" />
            Mengambil data fingerprint…
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >{state.msg}</motion.p>
        )}

        {state.status === "loaded" && (
          <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {state.list.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-xs text-slate-400">
                  Tidak ada data fingerprint untuk tanggal {fmtDate(state.tgl)}.
                </p>
                <p className="mt-1 text-[10px] text-slate-300">
                  Coba tanggal 2026-05-01 atau 2026-05-10 untuk data mock.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                <table className="w-full min-w-[420px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {["No. Kartu / Nama", "No. SEP", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {state.list.map((item, i) => (
                      <Row key={item.noSEP} item={item} index={i} />
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 bg-indigo-50/50 px-3 py-2 text-[10px] font-medium text-indigo-700">
                  {state.list.length} peserta · {fmtDate(state.tgl)}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
