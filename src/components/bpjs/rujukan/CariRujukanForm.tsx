"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Hash, CreditCard, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRujukan, listRujukanByPeserta } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import type { SearchState } from "./rujukanShared";
import { SAMPLE_RUJUKAN_NOS, SAMPLE_KARTU_RUJUKAN } from "./rujukanShared";

// ── Helpers ────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal mengambil data rujukan.";
}

// ── Sub-components ─────────────────────────────────────

function FaskesToggle({
  value,
  onChange,
}: {
  value: "FKTP" | "FKRTL";
  onChange: (v: "FKTP" | "FKRTL") => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {(["FKTP", "FKRTL"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all",
            value === opt
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition-all",
        loading
          ? "cursor-wait bg-teal-300"
          : "bg-teal-600 shadow-teal-200/60 hover:bg-teal-700 active:scale-[0.99]",
      )}
    >
      {loading
        ? <><Loader2 size={12} className="animate-spin" />Mencari…</>
        : <><Search size={12} strokeWidth={2.5} />Cari Rujukan</>
      }
    </button>
  );
}

// ── Component ──────────────────────────────────────────

type SearchMode = "noRujukan" | "noKartu";

interface Props {
  isLoading: boolean;
  onStateChange: (s: SearchState) => void;
}

export default function CariRujukanForm({ isLoading, onStateChange }: Props) {
  const noRujukanId = useId();
  const noKartuId   = useId();

  const [mode, setMode]           = useState<SearchMode>("noRujukan");
  const [jenisFaskes, setJenisF]  = useState<"FKTP" | "FKRTL">("FKTP");
  const [noRujukan, setNoRujukan] = useState("");
  const [noKartu, setNoKartu]     = useState("");
  const [touched, setTouched]     = useState(false);

  const noRujukanErr = touched && mode === "noRujukan" && noRujukan.trim().length < 5
    ? "No. Rujukan terlalu pendek" : null;
  const noKartuErr = touched && mode === "noKartu" && !/^\d{13}$/.test(noKartu.trim())
    ? "Nomor kartu harus 13 digit angka" : null;

  async function handleSearch(e?: { preventDefault(): void }) {
    e?.preventDefault();
    setTouched(true);
    if (isLoading) return;
    if (mode === "noRujukan" && noRujukan.trim().length < 5) return;
    if (mode === "noKartu" && !/^\d{13}$/.test(noKartu.trim())) return;

    onStateChange({ status: "loading" });
    try {
      if (mode === "noRujukan") {
        const res = await getRujukan(noRujukan.trim(), jenisFaskes);
        if (!res.ok) { onStateChange({ status: "error", msg: errMsg(res.error) }); return; }
        const r = res.value.response;
        onStateChange(r ? { status: "found", results: [r] } : { status: "empty" });
      } else {
        const res = await listRujukanByPeserta(noKartu.trim(), jenisFaskes);
        if (!res.ok) { onStateChange({ status: "error", msg: errMsg(res.error) }); return; }
        const list = res.value.response ?? [];
        onStateChange(list.length > 0 ? { status: "found", results: list } : { status: "empty" });
      }
    } catch {
      onStateChange({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  function switchMode(next: SearchMode) {
    setMode(next);
    setTouched(false);
    onStateChange({ status: "idle" });
  }

  function applySampleNo(val: string, jenis: "FKTP" | "FKRTL") {
    setMode("noRujukan");
    setNoRujukan(val);
    setJenisF(jenis);
    setTouched(false);
    onStateChange({ status: "idle" });
  }

  function applySampleKartu(val: string) {
    setMode("noKartu");
    setNoKartu(val);
    setTouched(false);
    onStateChange({ status: "idle" });
  }

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-75 lg:shrink-0">
      {/* Panel header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileSearch size={13} className="text-teal-500" strokeWidth={2.3} />
          <p className="text-xs font-bold text-slate-800">Pencarian</p>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">No. Rujukan atau No. Kartu · FKTP / FKRTL</p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {([
              { key: "noRujukan" as SearchMode, label: "No. Rujukan", Icon: Hash },
              { key: "noKartu"   as SearchMode, label: "No. Kartu",   Icon: CreditCard },
            ] as { key: SearchMode; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-bold transition-all",
                  mode === key
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon size={10} strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>

          {/* Jenis faskes */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jenis Faskes</p>
            <FaskesToggle value={jenisFaskes} onChange={setJenisF} />
          </div>

          {/* Conditional form per mode */}
          <AnimatePresence mode="wait">
            {mode === "noRujukan" ? (
              <motion.form
                key="form-no-rujukan"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSearch}
                className="flex flex-col gap-3"
              >
                <div>
                  <label htmlFor={noRujukanId} className="mb-1.5 block text-xs font-semibold text-slate-600">
                    No. Rujukan
                  </label>
                  <input
                    id={noRujukanId}
                    type="text"
                    value={noRujukan}
                    onChange={(e) => setNoRujukan(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="RUJ/FKTP-Mawar/2026/05/0023"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
                      noRujukanErr
                        ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                        : "border-slate-200 bg-white focus:border-teal-300 focus:ring-teal-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {noRujukanErr && (
                      <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }} className="mt-1 text-[10px] font-medium text-rose-500"
                      >{noRujukanErr}</motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_RUJUKAN_NOS.map((s) => (
                    <button key={s.value} type="button"
                      onClick={() => applySampleNo(s.value, s.jenis)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <SubmitButton loading={isLoading} />
              </motion.form>
            ) : (
              <motion.form
                key="form-no-kartu"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSearch}
                className="flex flex-col gap-3"
              >
                <div>
                  <label htmlFor={noKartuId} className="mb-1.5 block text-xs font-semibold text-slate-600">
                    No. Kartu BPJS
                  </label>
                  <input
                    id={noKartuId}
                    type="text"
                    inputMode="numeric"
                    value={noKartu}
                    onChange={(e) => setNoKartu(e.target.value.replace(/\D/g, "").slice(0, 13))}
                    onBlur={() => setTouched(true)}
                    placeholder="0001234567891"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
                      noKartuErr
                        ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                        : "border-slate-200 bg-white focus:border-teal-300 focus:ring-teal-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {noKartuErr && (
                      <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }} className="mt-1 text-[10px] font-medium text-rose-500"
                      >{noKartuErr}</motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_KARTU_RUJUKAN.map((s) => (
                    <button key={s.value} type="button"
                      onClick={() => applySampleKartu(s.value)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <SubmitButton loading={isLoading} />
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>
    </aside>
  );
}
