"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, X, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SMF_LIST,
  URGENCY_CONFIG,
  type UrgencyKonsultasi,
  type SmfOption,
  type KonsultasiItem,
} from "./konsultasiShared";

interface Props {
  noRM: string;
  dokterPeminta: string;
  onSubmit: (item: KonsultasiItem) => void;
  onCancel: () => void;
}

type SbarKey = "situation" | "background" | "assessment" | "recommendation";

const SBAR_FIELDS: { key: SbarKey; label: string; hint: string; rows: number; required: boolean }[] = [
  { key: "situation",      label: "S — Situation",      rows: 3, required: true,
    hint: "Kondisi klinis saat ini yang memerlukan konsultasi" },
  { key: "background",     label: "B — Background",     rows: 3, required: false,
    hint: "Riwayat relevan, diagnosis, hasil pemeriksaan, obat-obatan" },
  { key: "assessment",     label: "A — Assessment",     rows: 2, required: false,
    hint: "Penilaian/asesmen dokter peminta saat ini" },
  { key: "recommendation", label: "R — Recommendation", rows: 2, required: true,
    hint: "Yang dimohon dari dokter konsultan (pertanyaan klinis spesifik)" },
];

const SBAR_COLORS: Record<SbarKey, string> = {
  situation:      "bg-sky-50 text-sky-700",
  background:     "bg-violet-50 text-violet-700",
  assessment:     "bg-amber-50 text-amber-700",
  recommendation: "bg-emerald-50 text-emerald-700",
};

export default function RequestPane({ noRM, dokterPeminta, onSubmit, onCancel }: Props) {
  const [selectedSmf, setSelectedSmf] = useState<SmfOption | null>(null);
  const [smfQuery,    setSmfQuery]    = useState("");
  const [smfOpen,     setSmfOpen]     = useState(false);
  const [urgency,     setUrgency]     = useState<UrgencyKonsultasi>("Rutin");
  const [dokterKons,  setDokterKons]  = useState("");
  const [sbar, setSbar] = useState<Record<SbarKey, string>>({
    situation: "", background: "", assessment: "", recommendation: "",
  });
  const [errors, setErrors] = useState<Partial<Record<SbarKey | "smf", string>>>({});

  const smfRef = useRef<HTMLDivElement>(null);

  const filteredSmf = SMF_LIST.filter(s =>
    s.nama.toLowerCase().includes(smfQuery.toLowerCase()) ||
    s.singkatan.toLowerCase().includes(smfQuery.toLowerCase()),
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (smfRef.current && !smfRef.current.contains(e.target as Node)) setSmfOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function validate() {
    const errs: typeof errors = {};
    if (!selectedSmf)              errs.smf          = "Pilih SMF tujuan";
    if (!sbar.situation.trim())    errs.situation     = "Wajib diisi";
    if (!sbar.recommendation.trim()) errs.recommendation = "Wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !selectedSmf) return;
    const item: KonsultasiItem = {
      id:              `kons-${Date.now()}`,
      noRM,
      tanggalRequest:  "2026-05-09",
      waktuRequest:    "10:00",
      urgency,
      smfId:           selectedSmf.id,
      smfNama:         selectedSmf.nama,
      smfSingkatan:    selectedSmf.singkatan,
      dokterKonsultan: dokterKons || undefined,
      dokterPeminta,
      ...sbar,
      status: "Terkirim",
    };
    onSubmit(item);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Permintaan Konsultasi Baru</h3>
          <p className="text-[11px] text-slate-400">Format SBAR · Standar SNARS SKP 2</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">

        {/* SMF + Dokter */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* SMF searchable dropdown */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              SMF Tujuan <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={smfRef}>
              <button
                type="button"
                onClick={() => setSmfOpen(v => !v)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all",
                  errors.smf
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-white hover:border-sky-300",
                  smfOpen && "border-sky-400 ring-1 ring-sky-200",
                )}
              >
                <span className={selectedSmf ? "text-slate-800" : "text-slate-400"}>
                  {selectedSmf ? `${selectedSmf.singkatan} — ${selectedSmf.nama}` : "Pilih SMF..."}
                </span>
                <ChevronDown
                  size={14}
                  className={cn("text-slate-400 transition-transform", smfOpen && "rotate-180")}
                />
              </button>

              {smfOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <Search size={12} className="text-slate-400" />
                    <input
                      autoFocus
                      value={smfQuery}
                      onChange={e => setSmfQuery(e.target.value)}
                      placeholder="Cari SMF..."
                      className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredSmf.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSmf(s); setSmfOpen(false); setSmfQuery(""); }}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-sky-50",
                          selectedSmf?.id === s.id && "bg-sky-50 font-semibold text-sky-700",
                        )}
                      >
                        <span className="w-8 shrink-0 rounded bg-slate-100 px-1 py-0.5 text-center text-[10px] font-bold text-slate-500">
                          {s.singkatan}
                        </span>
                        <span>{s.nama}</span>
                      </button>
                    ))}
                    {filteredSmf.length === 0 && (
                      <p className="px-3 py-3 text-xs text-slate-400">SMF tidak ditemukan</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.smf && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                <AlertCircle size={11} />{errors.smf}
              </p>
            )}
          </div>

          {/* Dokter konsultan */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Dokter Konsultan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              value={dokterKons}
              onChange={e => setDokterKons(e.target.value)}
              placeholder="dr. Nama Konsultan, Sp.XX"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition hover:border-sky-300 focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />
          </div>
        </div>

        {/* Urgency picker */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">Urgensi</label>
          <div className="flex gap-2">
            {(["Rutin", "Urgen", "CITO"] as UrgencyKonsultasi[]).map(u => {
              const cfg = URGENCY_CONFIG[u];
              const active = urgency === u;
              return (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-xl border-2 py-3 text-center transition-all",
                    active
                      ? `${cfg.selBorder} ${cfg.selBg}`
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <span className={cn("text-xs font-bold", active ? cfg.selText : "text-slate-600")}>
                    {u}
                  </span>
                  <span className={cn("text-[10px]", active ? cfg.selText : "text-slate-400")}>
                    {cfg.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SBAR fields */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Format SBAR</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="space-y-4">
            {SBAR_FIELDS.map(({ key, label, hint, rows, required }) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", SBAR_COLORS[key])}>
                    {label}
                  </span>
                  {required && <span className="text-red-500 text-xs">*</span>}
                </div>
                <p className="mb-1.5 text-[11px] text-slate-400">{hint}</p>
                <textarea
                  rows={rows}
                  value={sbar[key]}
                  onChange={e => setSbar(p => ({ ...p, [key]: e.target.value }))}
                  className={cn(
                    "w-full resize-y rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400",
                    errors[key]
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-slate-200 hover:border-sky-300 focus:border-sky-400 focus:ring-1 focus:ring-sky-200",
                  )}
                />
                {errors[key] && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={11} />{errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          <Send size={13} />
          Kirim Permintaan
        </button>
      </div>
    </motion.div>
  );
}
