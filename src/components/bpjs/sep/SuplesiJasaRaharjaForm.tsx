"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Loader2, Search, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { suplesiCek } from "@/lib/bpjs/vClaimSEP";
import type { SuplesiJaminanItem, BPJSError } from "@/lib/bpjs/bpjsShared";

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

// ── Row ────────────────────────────────────────────────────

function Row({ item, index }: { item: SuplesiJaminanItem; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      className="border-b border-slate-100 last:border-0"
    >
      <td className="py-2.5 pl-3 pr-3">
        <p className="font-mono text-xs font-medium text-slate-700">{item.noRegister}</p>
      </td>
      <td className="py-2.5 pr-3">
        <p className="font-mono text-[11px] text-slate-700">{item.noSep}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.noSepAwal}</p>
      </td>
      <td className="py-2.5 pr-3 text-[11px] text-slate-500">{fmtDate(item.tglKejadian)}</td>
      <td className="py-2.5 pr-3 text-[11px] text-slate-500">{fmtDate(item.tglSep)}</td>
    </motion.tr>
  );
}

// ── Field wrapper ──────────────────────────────────────────

function Field({
  label, htmlFor, error, children,
}: {
  label: string; htmlFor?: string; error?: string | null; children: React.ReactNode;
}) {
  return (
    <div>
      {htmlFor
        ? <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
        : <p className="mb-1.5 text-xs font-semibold text-slate-600">{label}</p>
      }
      {children}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p key="e"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="mt-1 text-xs font-medium text-rose-500"
          >{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────

type SuplesiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: SuplesiJaminanItem[] }
  | { status: "error"; msg: string };

const SAMPLES = [
  { label: "KLL · Concussion", value: "0001234567899" },
  { label: "KK · Radius #", value: "0001234567812" },
];

export default function SuplesiJasaRaharjaForm() {
  const kartuId = useId();
  const tglId   = useId();

  const [noKartu, setNoKartu]         = useState("");
  const [tglPelayanan, setTglPelayanan] = useState(new Date().toISOString().slice(0, 10));
  const [touched, setTouched]         = useState(false);
  const [state, setState]             = useState<SuplesiState>({ status: "idle" });

  const kartuErr = touched && !/^\d{13}$/.test(noKartu.trim())
    ? "Nomor kartu harus 13 digit angka" : null;
  const tglErr   = touched && !tglPelayanan ? "Tanggal wajib diisi" : null;

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (kartuErr || tglErr || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await suplesiCek(noKartu.trim(), tglPelayanan);
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      setState({ status: "loaded", list: res.value.response?.jaminan ?? [] });
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert size={13} className="text-amber-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Potensi Suplesi Jasa Raharja</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3.5 py-3 ring-1 ring-amber-100">
        <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-amber-700">
          Cek potensi suplesi untuk peserta yang mengalami kecelakaan lalu lintas (KLL) atau kecelakaan kerja (KK).
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <Field label="No. Kartu BPJS" htmlFor={kartuId} error={kartuErr}>
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
                : "border-slate-200 bg-white focus:border-amber-300 focus:ring-amber-100",
            )}
          />
        </Field>

        <Field label="Tanggal Pelayanan" htmlFor={tglId} error={tglErr}>
          <input
            id={tglId}
            type="date"
            value={tglPelayanan}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setTglPelayanan(e.target.value)}
            onBlur={() => setTouched(true)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </Field>

        {/* Dev samples */}
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button key={s.value} type="button"
              onClick={() => { setNoKartu(s.value); setTouched(false); }}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
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
              ? "cursor-wait bg-amber-300"
              : "bg-amber-500 shadow-amber-200/50 hover:bg-amber-600",
          )}
        >
          {state.status === "loading"
            ? <><Loader2 size={12} className="animate-spin" />Memeriksa…</>
            : <><Search size={12} strokeWidth={2.5} />Cek Suplesi JR</>
          }
        </button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2.5 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
              <ShieldAlert size={20} className="text-amber-200" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-400">Masukkan No. Kartu dan tanggal untuk cek potensi suplesi</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"
          >
            <Loader2 size={13} className="animate-spin text-amber-400" />
            Memeriksa data suplesi…
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >{state.msg}</motion.p>
        )}

        {state.status === "loaded" && (
          <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {state.list.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
                <p className="text-xs text-slate-400">Tidak ada potensi suplesi JR ditemukan untuk peserta ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                <table className="w-full min-w-[420px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {["No. Register", "No. SEP / Awal", "Tgl Kejadian", "Tgl SEP"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {state.list.map((item, i) => (
                      <Row key={item.noRegister} item={item} index={i} />
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 bg-amber-50/50 px-3 py-2 text-[10px] font-medium text-amber-700">
                  {state.list.length} potensi suplesi JR ditemukan
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
