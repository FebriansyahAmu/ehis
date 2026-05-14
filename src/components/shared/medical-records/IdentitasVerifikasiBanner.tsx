"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, CheckCircle2, User, Calendar, Hash, ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

export interface VerifikasiInfo {
  perawat: string;
  waktu:   string;
}

interface Props {
  namaLengkap:     string;
  tanggalLahir:    string;
  noRM:            string;
  isVerified:      boolean;
  verifikasiInfo?: VerifikasiInfo;
  onVerify:        (perawat: string) => void;
}

// ── Identity card ──────────────────────────────────────────

function IdCard({
  icon: Icon, label, value, delay,
}: { icon: React.ElementType; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: "easeOut" }}
      className="flex flex-col gap-1.5 rounded-xl bg-white p-3 ring-1 ring-amber-200/80 shadow-xs"
    >
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-amber-400" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">{label}</span>
      </div>
      <p className="text-sm font-bold leading-tight text-slate-800">{value}</p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function IdentitasVerifikasiBanner({
  namaLengkap, tanggalLahir, noRM,
  isVerified, verifikasiInfo, onVerify,
}: Props) {
  const [checked,    setChecked]    = useState(false);
  const [perawat,    setPerawat]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canConfirm = checked && perawat.trim().length > 0 && !submitting;

  function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setTimeout(() => onVerify(perawat.trim()), 380);
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── UNVERIFIED: full banner ── */}
      {!isVerified && (
        <motion.div
          key="banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 overflow-hidden"
        >
          {/* Header strip */}
          <div className="flex items-center gap-2.5 rounded-t-xl bg-amber-400 px-4 py-2.5">
            <ShieldAlert size={14} className="shrink-0 text-amber-900" />
            <span className="text-xs font-bold text-amber-900">
              Verifikasi Identitas Pasien Diperlukan
            </span>
            <span className="ml-auto rounded-full bg-amber-300/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-900">
              SKP 1 · JCI IPSG 1
            </span>
          </div>

          {/* Body */}
          <div className="rounded-b-xl border border-t-0 border-amber-200 bg-amber-50 p-4">
            <p className="mb-3.5 text-xs leading-relaxed text-amber-800">
              Konfirmasi identitas pasien secara verbal menggunakan minimal{" "}
              <strong className="font-bold">2 identitas</strong> di bawah sebelum memberikan
              order atau tindakan apapun.
            </p>

            {/* Identity cards */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <IdCard icon={User}     label="Nama Lengkap"  value={namaLengkap}  delay={0.05} />
              <IdCard icon={Calendar} label="Tanggal Lahir" value={tanggalLahir} delay={0.11} />
              <IdCard icon={Hash}     label="Nomor RM"      value={noRM}         delay={0.17} />
            </div>

            {/* Checkbox */}
            <label className="mb-3.5 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-amber-500"
              />
              <span className="text-xs leading-relaxed text-amber-800">
                Saya telah mengkonfirmasi identitas pasien secara verbal menggunakan
                minimal 2 identitas di atas
              </span>
            </label>

            {/* Perawat input + confirm button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nama perawat yang memverifikasi..."
                value={perawat}
                onChange={e => setPerawat(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleConfirm()}
                className={cn(
                  "flex-1 rounded-lg border bg-white px-3 py-2 text-xs text-slate-700 outline-none transition",
                  "placeholder:text-slate-300",
                  "border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100",
                )}
              />
              <motion.button
                whileHover={canConfirm ? { scale: 1.02 } : {}}
                whileTap={canConfirm  ? { scale: 0.96 } : {}}
                disabled={!canConfirm}
                onClick={handleConfirm}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  canConfirm
                    ? "cursor-pointer bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                    : "cursor-not-allowed bg-amber-100 text-amber-300",
                )}
              >
                {submitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>Konfirmasi &amp; Lanjutkan <ChevronRight size={12} /></>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── VERIFIED: compact chip ── */}
      {isVerified && (
        <motion.div
          key="verified"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
        >
          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">Identitas terverifikasi</span>
          {verifikasiInfo && (
            <span className="text-xs text-emerald-600">
              · {verifikasiInfo.perawat} · {verifikasiInfo.waktu}
            </span>
          )}
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 ring-1 ring-emerald-200">
            SKP 1
          </span>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
