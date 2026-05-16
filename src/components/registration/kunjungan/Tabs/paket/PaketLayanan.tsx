"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Package, AlertCircle, X, ChevronRight } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { type PaketLayananData, type KategoriPaket, PAKET_LIST, fmtRp } from "./paketTypes";

// ─── Constants ────────────────────────────────────────────────

const KATEGORI_LIST: KategoriPaket[] = [
  "Semua", "MCU", "Persalinan", "Bedah", "Dialisis", "Rehabilitasi",
];

const BADGE_STYLE: Record<string, string> = {
  Populer: "bg-sky-100 text-sky-700",
  Baru:    "bg-emerald-100 text-emerald-700",
  Promo:   "bg-amber-100 text-amber-700",
};

const BADGE_PREFIX: Record<string, string> = {
  Populer: "★ ",
  Baru:    "✦ ",
  Promo:   "⚡ ",
};

// ─── EmptyState ───────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Package size={20} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-slate-500">
          Tidak ada paket{label !== "Semua" ? ` kategori ${label}` : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Hubungi admin untuk informasi ketersediaan paket
        </p>
      </div>
    </motion.div>
  );
}

// ─── PackageCard ──────────────────────────────────────────────

function PackageCard({
  paket, isActive, onSelect, delay,
}: {
  paket: PaketLayananData;
  isActive: boolean;
  onSelect: (id: string) => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border transition-shadow",
        isActive
          ? "border-emerald-300 bg-emerald-50/30 shadow-md shadow-emerald-100/50"
          : "border-slate-200 bg-white hover:shadow-sm",
      )}
    >
      {/* Active accent top bar */}
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400" />
      )}

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-bold text-slate-800">{paket.nama}</p>
            {isActive && (
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">
                ✓ Aktif
              </span>
            )}
            {paket.badge && !isActive && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[8.5px] font-bold", BADGE_STYLE[paket.badge])}>
                {BADGE_PREFIX[paket.badge]}{paket.badge}
              </span>
            )}
          </div>
          <p className="text-[10.5px] leading-snug text-slate-500">{paket.deskripsi}</p>
        </div>

        {/* Service list */}
        <ul className="space-y-1">
          {paket.layanan.map(l => (
            <li key={l} className="flex items-start gap-1.5">
              <Check size={10} className="mt-0.5 shrink-0 text-sky-500" />
              <span className="text-[10.5px] leading-snug text-slate-600">{l}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-[14px] font-bold text-slate-800">{fmtRp(paket.harga)}</p>
            <p className="text-[9px] text-slate-400">sudah termasuk pajak</p>
          </div>
          {isActive ? (
            <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
              Paket Aktif
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(paket.id)}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
            >
              Pilih<ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ConfirmPanel ─────────────────────────────────────────────

function ConfirmPanel({
  paket, onConfirm, onCancel,
}: {
  paket: PaketLayananData;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl border border-sky-200 bg-sky-50 shadow-lg shadow-sky-100/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-100 bg-sky-500 px-4 py-3">
        <div>
          <p className="text-[12px] font-bold text-white">Konfirmasi Pilih Paket</p>
          <p className="text-[9.5px] text-white/70">Pastikan paket sesuai dengan kebutuhan pasien</p>
        </div>
        <button type="button" onClick={onCancel}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-white/80 transition hover:bg-white/25">
          <X size={12} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Package summary */}
        <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-sky-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100">
            <Package size={15} className="text-sky-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-slate-800">{paket.nama}</p>
            <p className="mt-0.5 text-[10.5px] text-slate-500">{paket.deskripsi}</p>
            <p className="mt-1.5 text-[14px] font-bold text-sky-700">{fmtRp(paket.harga)}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
          <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[10px] leading-relaxed text-amber-700">
            Paket ini akan <strong>menggantikan paket aktif</strong> saat ini. Perubahan berlaku
            setelah dikonfirmasi oleh admin.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
            Batal
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            Ya, Ganti Paket
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────

function SuccessState({ paket, onReset }: { paket: PaketLayananData; onReset: () => void }) {
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
        <p className="text-[14px] font-bold text-slate-800">Paket Berhasil Diganti</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          <span className="font-bold text-slate-600">{paket.nama}</span> kini menjadi paket
          aktif. Admin akan mengkonfirmasi perubahan ini.
        </p>
      </div>
      <button type="button" onClick={onReset}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
        Lihat Paket Lain
      </button>
    </motion.div>
  );
}

// ─── PaketLayanan ─────────────────────────────────────────────

export function PaketLayanan({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [kategori,   setKategori]   = useState<KategoriPaket>("Semua");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [submitted,  setSubmitted]  = useState(false);

  const filtered     = PAKET_LIST.filter(p => kategori === "Semua" || p.kategori === kategori);
  const confirmPaket = PAKET_LIST.find(p => p.id === confirming) ?? null;
  const activePaket  = PAKET_LIST.find(p => p.id === activeId)  ?? null;

  const handleConfirm = () => {
    setActiveId(confirming);
    setConfirming(null);
    setSubmitted(true);
  };

  if (submitted && activePaket) {
    return <SuccessState paket={activePaket} onReset={() => setSubmitted(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {KATEGORI_LIST.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKategori(k)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95",
              kategori === k
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Package grid with AnimatePresence for category change */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState key="empty" label={kategori} />
        ) : (
          <motion.div
            key={kategori}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            {filtered.map((paket, i) => (
              <PackageCard
                key={paket.id}
                paket={paket}
                isActive={paket.id === activeId}
                onSelect={setConfirming}
                delay={i * 0.04}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline confirm panel */}
      <AnimatePresence>
        {confirming && confirmPaket && (
          <ConfirmPanel
            key="confirm"
            paket={confirmPaket}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
