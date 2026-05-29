"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, FileText, CalendarDays, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNoSuratKontrol } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { RKDetailRecord, BPJSError } from "@/lib/bpjs/bpjsShared";
import { PRB_LABELS } from "@/lib/bpjs/bpjsShared";
import { fmtDate, errMsg, jnsKontrolChipCls, jnsKontrolLabel, SAMPLE_SURAT_NOS } from "./rencanaKontrolShared";
import { PRBDisplay } from "./PRBFormFields";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; record: RKDetailRecord }
  | { status: "error"; msg: string };

// ── Sub-sections ───────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={cn("text-[11px] font-semibold text-slate-700", mono && "font-mono text-[10px]")}>
        {value || "—"}
      </p>
    </div>
  );
}

function RKDetailView({ record }: { record: RKDetailRecord }) {
  const isSPRI = record.jnsKontrol === "1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Header card */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-violet-700">{record.noSuratKontrol}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", jnsKontrolChipCls(record.jnsKontrol))}>
            {jnsKontrolLabel(record.jnsKontrol)}
          </span>
          {record.flagKontrol === "True" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              Flag Kontrol
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <CalendarDays size={10} />
            Rencana: {fmtDate(record.tglRencanaKontrol)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Poli & Dokter</SectionLabel>
            <p className="text-xs font-bold text-slate-800">{record.namaPoliTujuan}</p>
            <p className="mt-0.5 text-[10px] font-mono text-slate-400">{record.poliTujuan}</p>
            <p className="mt-1 text-[11px] text-slate-600">{record.namaDokter}</p>
            <p className="font-mono text-[10px] text-slate-400">{record.kodeDokter}</p>
          </div>
          <div>
            <SectionLabel>Audit</SectionLabel>
            <InfoRow label="Tgl Terbit" value={fmtDate(record.tglTerbit)} />
            <InfoRow label="Jenis" value={record.namaJnsKontrol} />
            <InfoRow label="Pembuat" value={record.namaDokterPembuat} />
          </div>
        </div>
      </div>

      {/* SEP section (conditional) */}
      {!isSPRI && record.sep && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <SectionLabel>Data SEP Asal</SectionLabel>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-slate-700">{record.sep.noSep}</span>
            <span className="text-[10px] text-slate-400">{record.sep.jnsPelayanan}</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <CalendarDays size={9} />
              {fmtDate(record.sep.tglSep)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-400">Diagnosa & Poli</p>
              <p className="mt-0.5 rounded-lg bg-teal-50 px-2 py-1 font-mono text-[10px] font-bold text-teal-700">
                {record.sep.diagnosa}
              </p>
              <p className="mt-1 text-[10px] text-slate-600">{record.sep.poli}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Peserta</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-800">{record.sep.peserta.nama}</p>
              <p className="font-mono text-[10px] text-slate-400">{record.sep.peserta.noKartu}</p>
            </div>
          </div>
          {record.sep.provPerujuk.noRujukan && (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-400">
              <ArrowRight size={9} />
              No. Rujukan:
              <span className="font-mono text-slate-600">{record.sep.provPerujuk.noRujukan}</span>
            </div>
          )}
        </div>
      )}

      {/* PRB section */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <SectionLabel>
          Data PRB{record.formPRB.kdStatusPRB ? ` — ${PRB_LABELS[record.formPRB.kdStatusPRB]}` : ""}
        </SectionLabel>
        <PRBDisplay kode={record.formPRB.kdStatusPRB} data={record.formPRB.data} />
      </div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────

export default function CariNoSuratPanel() {
  const [noSurat, setNoSurat] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(async (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    const q = noSurat.trim();
    if (!q || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await getNoSuratKontrol(q);
      if (!res.ok) {
        setState({ status: "error", msg: errMsg(res.error as BPJSError) });
        return;
      }
      const record = res.value.response;
      if (!record) { setState({ status: "error", msg: "Data tidak ditemukan." }); return; }
      setState({ status: "loaded", record });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [noSurat, state.status]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-600">No. Surat</label>
            <input
              type="text"
              value={noSurat}
              onChange={(e) => setNoSurat(e.target.value)}
              placeholder="RK/… atau SPRI/…"
              className="w-52 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <button
            type="submit"
            disabled={!noSurat.trim() || state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300">Sample:</span>
            {SAMPLE_SURAT_NOS.map((s) => (
              <button key={s} type="button" onClick={() => setNoSurat(s)}
                className={cn(
                  "rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                  noSurat === s ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600",
                )}>
                {s.split("/").slice(-1)[0]}
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
                <FileText size={20} className="text-violet-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-slate-400">Masukkan No. Surat Kontrol</p>
              <p className="text-[10px] text-slate-300">RK/…/… atau SPRI/…/…</p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-violet-400" />
              Memuat detail surat kontrol…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
              {state.msg}
            </motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RKDetailView record={state.record} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
