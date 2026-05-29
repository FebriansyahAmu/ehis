"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertRKV2, updateRKV2, getNoSuratKontrol } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { BPJSError, PRBKodeStatus, PRBFormData } from "@/lib/bpjs/bpjsShared";
import { emptyPRBFormData } from "@/lib/bpjs/bpjsShared";
import {
  errMsg, fmtDate, SAMPLE_SEP_NOS, SAMPLE_SURAT_NOS,
  POLI_RK_OPTIONS, DOKTER_RK_OPTIONS,
} from "./rencanaKontrolShared";
import PRBFormFields from "./PRBFormFields";

// ── Types ──────────────────────────────────────────────

type Mode = "insert" | "update";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; noSurat: string }
  | { status: "error"; msg: string };

const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_USER = "operator.bpjs@rs-sakti.id";

// ── Shared form fields ─────────────────────────────────

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

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

const inputCls = "rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400";

// ── Insert RK panel ────────────────────────────────────

function InsertRKForm() {
  const [noSEP, setNoSEP] = useState("");
  const [tgl, setTgl] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [poli, setPoli] = useState(POLI_RK_OPTIONS[6].kode);
  const [dokter, setDokter] = useState(DOKTER_RK_OPTIONS[0].kode);
  const [kode, setKode] = useState<PRBKodeStatus>("01");
  const [prbData, setPrbData] = useState<PRBFormData>(emptyPRBFormData);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noSEP.trim() || state.status === "loading") return;
      if (tgl < TODAY) { setState({ status: "error", msg: "Tgl rencana harus >= hari ini." }); return; }
      setState({ status: "loading" });
      try {
        const res = await insertRKV2({
          noSEP: noSEP.trim(),
          kodeDokter: dokter,
          poliKontrol: poli,
          tglRencanaKontrol: tgl,
          user: DEFAULT_USER,
          formPRB: { kdStatusPRB: kode, data: prbData },
        });
        if (!res.ok) {
          setState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        const noSurat = res.value.response?.noSurat ?? "";
        setState({ status: "success", noSurat });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [noSEP, tgl, poli, dokter, kode, prbData, state.status],
  );

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
          <p className="text-sm font-bold text-slate-800">Rencana Kontrol berhasil dibuat</p>
          <p className="mt-1 font-mono text-xs text-violet-600">{state.noSurat}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Tgl Rencana: {fmtDate(tgl)}</p>
        </div>
        <button
          type="button"
          onClick={() => { setState({ status: "idle" }); setNoSEP(""); }}
          className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100"
        >
          <RefreshCw size={11} />
          Buat RK Lain
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Header RK</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="No. SEP" required>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={noSEP}
                onChange={(e) => setNoSEP(e.target.value)}
                placeholder="SEP-…"
                className={cn(inputCls, "font-mono")}
              />
              <div className="flex flex-wrap gap-1">
                {SAMPLE_SEP_NOS.map((s) => (
                  <button key={s} type="button" onClick={() => setNoSEP(s)}
                    className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                      noSEP === s ? "bg-violet-100 text-violet-700" : "text-slate-300 hover:text-slate-500")}
                  >
                    {s.slice(-8)}
                  </button>
                ))}
              </div>
            </div>
          </FieldRow>

          <FieldRow label="Tgl Rencana Kontrol" required>
            <input
              type="date"
              value={tgl}
              min={TODAY}
              onChange={(e) => setTgl(e.target.value)}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Poli Kontrol" required>
            <select
              value={poli}
              onChange={(e) => setPoli(e.target.value)}
              className={inputCls}
            >
              {POLI_RK_OPTIONS.map((p) => (
                <option key={p.kode} value={p.kode}>{p.kode} · {p.nama}</option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="Dokter" required>
            <select
              value={dokter}
              onChange={(e) => setDokter(e.target.value)}
              className={inputCls}
            >
              {DOKTER_RK_OPTIONS.map((d) => (
                <option key={d.kode} value={d.kode}>{d.nama}</option>
              ))}
            </select>
          </FieldRow>
        </div>
      </FormSection>

      <FormSection>
        <PRBFormFields
          kode={kode}
          data={prbData}
          onKodeChange={setKode}
          onFieldChange={(f, v) => setPrbData((prev) => ({ ...prev, [f]: v }))}
        />
      </FormSection>

      {state.status === "error" && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
          {state.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={!noSEP.trim() || state.status === "loading"}
        className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Simpan Rencana Kontrol
      </button>
    </form>
  );
}

// ── Update RK panel ────────────────────────────────────

function UpdateRKForm() {
  const [noSurat, setNoSurat] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  const [noSEP, setNoSEP] = useState("");
  const [tgl, setTgl] = useState("");
  const [poli, setPoli] = useState(POLI_RK_OPTIONS[6].kode);
  const [dokter, setDokter] = useState(DOKTER_RK_OPTIONS[0].kode);
  const [kode, setKode] = useState<PRBKodeStatus>("01");
  const [prbData, setPrbData] = useState<PRBFormData>(emptyPRBFormData);
  const [prefilled, setPrefilled] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const handleFetch = useCallback(async () => {
    if (!noSurat.trim() || fetching) return;
    setFetching(true);
    setFetchErr("");
    try {
      const res = await getNoSuratKontrol(noSurat.trim());
      if (!res.ok) { setFetchErr(errMsg(res.error as BPJSError)); setFetching(false); return; }
      const d = res.value.response;
      if (!d) { setFetchErr("Data tidak ditemukan."); setFetching(false); return; }
      setNoSEP(d.sep?.noSep ?? "");
      setTgl(d.tglRencanaKontrol);
      const matchPoli = POLI_RK_OPTIONS.find((p) => p.kode === d.poliTujuan);
      if (matchPoli) setPoli(matchPoli.kode);
      const matchDokter = DOKTER_RK_OPTIONS.find((dk) => dk.kode === d.kodeDokter);
      if (matchDokter) setDokter(matchDokter.kode);
      if (d.formPRB.kdStatusPRB) {
        setKode(d.formPRB.kdStatusPRB);
        setPrbData(d.formPRB.data);
      }
      setPrefilled(true);
    } catch {
      setFetchErr("Koneksi gagal.");
    }
    setFetching(false);
  }, [noSurat, fetching]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noSurat.trim() || submitState.status === "loading") return;
      setSubmitState({ status: "loading" });
      try {
        const res = await updateRKV2({
          noSuratKontrol: noSurat.trim(),
          noSEP,
          kodeDokter: dokter,
          poliKontrol: poli,
          tglRencanaKontrol: tgl,
          user: DEFAULT_USER,
          formPRB: { kdStatusPRB: kode, data: prbData },
        });
        if (!res.ok) {
          setSubmitState({ status: "error", msg: errMsg(res.error as BPJSError) });
          return;
        }
        setSubmitState({ status: "success", noSurat: noSurat.trim() });
      } catch {
        setSubmitState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [noSurat, noSEP, tgl, poli, dokter, kode, prbData, submitState.status],
  );

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
          <p className="text-sm font-bold text-slate-800">Rencana Kontrol berhasil di-update</p>
          <p className="mt-1 font-mono text-xs text-violet-600">{submitState.noSurat}</p>
        </div>
        <button
          type="button"
          onClick={() => { setSubmitState({ status: "idle" }); setNoSurat(""); setPrefilled(false); }}
          className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100"
        >
          <RefreshCw size={11} />
          Update RK Lain
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lookup no surat */}
      <FormSection>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">No. Surat Kontrol</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <input
              type="text"
              value={noSurat}
              onChange={(e) => { setNoSurat(e.target.value); setPrefilled(false); }}
              placeholder="RK/…"
              className={cn(inputCls, "font-mono")}
            />
            <div className="flex flex-wrap gap-1">
              {SAMPLE_SURAT_NOS.map((s) => (
                <button key={s} type="button" onClick={() => { setNoSurat(s); setPrefilled(false); }}
                  className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                    noSurat === s ? "bg-violet-100 text-violet-700" : "text-slate-300 hover:text-slate-500")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!noSurat.trim() || fetching}
            onClick={handleFetch}
            className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
          >
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
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Edit Header RK</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="No. SEP">
                  <input type="text" value={noSEP} readOnly className={cn(inputCls, "font-mono")} />
                </FieldRow>
                <FieldRow label="Tgl Rencana Kontrol" required>
                  <input type="date" value={tgl} min={TODAY} onChange={(e) => setTgl(e.target.value)} className={inputCls} />
                </FieldRow>
                <FieldRow label="Poli Kontrol" required>
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

            <FormSection>
              <PRBFormFields
                kode={kode}
                data={prbData}
                onKodeChange={setKode}
                onFieldChange={(f, v) => setPrbData((prev) => ({ ...prev, [f]: v }))}
              />
            </FormSection>

            {submitState.status === "error" && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
                {submitState.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitState.status === "loading"}
              className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitState.status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Simpan Perubahan
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Orchestrator ───────────────────────────────────────

export default function InsertUpdateRKPanel() {
  const [mode, setMode] = useState<Mode>("insert");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mode toggle */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/40 px-4 py-3">
        <div className="flex w-fit gap-0.5 rounded-xl bg-slate-100 p-0.5">
          {(["insert","update"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all",
                mode === m
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {m === "insert" ? "Insert RK Baru" : "Update RK"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "insert" ? (
            <motion.div key="insert" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}>
              <InsertRKForm />
            </motion.div>
          ) : (
            <motion.div key="update" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}>
              <UpdateRKForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
