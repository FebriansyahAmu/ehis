"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { ModalShell } from "../primitives";
import { POLI_OPTS } from "../config";

export function TambahJadwalModal({
  patient,
  onClose,
}: {
  patient: PatientMaster;
  onClose: () => void;
}) {
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("09:00");
  const [dokter, setDokter] = useState("");
  const [unit, setUnit] = useState<"Rawat Jalan" | "Rawat Inap" | "IGD">("Rawat Jalan");
  const [poli, setPoli] = useState("Poli Umum");
  const [keterangan, setKeterangan] = useState("");
  const [linkedKunjungan, setLinkedKunjungan] = useState(
    patient.riwayatKunjungan[0]?.noKunjungan ?? "",
  );

  const kunjunganOpts = patient.riwayatKunjungan.map((k) => ({
    value: k.noKunjungan,
    label: `${k.noKunjungan} · ${k.tanggal} (${k.unit})`,
  }));

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const labelCls =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400";

  const canSave = !!tanggal && !!dokter.trim();

  return (
    <ModalShell
      title="Tambah Jadwal Kontrol"
      subtitle={`${patient.name} · ${patient.noRM}`}
      onClose={onClose}
      size="md"
    >
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>
              Tanggal Kontrol <span className="text-rose-400 font-normal normal-case">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jam</label>
            <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Dokter <span className="text-rose-400 font-normal normal-case">*</span>
          </label>
          <input
            type="text"
            value={dokter}
            onChange={(e) => setDokter(e.target.value)}
            placeholder="dr. Nama Dokter, Sp.X"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Unit Tujuan</label>
          <div className="flex gap-1.5">
            {(["Rawat Jalan", "Rawat Inap", "IGD"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={cn(
                  "flex-1 cursor-pointer rounded-lg border py-2 text-[11px] font-semibold transition",
                  unit === u
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {unit === "Rawat Jalan" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <label className={labelCls}>Poli Tujuan</label>
              <select value={poli} onChange={(e) => setPoli(e.target.value)} className={inputCls}>
                {POLI_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className={labelCls}>Terkait Kunjungan</label>
          <select
            value={linkedKunjungan}
            onChange={(e) => setLinkedKunjungan(e.target.value)}
            className={inputCls}
          >
            {kunjunganOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Keterangan / Catatan</label>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Tujuan kontrol, pemeriksaan yang diperlukan..."
            rows={2}
            className={cn(inputCls, "resize-none")}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <p className="text-[10px] text-slate-400">
          <span className="text-rose-400">*</span> Wajib diisi
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            disabled={!canSave}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition",
              canSave
                ? "cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            <Calendar size={12} /> Simpan Jadwal
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
