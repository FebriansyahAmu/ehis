"use client";

// ANT-ONSITE — Step 1: pilih Pasien Lama / Pasien Baru.

import { motion } from "framer-motion";
import { UserCheck, UserPlus, X, Hand } from "lucide-react";
import { ChoiceCard } from "../apmUi";

export function StepWelcome({
  onChoose,
  onExit,
}: {
  onChoose: (jenis: "Lama" | "Baru") => void;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-10 pt-6">
      <button
        type="button"
        onClick={onExit}
        title="Tutup mode kiosk"
        className="absolute right-2 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-200 hover:text-slate-500"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700">
          <Hand className="h-4 w-4" aria-hidden />
          Selamat datang
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">
          Ambil Nomor Antrean
        </h1>
        <p className="max-w-md text-lg text-slate-500">
          Silakan pilih status pendaftaran Anda untuk memulai.
        </p>
      </motion.div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <ChoiceCard
          title="Pasien Lama"
          subtitle="Sudah pernah berobat & memiliki No. Rekam Medis"
          icon={UserCheck}
          accent="indigo"
          className="p-8"
          onClick={() => onChoose("Lama")}
        />
        <ChoiceCard
          title="Pasien Baru"
          subtitle="Belum pernah berobat di rumah sakit ini"
          icon={UserPlus}
          accent="cyan"
          className="p-8"
          onClick={() => onChoose("Baru")}
        />
      </div>

      <p className="text-sm text-slate-400">
        Sentuh salah satu pilihan di atas untuk melanjutkan.
      </p>
    </div>
  );
}
