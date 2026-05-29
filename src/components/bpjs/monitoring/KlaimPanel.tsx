"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CalendarDays, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringKlaim } from "@/lib/bpjs/vClaimMonitoring";
import type {
  KlaimMonitoringItem,
  JnsPelayananKode,
  KlaimMonitoringStatusKode,
  BPJSError,
} from "@/lib/bpjs/bpjsShared";
import { KLAIM_MONITORING_STATUS_LABEL } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, fmtRupiah, kelasChipCls, statusKlaimChipCls, today,
  SAMPLE_KUNJUNGAN_DATES,
} from "./monitoringShared";

// ── Types ──────────────────────────────────────────────

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "loaded";
      list: KlaimMonitoringItem[];
      tgl: string;
      statusKode: KlaimMonitoringStatusKode;
      totalTagih: number;
      totalSetuju: number;
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

function StatusToggle({
  value,
  onChange,
}: {
  value: KlaimMonitoringStatusKode;
  onChange: (v: KlaimMonitoringStatusKode) => void;
}) {
  const OPTS: { kode: KlaimMonitoringStatusKode; cls: string; activeCls: string }[] = [
    { kode: "1", cls: "text-slate-500", activeCls: "bg-white text-amber-700 shadow-sm" },
    { kode: "2", cls: "text-slate-500", activeCls: "bg-white text-orange-700 shadow-sm" },
    { kode: "3", cls: "text-slate-500", activeCls: "bg-white text-emerald-700 shadow-sm" },
  ];
  return (
    <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5">
      {OPTS.map(({ kode, cls, activeCls }) => (
        <button
          key={kode}
          type="button"
          onClick={() => onChange(kode)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all",
            value === kode ? activeCls : cls,
          )}
        >
          {KLAIM_MONITORING_STATUS_LABEL[kode]}
        </button>
      ))}
    </div>
  );
}

function BiayaCell({ biaya }: { biaya: KlaimMonitoringItem["biaya"] }) {
  return (
    <div className="min-w-32 space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] text-slate-400">Tagih</span>
        <span className="font-mono text-[10px] text-slate-700">
          {fmtRupiah(biaya.byPengajuan)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] text-slate-400">Setuju</span>
        <span className={cn("font-mono text-[10px]",
          Number(biaya.bySetujui) > 0 ? "text-emerald-600" : "text-slate-300"
        )}>
          {fmtRupiah(biaya.bySetujui)}
        </span>
      </div>
      {Number(biaya.byTopup) > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] text-amber-400">Topup</span>
          <span className="font-mono text-[10px] text-amber-600">
            +{fmtRupiah(biaya.byTopup)}
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-2.5 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
        <MousePointerClick size={20} className="text-amber-200" strokeWidth={1.5} />
      </div>
      <p className="text-xs font-medium text-slate-400">Pilih tanggal pulang & status klaim</p>
      <p className="text-[10px] text-slate-300">Klik Cari untuk menampilkan data klaim</p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────

export default function KlaimPanel() {
  const [tglPulang, setTglPulang] = useState("2026-05-01");
  const [jns, setJns] = useState<JnsPelayananKode>("1");
  const [statusKode, setStatusKode] = useState<KlaimMonitoringStatusKode>("2");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (state.status === "loading") return;
      setState({ status: "loading" });
      try {
        const res = await monitoringKlaim(tglPulang, jns, statusKode);
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const list = res.value.response ?? [];
        const totalTagih  = list.reduce((s, k) => s + Number(k.biaya.byPengajuan), 0);
        const totalSetuju = list.reduce((s, k) => s + Number(k.biaya.bySetujui), 0);
        setState({ status: "loaded", list, tgl: tglPulang, statusKode, totalTagih, totalSetuju });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [tglPulang, jns, statusKode, state.status],
  );

  const approvalPct =
    state.status === "loaded" && state.totalTagih > 0
      ? Math.round((state.totalSetuju / state.totalTagih) * 100)
      : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={13} className="text-amber-500" strokeWidth={2} />
            <span className="text-[11px] font-semibold text-slate-600">Tgl Pulang</span>
            <input
              type="date"
              value={tglPulang}
              max={today()}
              onChange={(e) => setTglPulang(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <JnsToggle value={jns} onChange={setJns} />
          <StatusToggle value={statusKode} onChange={setStatusKode} />

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

          {/* Dev sample dates */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300">Sample:</span>
            {SAMPLE_KUNJUNGAN_DATES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTglPulang(d)}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors",
                  tglPulang === d ? "bg-amber-100 text-amber-700" : "text-slate-400 hover:text-slate-600",
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
              Memuat data klaim…
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
                    Tidak ada klaim "{KLAIM_MONITORING_STATUS_LABEL[state.statusKode]}" pada {fmtDate(state.tgl)}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-250 text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["No. SEP", "Peserta", "INA-CBG / Grouper", "Poli", "Kelas", "Biaya", "No. FPK", "Status", "Tgl Pulang"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.list.map((item, i) => (
                        <motion.tr
                          key={item.noSEP}
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.13, delay: i * 0.03 }}
                          className="border-b border-slate-50 last:border-0 align-top transition-colors hover:bg-amber-50/20"
                        >
                          <td className="py-2.5 pl-4 pr-3 font-mono text-[10px] font-semibold text-slate-700">
                            {item.noSEP}
                          </td>
                          <td className="py-2.5 pr-3">
                            <p className="text-xs font-semibold text-slate-800">{item.peserta.nama}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.peserta.noKartu}</p>
                            {item.peserta.noMR && (
                              <p className="text-[9px] text-slate-300">MR: {item.peserta.noMR}</p>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span
                              className="cursor-default rounded-lg bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-700 ring-1 ring-violet-200/60"
                              title={item.Inacbg.nama}
                            >
                              {item.Inacbg.kode}
                            </span>
                            <p className="mt-1 max-w-36 truncate text-[9px] text-slate-400" title={item.Inacbg.nama}>
                              {item.Inacbg.nama}
                            </p>
                          </td>
                          <td className="py-2.5 pr-3 text-[11px] text-slate-600">{item.poli}</td>
                          <td className="py-2.5 pr-3">
                            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", kelasChipCls(item.kelasRawat))}>
                              Kls {item.kelasRawat}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <BiayaCell biaya={item.biaya} />
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[10px] text-slate-500">
                            {item.noFPK || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusKlaimChipCls(item.status))}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-[11px] text-slate-500">
                            {fmtDate(item.tglPulang)}
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
        <div className="shrink-0 border-t border-slate-100 bg-amber-50/60 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-4 text-[10px]">
            <span className="font-bold text-amber-700">{state.list.length} klaim</span>
            <span className="text-slate-500">
              Total Tagih: <span className="font-semibold text-slate-700">{fmtRupiah(String(state.totalTagih))}</span>
            </span>
            <span className="text-slate-500">
              Disetujui: <span className="font-semibold text-emerald-700">{fmtRupiah(String(state.totalSetuju))}</span>
            </span>
            <span className="text-slate-500">
              Selisih: <span className="font-semibold text-rose-600">{fmtRupiah(String(state.totalTagih - state.totalSetuju))}</span>
            </span>
            <span className={cn("ml-auto rounded-full px-2.5 py-0.5 font-bold",
              approvalPct >= 80 ? "bg-emerald-100 text-emerald-700"
                : approvalPct >= 50 ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            )}>
              {approvalPct}% approval
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
