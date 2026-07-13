"use client";

// Layar penjaga akses rekam medis (dipakai resolver IGD/RI). Kunjungan yang ordernya BELUM
// DITERIMA unit (status Registered) atau sudah DIBATALKAN (Cancelled) tidak boleh membuka
// rekam medis — pengisian klinis dimulai setelah "Terima Order/Terima Pasien" di worklist.
// Gate ini menutup semua pintu masuk (URL langsung, link "Buka Rekam Medis" registrasi).

import Link from "next/link";
import { motion } from "framer-motion";
import { Hourglass, Ban, ArrowLeft, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecordGateVariant = "belum-diterima" | "dibatalkan";

const CFG: Record<RecordGateVariant, {
  icon: IconComponent;
  title: string;
  message: string;
  iconCls: string;
  ringCls: string;
  stripe: string;
}> = {
  "belum-diterima": {
    icon: Hourglass,
    title: "Order Belum Diterima",
    message:
      "Rekam medis belum dapat dibuka. Pengisian klinis dimulai setelah unit menerima order pasien ini.",
    iconCls: "text-amber-500",
    ringCls: "bg-amber-50 ring-amber-200",
    stripe: "bg-amber-400",
  },
  dibatalkan: {
    icon: Ban,
    title: "Kunjungan Dibatalkan",
    message: "Order kunjungan ini telah dibatalkan — rekam medis tidak tersedia.",
    iconCls: "text-rose-500",
    ringCls: "bg-rose-50 ring-rose-200",
    stripe: "bg-rose-400",
  },
};

export default function RecordGateScreen({
  variant, nama, noRm, hint, backHref, backLabel,
}: {
  variant: RecordGateVariant;
  nama: string;
  noRm: string;
  /** Petunjuk tindak lanjut spesifik unit (mis. "Terima order melalui worklist bangsal…"). */
  hint?: string;
  backHref: string;
  backLabel: string;
}) {
  const c = CFG[variant];
  const Icon = c.icon;
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className={cn("h-1.5", c.stripe)} />
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl ring-1", c.ringCls)}>
            <Icon size={26} className={c.iconCls} />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">{c.title}</h1>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{nama}</span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                <Hash size={9} /> {noRm}
              </span>
            </p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-slate-500">{c.message}</p>
          {hint && variant === "belum-diterima" && (
            <p className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              {hint}
            </p>
          )}
          <Link
            href={backHref}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95"
          >
            <ArrowLeft size={13} /> {backLabel}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
