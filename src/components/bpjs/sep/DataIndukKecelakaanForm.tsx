"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Loader2, Search, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { dataIndukKecelakaan } from "@/lib/bpjs/vClaimSEP";
import type { DataIndukKecelakaanItem, BPJSError } from "@/lib/bpjs/bpjsShared";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

function fmtDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Card ───────────────────────────────────────────────────

function KecelakaanCard({ item, index }: { item: DataIndukKecelakaanItem; index: number }) {
  const hasSuplesi = !!item.noSEPSuplesi;
  const hasLokasi  = item.kdProp !== "00";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      className="rounded-xl border border-slate-200/60 bg-white p-3.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-xs font-medium text-slate-700">{item.noSEP}</p>
        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
          {fmtDate(item.tglKejadian)}
        </span>
      </div>

      {/* Suplesi badge */}
      {hasSuplesi && (
        <p className="mt-1.5 font-mono text-[10px] text-amber-600">
          Suplesi: {item.noSEPSuplesi}
        </p>
      )}

      {/* Keterangan */}
      {item.ketKejadian && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.ketKejadian}</p>
      )}

      {/* Lokasi */}
      {hasLokasi && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
          <MapPin size={10} strokeWidth={2} className="shrink-0" />
          <span>Prop {item.kdProp} · Kab {item.kdKab} · Kec {item.kdKec}</span>
        </div>
      )}

      {/* PPK */}
      <p className="mt-1.5 text-[10px] text-slate-400">PPK: {item.ppkPelSEP}</p>
    </motion.div>
  );
}

// ── Component ──────────────────────────────────────────────

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: DataIndukKecelakaanItem[] }
  | { status: "error"; msg: string };

const SAMPLES = [
  { label: "KLL · Concussion", value: "0001234567899" },
  { label: "KK · Radius #", value: "0001234567812" },
];

export default function DataIndukKecelakaanForm() {
  const kartuId = useId();

  const [noKartu, setNoKartu]   = useState("");
  const [touched, setTouched]   = useState(false);
  const [state, setState]       = useState<State>({ status: "idle" });

  const kartuErr = touched && !/^\d{13}$/.test(noKartu.trim())
    ? "Nomor kartu harus 13 digit angka" : null;

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (kartuErr || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await dataIndukKecelakaan(noKartu.trim());
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      setState({ status: "loaded", list: res.value.response?.list ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Car size={13} className="text-rose-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Data Induk Kecelakaan</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div>
          <label htmlFor={kartuId} className="mb-1.5 block text-xs font-semibold text-slate-600">
            No. Kartu BPJS
          </label>
          <div className="flex gap-2">
            <input
              id={kartuId}
              type="text"
              inputMode="numeric"
              value={noKartu}
              onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
              onBlur={() => setTouched(true)}
              placeholder="0001234567891"
              className={cn(
                "min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
                kartuErr
                  ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                  : "border-slate-200 bg-white focus:border-rose-300 focus:ring-rose-100",
              )}
            />
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-rose-200/50 transition-all hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60"
            >
              {state.status === "loading"
                ? <Loader2 size={12} className="animate-spin" />
                : <Search size={12} strokeWidth={2.5} />
              }
              Cari
            </button>
          </div>
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

        {/* Dev samples */}
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button key={s.value} type="button"
              onClick={() => { setNoKartu(s.value); setTouched(false); }}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
            >
              {s.label}
            </button>
          ))}
        </div>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2.5 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
              <Car size={20} className="text-rose-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Masukkan No. Kartu untuk lihat riwayat kecelakaan peserta</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={13} className="animate-spin text-rose-400" />
            Memuat data induk kecelakaan…
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
            {state.list.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-xs text-slate-400">Tidak ada data kecelakaan untuk peserta ini.</p>
              </div>
            ) : (
              <>
                {state.list.map((item, i) => (
                  <KecelakaanCard key={item.noSEP} item={item} index={i} />
                ))}
                <p className="text-center text-[10px] text-slate-400">
                  {state.list.length} catatan kecelakaan
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
