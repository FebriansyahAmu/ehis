"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteRK } from "@/lib/bpjs/vClaimRencanaKontrol";
import { findRKByNoSurat } from "@/lib/bpjs/mock/rencanaKontrolMock";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { errMsg, statusChipCls, SAMPLE_SURAT_NOS } from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; noSurat: string }
  | { status: "error"; msg: string };

const DEFAULT_USER = "operator.bpjs@rs-sakti.id";

const inputCls = "rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100";

export default function HapusRKPanel() {
  const [noSurat, setNoSurat] = useState("");
  const [alasan, setAlasan] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const trimmed = noSurat.trim();
  const rk = trimmed ? findRKByNoSurat(trimmed) : undefined;
  const isUsed = rk?.status === "Used";
  const alasanOk = alasan.trim().length >= 10;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || isUsed || !alasanOk || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await deleteRK(trimmed, DEFAULT_USER);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "success", noSurat: trimmed });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [trimmed, isUsed, alasanOk, state.status]);

  if (state.status === "success") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <p className="text-sm font-bold text-slate-800">Surat kontrol berhasil dihapus</p>
        <p className="font-mono text-xs text-slate-400">{state.noSurat}</p>
        <button
          type="button"
          onClick={() => { setState({ status: "idle" }); setNoSurat(""); setAlasan(""); }}
          className="mt-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
        >
          Hapus Surat Lain
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          {/* Warning banner */}
          <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-400" />
            <div>
              <p className="text-[11px] font-bold text-rose-700">Tindakan tidak dapat dibatalkan</p>
              <p className="mt-0.5 text-[10px] text-rose-500">
                Hapus RK/SPRI akan menonaktifkan surat kontrol ini. Catat alasan untuk kepatuhan UU PDP 27/2022.
              </p>
            </div>
          </div>

          {/* Input no surat */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-600">
              No. Surat Kontrol <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={noSurat}
              onChange={(e) => setNoSurat(e.target.value)}
              placeholder="RK/… atau SPRI/…"
              className={cn(inputCls, "w-full font-mono")}
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {SAMPLE_SURAT_NOS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNoSurat(s)}
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                    noSurat === s ? "bg-rose-100 text-rose-700" : "text-slate-300 hover:text-slate-500",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Status lookup */}
          <AnimatePresence>
            {rk && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-700">{rk.poli.nama}</p>
                  <p className="text-[10px] text-slate-400">dr. {rk.dokter.nama} · {rk.jenis}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold", statusChipCls(rk.status))}>
                  {rk.status}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Used guard */}
          <AnimatePresence>
            {isUsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700"
              >
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                Surat kontrol sudah digunakan (status Used). Tidak dapat dihapus.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alasan */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-600">
              Alasan Penghapusan <span className="text-rose-400">*</span>
              <span className="ml-1 font-normal text-slate-400">(min. 10 karakter)</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan penghapusan…"
              className={cn(
                "w-full resize-none rounded-xl border bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2",
                alasan.length > 0 && !alasanOk
                  ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                  : "border-slate-200 focus:border-rose-300 focus:ring-rose-100",
              )}
            />
            <p className={cn("text-right text-[9px]", alasanOk ? "text-slate-300" : "text-rose-400")}>
              {alasan.trim().length}/10 karakter minimum
            </p>
          </div>

          {state.status === "error" && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
              {state.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={!trimmed || isUsed || !alasanOk || state.status === "loading"}
            className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-rose-200/60 transition-all hover:bg-rose-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Hapus Surat Kontrol
          </button>
        </form>
      </div>
    </div>
  );
}
