"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, FileSearch, CalendarDays, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSEPUntukRK } from "@/lib/bpjs/vClaimRencanaKontrol";
import { findRKsBySEP } from "@/lib/bpjs/mock/rencanaKontrolMock";
import type { SEPUntukRKRecord, BPJSError } from "@/lib/bpjs/bpjsShared";
import { fmtDate, errMsg, statusChipCls, jnsKontrolLabel, SAMPLE_SEP_NOS } from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; record: SEPUntukRKRecord; noSEP: string }
  | { status: "error"; msg: string };

// ── Detail sections ────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <p className="shrink-0 text-[10px] text-slate-400">{label}</p>
      <p className={cn("text-right text-[11px] font-semibold text-slate-700", mono && "font-mono text-[10px]")}>
        {value || "—"}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

function SEPRKDetail({ record, noSEP }: { record: SEPUntukRKRecord; noSEP: string }) {
  const linkedRKs = findRKsBySEP(noSEP);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* SEP header */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-violet-700">{record.noSep}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {record.jnsPelayanan}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <CalendarDays size={10} />
            {fmtDate(record.tglSep)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Diagnosa & Poli</SectionLabel>
            <p className="rounded-lg bg-teal-50 px-2 py-1 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200/60">
              {record.diagnosa}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-600">{record.poli}</p>
          </div>
          <div>
            <SectionLabel>Peserta</SectionLabel>
            <p className="text-xs font-bold text-slate-800">{record.peserta.nama}</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{record.peserta.noKartu}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Kelas: <span className="font-semibold text-slate-600">{record.peserta.hakKelas}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 border-t border-violet-100 pt-3">
          <div>
            <SectionLabel>FKTP (Prov Umum)</SectionLabel>
            <p className="text-[11px] font-semibold text-slate-700">{record.provUmum.nmProvider}</p>
            <p className="font-mono text-[10px] text-slate-400">{record.provUmum.kdProvider}</p>
          </div>
          <div>
            <SectionLabel>Perujuk</SectionLabel>
            <p className="text-[11px] font-semibold text-slate-700">{record.provPerujuk.nmProviderPerujuk || "—"}</p>
            {record.provPerujuk.noRujukan && (
              <InfoRow label="No. Rujukan" value={record.provPerujuk.noRujukan} mono />
            )}
          </div>
        </div>
      </div>

      {/* Linked RK */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <SectionLabel>
          Rencana Kontrol Terkait ({linkedRKs.length})
        </SectionLabel>
        {linkedRKs.length === 0 ? (
          <p className="text-[11px] text-slate-400">Belum ada RK untuk SEP ini.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedRKs.map((rk) => (
              <div key={rk.noSurat} className="flex items-center gap-2">
                <CheckCircle size={11} className="shrink-0 text-emerald-500" />
                <span className="font-mono text-[11px] font-semibold text-slate-700">{rk.noSurat}</span>
                <ChevronRight size={9} className="text-slate-300" />
                <span className="text-[10px] text-slate-500">{fmtDate(rk.tglRencana)} · {rk.poli.nama}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold", statusChipCls(rk.status))}>
                  {rk.status}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500")}>
                  {jnsKontrolLabel(rk.tipeKontrol)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────

export default function CariSEPRKPanel() {
  const [noSEP, setNoSEP] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      const q = noSEP.trim();
      if (!q || state.status === "loading") return;
      setState({ status: "loading" });
      try {
        const res = await getSEPUntukRK(q);
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const record = res.value.response;
        if (!record) {
          setState({ status: "error", msg: "SEP tidak ditemukan." });
          return;
        }
        setState({ status: "loaded", record, noSEP: q });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [noSEP, state.status],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-600">No. SEP</label>
            <input
              type="text"
              value={noSEP}
              onChange={(e) => setNoSEP(e.target.value)}
              placeholder="SEP-…"
              className="w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <button
            type="submit"
            disabled={!noSEP.trim() || state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300">Sample:</span>
            {SAMPLE_SEP_NOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNoSEP(s)}
                className={cn(
                  "rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                  noSEP === s ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600",
                )}
              >
                {s.slice(-8)}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5 py-14 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
                <FileSearch size={20} className="text-violet-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-slate-400">Masukkan No. SEP untuk melihat detail RK</p>
              <p className="text-[10px] text-slate-300">
                Endpoint: <span className="font-mono">/RencanaKontrol/nosep/{"{noSEP}"}</span>
              </p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"
            >
              <Loader2 size={14} className="animate-spin text-violet-400" />
              Memuat data SEP untuk RK…
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
              <SEPRKDetail record={state.record} noSEP={state.noSEP} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
