"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Loader2, Search, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { getFingerPrint } from "@/lib/bpjs/vClaimSEP";
import type { FingerPrintResponse, BPJSError } from "@/lib/bpjs/bpjsShared";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memeriksa fingerprint.";
}

// ── Status card ────────────────────────────────────────────

function StatusCard({ data }: { data: FingerPrintResponse }) {
  const verified = data.kode === "1";

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border p-6 text-center",
        verified
          ? "border-emerald-200/60 bg-emerald-50/40"
          : "border-rose-200/60 bg-rose-50/40",
      )}
    >
      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
        verified
          ? "bg-emerald-100 ring-emerald-200"
          : "bg-rose-100 ring-rose-200",
      )}>
        {verified
          ? <CheckCircle size={24} className="text-emerald-600" strokeWidth={1.8} />
          : <XCircle    size={24} className="text-rose-500"    strokeWidth={1.8} />
        }
      </div>

      <div>
        <p className={cn(
          "text-sm font-bold",
          verified ? "text-emerald-700" : "text-rose-600",
        )}>
          {verified ? "Fingerprint Terverifikasi" : "Fingerprint Belum Divalidasi"}
        </p>
        <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500">{data.status}</p>
      </div>

      {!verified && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-left ring-1 ring-amber-100">
          <AlertCircle size={12} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
          <p className="text-[11px] leading-relaxed text-amber-700">
            Arahkan peserta ke petugas untuk validasi fingerprint sebelum pelayanan.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Component ──────────────────────────────────────────────

type FPState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; data: FingerPrintResponse }
  | { status: "error"; msg: string };

const SAMPLES = [
  { label: "Kartu 891", value: "0001234567891" },
  { label: "Kartu 892", value: "0001234567892" },
  { label: "Kartu 893", value: "0001234567893" },
];

export default function FingerprintPanel() {
  const kartuId = useId();
  const tglId   = useId();

  const [noKartu, setNoKartu]         = useState("");
  const [tglPelayanan, setTglPelayanan] = useState(new Date().toISOString().slice(0, 10));
  const [touched, setTouched]         = useState(false);
  const [state, setState]             = useState<FPState>({ status: "idle" });

  const kartuErr = touched && !/^\d{13}$/.test(noKartu.trim())
    ? "Nomor kartu harus 13 digit angka" : null;
  const tglErr   = touched && !tglPelayanan ? "Tanggal wajib diisi" : null;

  async function handleCheck(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (kartuErr || tglErr || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await getFingerPrint(noKartu.trim(), tglPelayanan);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      const data = res.value.response;
      if (!data) { setState({ status: "error", msg: "Data fingerprint tidak tersedia." }); return; }
      setState({ status: "found", data });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Fingerprint size={13} className="text-indigo-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Cek Fingerprint Peserta</p>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-2 rounded-xl bg-indigo-50/60 px-3.5 py-3 ring-1 ring-indigo-100">
        <Info size={12} className="mt-0.5 shrink-0 text-indigo-400" strokeWidth={2} />
        <p className="text-[11px] leading-relaxed text-indigo-700">
          Sidik jari <strong>wajib</strong> untuk peserta JKN ≥ 4 kunjungan/bulan per jenis pelayanan.
          <span className="ml-1 text-indigo-400">(Permenkes 26/2021)</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCheck} className="flex flex-col gap-3">
        <div>
          <label htmlFor={kartuId} className="mb-1.5 block text-xs font-semibold text-slate-600">
            No. Kartu BPJS
          </label>
          <input
            id={kartuId}
            type="text"
            inputMode="numeric"
            value={noKartu}
            onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
            onBlur={() => setTouched(true)}
            placeholder="0001234567891"
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
              kartuErr
                ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                : "border-slate-200 bg-white focus:border-indigo-300 focus:ring-indigo-100",
            )}
          />
          <AnimatePresence mode="wait">
            {kartuErr && (
              <motion.p key="e"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="mt-1 text-xs font-medium text-rose-500"
              >{kartuErr}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label htmlFor={tglId} className="mb-1.5 block text-xs font-semibold text-slate-600">
            Tanggal Pelayanan
          </label>
          <input
            id={tglId}
            type="date"
            value={tglPelayanan}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setTglPelayanan(e.target.value)}
            onBlur={() => setTouched(true)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Dev samples */}
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button key={s.value} type="button"
              onClick={() => { setNoKartu(s.value); setTouched(false); }}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={state.status === "loading"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition-all",
            state.status === "loading"
              ? "cursor-wait bg-indigo-300"
              : "bg-indigo-500 shadow-indigo-200/50 hover:bg-indigo-600",
          )}
        >
          {state.status === "loading"
            ? <><Loader2 size={12} className="animate-spin" />Memeriksa…</>
            : <><Search size={12} strokeWidth={2.5} />Cek Fingerprint</>
          }
        </button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2.5 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
              <Fingerprint size={22} className="text-indigo-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Masukkan No. Kartu dan tanggal untuk cek status fingerprint</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={13} className="animate-spin text-indigo-400" />
            Memeriksa status fingerprint…
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >{state.msg}</motion.p>
        )}

        {state.status === "found" && (
          <StatusCard key="found" data={state.data} />
        )}
      </AnimatePresence>
    </div>
  );
}
