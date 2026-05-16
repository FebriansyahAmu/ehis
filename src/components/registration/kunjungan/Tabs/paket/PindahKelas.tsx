"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BedDouble, Check, ChevronRight, AlertCircle,
  TrendingUp, TrendingDown, ArrowRight,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import {
  type KelasId, type SumberPembayaran,
  KELAS_RAWAT, CURRENT_KELAS_DEFAULT, SUMBER_BAYAR, fmtRp,
} from "./paketTypes";

// ─── AmenityChip ──────────────────────────────────────────────

function AmenityChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
      {label}
    </span>
  );
}

// ─── CurrentKelasCard ─────────────────────────────────────────

function CurrentKelasCard({ kelasId }: { kelasId: KelasId }) {
  const kelas = KELAS_RAWAT.find(k => k.id === kelasId)!;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <BedDouble size={16} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-bold text-slate-800">{kelas.label}</p>
          <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
            Kelas Saat Ini
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{fmtRp(kelas.tarif)} / malam</p>
      </div>
      {kelas.bpjsEntitlement && (
        <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          {kelas.bpjsEntitlement}
        </span>
      )}
    </div>
  );
}

// ─── KelasCard ────────────────────────────────────────────────

function KelasCard({
  kelas, selected, isCurrent, onClick,
}: {
  kelas: typeof KELAS_RAWAT[number];
  selected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-44 shrink-0 flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-all duration-200 active:scale-[0.97]",
        selected
          ? "border-sky-400 bg-sky-50 shadow-md shadow-sky-100/60 ring-2 ring-sky-400/25"
          : isCurrent
          ? "border-slate-300 bg-white"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      )}
    >
      {/* Selected checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500"
          >
            <Check size={10} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class label */}
      <div>
        <p className={cn("text-[13px] font-bold", selected ? "text-sky-800" : "text-slate-800")}>
          {kelas.label}
        </p>
        <p className="text-[9px] text-slate-400">{kelas.kapasitas}</p>
        {isCurrent && !selected && (
          <span className="text-[8.5px] font-semibold text-slate-400">• Saat Ini</span>
        )}
      </div>

      {/* Tarif */}
      <div>
        <p className={cn("text-[12px] font-bold", selected ? "text-sky-600" : "text-slate-700")}>
          {fmtRp(kelas.tarif)}
        </p>
        <p className="text-[9px] text-slate-400">per malam</p>
      </div>

      {/* Amenities */}
      <div className="flex flex-wrap gap-1">
        {kelas.amenities.slice(0, 3).map(a => <AmenityChip key={a} label={a} />)}
        {kelas.amenities.length > 3 && (
          <span className="text-[9px] text-slate-400">+{kelas.amenities.length - 3}</span>
        )}
      </div>

      {/* BPJS badge */}
      {kelas.bpjsEntitlement ? (
        <span className="self-start rounded-md bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-600 ring-1 ring-emerald-100">
          ✓ BPJS
        </span>
      ) : (
        <span className="self-start rounded-md bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-600 ring-1 ring-amber-100">
          Non-BPJS
        </span>
      )}
    </button>
  );
}

// ─── SelisihBanner ────────────────────────────────────────────

function SelisihBanner({ currentId, targetId }: { currentId: KelasId; targetId: KelasId }) {
  const current  = KELAS_RAWAT.find(k => k.id === currentId)!;
  const target   = KELAS_RAWAT.find(k => k.id === targetId)!;
  const diff     = target.tarif - current.tarif;
  const isUpgrade = diff > 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border p-4",
      isUpgrade ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50",
    )}>
      {/* Route display */}
      <div className="mb-3 flex items-center gap-2">
        {isUpgrade
          ? <TrendingUp size={14} className="shrink-0 text-amber-600" />
          : <TrendingDown size={14} className="shrink-0 text-emerald-600" />}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "rounded-lg px-2 py-0.5 text-[10px] font-bold",
            isUpgrade ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
          )}>
            {current.label}
          </span>
          <ArrowRight size={11} className={isUpgrade ? "text-amber-500" : "text-emerald-500"} />
          <span className={cn(
            "rounded-lg px-2 py-0.5 text-[10px] font-bold",
            isUpgrade ? "bg-amber-500 text-white" : "bg-emerald-500 text-white",
          )}>
            {target.label}
          </span>
        </div>
        <span className={cn("ml-auto text-[9px] font-semibold", isUpgrade ? "text-amber-600" : "text-emerald-600")}>
          {isUpgrade ? "Naik Kelas" : "Turun Kelas"}
        </span>
      </div>

      {/* Price diff */}
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-[10px] font-semibold", isUpgrade ? "text-amber-700" : "text-emerald-700")}>
            Selisih tarif per malam
          </p>
          <p className={cn("text-[9.5px]", isUpgrade ? "text-amber-500" : "text-emerald-500")}>
            {fmtRp(current.tarif)} → {fmtRp(target.tarif)}
          </p>
        </div>
        <div className={cn(
          "rounded-xl px-3 py-2 text-center",
          isUpgrade ? "bg-amber-100" : "bg-emerald-100",
        )}>
          <p className={cn("text-[15px] font-bold tabular-nums", isUpgrade ? "text-amber-700" : "text-emerald-700")}>
            {isUpgrade ? "+" : "−"}{fmtRp(Math.abs(diff))}
          </p>
          <p className={cn("text-[8px] font-semibold", isUpgrade ? "text-amber-500" : "text-emerald-500")}>
            / malam
          </p>
        </div>
      </div>

      {/* Non-BPJS warning */}
      {isUpgrade && !target.bpjsEntitlement && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-100/80 px-2.5 py-2">
          <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[10px] leading-relaxed text-amber-700">
            <strong>{target.label}</strong> tidak tercover BPJS. Seluruh biaya akomodasi menjadi
            tanggung jawab pasien / penjamin sesuai Permenkes 28/2014.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── PaymentSourcePicker ──────────────────────────────────────

function PaymentSourcePicker({
  value, onChange,
}: {
  value: SumberPembayaran | "";
  onChange: (v: SumberPembayaran) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Sumber Pembayaran Selisih
      </p>
      <div className="grid grid-cols-3 gap-2">
        {SUMBER_BAYAR.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.97]",
              value === s.id
                ? "border-sky-400 bg-sky-50 shadow-sm ring-1 ring-sky-300/50"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[11px] font-bold",
                value === s.id ? "text-sky-700" : "text-slate-700",
              )}>
                {s.label}
              </span>
              <AnimatePresence>
                {value === s.id && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500"
                  >
                    <Check size={8} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="text-[9px] leading-snug text-slate-400">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────

function SuccessState({ targetId, onReset }: { targetId: KelasId; onReset: () => void }) {
  const target = KELAS_RAWAT.find(k => k.id === targetId)!;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-5 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
      >
        <Check size={28} className="text-emerald-600" />
      </motion.div>
      <div>
        <p className="text-[14px] font-bold text-slate-800">Permohonan Dikirim</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Perpindahan ke <span className="font-bold text-slate-600">{target.label}</span> sedang
          diproses oleh admin. Anda akan mendapat notifikasi setelah disetujui.
        </p>
      </div>
      <button
        type="button" onClick={onReset}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Ajukan Perubahan Lain
      </button>
    </motion.div>
  );
}

// ─── PindahKelas ──────────────────────────────────────────────

export function PindahKelas({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const currentId = CURRENT_KELAS_DEFAULT;

  const [targetId,  setTargetId]  = useState<KelasId>(currentId);
  const [sumber,    setSumber]    = useState<SumberPembayaran | "">("");
  const [alasan,    setAlasan]    = useState("");
  const [consent,   setConsent]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentIdx = KELAS_RAWAT.findIndex(k => k.id === currentId);
  const targetIdx  = KELAS_RAWAT.findIndex(k => k.id === targetId);
  const isChanged  = targetId !== currentId;
  const isUpgrade  = targetIdx > currentIdx;

  const canSubmit =
    isChanged &&
    consent &&
    alasan.trim().length > 0 &&
    (!isUpgrade || sumber !== "");

  const handleReset = () => {
    setTargetId(currentId); setSumber(""); setAlasan(""); setConsent(false); setSubmitted(false);
  };

  if (submitted) return <SuccessState targetId={targetId} onReset={handleReset} />;

  return (
    <div className="space-y-4">
      {/* Current class info */}
      <CurrentKelasCard kelasId={currentId} />

      {/* Class selector */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Pilih Kelas Tujuan
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {KELAS_RAWAT.map(kelas => (
            <KelasCard
              key={kelas.id}
              kelas={kelas}
              selected={targetId === kelas.id}
              isCurrent={currentId === kelas.id}
              onClick={() => setTargetId(kelas.id)}
            />
          ))}
        </div>
      </div>

      {/* Selisih section — animated in/out */}
      <AnimatePresence>
        {isChanged && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 overflow-hidden"
          >
            <SelisihBanner currentId={currentId} targetId={targetId} />

            {/* Payment source — only for upgrades */}
            <AnimatePresence>
              {isUpgrade && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <PaymentSourcePicker value={sumber} onChange={setSumber} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alasan */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Alasan Perubahan
        </p>
        <textarea
          value={alasan}
          onChange={e => setAlasan(e.target.value)}
          rows={3}
          placeholder="Jelaskan alasan permintaan pindah kelas rawat..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition"
        />
      </div>

      {/* Consent checkbox */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:bg-slate-50">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-sky-500"
        />
        <span className="text-[11px] leading-relaxed text-slate-600">
          Pasien / keluarga{" "}
          <span className="font-bold text-slate-800">menyetujui</span>{" "}
          perpindahan kelas rawat ini dan bersedia menanggung selisih biaya sesuai ketentuan
          RS yang berlaku.
        </span>
      </label>

      {/* Submit */}
      <div className="flex items-center justify-between">
        {!canSubmit && isChanged && (
          <p className="text-[10px] text-slate-400">
            {!alasan.trim() ? "Isi alasan perubahan" :
             !consent ? "Centang persetujuan pasien" :
             isUpgrade && !sumber ? "Pilih sumber pembayaran" : ""}
          </p>
        )}
        <div className="ml-auto">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setSubmitted(true)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold transition active:scale-95",
              canSubmit
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200 hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            <ChevronRight size={13} />
            Simpan Perubahan Kelas
          </button>
        </div>
      </div>
    </div>
  );
}
