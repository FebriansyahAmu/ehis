"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Loader2, Search, Trash2, CheckCircle, AlertCircle, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { dataSepInternal, hapusSepInternal } from "@/lib/bpjs/vClaimSEP";
import type { SEPInternalItem, BPJSError } from "@/lib/bpjs/bpjsShared";
import { SAMPLE_SEP } from "./sepShared";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Terjadi kesalahan.";
}

function fmtDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Row ────────────────────────────────────────────────────

type DelState = "idle" | "confirm" | "loading" | "done" | "error";

function InternalRow({
  item, index, noSEP, onDeleted,
}: {
  item: SEPInternalItem;
  index: number;
  noSEP: string;
  onDeleted: () => void;
}) {
  const [delState, setDelState] = useState<DelState>("idle");
  const [delErr, setDelErr]     = useState<string | null>(null);

  async function confirmHapus() {
    setDelState("loading");
    try {
      const res = await hapusSepInternal({
        noSep: noSEP,
        noSurat: item.nosurat,
        tglRujukanInternal: item.tglrujukinternal,
        kdPoliTuj: item.kdpolituj,
        user: "operator.bpjs@rs-sakti.id",
      });
      if (!res.ok) {
        setDelErr(errMsg(res.error));
        setDelState("error");
        return;
      }
      setDelState("done");
      setTimeout(onDeleted, 900);
    } catch {
      setDelErr("Gagal menghapus SEP Internal.");
      setDelState("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      className="rounded-xl border border-slate-200/60 bg-white p-3.5"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Transfer route */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {item.nmpoliasal}
            </span>
            <span className="text-[10px] text-slate-300">→</span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-700">
              {item.nmtujuanrujuk}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-slate-700">{item.nmdokter}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{item.nmdiag} · {fmtDate(item.tglrujukinternal)}</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.nosurat}</p>
        </div>

        {/* Delete action */}
        <div className="shrink-0 flex items-center">
          {delState === "idle" && (
            <button
              type="button"
              onClick={() => setDelState("confirm")}
              className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 transition-colors hover:bg-rose-100"
            >
              <Trash2 size={10} strokeWidth={2.3} />
              Hapus
            </button>
          )}
          {delState === "confirm" && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={confirmHapus}
                className="rounded-lg bg-rose-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-rose-600"
              >
                Yakin?
              </button>
              <button type="button" onClick={() => setDelState("idle")}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          )}
          {delState === "loading" && <Loader2 size={14} className="animate-spin text-slate-400" />}
          {delState === "done" && <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />}
          {delState === "error" && (
            <span className="max-w-[100px] text-[10px] leading-tight text-rose-500">{delErr}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Component ──────────────────────────────────────────────

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; noSEP: string; list: SEPInternalItem[] }
  | { status: "error"; msg: string };

export default function SEPInternalForm() {
  const inputId = useId();

  const [noSEP, setNoSEP]     = useState("");
  const [touched, setTouched] = useState(false);
  const [state, setState]     = useState<State>({ status: "idle" });

  const sepErr = touched && noSEP.trim().length < 5
    ? "No. SEP minimal 5 karakter" : null;

  async function handleSearch(e?: { preventDefault(): void }) {
    e?.preventDefault();
    setTouched(true);
    if (sepErr || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await dataSepInternal(noSEP.trim());
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      setState({ status: "loaded", noSEP: noSEP.trim(), list: res.value.response?.list ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  function handleDeleted() {
    handleSearch();
  }

  const riSamples = SAMPLE_SEP.filter((s) => s.label.toLowerCase().includes("ri"));

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={13} className="text-sky-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Data SEP Internal</p>
      </div>

      {/* Context note */}
      <div className="flex items-start gap-2 rounded-xl bg-sky-50/60 px-3.5 py-3 ring-1 ring-sky-100">
        <Info size={12} className="mt-0.5 shrink-0 text-sky-500" strokeWidth={2} />
        <p className="text-[11px] leading-relaxed text-sky-700">
          Transfer antar SMF di RS — berlaku untuk SEP Rawat Inap. Hapus SEP Internal jika transfer dibatalkan.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-slate-600">
            Nomor SEP
          </label>
          <input
            id={inputId}
            type="text"
            value={noSEP}
            onChange={(e) => setNoSEP(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="SEP-2026-0501-00012"
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
              sepErr
                ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                : "border-slate-200 bg-white focus:border-sky-300 focus:ring-sky-100",
            )}
          />
          <AnimatePresence mode="wait">
            {sepErr && (
              <motion.p key="e"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="mt-1 text-xs font-medium text-rose-500"
              >{sepErr}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {riSamples.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {riSamples.map((s) => (
              <button key={s.value} type="button"
                onClick={() => { setNoSEP(s.value); setTouched(false); }}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={state.status === "loading"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition-all",
            state.status === "loading"
              ? "cursor-wait bg-sky-300"
              : "bg-sky-500 shadow-sky-200/50 hover:bg-sky-600",
          )}
        >
          {state.status === "loading"
            ? <><Loader2 size={12} className="animate-spin" />Memuat…</>
            : <><Search size={12} strokeWidth={2.5} />Cari SEP Internal</>
          }
        </button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2.5 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
              <ArrowRightLeft size={20} className="text-sky-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Masukkan No. SEP Rawat Inap untuk lihat transfer internal</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={13} className="animate-spin text-sky-400" />
            Mengambil data SEP Internal…
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >{state.msg}</motion.p>
        )}

        {state.status === "loaded" && (
          <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer Internal</p>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                state.list.length > 0 ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
              )}>
                {state.list.length} entri
              </span>
            </div>

            {state.list.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-xs text-slate-500">Tidak ada SEP Internal untuk SEP ini.</p>
                <p className="mt-1 text-[10px] text-slate-300">
                  Hanya muncul untuk SEP Rawat Inap yang sudah memiliki transfer antar SMF.
                </p>
              </div>
            ) : (
              state.list.map((item, i) => (
                <InternalRow
                  key={`${item.nosurat}-${i}`}
                  item={item}
                  index={i}
                  noSEP={state.noSEP}
                  onDeleted={handleDeleted}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
