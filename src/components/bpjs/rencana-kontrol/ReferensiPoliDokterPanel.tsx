"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPoliRK, getDokterRK } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { PoliRKSpecItem, DokterRKSpecItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import { errMsg, POLI_RK_OPTIONS } from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

type SubTab = "poli" | "dokter";

type PoliState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: PoliRKSpecItem[] }
  | { status: "error"; msg: string };

type DokterState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: DokterRKSpecItem[] }
  | { status: "error"; msg: string };

// ── Jns Kontrol toggle ─────────────────────────────────

function JnsKontrolToggle({
  value,
  onChange,
}: {
  value: "1" | "2";
  onChange: (v: "1" | "2") => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5">
      {(["1","2"] as const).map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg px-3 py-1 text-[11px] font-bold transition-all",
            value === opt ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
          )}>
          {opt === "1" ? "SPRI" : "RK Kontrol"}
        </button>
      ))}
    </div>
  );
}

// ── Poli panel ─────────────────────────────────────────

function PoliPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [jns, setJns] = useState<"1" | "2">("2");
  const [nomor, setNomor] = useState("SEP-2026-0510-00033");
  const [tglRencana, setTglRencana] = useState(today);
  const [state, setState] = useState<PoliState>({ status: "idle" });

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomor.trim() || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await getPoliRK(jns, nomor.trim(), tglRencana);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "loaded", list: res.value.response ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [jns, nomor, tglRencana, state.status]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Jenis Kontrol</span>
            <JnsKontrolToggle value={jns} onChange={setJns} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">
              {jns === "1" ? "No. Kartu" : "No. SEP"}
            </span>
            <input type="text" value={nomor} onChange={(e) => setNomor(e.target.value)}
              placeholder={jns === "1" ? "13 digit…" : "SEP-…"}
              className="w-52 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Tgl Rencana</span>
            <input type="date" value={tglRencana} onChange={(e) => setTglRencana(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <button type="submit" disabled={!nomor.trim() || state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {state.status === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} strokeWidth={2.5} />}
            Ambil Poli
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-14 text-center">
              <BookOpen size={20} className="text-slate-200" strokeWidth={1.5} />
              <p className="text-xs text-slate-400">Ambil daftar poli tersedia untuk RK</p>
            </motion.div>
          )}
          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-violet-400" />
              Memuat data poli…
            </motion.div>
          )}
          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{state.msg}</motion.p>
          )}
          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <p className="py-14 text-center text-xs text-slate-400">Tidak ada poli tersedia.</p>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
                    <tr>
                      {["Kode Poli","Nama Poli","Kapasitas","Terisi","Utilisasi"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.list.map((item, i) => {
                      const pct = parseFloat(item.persentase);
                      const pctColor = pct >= 80 ? "bg-rose-400" : pct >= 50 ? "bg-amber-400" : "bg-emerald-400";
                      return (
                        <motion.tr key={item.kodePoli}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-mono text-[10px] font-bold text-violet-700">{item.kodePoli}</td>
                          <td className="px-3 py-2 text-[11px] font-semibold text-slate-700">{item.namaPoli}</td>
                          <td className="px-3 py-2 text-center text-[11px] text-slate-600">{item.kapasitas}</td>
                          <td className="px-3 py-2 text-center text-[11px] text-slate-600">{item.jmlRencanaKontroldanRujukan}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                <div className={cn("h-full rounded-full", pctColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500">{item.persentase}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Dokter panel ───────────────────────────────────────

function DokterPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [jns, setJns] = useState<"1" | "2">("2");
  const [kdPoli, setKdPoli] = useState(POLI_RK_OPTIONS[6].kode);
  const [tglRencana, setTglRencana] = useState(today);
  const [state, setState] = useState<DokterState>({ status: "idle" });

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kdPoli || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await getDokterRK(jns, kdPoli, tglRencana);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "loaded", list: res.value.response ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [jns, kdPoli, tglRencana, state.status]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Jenis Kontrol</span>
            <JnsKontrolToggle value={jns} onChange={setJns} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Poli</span>
            <select value={kdPoli} onChange={(e) => setKdPoli(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100">
              {POLI_RK_OPTIONS.map((p) => <option key={p.kode} value={p.kode}>{p.kode} · {p.nama}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500">Tgl Rencana</span>
            <input type="date" value={tglRencana} onChange={(e) => setTglRencana(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <button type="submit" disabled={state.status === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {state.status === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} strokeWidth={2.5} />}
            Ambil Dokter
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-14 text-center">
              <BookOpen size={20} className="text-slate-200" strokeWidth={1.5} />
              <p className="text-xs text-slate-400">Pilih poli & tgl rencana untuk melihat jadwal dokter</p>
            </motion.div>
          )}
          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-violet-400" />
              Memuat jadwal dokter…
            </motion.div>
          )}
          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{state.msg}</motion.p>
          )}
          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <p className="py-14 text-center text-xs text-slate-400">Tidak ada dokter tersedia untuk poli ini.</p>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
                    <tr>
                      {["Kode Dokter","Nama Dokter","Jadwal Praktek","Kapasitas"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.list.map((item, i) => (
                      <motion.tr key={item.kodeDokter}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-mono text-[10px] font-bold text-violet-600">{item.kodeDokter}</td>
                        <td className="px-3 py-2 text-[11px] font-semibold text-slate-800">{item.namaDokter}</td>
                        <td className="px-3 py-2 text-[11px] text-slate-600">{item.jadwalPraktek}</td>
                        <td className="px-3 py-2 text-center text-[11px] text-slate-600">{item.kapasitas}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Orchestrator ───────────────────────────────────────

const SUB_ORDER: Record<SubTab, number> = { poli: 0, dokter: 1 };

export default function ReferensiPoliDokterPanel() {
  const [tab, setTab] = useState<SubTab>("poli");
  const [prev, setPrev] = useState<SubTab>("poli");

  function switchTab(next: SubTab) {
    if (next === tab) return;
    setPrev(tab);
    setTab(next);
  }

  const dir = SUB_ORDER[tab] > SUB_ORDER[prev] ? 8 : -8;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-1 border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        {(["poli","dokter"] as const).map((t) => (
          <button key={t} type="button" onClick={() => switchTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
              tab === t
                ? "bg-white text-violet-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}>
            {t === "poli" ? "Data Poli" : "Jadwal Dokter"}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "poli" && (
            <motion.div key="poli" initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col">
              <PoliPanel />
            </motion.div>
          )}
          {tab === "dokter" && (
            <motion.div key="dokter" initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col">
              <DokterPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
