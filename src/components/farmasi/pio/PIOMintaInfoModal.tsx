"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addPIOEntry,
  KATEGORI_LIST,
  type KategoriPIO,
  type SumberPertanyaan,
  type UrgensipIO,
} from "./pioShared";

// ── Props ─────────────────────────────────────────────────

interface PatientContext {
  noRM:         string;
  name:         string;
  dpjp?:        string;
  perawatJaga?: string;
  unit?:        string;
}

interface Props {
  patient: PatientContext;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────

function defaultName(sumber: SumberPertanyaan, p: PatientContext): string {
  if (sumber === "Dokter")   return p.dpjp        ?? "";
  if (sumber === "Perawat")  return p.perawatJaga  ?? "";
  if (sumber === "Pasien")   return p.name;
  return "";
}

// ── Main ──────────────────────────────────────────────────

export default function PIOMintaInfoModal({ patient, onClose }: Props) {
  const [sumber,      setSumber]      = useState<SumberPertanyaan>("Perawat");
  const [namaPenanya, setNamaPenanya] = useState(patient.perawatJaga ?? "");
  const [unitAsal,    setUnitAsal]    = useState(patient.unit ?? "");
  const [kategori,    setKategori]    = useState<KategoriPIO>("Dosis");
  const [urgensi,     setUrgensi]     = useState<UrgensipIO>("Reguler");
  const [pertanyaan,  setPertanyaan]  = useState("");
  const [done,        setDone]        = useState(false);

  function handleSumberChange(s: SumberPertanyaan) {
    setSumber(s);
    setNamaPenanya(defaultName(s, patient));
  }

  function handleSubmit() {
    if (!pertanyaan.trim() || !namaPenanya.trim()) return;
    const now = new Date();
    addPIOEntry({
      id:          `pio-req-${Date.now()}`,
      noRM:        patient.noRM,
      tanggal:     now.toISOString().slice(0, 10),
      jam:         now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      urgensi, sumber, namaPenanya,
      unitAsal:    unitAsal.trim() || undefined,
      kategori, pertanyaan,
      apoteker:    "—",
      status:      "Pending",
    });
    setDone(true);
    setTimeout(onClose, 1800);
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  const labelCls = "text-[11px] font-semibold text-slate-500 block mb-1";
  const canSubmit = pertanyaan.trim().length > 0 && namaPenanya.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.96, y: 8  }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-50 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
            <BookOpen size={15} className="text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Minta Informasi Obat</p>
            <p className="text-[11px] text-slate-400">PIO · PMK 72/2016 Ps. 27</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-slate-100">
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            /* Success state */
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 px-6 py-12"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800">Pertanyaan Terkirim</p>
                <p className="mt-1 text-xs text-slate-500">Apoteker akan menjawab segera</p>
              </div>
            </motion.div>
          ) : (
            /* Form */
            <motion.div key="form" className="space-y-3 p-5">
              {/* Patient context chip */}
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-700">{patient.name}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="text-xs text-slate-500">{patient.noRM}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Penanya */}
                <div>
                  <label className={labelCls}>Penanya</label>
                  <select
                    value={sumber}
                    onChange={(e) => handleSumberChange(e.target.value as SumberPertanyaan)}
                    className={inputCls}
                  >
                    {(["Dokter", "Perawat", "Pasien", "Keluarga", "Apoteker"] as SumberPertanyaan[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Urgensi */}
                <div>
                  <label className={labelCls}>Urgensi</label>
                  <select
                    value={urgensi}
                    onChange={(e) => setUrgensi(e.target.value as UrgensipIO)}
                    className={inputCls}
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Urgent">Urgent (&lt;15 mnt)</option>
                  </select>
                </div>
                {/* Nama */}
                <div>
                  <label className={labelCls}>Nama Penanya <span className="text-rose-400">*</span></label>
                  <input
                    value={namaPenanya}
                    onChange={(e) => setNamaPenanya(e.target.value)}
                    placeholder="dr. / Ns. / nama"
                    className={inputCls}
                  />
                </div>
                {/* Kategori */}
                <div>
                  <label className={labelCls}>Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriPIO)}
                    className={inputCls}
                  >
                    {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                {/* Unit */}
                <div className="col-span-2">
                  <label className={labelCls}>Unit Asal</label>
                  <input
                    value={unitAsal}
                    onChange={(e) => setUnitAsal(e.target.value)}
                    placeholder="Bangsal / Poli / IGD"
                    className={inputCls}
                  />
                </div>
                {/* Pertanyaan */}
                <div className="col-span-2">
                  <label className={labelCls}>Pertanyaan <span className="text-rose-400">*</span></label>
                  <textarea
                    value={pertanyaan}
                    onChange={(e) => setPertanyaan(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan pertanyaan informasi obat secara jelas dan lengkap"
                    className={cn(inputCls, "resize-none")}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={14} />
                Kirim ke Apoteker
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
