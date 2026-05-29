"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { updateTglPulang } from "@/lib/bpjs/vClaimSEP";
import type { StatusPulangKode } from "@/lib/bpjs/bpjsShared";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";

// ── Helpers ────────────────────────────────────────────────

const STATUS_PULANG_OPTIONS: { value: StatusPulangKode; label: string }[] = [
  { value: "1", label: "Atas Persetujuan Dokter" },
  { value: "3", label: "Atas Permintaan Sendiri (APS)" },
  { value: "4", label: "Meninggal" },
  { value: "5", label: "Lain-lain" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Terjadi kesalahan, coba lagi.";
}

// ── Component ──────────────────────────────────────────────

interface UpdateTglPulangFormProps {
  initialNoSEP?: string;
  onSuccess?: () => void;
}

export default function UpdateTglPulangForm({ initialNoSEP, onSuccess }: UpdateTglPulangFormProps) {
  const noSEPId     = useId();
  const tglPulangId = useId();
  const statusId    = useId();

  const [noSep, setNoSep]             = useState(initialNoSEP ?? "");
  const [tglPulang, setTglPulang]     = useState("");
  const [statusPulang, setStatusPulang] = useState<StatusPulangKode>("1");
  const [noSuratMeninggal, setNoSuratMeninggal] = useState("");
  const [tglMeninggal, setTglMeninggal]         = useState("");
  const [touched, setTouched]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [apiErr, setApiErr]           = useState<string | null>(null);

  const isMeninggal = statusPulang === "4";

  const noSepErr    = touched && noSep.trim().length < 5  ? "No. SEP minimal 5 karakter" : null;
  const tglErr      = touched && !tglPulang               ? "Tanggal pulang wajib diisi" : null;
  const suratErr    = touched && isMeninggal && noSuratMeninggal.trim().length === 0
    ? "No. Surat wajib jika status Meninggal" : null;
  const tglMeninggalErr = touched && isMeninggal && !tglMeninggal
    ? "Tanggal meninggal wajib" : null;

  const hasErr = !!(noSepErr || tglErr || suratErr || tglMeninggalErr);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (hasErr || loading) return;
    setLoading(true);
    setApiErr(null);
    try {
      const res = await updateTglPulang({
        noSep: noSep.trim(),
        tglPulang,
        statusPulang,
        noSuratMeninggal: isMeninggal ? noSuratMeninggal.trim() : undefined,
        tglMeninggal:     isMeninggal ? tglMeninggal : undefined,
        user: "operator.bpjs@rs-sakti.id",
      });
      if (!res.ok) { setApiErr(errMsg(res.error)); return; }
      setDone(true);
      onSuccess?.();
    } catch {
      setApiErr("Koneksi ke V-Claim gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setNoSep(initialNoSEP ?? "");
    setTglPulang("");
    setStatusPulang("1");
    setNoSuratMeninggal("");
    setTglMeninggal("");
    setTouched(false);
    setDone(false);
    setApiErr(null);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-4 p-8 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle size={28} className="text-emerald-500" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Tanggal Pulang Diperbarui</p>
          <p className="mt-1 font-mono text-xs text-slate-400">{noSep}</p>
          <p className="mt-0.5 text-xs text-slate-400">SEP berhasil di-update ke V-Claim BPJS</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-1 rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          Update SEP Lain
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">

      {/* Context hint */}
      <div className="flex items-start gap-2 rounded-xl bg-emerald-50/70 px-3.5 py-3 ring-1 ring-emerald-100">
        <CalendarClock size={13} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-emerald-700">
          Update tanggal pulang pasien rawat inap ke V-Claim BPJS. Status Meninggal memerlukan surat kematian.
        </p>
      </div>

      {/* No SEP */}
      <Field label="Nomor SEP" htmlFor={noSEPId} error={noSepErr}>
        <input
          id={noSEPId}
          type="text"
          value={noSep}
          onChange={(e) => setNoSep(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="SEP-2026-0501-00012"
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
            noSepErr
              ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
              : "border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-100",
          )}
        />
      </Field>

      {/* Tgl Pulang */}
      <Field label="Tanggal Pulang" htmlFor={tglPulangId} error={tglErr}>
        <input
          id={tglPulangId}
          type="date"
          value={tglPulang}
          max={todayISO()}
          onChange={(e) => setTglPulang(e.target.value)}
          onBlur={() => setTouched(true)}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2",
            tglErr
              ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
              : "border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-100",
          )}
        />
      </Field>

      {/* Status Pulang */}
      <Field label="Status Pulang" htmlFor={statusId}>
        <select
          id={statusId}
          value={statusPulang}
          onChange={(e) => setStatusPulang(e.target.value as StatusPulangKode)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {STATUS_PULANG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Conditional — Meninggal */}
      <AnimatePresence initial={false}>
        {isMeninggal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 p-3.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-600" strokeWidth={2.3} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Data Meninggal (Wajib)</p>
              </div>
              <Field label="No. Surat Kematian" error={suratErr}>
                <input
                  type="text"
                  value={noSuratMeninggal}
                  onChange={(e) => setNoSuratMeninggal(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="SKM/2026/05/001"
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
                    suratErr
                      ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                      : "border-amber-200 bg-white focus:border-amber-400 focus:ring-amber-100",
                  )}
                />
              </Field>
              <Field label="Tanggal Meninggal" error={tglMeninggalErr}>
                <input
                  type="date"
                  value={tglMeninggal}
                  max={todayISO()}
                  onChange={(e) => setTglMeninggal(e.target.value)}
                  onBlur={() => setTouched(true)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2",
                    tglMeninggalErr
                      ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                      : "border-amber-200 bg-white focus:border-amber-400 focus:ring-amber-100",
                  )}
                />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API error */}
      <AnimatePresence>
        {apiErr && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >
            {apiErr}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileTap={!loading ? { scale: 0.98 } : undefined}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2",
          loading
            ? "cursor-wait bg-emerald-300 text-white"
            : "bg-emerald-500 text-white shadow-md shadow-emerald-200/50 hover:bg-emerald-600",
        )}
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" />Menyimpan…</>
          : <><CalendarClock size={14} />Update Tgl Pulang</>
        }
      </motion.button>
    </form>
  );
}

// ── Field wrapper ──────────────────────────────────────────

function Field({
  label, htmlFor, error, children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
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
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="mt-1 text-xs font-medium text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
