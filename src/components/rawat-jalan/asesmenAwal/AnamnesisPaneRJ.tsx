"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Sparkles } from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type AnamnesisRJData,
  ANAMNESIS_RJ_TEMPLATES,
  ASESMEN_RJ_MOCK,
} from "./asesmenAwalRJShared";

// ── Primitives ────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

const TA_CLS = "w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={TA_CLS} />
    </div>
  );
}

function Block({ title, badge, children }: { title?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{badge}</span>}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Template picker ───────────────────────────────────────

function TemplatePicker({ onApply }: { onApply: (t: typeof ANAMNESIS_RJ_TEMPLATES[number]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100">
        <Sparkles size={12} /> Template Cepat
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-8 z-20 w-52 rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {ANAMNESIS_RJ_TEMPLATES.map(t => (
              <button key={t.id} type="button"
                onClick={() => { onApply(t); setOpen(false); }}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-xs transition hover:bg-sky-50 first:rounded-t-xl last:rounded-b-xl">
                <FileText size={13} className="mt-0.5 shrink-0 text-sky-500" />
                <span className="font-semibold text-slate-700">{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface Props {
  patient:    RJPatientDetail;
  onComplete?: (done: boolean) => void;
}

// ── Main component ────────────────────────────────────────

export default function AnamnesisPaneRJ({ patient, onComplete }: Props) {
  const mock = ASESMEN_RJ_MOCK[patient.noRM];

  const [form, setForm] = useState<AnamnesisRJData>({
    keluhanUtama:   mock?.keluhanUtama   ?? "",
    rps:            mock?.rps            ?? "",
    onsetDurasi:    mock?.onsetDurasi    ?? "",
    faktorPemberat: mock?.faktorPemberat ?? "",
    faktorPemerut:  mock?.faktorPemerut  ?? "",
    keadaanUmum:    mock?.keadaanUmum   ?? "",
    obatSaatIni:    mock?.obatSaatIni    ?? (patient.obatSaatIni ?? ""),
    savedAt: "",
  });

  function set<K extends keyof AnamnesisRJData>(k: K, v: AnamnesisRJData[K]) {
    const updated = { ...form, [k]: v };
    setForm(updated);
    const done =
      updated.keluhanUtama.trim().length > 3 &&
      updated.rps.trim().length > 10 &&
      updated.keadaanUmum.trim().length > 3;
    onComplete?.(done);
  }

  function applyTemplate(t: typeof ANAMNESIS_RJ_TEMPLATES[number]) {
    const updated = {
      ...form,
      keluhanUtama:   t.keluhanUtama,
      rps:            t.rps,
      onsetDurasi:    t.onsetDurasi,
      faktorPemberat: t.faktorPemberat,
      faktorPemerut:  t.faktorPemerut,
      keadaanUmum:    t.keadaanUmum,
    };
    setForm(updated);
    onComplete?.(updated.keluhanUtama.length > 3 && updated.rps.length > 10);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">

      {/* ── Left: form ── */}
      <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">

        {/* Keluhan & RPS */}
        <Block title="Keluhan & Anamnesis" badge="Wajib">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Lengkapi riwayat penyakit sekarang</span>
            <TemplatePicker onApply={applyTemplate} />
          </div>
          <TA label="Keluhan Utama" required value={form.keluhanUtama}
            onChange={v => set("keluhanUtama", v)}
            placeholder="Keluhan utama yang membawa pasien ke poliklinik..." />
          <TA label="Riwayat Penyakit Sekarang (RPS)" rows={4} required
            value={form.rps} onChange={v => set("rps", v)}
            placeholder="Kronologis keluhan: kapan mulai, bagaimana perkembangannya, gejala penyerta, sudah berobat sebelumnya..." />
          <div className="grid gap-3 sm:grid-cols-3">
            <TA label="Onset / Durasi"   value={form.onsetDurasi}    onChange={v => set("onsetDurasi", v)}    placeholder="Mendadak, ± 3 hari..." />
            <TA label="Faktor Pemberat"  value={form.faktorPemberat} onChange={v => set("faktorPemberat", v)} placeholder="Aktivitas, posisi..." />
            <TA label="Faktor Peringan"  value={form.faktorPemerut}  onChange={v => set("faktorPemerut", v)}  placeholder="Istirahat, obat..." />
          </div>
        </Block>

        {/* Keadaan Umum */}
        <Block title="Keadaan Umum" badge="Wajib">
          <p className="text-[11px] text-slate-400">Deskripsi singkat kondisi pasien saat diperiksa. Pemeriksaan fisik lengkap di tab Pemeriksaan Fisik.</p>
          <TA label="Status Generalis" rows={2} required value={form.keadaanUmum}
            onChange={v => set("keadaanUmum", v)}
            placeholder="Tampak sakit ringan/sedang/berat, kesadaran, posisi pasien..." />
        </Block>

        {/* Obat Saat Ini */}
        <Block title="Obat yang Sedang Diminum">
          <TA label="Daftar Obat" rows={3} value={form.obatSaatIni}
            onChange={v => set("obatSaatIni", v)}
            placeholder="Nama obat, dosis, frekuensi — satu per baris..." />
          <p className="text-[11px] text-slate-400">Riwayat obat lengkap ada di sub-tab Riwayat Medis.</p>
        </Block>

        <div className="flex justify-end">
          <button type="button"
            className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700">
            Simpan Anamnesis
          </button>
        </div>
      </div>

      {/* ── Right: visit history ── */}
      <div className="flex flex-col gap-2 md:w-72 md:shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-3">
            <span className="text-xs font-semibold text-slate-700">Riwayat Kunjungan</span>
          </div>
          {patient.riwayatKunjungan.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada riwayat kunjungan</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {patient.riwayatKunjungan.map((kunjungan, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                      {kunjungan.tanggal}
                    </span>
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                      {kunjungan.unit}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800">{kunjungan.diagnosa}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{kunjungan.catatan}</p>
                  <p className="mt-2 text-[11px] italic text-slate-400">{kunjungan.dokter}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
