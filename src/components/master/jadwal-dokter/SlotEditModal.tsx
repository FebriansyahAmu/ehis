"use client";

// Master Jadwal Dokter — modal edit/tambah/hapus slot praktik satu hari.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Trash2, ShieldCheck, Wallet, Timer } from "lucide-react";
import {
  upsertSlot,
  removeSlot,
  type Hari,
  type JadwalDokter,
  type JadwalSlot,
} from "@/lib/master/jadwalDokterStore";

export function SlotEditModal({
  dokter,
  hari,
  slot,
  onClose,
}: {
  dokter: JadwalDokter;
  hari: Hari;
  slot?: JadwalSlot;
  onClose: () => void;
}) {
  const [jamMulai, setJamMulai] = useState(slot?.jamMulai ?? "08:00");
  const [jamSelesai, setJamSelesai] = useState(slot?.jamSelesai ?? "12:00");
  const [kuotaJKN, setKuotaJKN] = useState(slot?.kuotaJKN ?? 20);
  const [kuotaNonJKN, setKuotaNonJKN] = useState(slot?.kuotaNonJKN ?? 8);
  const [menit, setMenit] = useState(slot?.menitPerPasien ?? 12);

  const save = () => {
    upsertSlot(dokter.dokterKode, hari, {
      jamMulai,
      jamSelesai,
      kuotaJKN,
      kuotaNonJKN,
      menitPerPasien: menit,
    });
    onClose();
  };

  const hapus = () => {
    removeSlot(dokter.dokterKode, hari);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-start gap-3 border-b border-slate-100 bg-sky-50/60 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-800">{slot ? "Ubah" : "Tambah"} Slot — {hari}</h3>
              <p className="text-xs text-slate-500">{dokter.dokterNama} · {dokter.poliNama}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Jam Mulai" value={jamMulai} onChange={setJamMulai} />
              <TimeField label="Jam Selesai" value={jamSelesai} onChange={setJamSelesai} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Kuota JKN" icon={ShieldCheck} value={kuotaJKN} onChange={setKuotaJKN} tone="text-emerald-500" />
              <NumField label="Kuota Non-JKN" icon={Wallet} value={kuotaNonJKN} onChange={setKuotaNonJKN} tone="text-slate-400" />
            </div>
            <NumField label="Menit per Pasien" icon={Timer} value={menit} onChange={setMenit} tone="text-sky-500" />
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              Estimasi kapasitas:{" "}
              <span className="font-bold text-slate-700">{kuotaJKN + kuotaNonJKN} pasien</span> ·{" "}
              durasi layanan ±{menit} mnt/pasien.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5">
            {slot ? (
              <button
                type="button"
                onClick={hapus}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
                Batal
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function NumField({
  label,
  icon: Icon,
  value,
  onChange,
  tone,
}: {
  label: string;
  icon: typeof ShieldCheck;
  value: number;
  onChange: (v: number) => void;
  tone: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className={`h-3.5 w-3.5 ${tone}`} /> {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
