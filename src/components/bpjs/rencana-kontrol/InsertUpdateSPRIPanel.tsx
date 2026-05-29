"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertSPRI, updateSPRI, getNoSuratKontrol } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, SAMPLE_KARTU_RK, SAMPLE_SURAT_NOS,
  POLI_RK_OPTIONS, DOKTER_RK_OPTIONS,
} from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

type Mode = "insert" | "update";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; noSPRI: string }
  | { status: "error"; msg: string };

const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_USER = "operator.bpjs@rs-sakti.id";

const inputCls = "rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400";

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-slate-600">
        {label}{required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

// ── Insert SPRI ────────────────────────────────────────

function InsertSPRIForm() {
  const [noKartu, setNoKartu] = useState("");
  const [tgl, setTgl] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [poli, setPoli] = useState(POLI_RK_OPTIONS[6].kode);
  const [dokter, setDokter] = useState(DOKTER_RK_OPTIONS[0].kode);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{13}$/.test(noKartu) || state.status === "loading") return;
    if (tgl < TODAY) { setState({ status: "error", msg: "Tgl SPRI harus >= hari ini." }); return; }
    setState({ status: "loading" });
    try {
      const res = await insertSPRI({
        noKartu,
        kodeDokter: dokter,
        poliKontrol: poli,
        tglRencanaKontrol: tgl,
        user: DEFAULT_USER,
      });
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setState({ status: "success", noSPRI: res.value.response?.noSPRI ?? "" });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [noKartu, tgl, poli, dokter, state.status]);

  if (state.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-12 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">SPRI berhasil dibuat</p>
          <p className="mt-1 font-mono text-xs text-sky-600">{state.noSPRI}</p>
        </div>
        <button type="button" onClick={() => setState({ status: "idle" })}
          className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-100">
          <RefreshCw size={11} />
          Buat SPRI Lain
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Data SPRI — tanpa PRB Form
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="No. Kartu Peserta" required>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={noKartu}
                maxLength={13}
                placeholder="13 digit…"
                onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
                className={cn(
                  inputCls, "font-mono",
                  noKartu.length > 0 && noKartu.length !== 13 && "border-rose-300 focus:border-rose-300 focus:ring-rose-100",
                )}
              />
              <div className="flex gap-1">
                {SAMPLE_KARTU_RK.map((k) => (
                  <button key={k} type="button" onClick={() => setNoKartu(k)}
                    className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                      noKartu === k ? "bg-sky-100 text-sky-700" : "text-slate-300 hover:text-slate-500")}>
                    {k.slice(-4)}
                  </button>
                ))}
              </div>
            </div>
          </FieldRow>

          <FieldRow label="Tgl Rencana SPRI" required>
            <input type="date" value={tgl} min={TODAY} onChange={(e) => setTgl(e.target.value)} className={inputCls} />
          </FieldRow>

          <FieldRow label="Poli Tujuan" required>
            <select value={poli} onChange={(e) => setPoli(e.target.value)} className={inputCls}>
              {POLI_RK_OPTIONS.map((p) => <option key={p.kode} value={p.kode}>{p.kode} · {p.nama}</option>)}
            </select>
          </FieldRow>

          <FieldRow label="Dokter" required>
            <select value={dokter} onChange={(e) => setDokter(e.target.value)} className={inputCls}>
              {DOKTER_RK_OPTIONS.map((d) => <option key={d.kode} value={d.kode}>{d.nama}</option>)}
            </select>
          </FieldRow>
        </div>

        <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-[10px] text-sky-600">
          SPRI = Surat Perintah Rawat Inap — untuk admisi elektif tanpa kunjungan RJ sebelumnya. Tidak memerlukan PRB Form.
        </div>
      </FormSection>

      {state.status === "error" && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{state.msg}</p>
      )}

      <button
        type="submit"
        disabled={!/^\d{13}$/.test(noKartu) || state.status === "loading"}
        className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-sky-200/60 transition-all hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Buat SPRI
      </button>
    </form>
  );
}

// ── Update SPRI ────────────────────────────────────────

function UpdateSPRIForm() {
  const [noSPRI, setNoSPRI] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const [tgl, setTgl] = useState("");
  const [poli, setPoli] = useState(POLI_RK_OPTIONS[6].kode);
  const [dokter, setDokter] = useState(DOKTER_RK_OPTIONS[0].kode);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const SPRI_SAMPLES = SAMPLE_SURAT_NOS.filter((s) => s.startsWith("SPRI"));

  const handleFetch = useCallback(async () => {
    if (!noSPRI.trim() || fetching) return;
    setFetching(true);
    setFetchErr("");
    try {
      const res = await getNoSuratKontrol(noSPRI.trim());
      if (!res.ok) { setFetchErr(errMsg(res.error as BPJSError)); setFetching(false); return; }
      const d = res.value.response;
      if (!d) { setFetchErr("SPRI tidak ditemukan."); setFetching(false); return; }
      setTgl(d.tglRencanaKontrol);
      const mp = POLI_RK_OPTIONS.find((p) => p.kode === d.poliTujuan);
      if (mp) setPoli(mp.kode);
      const md = DOKTER_RK_OPTIONS.find((dk) => dk.kode === d.kodeDokter);
      if (md) setDokter(md.kode);
      setPrefilled(true);
    } catch {
      setFetchErr("Koneksi gagal.");
    }
    setFetching(false);
  }, [noSPRI, fetching]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSPRI.trim() || submitState.status === "loading") return;
    setSubmitState({ status: "loading" });
    try {
      const res = await updateSPRI({
        noSPRI: noSPRI.trim(),
        kodeDokter: dokter,
        poliKontrol: poli,
        tglRencanaKontrol: tgl,
        user: DEFAULT_USER,
      });
      if (!res.ok) { setSubmitState({ status: "error", msg: errMsg(res.error as BPJSError) }); return; }
      setSubmitState({ status: "success", noSPRI: noSPRI.trim() });
    } catch {
      setSubmitState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }, [noSPRI, tgl, poli, dokter, submitState.status]);

  if (submitState.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-12 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">SPRI berhasil di-update</p>
          <p className="mt-1 font-mono text-xs text-sky-600">{submitState.noSPRI}</p>
        </div>
        <button type="button"
          onClick={() => { setSubmitState({ status: "idle" }); setNoSPRI(""); setPrefilled(false); }}
          className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-100">
          <RefreshCw size={11} /> Update SPRI Lain
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <FormSection>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">No. SPRI</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <input type="text" value={noSPRI} onChange={(e) => { setNoSPRI(e.target.value); setPrefilled(false); }}
              placeholder="SPRI/…" className={cn(inputCls, "font-mono")} />
            <div className="flex gap-1">
              {SPRI_SAMPLES.map((s) => (
                <button key={s} type="button" onClick={() => { setNoSPRI(s); setPrefilled(false); }}
                  className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                    noSPRI === s ? "bg-sky-100 text-sky-700" : "text-slate-300 hover:text-slate-500")}>{s}</button>
              ))}
            </div>
          </div>
          <button type="button" disabled={!noSPRI.trim() || fetching} onClick={handleFetch}
            className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50">
            {fetching ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
            Ambil Data
          </button>
        </div>
        {fetchErr && <p className="mt-1.5 text-xs text-rose-500">{fetchErr}</p>}
      </FormSection>

      <AnimatePresence>
        {prefilled && (
          <motion.form
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <FormSection>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Edit Data SPRI</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Tgl Rencana SPRI" required>
                  <input type="date" value={tgl} min={TODAY} onChange={(e) => setTgl(e.target.value)} className={inputCls} />
                </FieldRow>
                <FieldRow label="Poli Tujuan" required>
                  <select value={poli} onChange={(e) => setPoli(e.target.value)} className={inputCls}>
                    {POLI_RK_OPTIONS.map((p) => <option key={p.kode} value={p.kode}>{p.kode} · {p.nama}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Dokter" required>
                  <select value={dokter} onChange={(e) => setDokter(e.target.value)} className={inputCls}>
                    {DOKTER_RK_OPTIONS.map((d) => <option key={d.kode} value={d.kode}>{d.nama}</option>)}
                  </select>
                </FieldRow>
              </div>
            </FormSection>

            {submitState.status === "error" && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">{submitState.msg}</p>
            )}

            <button type="submit" disabled={submitState.status === "loading"}
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-sky-200/60 transition-all hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
              {submitState.status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Simpan Perubahan SPRI
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Orchestrator ───────────────────────────────────────

export default function InsertUpdateSPRIPanel() {
  const [mode, setMode] = useState<Mode>("insert");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40 px-4 py-3">
        <div className="flex w-fit gap-0.5 rounded-xl bg-slate-100 p-0.5">
          {(["insert","update"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all",
                mode === m ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}>
              {m === "insert" ? "Insert SPRI Baru" : "Update SPRI"}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "insert" ? (
            <motion.div key="insert" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}>
              <InsertSPRIForm />
            </motion.div>
          ) : (
            <motion.div key="update" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}>
              <UpdateSPRIForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
