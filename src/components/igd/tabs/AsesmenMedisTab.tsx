"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, Utensils, ShieldAlert, AlertTriangle,
  Trash2, Plus, CheckCircle2, HelpCircle, ShieldCheck,
  Check, X, ChevronDown, FileText, Sparkles,
  ClipboardList, History, Salad, BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import EdukasiPane from "@/components/igd/tabs/EdukasiPane";
import GiziPane    from "@/components/shared/asesmen/GiziPane";

// ── Shared compact primitives ─────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function Block({ title, badge, children, className }: {
  title?: string; badge?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{badge}</span>}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea
        rows={rows} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function TI({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type="text" value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

// ── Sub-tab definitions ───────────────────────────────────

type SubTabId = "anamnesis" | "riwayat" | "alergi" | "skrining" | "edukasi";

interface SubTabDef {
  id: SubTabId;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  standard: string;
}

const SUB_TABS: SubTabDef[] = [
  { id: "anamnesis", label: "Anamnesis",     sublabel: "Keluhan & Anamnesis", icon: ClipboardList, standard: "AP 1.1"   },
  { id: "riwayat",   label: "Riwayat Medis", sublabel: "RPD · Obat · Kel.",   icon: History,       standard: "AP 1.1"   },
  { id: "alergi",    label: "Alergi",         sublabel: "Riwayat Alergi",     icon: AlertTriangle, standard: "AP 1.1"   },
  { id: "skrining",  label: "Skrining Gizi",  sublabel: "MUST · Nutrisi",     icon: Salad,         standard: "AP 1.3"   },
  { id: "edukasi",   label: "Edukasi",        sublabel: "Informasi Pasien",   icon: BookOpen,      standard: "HPK 2"    },
];

// ── SubNavItem ────────────────────────────────────────────

function SubNavItem({
  tab, active, done, onClick,
}: { tab: SubTabDef; active: boolean; done: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
        active
          ? "border-sky-300 bg-sky-600 shadow-md shadow-sky-100"
          : done
          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
        active ? "bg-white/20 text-white"
          : done ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}>
        {done && !active ? <CheckCircle2 size={14} /> : <Icon size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-[11px] font-bold leading-tight",
          active ? "text-white" : done ? "text-emerald-800" : "text-slate-700",
        )}>
          {tab.label}
        </p>
        <p className={cn(
          "mt-0.5 truncate text-[9px] font-medium leading-tight",
          active ? "text-white/70" : done ? "text-emerald-600" : "text-slate-400",
        )}>
          {tab.sublabel}
        </p>
      </div>
      <span className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold",
        active ? "bg-white/20 text-white/90"
          : done ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}>
        {tab.standard}
      </span>
      {active && (
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-white/50" />
      )}
    </button>
  );
}

// ── ProgressHeader ────────────────────────────────────────

function ProgressHeader({ doneCount, total }: { doneCount: number; total: number }) {
  const pct     = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      allDone ? "border-emerald-200 bg-emerald-50" : "border-sky-100 bg-linear-to-r from-sky-50 to-white",
    )}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className={cn("text-xs font-bold", allDone ? "text-emerald-800" : "text-sky-800")}>
            {allDone ? "Asesmen Medis Lengkap" : "Asesmen Medis IGD"}
          </p>
          <p className={cn("mt-0.5 text-[10px]", allDone ? "text-emerald-600" : "text-sky-600")}>
            {allDone
              ? "Semua komponen asesmen telah diisi — PMK 47/2018 terpenuhi"
              : `${doneCount} dari ${total} komponen selesai · Selesaikan sebelum pasien dipindahkan`}
          </p>
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-black text-sm tabular-nums",
          allDone ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-sky-300 bg-white text-sky-700",
        )}>
          {pct}<span className="text-[8px] font-bold">%</span>
        </div>
      </div>
      <div className="flex gap-1">
        {SUB_TABS.map((tab, i) => {
          const segDone = i < doneCount;
          return (
            <div
              key={tab.id}
              className={cn(
                "h-[5px] flex-1 rounded-full transition-colors duration-300",
                segDone ? (allDone ? "bg-emerald-400" : "bg-sky-400") : "bg-slate-200",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── IGD Anamnesis Templates ───────────────────────────────

const IGD_TEMPLATES = [
  {
    id: "nyeri-dada", label: "Nyeri Dada / Angina",
    keluhanUtama: "Nyeri dada kiri menjalar ke lengan kiri",
    rps: "Pasien mengeluh nyeri dada kiri seperti ditekan sejak ± 1 jam. Nyeri menjalar ke lengan kiri. Disertai keringat dingin dan mual. Tidak membaik dengan istirahat.",
    onsetDurasi: "Mendadak, ± 1 jam", mekanismeCedera: "",
    faktorPemberat: "Aktivitas fisik, emosi", faktorPemerut: "Istirahat, nitrogliserin sublingual",
    statusGeneralis: "Tampak sakit sedang, kompos mentis, akral dingin, diaforesis",
  },
  {
    id: "sesak-napas", label: "Sesak Napas Akut",
    keluhanUtama: "Sesak napas mendadak",
    rps: "Pasien mengeluh sesak napas mendadak sejak ± 2 jam. Sesak memberat saat berbaring (ortopnea). Disertai batuk dan bengkak kedua tungkai.",
    onsetDurasi: "Mendadak, ± 2 jam", mekanismeCedera: "",
    faktorPemberat: "Berbaring, aktivitas fisik", faktorPemerut: "Posisi duduk tegak",
    statusGeneralis: "Tampak sakit berat, kompos mentis, sesak, RR meningkat, SpO2 turun",
  },
  {
    id: "nyeri-abdomen", label: "Nyeri Abdomen Akut",
    keluhanUtama: "Nyeri perut hebat, mual, muntah",
    rps: "Pasien mengeluh nyeri perut sejak ± 4 jam. Nyeri di perut kanan bawah / epigastrium. Disertai mual, muntah, dan demam.",
    onsetDurasi: "Bertahap, ± 4–6 jam", mekanismeCedera: "",
    faktorPemberat: "Makan, gerakan", faktorPemerut: "Posisi tertentu",
    statusGeneralis: "Tampak sakit sedang, kompos mentis, demam, abdomen tegang saat palpasi",
  },
  {
    id: "trauma", label: "Trauma / Kecelakaan",
    keluhanUtama: "Nyeri setelah trauma / kecelakaan",
    rps: "Pasien datang dengan nyeri akibat trauma. Mekanisme cedera: kecelakaan lalu lintas / jatuh / benturan langsung. Disertai perdarahan / deformitas / keterbatasan gerak.",
    onsetDurasi: "Akut, segera setelah trauma", mekanismeCedera: "Benturan langsung / KLL",
    faktorPemberat: "Pergerakan, penekanan", faktorPemerut: "Immobilisasi, kompres",
    statusGeneralis: "Tampak sakit sedang–berat, kesadaran sesuai GCS, terdapat luka / deformitas",
  },
] as const;

type IGDTemplate = typeof IGD_TEMPLATES[number];

// ── Template picker ───────────────────────────────────────

function TemplatePicker({ onApply }: { onApply: (t: IGDTemplate) => void }) {
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
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-8 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {IGD_TEMPLATES.map(t => (
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

// ── Mock: previous medical notes ─────────────────────────

const PREV_NOTES = [
  {
    tanggal: "10 Jan 2026", unit: "Poli Jantung",
    dokter: "dr. Hendra Wijaya, Sp.JP",
    diagnosa: "CAD, Hipertensi Grade II",
    catatan: "Pasien kontrol rutin. TD 150/90 mmHg. Terapi dilanjutkan: amlodipine 5 mg, bisoprolol 2.5 mg.",
  },
  {
    tanggal: "15 Nov 2025", unit: "IGD",
    dokter: "dr. Rizal Akbar, Sp.EM",
    diagnosa: "Nyeri Dada Atipikal",
    catatan: "EKG: sinus rhythm, normal. Enzim jantung negatif. Dipulangkan dengan terapi simtomatik.",
  },
  {
    tanggal: "03 Agu 2025", unit: "Poli Penyakit Dalam",
    dokter: "dr. Anisa Putri, Sp.PD",
    diagnosa: "Hipertensi, DM Tipe 2",
    catatan: "HbA1c 8.2%. Gula darah puasa 180 mg/dL. Penyesuaian dosis metformin.",
  },
];

// ─────────────────────────────────────────────────────────
// ANAMNESIS sub-tab
// ─────────────────────────────────────────────────────────

type SumberAnamnesis = "Pasien" | "Keluarga" | "Pengantar" | "Rekam Medis";

interface AnamnesisIGDForm {
  sumberAnamnesis: SumberAnamnesis | "";
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera: string;
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  obatSaatIni: string;
}

function AnamnesisPane({
  patient, onComplete,
}: { patient: IGDPatientDetail; onComplete?: (done: boolean) => void }) {
  const [form, setForm] = useState<AnamnesisIGDForm>({
    sumberAnamnesis: "Pasien",
    keluhanUtama: patient.complaint,
    rps: patient.riwayatPenyakitSekarang,
    onsetDurasi: "",
    mekanismeCedera: patient.mekanismeCedera ?? "",
    faktorPemberat: "",
    faktorPemerut: "",
    statusGeneralis: patient.pemeriksaanFisikUmum,
    obatSaatIni: patient.obatSaatIni ?? "",
  });

  function set<K extends keyof AnamnesisIGDForm>(k: K, v: AnamnesisIGDForm[K]) {
    const updated = { ...form, [k]: v };
    setForm(updated);
    const done = updated.keluhanUtama.trim().length > 3 && updated.rps.trim().length > 10 && updated.statusGeneralis.trim().length > 3;
    onComplete?.(done);
  }

  function applyTemplate(t: IGDTemplate) {
    const updated: AnamnesisIGDForm = {
      ...form,
      keluhanUtama:    t.keluhanUtama,
      rps:             t.rps,
      onsetDurasi:     t.onsetDurasi,
      mekanismeCedera: t.mekanismeCedera,
      faktorPemberat:  t.faktorPemberat,
      faktorPemerut:   t.faktorPemerut,
      statusGeneralis: t.statusGeneralis,
    };
    setForm(updated);
    onComplete?.(updated.keluhanUtama.length > 3 && updated.rps.length > 10);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">

      {/* ── Left: form ── */}
      <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">

        {/* Sumber anamnesis — IGD-specific: siapa yang memberi keterangan */}
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sumber Anamnesis<span className="ml-0.5 text-rose-400">*</span>
          </p>
          {(["Pasien", "Keluarga", "Pengantar", "Rekam Medis"] as SumberAnamnesis[]).map(s => (
            <button key={s} type="button" onClick={() => set("sumberAnamnesis", s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                form.sumberAnamnesis === s
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50/40",
              )}>
              {s}
            </button>
          ))}
        </div>

        {/* Keluhan & RPS */}
        <Block title="Keluhan & Anamnesis" badge="Wajib">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Lengkapi riwayat penyakit sekarang</span>
            <TemplatePicker onApply={applyTemplate} />
          </div>
          <TA label="Keluhan Utama" required value={form.keluhanUtama}
            onChange={v => set("keluhanUtama", v)} placeholder="Keluhan utama yang membawa pasien ke IGD..." />
          <TA label="Riwayat Penyakit Sekarang (RPS)" rows={4} required value={form.rps}
            onChange={v => set("rps", v)}
            placeholder="Kronologis keluhan: kapan mulai, bagaimana perkembangannya, gejala penyerta, sudah berobat sebelumnya..." />
          <div className="grid gap-3 sm:grid-cols-3">
            <TA label="Onset / Durasi" value={form.onsetDurasi}
              onChange={v => set("onsetDurasi", v)} placeholder="Mendadak, ± 2 jam..." />
            <TA label="Faktor Pemberat" value={form.faktorPemberat}
              onChange={v => set("faktorPemberat", v)} placeholder="Aktivitas, posisi..." />
            <TA label="Faktor Peringan" value={form.faktorPemerut}
              onChange={v => set("faktorPemerut", v)} placeholder="Istirahat, obat..." />
          </div>
          {/* Mekanisme cedera — hanya relevan jika trauma */}
          <TA label="Mekanisme Cedera (jika trauma)" value={form.mekanismeCedera}
            onChange={v => set("mekanismeCedera", v)}
            placeholder="Contoh: KLL, jatuh dari ketinggian, benturan langsung — kosongkan jika bukan trauma" />
        </Block>

        {/* Status Generalis */}
        <Block title="Status Generalis" badge="Wajib">
          <p className="text-[11px] text-slate-400">Deskripsi singkat keadaan umum pasien. Pemeriksaan fisik lengkap ada di tab Pemeriksaan Fisik.</p>
          <TA label="Keadaan Umum" rows={2} required value={form.statusGeneralis}
            onChange={v => set("statusGeneralis", v)}
            placeholder="Tampak sakit sedang/berat, kesadaran, tanda vital awal, kondisi umum..." />
        </Block>

        {/* Obat saat ini */}
        <Block title="Obat yang Sedang Diminum">
          <TA label="Daftar Obat" rows={3} value={form.obatSaatIni}
            onChange={v => set("obatSaatIni", v)}
            placeholder="Nama obat, dosis, frekuensi — satu per baris..." />
          <p className="text-[11px] text-slate-400">Riwayat obat lengkap dengan indikasi ada di sub-tab Riwayat Medis.</p>
        </Block>

        <div className="flex justify-end">
          <button type="button"
            className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700">
            Simpan Anamnesis
          </button>
        </div>
      </div>

      {/* ── Right: previous notes ── */}
      <div className="flex flex-col gap-2 md:w-80 md:shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <span className="text-xs font-semibold text-slate-700">Catatan Medis Sebelumnya</span>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {PREV_NOTES.map((note, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                    {note.tanggal}
                  </span>
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                    {note.unit}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-800">{note.diagnosa}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{note.catatan}</p>
                <p className="mt-2 text-[11px] italic text-slate-400">{note.dokter}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RIWAYAT — shared primitives
// ─────────────────────────────────────────────────────────

function SaveRwyBtn() {
  return (
    <div className="flex justify-end pt-1">
      <button type="button" className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95">
        Simpan
      </button>
    </div>
  );
}

function ChkBtn({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition",
        checked
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50/40",
      )}
    >
      <span className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
        checked ? "border-sky-500 bg-sky-500" : "border-slate-300",
      )}>
        {checked && <Check size={10} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function YesNoRadio({
  value, onChange, yesLabel = "Ya", noLabel = "Tidak",
}: { value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={cn(
            "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
            value === v
              ? v ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-400 bg-slate-100 text-slate-700"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
          )}
        >
          {v ? yesLabel : noLabel}
        </button>
      ))}
    </div>
  );
}

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

// ─────────────────────────────────────────────────────────
// RIWAYAT — sub-panes
// ─────────────────────────────────────────────────────────

const PENYAKIT_DAHULU_LIST = [
  "Hipertensi", "Diabetes Melitus", "Penyakit Jantung Koroner", "Gagal Jantung",
  "Stroke / TIA", "Asma Bronkial", "PPOK", "Tuberkulosis Paru", "Hepatitis B",
  "Hepatitis C", "HIV / AIDS", "Gagal Ginjal Kronis", "Batu Saluran Kemih",
  "Kanker / Keganasan", "Epilepsi", "Gangguan Jiwa", "Penyakit Tiroid",
  "Reumatoid Artritis", "Lupus (SLE)", "Thalasemia / Anemia Kronis",
];

function PenyakitDahuluPane({ patient }: { patient: IGDPatientDetail }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [catatan, setCatatan] = useState(patient.riwayatPenyakitDahulu ?? "");
  const toggle = (p: string) => setChecked(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  return (
    <div className="flex flex-col gap-4">
      <Block title="Penyakit yang Pernah Diderita">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PENYAKIT_DAHULU_LIST.map(p => (
            <ChkBtn key={p} label={p} checked={checked.includes(p)} onChange={() => toggle(p)} />
          ))}
        </div>
      </Block>
      <Block title="Keterangan Tambahan">
        <TA label="Detail / Catatan" value={catatan} onChange={setCatatan} rows={3}
          placeholder="Tahun diagnosis, kondisi saat ini, komplikasi yang pernah terjadi..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

interface ObatEntry { id: string; nama: string; dosis: string; frekuensi: string; rute: string; sejak: string; indikasi: string; }
const RUTE_OBAT = ["Oral", "IV", "IM", "SC", "Sublingual", "Topikal", "Inhalasi", "Rektal"];

function PemberianObatPane() {
  const [obats, setObats] = useState<ObatEntry[]>([
    { id: "ob-1", nama: "", dosis: "", frekuensi: "", rute: "Oral", sejak: "", indikasi: "" },
  ]);
  const add = () => setObats(p => [...p, { id: `ob-${Date.now()}`, nama: "", dosis: "", frekuensi: "", rute: "Oral", sejak: "", indikasi: "" }]);
  const rem = (id: string) => setObats(p => p.filter(e => e.id !== id));
  const upd = (id: string, k: keyof ObatEntry, v: string) => setObats(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Daftar Obat yang Sedang / Pernah Diminum">
        <div className="flex flex-col gap-3">
          {obats.map((ob, i) => (
            <div key={ob.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Obat #{i + 1}</span>
                {obats.length > 1 && (
                  <button type="button" onClick={() => rem(ob.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>Nama Obat</Label>
                  <input value={ob.nama} onChange={e => upd(ob.id, "nama", e.target.value)} placeholder="Nama generik / merek..." className={INPUT_CLS} />
                </div>
                <div>
                  <Label>Dosis</Label>
                  <input value={ob.dosis} onChange={e => upd(ob.id, "dosis", e.target.value)} placeholder="5 mg, 500 mg..." className={INPUT_CLS} />
                </div>
                <div>
                  <Label>Frekuensi</Label>
                  <input value={ob.frekuensi} onChange={e => upd(ob.id, "frekuensi", e.target.value)} placeholder="1×/hari, 3×/hari..." className={INPUT_CLS} />
                </div>
                <div>
                  <Label>Rute</Label>
                  <select value={ob.rute} onChange={e => upd(ob.id, "rute", e.target.value)} className={INPUT_CLS}>
                    {RUTE_OBAT.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Sejak</Label>
                  <input value={ob.sejak} onChange={e => upd(ob.id, "sejak", e.target.value)} placeholder="Jan 2024, ±6 bulan..." className={INPUT_CLS} />
                </div>
                <div className="sm:col-span-3">
                  <Label>Indikasi</Label>
                  <input value={ob.indikasi} onChange={e => upd(ob.id, "indikasi", e.target.value)} placeholder="Indikasi / keterangan penggunaan..." className={INPUT_CLS} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-sky-300 hover:text-sky-500">
            <Plus size={15} /> Tambah Obat
          </button>
        </div>
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

type SmokingStatus = "ya" | "tidak" | "mantan";

function LainnyaPane() {
  const [merokok, setMerokok] = useState<SmokingStatus | null>(null);
  const [batang, setBatang] = useState(""); const [merokokSejak, setMerokokSejak] = useState(""); const [berhentiSejak, setBerhentiSejak] = useState("");
  const [paparanAsap, setPaparanAsap] = useState<boolean | null>(null);
  const [paparanDetail, setPaparanDetail] = useState("");
  const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Status Merokok">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Apakah Anda merokok?</Label>
            <div className="flex gap-2">
              {([
                { v: "ya" as SmokingStatus, label: "Ya, Aktif Merokok",  cls: "border-rose-400 bg-rose-50 text-rose-700" },
                { v: "tidak" as SmokingStatus, label: "Tidak Merokok",   cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                { v: "mantan" as SmokingStatus, label: "Mantan Perokok", cls: "border-amber-400 bg-amber-50 text-amber-700" },
              ] as const).map(opt => (
                <button key={opt.v} type="button" onClick={() => setMerokok(opt.v)}
                  className={cn("flex-1 rounded-lg border py-2 text-xs font-semibold transition",
                    merokok === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {merokok === "ya" && (
              <motion.div key="ya" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><Label>Jumlah Rokok per Hari</Label><input value={batang} onChange={e => setBatang(e.target.value)} placeholder="Contoh: 10 batang" className={INPUT_CLS} /></div>
                  <div><Label>Merokok Sejak</Label><input value={merokokSejak} onChange={e => setMerokokSejak(e.target.value)} placeholder="2010, usia 20 thn..." className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
            {merokok === "mantan" && (
              <motion.div key="mantan" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><Label>Berhenti Sejak</Label><input value={berhentiSejak} onChange={e => setBerhentiSejak(e.target.value)} placeholder="2022" className={INPUT_CLS} /></div>
                  <div><Label>Merokok Sejak</Label><input value={merokokSejak} onChange={e => setMerokokSejak(e.target.value)} placeholder="2000" className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Block>
      <Block title="Paparan Asap Rokok (Perokok Pasif)">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Apakah Anda terpapar asap rokok?</Label>
            <YesNoRadio value={paparanAsap} onChange={setPaparanAsap} />
          </div>
          <AnimatePresence>
            {paparanAsap && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <TA label="Keterangan Paparan" value={paparanDetail} onChange={setPaparanDetail}
                  placeholder="Di rumah, tempat kerja, durasi paparan sehari-hari..." rows={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Block>
      <Block title="Kebiasaan & Gaya Hidup Lainnya">
        <TA label="Catatan" value={catatan} onChange={setCatatan} rows={3}
          placeholder="Konsumsi alkohol, pola makan, aktivitas fisik, pola tidur, dll..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

const PENYAKIT_BERESIKO = [
  "Hipertensi", "Diabetes Melitus", "Obesitas", "Dislipidemia / Kolesterol Tinggi",
  "Gagal Ginjal", "Penyakit Jantung", "Stroke", "Asma / PPOK",
  "Kanker", "Gangguan Tiroid", "Anemia", "Hepatitis Kronis",
];
const PERILAKU_BERESIKO = [
  "Merokok Aktif", "Konsumsi Alkohol", "Penggunaan NAPZA / Narkoba",
  "Seks Berisiko Tinggi", "Tidak Rutin Berolahraga",
  "Pola Makan Tidak Sehat", "Kurang Tidur (< 6 jam/hari)", "Stres Berat / Kronis",
];

function FaktorResikoPane() {
  const [penyakitB, setPenyakitB] = useState<string[]>([]); const [penyakitLain, setPenyakitLain] = useState("");
  const [perilakuB, setPerilakuB] = useState<string[]>([]); const [perilakuLain, setPerilakuLain] = useState("");
  const tP = (v: string) => setPenyakitB(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const tB = (v: string) => setPerilakuB(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Penyakit Beresiko">
          <div className="flex flex-col gap-1.5">
            {PENYAKIT_BERESIKO.map(p => <ChkBtn key={p} label={p} checked={penyakitB.includes(p)} onChange={() => tP(p)} />)}
          </div>
          <div className="mt-3">
            <Label>Penyakit Beresiko Lainnya</Label>
            <input value={penyakitLain} onChange={e => setPenyakitLain(e.target.value)} placeholder="Tambahkan penyakit berisiko lainnya..." className={INPUT_CLS} />
          </div>
        </Block>
        <Block title="Perilaku Beresiko">
          <div className="flex flex-col gap-1.5">
            {PERILAKU_BERESIKO.map(p => <ChkBtn key={p} label={p} checked={perilakuB.includes(p)} onChange={() => tB(p)} />)}
          </div>
          <div className="mt-3">
            <Label>Perilaku Beresiko Lainnya</Label>
            <input value={perilakuLain} onChange={e => setPerilakuLain(e.target.value)} placeholder="Tambahkan perilaku berisiko lainnya..." className={INPUT_CLS} />
          </div>
        </Block>
      </div>
      <SaveRwyBtn />
    </div>
  );
}

const PENYAKIT_KELUARGA_LIST = [
  "Hipertensi", "Diabetes Melitus", "Penyakit Jantung", "Stroke",
  "Kanker", "Tuberkulosis", "Asma", "Thalasemia", "Gangguan Jiwa", "HIV/AIDS",
];
const ANGGOTA_KELUARGA = ["Ayah", "Ibu", "Kakak / Adik", "Kakek (Paternal)", "Nenek (Paternal)", "Kakek (Maternal)", "Nenek (Maternal)"];
interface KeluargaEntry { anggota: string; penyakit: string[]; keterangan: string; }

function PenyakitKeluargaPane({ patient }: { patient: IGDPatientDetail }) {
  const [entries, setEntries] = useState<KeluargaEntry[]>(ANGGOTA_KELUARGA.map(a => ({ anggota: a, penyakit: [], keterangan: "" })));
  const [riwayatLain, setRiwayatLain] = useState(patient.riwayatKeluarga ?? "");
  const toggleP = (idx: number, p: string) => setEntries(prev => prev.map((e, i) => i !== idx ? e : { ...e, penyakit: e.penyakit.includes(p) ? e.penyakit.filter(x => x !== p) : [...e.penyakit, p] }));
  const setKet = (idx: number, v: string) => setEntries(prev => prev.map((e, i) => i !== idx ? e : { ...e, keterangan: v }));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
          <span className="text-xs font-semibold text-slate-700">Riwayat Penyakit per Anggota Keluarga</span>
        </div>
        <div className="divide-y divide-slate-100">
          {entries.map((e, idx) => (
            <div key={e.anggota} className="p-4">
              <p className="mb-2.5 text-xs font-bold text-slate-700">{e.anggota}</p>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {PENYAKIT_KELUARGA_LIST.map(p => (
                  <button key={p} type="button" onClick={() => toggleP(idx, p)}
                    className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition",
                      e.penyakit.includes(p) ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-sky-50/40")}>
                    {p}
                  </button>
                ))}
              </div>
              <input value={e.keterangan} onChange={ev => setKet(idx, ev.target.value)}
                placeholder="Keterangan tambahan (opsional)..."
                className={INPUT_CLS} />
            </div>
          ))}
        </div>
      </div>
      <Block title="Catatan Tambahan Riwayat Keluarga">
        <TA label="Keterangan" value={riwayatLain} onChange={setRiwayatLain} rows={3}
          placeholder="Pola herediter, penyakit genetik, riwayat lainnya..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

function TuberkulosisPane() {
  const [riwayatTBC, setRiwayatTBC] = useState<boolean | null>(null);
  const [tahun, setTahun] = useState(""); const [statusOAT, setStatusOAT] = useState("");
  const [penunjang, setPenunjang] = useState(""); const [kontakTBC, setKontakTBC] = useState<boolean | null>(null);
  const [tcmDilakukan, setTcmDilakukan] = useState<boolean | null>(null); const [tcmHasil, setTcmHasil] = useState("");
  const [sputumDilakukan, setSputumDilakukan] = useState<boolean | null>(null);
  const [sputumHasil, setSputumHasil] = useState(""); const [sputumGrade, setSputumGrade] = useState("");
  const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Penyakit Tuberkulosis">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Apakah pernah didiagnosis / diobati TBC?</Label>
            <YesNoRadio value={riwayatTBC} onChange={setRiwayatTBC} />
          </div>
          <AnimatePresence>
            {riwayatTBC && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-1 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tahun Pengobatan</Label><input value={tahun} onChange={e => setTahun(e.target.value)} placeholder="2018" className={INPUT_CLS} /></div>
                    <div>
                      <Label>Status Pengobatan OAT</Label>
                      <select value={statusOAT} onChange={e => setStatusOAT(e.target.value)} className={INPUT_CLS}>
                        <option value="">— Pilih status —</option>
                        <option value="selesai">Selesai / Sembuh</option>
                        <option value="tidak-selesai">Tidak Selesai / Putus Obat</option>
                        <option value="sedang-berjalan">Sedang Berjalan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <Label>Riwayat Kontak dengan Penderita TBC</Label>
            <YesNoRadio value={kontakTBC} onChange={setKontakTBC} />
          </div>
        </div>
      </Block>

      <Block title="Riwayat Pemeriksaan Penunjang TBC">
        <TA label="Pemeriksaan Penunjang yang Pernah Dilakukan" value={penunjang} onChange={setPenunjang} rows={2}
          placeholder="Rontgen thorax, mantoux test, IGRA, dll..." />

        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <p className="mb-2 text-xs font-bold text-slate-700">Tes Cepat Molekuler (TCM / GeneXpert)</p>
          <YesNoRadio value={tcmDilakukan} onChange={setTcmDilakukan} yesLabel="Sudah Dilakukan" noLabel="Belum Dilakukan" />
          <AnimatePresence>
            {tcmDilakukan && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-3">
                  <Label>Hasil TCM</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "pos-sensitif",  label: "MTB Pos — Rifampisin Sensitif",   cls: "border-amber-400 bg-amber-50 text-amber-700" },
                      { v: "pos-resisten",  label: "MTB Pos — Rifampisin Resisten",   cls: "border-rose-400 bg-rose-50 text-rose-700" },
                      { v: "negatif",       label: "MTB Negatif",                    cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                      { v: "invalid",       label: "Invalid / Error",                cls: "border-slate-400 bg-slate-100 text-slate-600" },
                    ].map(opt => (
                      <button key={opt.v} type="button" onClick={() => setTcmHasil(opt.v)}
                        className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                          tcmHasil === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <p className="mb-2 text-xs font-bold text-slate-700">Pemeriksaan Sputum BTA</p>
          <YesNoRadio value={sputumDilakukan} onChange={setSputumDilakukan} yesLabel="Sudah Dilakukan" noLabel="Belum Dilakukan" />
          <AnimatePresence>
            {sputumDilakukan && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hasil Sputum BTA</Label>
                    <div className="flex gap-2">
                      {[
                        { v: "positif", label: "Positif", cls: "border-rose-400 bg-rose-50 text-rose-700" },
                        { v: "negatif", label: "Negatif", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                      ].map(opt => (
                        <button key={opt.v} type="button" onClick={() => setSputumHasil(opt.v)}
                          className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                            sputumHasil === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><Label>Grade / Jumlah Koloni</Label><input value={sputumGrade} onChange={e => setSputumGrade(e.target.value)} placeholder="1+, 2+, Skanty..." className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <TA label="Catatan Pemeriksaan TBC" value={catatan} onChange={setCatatan} rows={2} placeholder="Hasil lab, klinis, rencana follow-up..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

function GinekologiPane() {
  const [statusMens, setStatusMens] = useState(""); const [hpht, setHpht] = useState(""); const [siklus, setSiklus] = useState(""); const [lama, setLama] = useState("");
  const [dismenorea, setDismenorea] = useState<boolean | null>(null); const [menoragia, setMenoragia] = useState<boolean | null>(null); const [keputihan, setKeputihan] = useState<boolean | null>(null);
  const [papSmear, setPapSmear] = useState<boolean | null>(null); const [papTahun, setPapTahun] = useState(""); const [papHasil, setPapHasil] = useState("");
  const [iva, setIva] = useState<boolean | null>(null); const [ivaTahun, setIvaTahun] = useState(""); const [ivaHasil, setIvaHasil] = useState("");
  const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Menstruasi">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Status Menstruasi</Label>
            <div className="flex flex-wrap gap-2">
              {(["Reguler", "Tidak Reguler", "Menopause", "Belum Menstruasi"] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatusMens(s)}
                  className={cn("rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition",
                    statusMens === s ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>HPHT</Label><input type="date" value={hpht} onChange={e => setHpht(e.target.value)} className={INPUT_CLS} /></div>
            <div><Label>Siklus (hari)</Label><input value={siklus} onChange={e => setSiklus(e.target.value)} placeholder="28 hari" className={INPUT_CLS} /></div>
            <div><Label>Lama Menstruasi</Label><input value={lama} onChange={e => setLama(e.target.value)} placeholder="5–7 hari" className={INPUT_CLS} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Dismenorea</Label><YesNoRadio value={dismenorea} onChange={setDismenorea} /></div>
            <div><Label>Menoragia</Label><YesNoRadio value={menoragia} onChange={setMenoragia} /></div>
            <div><Label>Keputihan Patologis</Label><YesNoRadio value={keputihan} onChange={setKeputihan} /></div>
          </div>
        </div>
      </Block>

      <Block title="Skrining Ginekologi">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <p className="mb-2 text-xs font-bold text-slate-700">Pap Smear</p>
            <YesNoRadio value={papSmear} onChange={setPapSmear} yesLabel="Pernah" noLabel="Belum Pernah" />
            <AnimatePresence>
              {papSmear && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div><Label>Tahun Terakhir</Label><input value={papTahun} onChange={e => setPapTahun(e.target.value)} placeholder="2023" className={INPUT_CLS} /></div>
                    <div><Label>Hasil</Label><input value={papHasil} onChange={e => setPapHasil(e.target.value)} placeholder="Normal / Abnormal" className={INPUT_CLS} /></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <p className="mb-2 text-xs font-bold text-slate-700">IVA Test</p>
            <YesNoRadio value={iva} onChange={setIva} yesLabel="Pernah" noLabel="Belum Pernah" />
            <AnimatePresence>
              {iva && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div><Label>Tahun Terakhir</Label><input value={ivaTahun} onChange={e => setIvaTahun(e.target.value)} placeholder="2023" className={INPUT_CLS} /></div>
                    <div><Label>Hasil</Label><input value={ivaHasil} onChange={e => setIvaHasil(e.target.value)} placeholder="IVA Negatif / Positif" className={INPUT_CLS} /></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Block>

      <Block title="Catatan Ginekologi">
        <TA label="Keterangan" value={catatan} onChange={setCatatan} rows={3}
          placeholder="Riwayat gangguan ginekologi, terapi hormonal, kontrasepsi, dll..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

interface RawatEntry  { id: string; rs: string; unit: string; tanggal: string; diagnosa: string; keterangan: string; }
interface BedahEntry  { id: string; tanggal: string; tindakan: string; rs: string; dokter: string; keterangan: string; }

function PerawatanTindakanPane() {
  const [rawats, setRawats] = useState<RawatEntry[]>([{ id: "rw-1", rs: "", unit: "", tanggal: "", diagnosa: "", keterangan: "" }]);
  const [bedahs, setBedahs]  = useState<BedahEntry[]>([]);
  const addR = () => setRawats(p => [...p, { id: `rw-${Date.now()}`, rs: "", unit: "", tanggal: "", diagnosa: "", keterangan: "" }]);
  const remR = (id: string) => setRawats(p => p.filter(e => e.id !== id));
  const updR = (id: string, k: keyof RawatEntry, v: string) => setRawats(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  const addB = () => setBedahs(p => [...p, { id: `bd-${Date.now()}`, tanggal: "", tindakan: "", rs: "", dokter: "", keterangan: "" }]);
  const remB = (id: string) => setBedahs(p => p.filter(e => e.id !== id));
  const updB = (id: string, k: keyof BedahEntry, v: string) => setBedahs(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Perawatan / Rawat Inap Terakhir">
        <div className="flex flex-col gap-3">
          {rawats.map((r, i) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Perawatan #{i + 1}</span>
                {rawats.length > 1 && <button type="button" onClick={() => remR(r.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2"><Label>Nama RS / Faskes</Label><input value={r.rs} onChange={e => updR(r.id, "rs", e.target.value)} placeholder="RSUD, Puskesmas, Klinik..." className={INPUT_CLS} /></div>
                <div><Label>Unit / Bagian</Label><input value={r.unit} onChange={e => updR(r.id, "unit", e.target.value)} placeholder="ICU, Penyakit Dalam..." className={INPUT_CLS} /></div>
                <div><Label>Tanggal Perawatan</Label><input type="date" value={r.tanggal} onChange={e => updR(r.id, "tanggal", e.target.value)} className={INPUT_CLS} /></div>
                <div className="sm:col-span-2"><Label>Diagnosa</Label><input value={r.diagnosa} onChange={e => updR(r.id, "diagnosa", e.target.value)} placeholder="Diagnosa saat perawatan..." className={INPUT_CLS} /></div>
                <div className="sm:col-span-3"><Label>Keterangan</Label><input value={r.keterangan} onChange={e => updR(r.id, "keterangan", e.target.value)} placeholder="Durasi rawat, kondisi keluar, dll..." className={INPUT_CLS} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addR} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-sky-300 hover:text-sky-500">
            <Plus size={15} /> Tambah Riwayat Perawatan
          </button>
        </div>
      </Block>

      <Block title="Riwayat Pembedahan / Tindakan Operatif">
        <div className="flex flex-col gap-3">
          {bedahs.length === 0 && <p className="text-xs text-slate-400">Belum ada riwayat pembedahan.</p>}
          {bedahs.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Pembedahan #{i + 1}</span>
                <button type="button" onClick={() => remB(b.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><Label>Tanggal Tindakan</Label><input type="date" value={b.tanggal} onChange={e => updB(b.id, "tanggal", e.target.value)} className={INPUT_CLS} /></div>
                <div className="sm:col-span-2"><Label>Nama Tindakan / Operasi</Label><input value={b.tindakan} onChange={e => updB(b.id, "tindakan", e.target.value)} placeholder="Appendektomi, CABG, SC, dll..." className={INPUT_CLS} /></div>
                <div><Label>Rumah Sakit</Label><input value={b.rs} onChange={e => updB(b.id, "rs", e.target.value)} placeholder="Nama faskes..." className={INPUT_CLS} /></div>
                <div><Label>Dokter Operator</Label><input value={b.dokter} onChange={e => updB(b.id, "dokter", e.target.value)} placeholder="dr. ..." className={INPUT_CLS} /></div>
                <div><Label>Keterangan</Label><input value={b.keterangan} onChange={e => updB(b.id, "keterangan", e.target.value)} placeholder="Komplikasi, kondisi post-op..." className={INPUT_CLS} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addB} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-sky-300 hover:text-sky-500">
            <Plus size={15} /> Tambah Riwayat Pembedahan
          </button>
        </div>
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

const METODE_KB = ["IUD / Spiral", "Pil KB", "Suntik KB", "Implan / Susuk", "Kondom", "Tubektomi / MOW", "Vasektomi / MOP", "Kalender / Alami", "Tidak Menggunakan KB"] as const;
const JENIS_PERSALINAN = ["Spontan / Normal", "Seksio Sesaria (SC)", "Vakum / Forseps", "Persalinan Prematur", "Sungsang"];
interface PersalinanEntry { id: string; tahun: string; usiaKeh: string; jenis: string; bbLahir: string; kondisiAnak: string; keterangan: string; }

function ObstetriPane() {
  const [metodeKB, setMetodeKB]     = useState(""); const [kbSejak, setKbSejak] = useState(""); const [kbKet, setKbKet] = useState("");
  const [gravida, setGravida]       = useState(""); const [para, setPara] = useState(""); const [abortus, setAbortus] = useState("");
  const [persalinans, setPersalinans] = useState<PersalinanEntry[]>([]);
  const [ancKunjungan, setAncKunjungan] = useState(""); const [ancUsia, setAncUsia] = useState("");
  const [ancTempat, setAncTempat]   = useState(""); const [ancPetugas, setAncPetugas] = useState(""); const [ancKet, setAncKet] = useState("");
  const addPs = () => setPersalinans(p => [...p, { id: `ps-${Date.now()}`, tahun: "", usiaKeh: "", jenis: JENIS_PERSALINAN[0], bbLahir: "", kondisiAnak: "", keterangan: "" }]);
  const remPs = (id: string) => setPersalinans(p => p.filter(e => e.id !== id));
  const updPs = (id: string, k: keyof PersalinanEntry, v: string) => setPersalinans(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Keluarga Berencana (KB)">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Metode KB yang Digunakan</Label>
            <div className="flex flex-wrap gap-2">
              {METODE_KB.map(m => (
                <button key={m} type="button" onClick={() => setMetodeKB(m)}
                  className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    metodeKB === m ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-sky-50/40")}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sejak / Durasi</Label><input value={kbSejak} onChange={e => setKbSejak(e.target.value)} placeholder="2020, 3 tahun..." className={INPUT_CLS} /></div>
            <div><Label>Keterangan</Label><input value={kbKet} onChange={e => setKbKet(e.target.value)} placeholder="Efek samping, alasan berhenti..." className={INPUT_CLS} /></div>
          </div>
        </div>
      </Block>

      <Block title="Riwayat Obstetri">
        <div className="flex flex-col gap-4">
          <div>
            <Label>G / P / A (Gravida / Para / Abortus)</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "G — Gravida", val: gravida, set: setGravida, tip: "Total kehamilan" },
                { label: "P — Para",    val: para,    set: setPara,    tip: "Persalinan ≥20 mg" },
                { label: "A — Abortus", val: abortus, set: setAbortus, tip: "Keguguran / terminasi" },
              ].map(f => (
                <div key={f.label}>
                  <Label>{f.label}</Label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder="0" className={cn(INPUT_CLS, "text-center font-bold")} />
                  <p className="mt-1 text-center text-[11px] text-slate-400">{f.tip}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Riwayat Persalinan</Label>
            <div className="flex flex-col gap-3">
              {persalinans.length === 0 && <p className="text-xs text-slate-400">Belum ada riwayat persalinan.</p>}
              {persalinans.map((ps, i) => (
                <div key={ps.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Persalinan ke-{i + 1}</span>
                    <button type="button" onClick={() => remPs(ps.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div><Label>Tahun</Label><input value={ps.tahun} onChange={e => updPs(ps.id, "tahun", e.target.value)} placeholder="2020" className={INPUT_CLS} /></div>
                    <div><Label>Usia Kehamilan</Label><input value={ps.usiaKeh} onChange={e => updPs(ps.id, "usiaKeh", e.target.value)} placeholder="38 minggu" className={INPUT_CLS} /></div>
                    <div>
                      <Label>Jenis Persalinan</Label>
                      <select value={ps.jenis} onChange={e => updPs(ps.id, "jenis", e.target.value)} className={INPUT_CLS}>
                        {JENIS_PERSALINAN.map(j => <option key={j}>{j}</option>)}
                      </select>
                    </div>
                    <div><Label>BB Lahir (gram)</Label><input value={ps.bbLahir} onChange={e => updPs(ps.id, "bbLahir", e.target.value)} placeholder="3200 gr" className={INPUT_CLS} /></div>
                    <div><Label>Kondisi Anak</Label><input value={ps.kondisiAnak} onChange={e => updPs(ps.id, "kondisiAnak", e.target.value)} placeholder="Hidup / Meninggal" className={INPUT_CLS} /></div>
                    <div><Label>Keterangan</Label><input value={ps.keterangan} onChange={e => updPs(ps.id, "keterangan", e.target.value)} placeholder="Komplikasi, dll..." className={INPUT_CLS} /></div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addPs} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-sky-300 hover:text-sky-500">
                <Plus size={15} /> Tambah Riwayat Persalinan
              </button>
            </div>
          </div>
        </div>
      </Block>

      <Block title="Ante Natal Care (ANC)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><Label>Kunjungan ANC ke-</Label><input value={ancKunjungan} onChange={e => setAncKunjungan(e.target.value)} placeholder="4" className={INPUT_CLS} /></div>
          <div><Label>Usia Kehamilan</Label><input value={ancUsia} onChange={e => setAncUsia(e.target.value)} placeholder="32 minggu" className={INPUT_CLS} /></div>
          <div><Label>Tempat ANC</Label><input value={ancTempat} onChange={e => setAncTempat(e.target.value)} placeholder="Puskesmas, RS..." className={INPUT_CLS} /></div>
          <div><Label>Petugas / Dokter</Label><input value={ancPetugas} onChange={e => setAncPetugas(e.target.value)} placeholder="dr. / Bidan..." className={INPUT_CLS} /></div>
        </div>
        <TA label="Catatan ANC" value={ancKet} onChange={setAncKet} rows={2}
          placeholder="Komplikasi kehamilan, suplemen, imunisasi TT, USG, dll..." />
      </Block>
      <SaveRwyBtn />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RIWAYAT — main pane with inner tabs
// ─────────────────────────────────────────────────────────

const RWY_TABS = [
  "Penyakit Dahulu", "Pemberian Obat", "Lainnya", "Faktor Resiko",
  "Penyakit Keluarga", "Tuberkulosis", "Ginekologi", "Perawatan & Tindakan", "Obstetri",
] as const;
type RwyTab = typeof RWY_TABS[number];

function RiwayatPane({ patient, onComplete }: { patient: IGDPatientDetail; onComplete?: (done: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<RwyTab>("Penyakit Dahulu");
  const [done, setDone] = useState(false);

  function markDone() {
    setDone(true);
    onComplete?.(true);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Inner tab strip */}
      <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 shadow-sm" style={{ scrollbarWidth: "none" }}>
        {RWY_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === tab
                ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Pane content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
          {activeTab === "Penyakit Dahulu"      && <PenyakitDahuluPane patient={patient} />}
          {activeTab === "Pemberian Obat"       && <PemberianObatPane />}
          {activeTab === "Lainnya"              && <LainnyaPane />}
          {activeTab === "Faktor Resiko"        && <FaktorResikoPane />}
          {activeTab === "Penyakit Keluarga"    && <PenyakitKeluargaPane patient={patient} />}
          {activeTab === "Tuberkulosis"         && <TuberkulosisPane />}
          {activeTab === "Ginekologi"           && <GinekologiPane />}
          {activeTab === "Perawatan & Tindakan" && <PerawatanTindakanPane />}
          {activeTab === "Obstetri"             && <ObstetriPane />}
        </motion.div>
      </AnimatePresence>
      {/* Mark done */}
      {!done ? (
        <div className="flex justify-end">
          <button type="button" onClick={markDone}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700">
            <CheckCircle2 size={13} /> Tandai Riwayat Selesai
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">Riwayat Medis selesai diisi</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ALERGI sub-tab
// ─────────────────────────────────────────────────────────

type AllergyCategory = "Obat" | "Makanan" | "Lainnya";
type AllergySeverity = "Ringan" | "Sedang" | "Berat";
type AllergyStatus   = "Terkonfirmasi" | "Dicurigai";

interface AllergyEntry {
  id: string;
  category: AllergyCategory;
  allergen: string;
  reactions: string[];
  severity: AllergySeverity;
  status: AllergyStatus;
  keterangan: string;
  snomedCode?: string;
}

// ── SNOMED CT mock codes ──────────────────────────────────

const SNOMED_CODES: { code: string; display: string }[] = [
  { code: "372687004",  display: "Amoksisilin (Amoxicillin)"          },
  { code: "7947003",    display: "Aspirin"                             },
  { code: "764146007",  display: "Penisilin (Penicillin)"             },
  { code: "387207008",  display: "Ibuprofen"                          },
  { code: "260421004",  display: "Kodein (Codeine)"                   },
  { code: "419199007",  display: "Kacang Tanah (Peanut)"              },
  { code: "227493005",  display: "Kacang Pohon (Tree Nut)"            },
  { code: "735029006",  display: "Susu Sapi (Cow's Milk)"             },
  { code: "102263004",  display: "Telur (Egg)"                        },
  { code: "1003755004", display: "Lateks (Natural Rubber Latex)"      },
];

// ── Allergy config ────────────────────────────────────────

const CAT_CFG: Record<AllergyCategory, { icon: LucideIcon; label: string; activeCls: string; iconCls: string }> = {
  Obat:    { icon: Pill,        label: "Obat",    activeCls: "border-sky-400 bg-sky-50 text-sky-700", iconCls: "text-sky-500" },
  Makanan: { icon: Utensils,    label: "Makanan", activeCls: "border-orange-300 bg-orange-50 text-orange-700", iconCls: "text-orange-500" },
  Lainnya: { icon: ShieldAlert, label: "Lainnya", activeCls: "border-teal-400   bg-teal-50   text-teal-700",   iconCls: "text-teal-500"   },
};

const SEV_CFG: Record<AllergySeverity, { activeCls: string; badgeCls: string; borderL: string }> = {
  Ringan: {
    activeCls: "border-emerald-400 bg-emerald-50 text-emerald-700",
    badgeCls:  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    borderL:   "border-l-4 border-l-emerald-400",
  },
  Sedang: {
    activeCls: "border-amber-400 bg-amber-50 text-amber-700",
    badgeCls:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    borderL:   "border-l-4 border-l-amber-400",
  },
  Berat: {
    activeCls: "border-rose-500 bg-rose-50 text-rose-700",
    badgeCls:  "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    borderL:   "border-l-4 border-l-rose-500",
  },
};

const QUICK_PICKS: Record<AllergyCategory, string[]> = {
  Obat: [
    "Penisilin", "Amoksisilin", "Aspirin", "Ibuprofen",
    "Sulfa", "Kodein", "Tetrasiklin", "Ciprofloxacin",
    "Kontras Radiologi", "Metronidazol", "Tramadol",
  ],
  Makanan: [
    "Kacang Tanah", "Seafood", "Susu Sapi", "Telur",
    "Gandum / Gluten", "Kedelai", "Ikan", "Kacang Pohon",
  ],
  Lainnya: [
    "Lateks", "Serbuk Sari", "Debu", "Bulu Hewan",
    "Nikel", "Lebah / Serangga", "Parfum", "Getah",
  ],
};

const REACTIONS: string[] = [
  "Anafilaksis", "Angioedema", "Bronkospasme",
  "Urtikaria", "Ruam / Eritema", "Pruritus",
  "Mual / Muntah", "Diare", "Rinitis", "Sesak Napas",
];

// ── Mock allergy data ─────────────────────────────────────

const ALLERGY_MOCK: Record<string, AllergyEntry[]> = {
  "RM-2025-005": [
    {
      id: "alg-s1",
      category: "Obat",
      allergen: "Penisilin",
      reactions: ["Anafilaksis", "Urtikaria", "Angioedema"],
      severity: "Berat",
      status: "Terkonfirmasi",
      keterangan: "Riwayat reaksi anafilaktoid. Hindari semua golongan beta-laktam.",
      snomedCode: "764146007",
    },
    {
      id: "alg-s2",
      category: "Makanan",
      allergen: "Seafood",
      reactions: ["Urtikaria", "Pruritus"],
      severity: "Sedang",
      status: "Dicurigai",
      keterangan: "Dilaporkan pasien, belum terkonfirmasi tes alergi.",
    },
  ],
  "RM-2025-012": [
    {
      id: "alg-s3",
      category: "Obat",
      allergen: "Aspirin",
      reactions: ["Bronkospasme", "Sesak Napas"],
      severity: "Berat",
      status: "Terkonfirmasi",
      keterangan: "Aspirin-exacerbated respiratory disease (AERD). Hindari seluruh golongan NSAID.",
      snomedCode: "7947003",
    },
    {
      id: "alg-s4",
      category: "Lainnya",
      allergen: "Lateks",
      reactions: ["Urtikaria", "Pruritus"],
      severity: "Ringan",
      status: "Dicurigai",
      keterangan: "",
      snomedCode: "1003755004",
    },
  ],
};

// ── Allergy card ──────────────────────────────────────────

function AllergyCard({
  entry,
  onDelete,
}: {
  entry: AllergyEntry;
  onDelete: (id: string) => void;
}) {
  const cat    = CAT_CFG[entry.category];
  const sev    = SEV_CFG[entry.severity];
  const CatIcon = cat.icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-sm",
        sev.borderL,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Category icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <CatIcon size={14} className={cat.iconCls} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800">{entry.allergen}</p>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", sev.badgeCls)}>
              {entry.severity}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                entry.status === "Terkonfirmasi"
                  ? "bg-indigo-50 text-indigo-600 ring-indigo-200"
                  : "bg-slate-100 text-slate-500 ring-slate-200",
              )}
            >
              {entry.status === "Terkonfirmasi"
                ? <CheckCircle2 size={9} />
                : <HelpCircle size={9} />
              }
              {entry.status}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {entry.category}
            </span>
          </div>

          {/* Reaction chips */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.reactions.map((r) => (
              <span
                key={r}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {r}
              </span>
            ))}
          </div>

          {entry.snomedCode && (
            <p className="mt-1.5 flex items-center gap-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
                SNOMED
              </span>
              <span className="font-mono text-[10px] text-slate-500">{entry.snomedCode}</span>
              <span className="text-[10px] text-slate-400">
                — {SNOMED_CODES.find((s) => s.code === entry.snomedCode)?.display ?? ""}
              </span>
            </p>
          )}

          {entry.keterangan && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 italic">
              {entry.keterangan}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label={`Hapus alergi ${entry.allergen}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Allergy pane ──────────────────────────────────────────

function AllergyPane({ patient, onComplete }: { patient: IGDPatientDetail; onComplete?: (done: boolean) => void }) {
  const [entries, setEntries] = useState<AllergyEntry[]>(
    () => structuredClone(ALLERGY_MOCK[patient.noRM] ?? []),
  );
  const [noKA, setNoKA] = useState(false);
  const [form, setForm] = useState<{
    category: AllergyCategory;
    allergen: string;
    reactions: string[];
    severity: AllergySeverity;
    status: AllergyStatus;
    keterangan: string;
    snomedCode: string;
  }>({
    category: "Obat",
    allergen: "",
    reactions: [],
    severity: "Sedang",
    status: "Terkonfirmasi",
    keterangan: "",
    snomedCode: "",
  });

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleReaction = (r: string) =>
    setF(
      "reactions",
      form.reactions.includes(r)
        ? form.reactions.filter((x) => x !== r)
        : [...form.reactions, r],
    );

  const canAdd = form.allergen.trim() !== "" && form.reactions.length > 0;

  function handleAdd() {
    if (!canAdd) return;
    setEntries((p) => [
      {
        id: `alg-${Date.now()}`,
        category: form.category,
        allergen: form.allergen.trim(),
        reactions: form.reactions,
        severity: form.severity,
        status: form.status,
        keterangan: form.keterangan.trim(),
        snomedCode: form.snomedCode || undefined,
      },
      ...p,
    ]);
    setNoKA(false);
    setForm({ ...form, allergen: "", reactions: [], keterangan: "", snomedCode: "" });
  }

  const handleDelete = (id: string) => setEntries((p) => p.filter((e) => e.id !== id));

  const severeEntries = entries.filter((e) => e.severity === "Berat");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Severe allergy alert banner ── */}
      <AnimatePresence>
        {severeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle size={14} className="text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Peringatan Alergi — Risiko Tinggi
              </p>
              <p className="mt-0.5 text-[11px] text-rose-600">
                {severeEntries.map((e) => (
                  <span key={e.id} className="mr-2 font-semibold">
                    {e.allergen} ({e.reactions.join(", ")})
                  </span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">

        {/* ── Left: Add form ── */}
        <div
          className={cn(
            "flex flex-col gap-3 transition-opacity md:w-64 md:shrink-0",
            noKA && "pointer-events-none opacity-40",
          )}
        >
          <Block title="Tambah Alergi Baru">

            {/* Category selector */}
            <div>
              <Label required>Kategori</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Obat", "Makanan", "Lainnya"] as AllergyCategory[]).map((cat) => {
                  const cfg  = CAT_CFG[cat];
                  const Icon = cfg.icon;
                  const active = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setF("category", cat)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-semibold transition",
                        active
                          ? cfg.activeCls
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      <Icon size={14} className={active ? undefined : "text-slate-400"} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergen name */}
            <div>
              <Label required>Nama Alergen</Label>
              <input
                type="text"
                value={form.allergen}
                onChange={(e) => setF("allergen", e.target.value)}
                placeholder="Ketik nama alergen..."
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
              {/* Quick picks */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {QUICK_PICKS[form.category].map((pick) => (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => setF("allergen", pick)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-medium transition",
                      form.allergen === pick
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600",
                    )}
                  >
                    {pick}
                  </button>
                ))}
              </div>
            </div>

            {/* SNOMED CT code */}
            <div>
              <Label>Kode SNOMED CT</Label>
              <select
                value={form.snomedCode}
                onChange={(e) => setF("snomedCode", e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              >
                <option value="">— Pilih kode SNOMED CT —</option>
                {SNOMED_CODES.map((s) => (
                  <option key={s.code} value={s.code}>
                    [{s.code}] {s.display}
                  </option>
                ))}
              </select>
            </div>

            {/* Reactions */}
            <div>
              <Label required>Jenis Reaksi</Label>
              <div className="flex flex-wrap gap-1">
                {REACTIONS.map((r) => {
                  const sel = form.reactions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleReaction(r)}
                      className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-semibold transition",
                        sel
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                          : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <Label required>Tingkat Keparahan</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Ringan", "Sedang", "Berat"] as AllergySeverity[]).map((sev) => {
                  const cfg    = SEV_CFG[sev];
                  const active = form.severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setF("severity", sev)}
                      className={cn(
                        "rounded-lg border py-1.5 text-[11px] font-semibold transition",
                        active
                          ? cfg.activeCls
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status Konfirmasi</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["Terkonfirmasi", "Dicurigai"] as AllergyStatus[]).map((s) => {
                  const Icon   = s === "Terkonfirmasi" ? CheckCircle2 : HelpCircle;
                  const active = form.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setF("status", s)}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-semibold transition",
                        active
                          ? "border-sky-400 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      <Icon size={11} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <Label>Keterangan</Label>
              <textarea
                rows={2}
                value={form.keterangan}
                onChange={(e) => setF("keterangan", e.target.value)}
                placeholder="Catatan tambahan, kondisi khusus..."
                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} />
              Tambah Alergi
            </button>
          </Block>
        </div>

        {/* ── Right: Allergy list ── */}
        <div className="flex flex-1 flex-col gap-3 md:min-w-0">

          {/* NKA toggle */}
          <button
            type="button"
            onClick={() => setNoKA((p) => !p)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              noKA
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            )}
          >
            {/* Toggle switch */}
            <div
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                noKA ? "bg-emerald-500" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                  noKA ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </div>
            <div className="flex-1">
              <p className={cn("text-xs font-semibold", noKA ? "text-emerald-800" : "text-slate-600")}>
                Tidak Ada Riwayat Alergi yang Diketahui (NKA)
              </p>
              <p className={cn("text-[10px]", noKA ? "text-emerald-600" : "text-slate-400")}>
                {noKA ? "Pasien tidak memiliki riwayat alergi tercatat" : "Aktifkan jika pasien tidak memiliki riwayat alergi"}
              </p>
            </div>
            {noKA && <ShieldCheck size={16} className="shrink-0 text-emerald-500" />}
          </button>

          {/* Allergy count header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Daftar Alergi
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {entries.length}
              </span>
            </p>
            {entries.length > 0 && (
              <div className="flex gap-1.5 text-[10px]">
                {(["Berat", "Sedang", "Ringan"] as AllergySeverity[]).map((sev) => {
                  const count = entries.filter((e) => e.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <span key={sev} className={cn("rounded-md px-2 py-0.5 font-semibold", SEV_CFG[sev].badgeCls)}>
                      {count} {sev}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* List */}
          {noKA && entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center">
              <ShieldCheck size={22} className="text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700">Tidak Ada Riwayat Alergi Diketahui</p>
              <p className="text-[11px] text-emerald-500">NKA telah dikonfirmasi dan dicatat</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
              <ShieldAlert size={22} className="text-slate-300" />
              <p className="text-xs font-medium text-slate-400">Belum ada alergi yang dicatat</p>
              <p className="text-[11px] text-slate-400">Tambahkan alergi dari panel kiri</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AllergyCard entry={entry} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Save button */}
          {entries.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onComplete?.(true)}
                className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                Simpan Data Alergi
              </button>
            </div>
          )}
          {/* NKA counts as done too */}
          {noKA && entries.length === 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onComplete?.(true)}
                className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                Konfirmasi NKA
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

export default function AsesmenMedisTab({ patient }: { patient: IGDPatientDetail }) {
  const [active,  setActive]  = useState<SubTabId>("anamnesis");
  const [prevTab, setPrevTab] = useState<SubTabId>("anamnesis");

  const [doneAnamnesis, setDoneAnamnesis] = useState(false);
  const [doneRiwayat,   setDoneRiwayat]   = useState(false);
  const [doneAlergi,    setDoneAlergi]    = useState(false);
  const [doneGizi,      setDoneGizi]      = useState(false);

  const DONE_MAP: Record<SubTabId, boolean> = {
    anamnesis: doneAnamnesis,
    riwayat:   doneRiwayat,
    alergi:    doneAlergi,
    skrining:  doneGizi,
    edukasi:   false,
  };

  const doneCount  = Object.values(DONE_MAP).filter(Boolean).length;
  const activeIdx  = SUB_TABS.findIndex(t => t.id === active);
  const prevIdx    = SUB_TABS.findIndex(t => t.id === prevTab);
  const direction  = activeIdx >= prevIdx ? 1 : -1;

  function navigate(id: SubTabId) {
    setPrevTab(active);
    setActive(id);
  }

  return (
    <div className="flex flex-col gap-4">

      <ProgressHeader doneCount={doneCount} total={SUB_TABS.length} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        {/* ── Vertical sub-nav ── */}
        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:w-52 lg:shrink-0 lg:flex-col lg:pb-0"
          aria-label="Asesmen Medis IGD sub-tab"
        >
          {SUB_TABS.map(tab => (
            <SubNavItem
              key={tab.id}
              tab={tab}
              active={active === tab.id}
              done={DONE_MAP[tab.id]}
              onClick={() => navigate(tab.id)}
            />
          ))}
        </nav>

        {/* ── Content area ── */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={{
                enter:  (d: number) => ({ opacity: 0, x: d * 20 }),
                center: { opacity: 1, x: 0 },
                exit:   (d: number) => ({ opacity: 0, x: d * -16 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {active === "anamnesis" && <AnamnesisPane patient={patient} onComplete={setDoneAnamnesis} />}
              {active === "riwayat"   && <RiwayatPane   patient={patient} onComplete={setDoneRiwayat}   />}
              {active === "alergi"    && <AllergyPane   patient={patient} onComplete={setDoneAlergi}    />}
              {active === "skrining"  && <GiziPane      noRM={patient.noRM} onComplete={setDoneGizi}    />}
              {active === "edukasi"   && <EdukasiPane patient={patient} />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
