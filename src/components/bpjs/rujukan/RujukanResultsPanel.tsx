"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, SearchX, MousePointerClick } from "lucide-react";
import type { SearchState } from "./rujukanShared";
import RujukanResultCard from "./RujukanResultCard";

interface Props {
  state: SearchState;
}

export default function RujukanResultsPanel({ state }: Props) {
  return (
    <div className="flex h-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-teal-500" strokeWidth={2.3} />
          <p className="text-xs font-bold text-slate-800">Hasil Pencarian</p>
          {state.status === "found" && (
            <span className="ml-auto rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
              {state.results.length} rujukan
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">Detail rujukan masuk · klik sample di panel kiri untuk mencoba</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {state.status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100">
                <MousePointerClick size={22} className="text-teal-200" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Belum ada pencarian</p>
                <p className="mt-0.5 text-[10px] text-slate-300">Isi No. Rujukan atau No. Kartu di panel kiri</p>
              </div>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <Loader2 size={24} className="animate-spin text-teal-400" strokeWidth={1.5} />
              <p className="text-xs text-slate-400">Mencari rujukan di V-Claim…</p>
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.div
              key="err"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-2xl bg-rose-50 px-4 py-3.5 ring-1 ring-rose-200"
            >
              <p className="text-xs font-semibold text-rose-600">Pencarian gagal</p>
              <p className="mt-0.5 text-[11px] text-rose-500">{state.msg}</p>
            </motion.div>
          )}

          {state.status === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <SearchX size={22} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Rujukan tidak ditemukan</p>
                <p className="mt-0.5 text-[10px] text-slate-300">Cek No. Rujukan / Kartu dan pastikan jenis faskes sesuai</p>
              </div>
            </motion.div>
          )}

          {state.status === "found" && (
            <motion.div
              key="found"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3 p-4"
            >
              {state.results.map((item, i) => (
                <RujukanResultCard key={item.noRujukan} item={item} index={i} />
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
