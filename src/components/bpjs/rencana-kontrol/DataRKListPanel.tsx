"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Download, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { listRKByKartu, listRKFiltered } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { RKListByKartuItem, RKListPeriodeItem, RKListFilterMode, BPJSError } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, jnsKontrolChipCls, jnsKontrolLabel,
  terbitSEPChipCls, exportCsv, SAMPLE_KARTU_RK,
} from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

type SubTab = "kartu" | "periode";

type KartuState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: RKListByKartuItem[]; bulan: string; tahun: string }
  | { status: "error"; msg: string };

type PeriodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: RKListPeriodeItem[]; tglAwal: string; tglAkhir: string }
  | { status: "error"; msg: string };

// ── Shared sub-components ──────────────────────────────

function FilterToggle({
  value,
  onChange,
  accent,
}: {
  value: RKListFilterMode;
  onChange: (v: RKListFilterMode) => void;
  accent: "violet" | "sky";
}) {
  const on = accent === "violet" ? "bg-white text-violet-700 shadow-sm" : "bg-white text-sky-700 shadow-sm";
  return (
    <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5">
      {(["1","2"] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={cn("rounded-lg px-3 py-1 text-[11px] font-bold transition-all",
            value === v ? on : "text-slate-500 hover:text-slate-700")}>
          {v === "1" ? "Tgl Entri" : "Tgl Rencana"}
        </button>
      ))}
    </div>
  );
}

// ── By Kartu ───────────────────────────────────────────

function ByKartuPanel() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [noKartu, setNoKartu] = useState("");
  const [filter, setFilter] = useState<RKListFilterMode>("1");
  const [state, setState] = useState<KartuState>({ status: "idle" });

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{13}$/.test(noKartu) || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await listRKByKartu(bulan, tahun, noKartu, filter);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "loaded", list: res.value.response ?? [], bulan, tahun });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [bulan, tahun, noKartu, filter, state.status]);

  const handleExport = useCallback(() => {
    if (state.status !== "loaded") return;
    const header = ["No. Surat","Jns Pelayanan","Jns Kontrol","Tgl Rencana","Tgl Terbit","No SEP Asal","Poli Asal","Poli Tujuan","Dokter","Terbit SEP"];
    const rows = state.list.map((r) => [
      r.noSuratKontrol, r.jnsPelayanan, r.namaJnsKontrol, r.tglRencanaKontrol,
      r.tglTerbitKontrol, r.noSepAsalKontrol, r.namaPoliAsal, r.namaPoliTujuan, r.namaDokter, r.terbitSEP,
    ]);
    exportCsv([header, ...rows], `rk_by_kartu_${bulan}_${tahun}.csv`);
  }, [state]);

  const BULAN_OPTS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const BULAN_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Bulan / Tahun</span>
            <div className="flex gap-2">
              <select value={bulan} onChange={(e) => setBulan(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100">
                {BULAN_OPTS.map((b, i) => <option key={b} value={b}>{BULAN_LABELS[i]}</option>)}
              </select>
              <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)}
                className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">No. Kartu</span>
            <div className="flex flex-col gap-0.5">
              <input type="text" value={noKartu} maxLength={13} placeholder="13 digit…"
                onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
                className={cn(
                  "w-36 rounded-xl border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2",
                  noKartu.length > 0 && noKartu.length !== 13
                    ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                    : "border-slate-200 focus:border-violet-300 focus:ring-violet-100",
                )}
              />
              <div className="flex gap-1">
                {SAMPLE_KARTU_RK.map((k) => (
                  <button key={k} type="button" onClick={() => setNoKartu(k)}
                    className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                      noKartu === k ? "bg-violet-100 text-violet-700" : "text-slate-300 hover:text-slate-500")}>
                    {k.slice(-4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Mode Filter</span>
            <FilterToggle value={filter} onChange={setFilter} accent="violet" />
          </div>

          <button type="submit"
            disabled={!/^\d{13}$/.test(noKartu) || state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {state.status === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>

          {state.status === "loaded" && state.list.length > 0 && (
            <button type="button" onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50">
              <Download size={11} />
              CSV
            </button>
          )}
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {state.status === "idle" && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-300">
            <List size={14} />
            Pilih bulan, tahun, dan kartu untuk menampilkan daftar RK
          </div>
        )}
        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-violet-400" />
            Memuat daftar RK…
          </div>
        )}
        {state.status === "error" && (
          <p className="m-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{state.msg}</p>
        )}
        {state.status === "loaded" && (
          <>
            {state.list.length === 0 ? (
              <p className="py-14 text-center text-xs text-slate-400">Tidak ada data RK pada periode ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
                    <tr>
                      {["No. Surat","Jenis","Tgl Rencana","Tgl Terbit","SEP Asal","Poli Tujuan","Dokter","Terbit SEP"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.list.map((item, i) => (
                      <motion.tr key={item.noSuratKontrol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-mono text-[10px] font-semibold text-violet-700">{item.noSuratKontrol}</td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", jnsKontrolChipCls(item.jnsKontrol))}>
                            {jnsKontrolLabel(item.jnsKontrol)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-slate-600">{fmtDate(item.tglRencanaKontrol)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-slate-400">{fmtDate(item.tglTerbitKontrol)}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.noSepAsalKontrol || "—"}</td>
                        <td className="px-3 py-2 text-[10px] text-slate-600">{item.namaPoliTujuan}</td>
                        <td className="px-3 py-2 text-[10px] text-slate-600">{item.namaDokter}</td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", terbitSEPChipCls(item.terbitSEP))}>
                            {item.terbitSEP}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {state.list.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 bg-violet-50/50 px-4 py-2">
                <p className="text-[10px] font-bold text-violet-700">
                  {state.list.length} data RK · {BULAN_OPTS.find((b) => b === state.bulan) ? state.bulan : ""}/{state.tahun}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── By Periode ─────────────────────────────────────────

function ByPeriodePanel() {
  const [tglAwal, setTglAwal] = useState("2026-05-01");
  const [tglAkhir, setTglAkhir] = useState("2026-05-31");
  const [filter, setFilter] = useState<RKListFilterMode>("1");
  const [state, setState] = useState<PeriodeState>({ status: "idle" });

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tglAwal || !tglAkhir || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await listRKFiltered(tglAwal, tglAkhir, filter);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "loaded", list: res.value.response ?? [], tglAwal, tglAkhir });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [tglAwal, tglAkhir, filter, state.status]);

  const handleExport = useCallback(() => {
    if (state.status !== "loaded") return;
    const header = ["No. Surat","Jns Pelayanan","Jns Kontrol","Tgl Rencana","Tgl Terbit","No SEP Asal","Poli Asal","Poli Tujuan","Dokter","No. Kartu"];
    const rows = state.list.map((r) => [
      r.noSuratKontrol, r.jnsPelayanan, r.namaJnsKontrol, r.tglRencanaKontrol,
      r.tglTerbitKontrol, r.noSepAsalKontrol, r.namaPoliAsal, r.namaPoliTujuan, r.namaDokter, r.noKartu,
    ]);
    exportCsv([header, ...rows], `rk_periode_${tglAwal}_${tglAkhir}.csv`);
  }, [state, tglAwal, tglAkhir]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Periode</span>
            <div className="flex items-center gap-2">
              <input type="date" value={tglAwal} max={tglAkhir} onChange={(e) => setTglAwal(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100" />
              <span className="text-[10px] text-slate-400">s/d</span>
              <input type="date" value={tglAkhir} min={tglAwal} onChange={(e) => setTglAkhir(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Mode Filter</span>
            <FilterToggle value={filter} onChange={setFilter} accent="sky" />
          </div>

          <button type="submit" disabled={!tglAwal || !tglAkhir || state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-sky-200/60 transition-all hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {state.status === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} strokeWidth={2.5} />}
            Cari
          </button>

          {state.status === "loaded" && state.list.length > 0 && (
            <button type="button" onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50">
              <Download size={11} />
              CSV
            </button>
          )}
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {state.status === "idle" && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-300">
            <List size={14} />
            Pilih periode untuk menampilkan daftar RK
          </div>
        )}
        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-sky-400" />
            Memuat daftar RK…
          </div>
        )}
        {state.status === "error" && (
          <p className="m-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{state.msg}</p>
        )}
        {state.status === "loaded" && (
          state.list.length === 0 ? (
            <p className="py-14 text-center text-xs text-slate-400">Tidak ada data RK pada periode ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
                  <tr>
                    {["No. Surat","Jenis","Tgl Rencana","SEP Asal","Poli Tujuan","Dokter","No. Kartu"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.list.map((item, i) => (
                    <motion.tr key={item.noSuratKontrol}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono text-[10px] font-semibold text-sky-700">{item.noSuratKontrol}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", jnsKontrolChipCls(item.jnsKontrol))}>
                          {jnsKontrolLabel(item.jnsKontrol)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] text-slate-600">{fmtDate(item.tglRencanaKontrol)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.noSepAsalKontrol || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-600">{item.namaPoliTujuan}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-600">{item.namaDokter}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.noKartu || "—"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-100 bg-sky-50/50 px-4 py-2">
                <p className="text-[10px] font-bold text-sky-700">
                  {state.list.length} data RK · {fmtDate(state.tglAwal)} — {fmtDate(state.tglAkhir)}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Orchestrator ───────────────────────────────────────

const SUB_TAB_ORDER: Record<SubTab, number> = { kartu: 0, periode: 1 };

export default function DataRKListPanel() {
  const [tab, setTab] = useState<SubTab>("kartu");
  const [prev, setPrev] = useState<SubTab>("kartu");

  function switchTab(next: SubTab) {
    if (next === tab) return;
    setPrev(tab);
    setTab(next);
  }

  const dir = SUB_TAB_ORDER[tab] > SUB_TAB_ORDER[prev] ? 8 : -8;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="shrink-0 flex items-center gap-1 border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        {(["kartu","periode"] as const).map((t) => (
          <button key={t} type="button" onClick={() => switchTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
              tab === t
                ? "bg-white text-violet-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}>
            {t === "kartu" ? "By No. Kartu" : "By Periode"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "kartu" && (
            <motion.div key="kartu" initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col">
              <ByKartuPanel />
            </motion.div>
          )}
          {tab === "periode" && (
            <motion.div key="periode" initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col">
              <ByPeriodePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
