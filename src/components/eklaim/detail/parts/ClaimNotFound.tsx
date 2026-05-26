"use client";

/**
 * ClaimNotFound — 404 state untuk halaman klaim detail (EK3.1).
 *
 * Ditampilkan saat `id` di URL tidak match satu pun klaim di `CLAIM_BOARD_MOCK`.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { FileSearch, ArrowLeft } from "lucide-react";

interface Props {
  id: string;
}

export default function ClaimNotFound({ id }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto mt-12 w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-200">
        <FileSearch size={26} strokeWidth={2} className="text-rose-600" />
      </div>
      <h2 className="mt-4 text-[16px] font-bold tracking-tight text-slate-900">
        Klaim tidak ditemukan
      </h2>
      <p className="mt-1 text-[13px] text-slate-500">
        ID klaim{" "}
        <span className="font-mono font-semibold text-slate-700">{id}</span>{" "}
        tidak ada di database. Mungkin sudah dihapus atau salah ketik.
      </p>
      <Link
        href="/ehis-eklaim/klaim"
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-teal-700 hover:shadow active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
      >
        <ArrowLeft size={12} strokeWidth={2.4} />
        Kembali ke Klaim Board
      </Link>
    </motion.section>
  );
}
