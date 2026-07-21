"use client";

import { motion } from "framer-motion";
import { LockOpen, AlertCircle, ListChecks, Receipt } from "lucide-react";

export type EmptyShiftVariant = "dashboard" | "quick" | "deposit";

interface Props {
  onBukaShift: () => void;
  /** Konteks pemanggil — menyesuaikan judul & penjelasan dengan aksi yang sedang dituju. */
  variant?: EmptyShiftVariant;
  /** Catatan tambahan, mis. tagihan yang menunggu dari deep-link "Terima Pembayaran". */
  note?: string;
}

const COPY: Record<EmptyShiftVariant, { title: string; desc: string }> = {
  dashboard: {
    title: "Belum ada shift terbuka",
    desc: "Sebelum menerima pembayaran, buka shift kasir terlebih dahulu. Sistem akan mengakumulasi semua transaksi pada shift ini sampai ditutup.",
  },
  quick: {
    title: "Buka shift dulu untuk menerima pembayaran",
    desc: "Setiap pembayaran tercatat sebagai bagian dari satu shift kasir — itu yang membuat kas bisa dipertanggungjawabkan saat tutup buku. Karena itu form pembayaran belum bisa dibuka.",
  },
  deposit: {
    title: "Buka shift dulu untuk menerima deposit",
    desc: "Deposit awal dicatat sebagai pembayaran pada shift berjalan, sehingga tak dapat diproses sebelum shift kasir dibuka.",
  },
};

/**
 * Empty state ketika tidak ada shift Open untuk kasir sesi sekarang.
 * Hero + pre-req list + CTA "Buka Shift Baru". Dipakai di ketiga tab (teks menyesuaikan `variant`)
 * agar tab yang dituju lewat deep-link tidak tampil kosong tanpa penjelasan.
 */
export default function EmptyShiftState({ onBukaShift, variant = "dashboard", note }: Props) {
  const copy = COPY[variant];
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      aria-label="Belum ada shift"
      className="flex flex-col items-center rounded-xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/40 to-white px-6 py-10 text-center dark:border-amber-900/40 dark:from-amber-950/15 dark:to-slate-900"
    >
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.05 }}
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-950/40"
      >
        <LockOpen size={26} strokeWidth={2.2} />
      </motion.div>

      <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
        {copy.title}
      </h3>
      <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
        {copy.desc}
      </p>

      {/* Tagihan yang menunggu (deep-link dari detail tagihan) */}
      {note && (
        <p className="mt-3 inline-flex max-w-md items-start gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-left text-[11.5px] font-medium text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900/50">
          <Receipt size={12} className="mt-0.5 flex-none" />
          <span>{note}</span>
        </p>
      )}

      {/* Pre-req hints */}
      <ul className="mt-4 inline-flex max-w-md flex-col gap-1 rounded-lg bg-white/80 px-4 py-2 text-left text-[11.5px] text-slate-600 ring-1 ring-amber-100 dark:bg-slate-900/60 dark:text-slate-400 dark:ring-amber-900/40">
        <PreReq label="Pilih counter yang tersedia (tidak boleh double-occupy)" />
        <PreReq label="Catat saldo kas fisik awal di laci (untuk verifikasi tutup shift)" />
        <PreReq label="Sertakan catatan serah-terima dari shift sebelumnya jika ada" />
      </ul>

      <p className="mt-3 inline-flex items-center gap-1 text-[10.5px] text-amber-700 dark:text-amber-300">
        <AlertCircle size={11} />
        Tanpa shift Open, fitur form pembayaran akan dinonaktifkan
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={onBukaShift}
        className="group mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow active:scale-[0.97]"
      >
        <LockOpen size={14} className="transition-transform group-hover:-rotate-12" />
        Buka Shift Baru
      </button>
    </motion.section>
  );
}

function PreReq({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-1.5">
      <ListChecks size={11} className="mt-0.5 flex-none text-amber-600/80" />
      <span>{label}</span>
    </li>
  );
}
