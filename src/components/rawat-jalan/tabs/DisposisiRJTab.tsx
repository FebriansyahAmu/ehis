"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, ArrowRight, Building2, Send, User, Stethoscope,
  Calendar, FileText, Tag, MapPin, ClipboardList, BookOpen,
  Check, CheckCircle2, Printer, AlertCircle, ChevronRight,
  Ambulance, Hospital, Microscope, BedDouble, Siren,
  type LucideIcon,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { POLI_CFG } from "@/components/rawat-jalan/rjShared";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type DisposisiTipe = "rujuk-internal" | "rujuk-eksternal" | "admisi-ri";

type JenisPelayanan = "Rawat_Jalan" | "Rawat_Inap" | "Rawat_Darurat" | "ICU_Intensif";
type JenisRujukan   = "FKTP_ke_FKRTL" | "Antar_FKRTL" | "Spesialistik" | "Parsial" | "Rujukan_Balik";
type KelasRI        = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";
type PrioritasInternal = "Segera" | "Elektif" | "Konsultasi";

// ── Config ─────────────────────────────────────────────────

interface DisposisiDef {
  id:    DisposisiTipe;
  label: string;
  sub:   string;
  icon:  LucideIcon;
  sel:   string;
  idle:  string;
  dot:   string;
}

const DISPOSISI: DisposisiDef[] = [
  {
    id:    "rujuk-internal",
    label: "Rujuk Internal",
    sub:   "Ke poli lain dalam RS",
    icon:  ArrowRight,
    sel:   "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    idle:  "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40",
    dot:   "bg-sky-500",
  },
  {
    id:    "rujuk-eksternal",
    label: "Rujuk Eksternal",
    sub:   "FKRTL / RS lain",
    icon:  Send,
    sel:   "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
    idle:  "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
    dot:   "bg-indigo-500",
  },
  {
    id:    "admisi-ri",
    label: "Admisi Rawat Inap",
    sub:   "Masuk bangsal / perawatan",
    icon:  BedDouble,
    sel:   "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle:  "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    dot:   "bg-emerald-500",
  },
];

interface PelayananDef { id: JenisPelayanan; label: string; sub: string; icon: LucideIcon; sel: string; idle: string; dot: string }
const PELAYANAN: PelayananDef[] = [
  { id: "Rawat_Jalan",  label: "Rawat Jalan",    sub: "Poli / Klinik",      icon: BookOpen,   sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",  idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",  dot: "bg-indigo-500"  },
  { id: "Rawat_Inap",   label: "Rawat Inap",     sub: "Bangsal / Ward",     icon: Building2,  sel: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200",  idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40",  dot: "bg-violet-500"  },
  { id: "Rawat_Darurat",label: "Rawat Darurat",  sub: "IGD / Emergency",    icon: Ambulance,  sel: "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-200",          idle: "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/40",      dot: "bg-rose-500"    },
  { id: "ICU_Intensif", label: "ICU / Intensif", sub: "Perawatan intensif", icon: Microscope, sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",      idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40",    dot: "bg-amber-500"   },
];

interface RujukanDef { id: JenisRujukan; label: string; sub: string; sel: string; idle: string }
const RUJUKAN: RujukanDef[] = [
  { id: "FKTP_ke_FKRTL", label: "FKTP ke FKRTL",      sub: "Puskesmas / Klinik → RS",       sel: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",         idle: "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50/40"     },
  { id: "Antar_FKRTL",   label: "Antar FKRTL",        sub: "RS → RS (horizontal/vertikal)",  sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200", idle: "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/40" },
  { id: "Spesialistik",  label: "Spesialistik / Konsul",sub: "Konsultasi dokter spesialis",   sel: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200", idle: "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/40" },
  { id: "Parsial",       label: "Rujukan Parsial",     sub: "Alih sebagian pelayanan",        sel: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200",       idle: "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-teal-50/40"   },
  { id: "Rujukan_Balik", label: "Rujukan Balik",       sub: "Kembali ke FKTP asal",           sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",   idle: "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50/40"  },
];

const KELAS_RI: { id: KelasRI; label: string; sub: string; sel: string; idle: string }[] = [
  { id: "VIP",     label: "VIP",     sub: "Suite / VIP",    sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",   idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40"   },
  { id: "Kelas_1", label: "Kelas 1", sub: "Satu tempat tidur", sel: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",      idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40"      },
  { id: "Kelas_2", label: "Kelas 2", sub: "Dua tempat tidur",  sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40" },
  { id: "Kelas_3", label: "Kelas 3", sub: "Bangsal umum",      sel: "border-slate-400 bg-slate-50 text-slate-800 ring-1 ring-slate-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"     },
  { id: "ICU",     label: "ICU",     sub: "Intensive Care",    sel: "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-200",     idle: "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/40"    },
  { id: "HCU",     label: "HCU",     sub: "High Care Unit",    sel: "border-orange-400 bg-orange-50 text-orange-800 ring-1 ring-orange-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50/40" },
  { id: "Isolasi", label: "Isolasi", sub: "Ruang isolasi",     sel: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40" },
];

const PRIORITAS: { id: PrioritasInternal; label: string; sub: string; sel: string; idle: string }[] = [
  { id: "Segera",     label: "Segera",     sub: "Butuh penanganan cepat", sel: "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-200",   idle: "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/40"   },
  { id: "Elektif",    label: "Elektif",    sub: "Terencana / jadwal",     sel: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",       idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40"     },
  { id: "Konsultasi", label: "Konsultasi", sub: "Opini/saran dokter lain",sel: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200",   idle: "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40"   },
];

// ── Helpers ────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon size={12} />
      </span>
      <p className="text-xs font-semibold text-slate-700">{title}</p>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="font-bold text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";
const textareaCls = "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";

function PreviewRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("text-xs font-medium text-slate-800", mono && "font-mono", highlight && "font-semibold text-indigo-700")}>
        {value}
      </p>
    </div>
  );
}

// ── Sub-forms ──────────────────────────────────────────────

interface InternalFormProps {
  patient: RJPatientDetail;
  onSubmit: () => void;
}

function RujukInternalForm({ patient, onSubmit }: InternalFormProps) {
  const [poliTujuan, setPoliTujuan]   = useState("");
  const [dokterTujuan, setDokterTujuan] = useState("");
  const [prioritas, setPrioritas]     = useState<PrioritasInternal | null>(null);
  const [alasan, setAlasan]           = useState("");
  const [catatan, setCatatan]         = useState("");
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<string[]>(
    patient.diagnosa.filter(d => d.tipe === "Utama").map(d => d.id),
  );

  const toggleDiagnosa = (id: string) =>
    setSelectedDiagnosa(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const poliLabel = poliTujuan && POLI_CFG[poliTujuan as keyof typeof POLI_CFG]?.label;

  const canSubmit = poliTujuan !== "" && prioritas !== null && alasan.trim() !== "" && selectedDiagnosa.length > 0;

  const checklist = [
    { label: "Poli tujuan",       done: poliTujuan !== "" },
    { label: "Prioritas",         done: prioritas !== null },
    { label: "Alasan rujukan",    done: alasan.trim() !== "" },
    { label: "Diagnosa dipilih",  done: selectedDiagnosa.length > 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={MapPin} title="Poli Tujuan" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Pilih Poli Tujuan" required>
                <select value={poliTujuan} onChange={e => setPoliTujuan(e.target.value)} className={inputCls}>
                  <option value="">— Pilih poli —</option>
                  {Object.entries(POLI_CFG).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dokter Tujuan" hint="Kosongkan jika belum ditentukan">
                <input value={dokterTujuan} onChange={e => setDokterTujuan(e.target.value)} placeholder="Nama dokter di poli tujuan" className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Siren} title="Prioritas Rujukan" />
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {PRIORITAS.map(opt => {
                  const sel = prioritas === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => setPrioritas(opt.id)}
                      className={cn("flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition", sel ? opt.sel : opt.idle)}>
                      <div className="flex w-full items-center gap-1">
                        <p className="text-xs font-semibold leading-none">{opt.label}</p>
                        {sel && <Check size={10} className="ml-auto shrink-0" />}
                      </div>
                      <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map(d => {
                const sel = selectedDiagnosa.includes(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => toggleDiagnosa(d.id)}
                    className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel ? "border-sky-300 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                      sel ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white")}>
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                      d.tipe === "Utama" ? "bg-indigo-100 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200")}>
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BookOpen} title="Alasan & Catatan" />
            <div className="flex flex-col gap-3 p-4">
              <Field label="Alasan Rujukan" required>
                <textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={3}
                  placeholder="Alasan merujuk pasien ke poli ini..." className={textareaCls} />
              </Field>
              <Field label="Catatan Tambahan">
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                  placeholder="Catatan untuk dokter poli tujuan..." className={textareaCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Kelengkapan Form</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition",
                    done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300")}>
                    {done ? <Check size={9} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                  </span>
                  <span className={cn("text-[11px] transition", done ? "text-slate-700" : "text-slate-400")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-sky-600 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Navigation size={13} className="text-sky-200" />
                <p className="text-xs font-semibold text-white">Preview Rujuk Internal</p>
              </div>
              <span className="rounded-md bg-sky-500/60 px-2 py-0.5 text-[10px] font-semibold text-sky-100 ring-1 ring-sky-400">Live</span>
            </div>
            <div className="p-5">
              <div className="mb-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <ArrowRight size={13} />
                  </span>
                  <p className="text-sm font-bold text-slate-900">Rujuk Internal</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {patient.poli.replace(/_/g, " ")} → {poliLabel || "—"}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Pasien</p>
                  <div className="grid grid-cols-2 gap-2">
                    <PreviewRow label="Nama" value={patient.name} />
                    <PreviewRow label="No. RM" value={patient.noRM} mono />
                    <PreviewRow label="Usia / JK" value={`${patient.age} thn / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
                    <PreviewRow label="Poli Asal" value={patient.poli.replace(/_/g, " ")} />
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                {poliLabel && (
                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Dirujuk Ke</p>
                    <p className="text-xs font-semibold text-sky-800">{poliLabel}</p>
                    {dokterTujuan && <p className="mt-0.5 text-[11px] text-sky-600">{dokterTujuan}</p>}
                  </div>
                )}
                {prioritas && (
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
                      prioritas === "Segera" ? "bg-rose-50 text-rose-700 ring-rose-200" :
                      prioritas === "Elektif" ? "bg-sky-50 text-sky-700 ring-sky-200" :
                      "bg-teal-50 text-teal-700 ring-teal-200")}>
                      Prioritas: {prioritas}
                    </span>
                  </div>
                )}
                {selectedDiagnosa.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa</p>
                    {patient.diagnosa.filter(d => selectedDiagnosa.includes(d.id)).map(d => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{d.kodeIcd10}</span>
                        <span className="text-[11px] text-slate-700">{d.namaDiagnosis}</span>
                      </div>
                    ))}
                  </div>
                )}
                {alasan && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{alasan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canSubmit && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700">
                Lengkapi semua field bertanda <span className="font-bold text-rose-500">*</span> untuk melanjutkan.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          {poliLabel ? (
            <span className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {patient.poli.replace(/_/g, " ")} → {poliLabel}
            </span>
          ) : (
            <p className="text-xs text-slate-400">Pilih poli tujuan untuk melanjutkan</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Printer size={13} /> Cetak
          </button>
          <button onClick={() => canSubmit && onSubmit()} disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
            <ArrowRight size={13} /> Kirim Rujukan Internal
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rujuk Eksternal Form ───────────────────────────────────

interface EksternalFormProps {
  patient: RJPatientDetail;
  onSubmit: () => void;
}

function RujukEksternalForm({ patient, onSubmit }: EksternalFormProps) {
  const [noSurat, setNoSurat]           = useState(`RUJ/RJ/2026/05/${Math.floor(Math.random() * 900 + 100)}`);
  const [tglKeluar, setTglKeluar]       = useState("");
  const [jamKeluar, setJamKeluar]       = useState("");
  const [tglRencana, setTglRencana]     = useState("");
  const [jenisPelayanan, setJenisPelayanan] = useState<JenisPelayanan | null>(null);
  const [jenisRujukan, setJenisRujukan]     = useState<JenisRujukan | null>(null);
  const [tujuanPPK, setTujuanPPK]       = useState("");
  const [tujuanPoli, setTujuanPoli]     = useState("");
  const [dokterPerujuk, setDokterPerujuk] = useState(patient.dokter);
  const [keterangan, setKeterangan]     = useState("");
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<string[]>(
    patient.diagnosa.filter(d => d.tipe === "Utama").map(d => d.id),
  );

  const toggleDiagnosa = (id: string) =>
    setSelectedDiagnosa(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const pelayananDef = jenisPelayanan ? PELAYANAN.find(p => p.id === jenisPelayanan) : null;
  const rujukanDef   = jenisRujukan   ? RUJUKAN.find(r => r.id === jenisRujukan)     : null;
  const diagnosaChosen = patient.diagnosa.filter(d => selectedDiagnosa.includes(d.id));

  const canSubmit =
    tglKeluar !== "" && jamKeluar !== "" &&
    jenisPelayanan !== null && jenisRujukan !== null &&
    tujuanPPK.trim() !== "" && tujuanPoli.trim() !== "" &&
    selectedDiagnosa.length > 0;

  const checklist = [
    { label: "Tanggal & Waktu",    done: tglKeluar !== "" && jamKeluar !== "" },
    { label: "Jenis Pelayanan",    done: jenisPelayanan !== null },
    { label: "Jenis Rujukan",      done: jenisRujukan !== null },
    { label: "Tujuan PPK",         done: tujuanPPK.trim() !== "" },
    { label: "Tujuan Ruangan/Poli",done: tujuanPoli.trim() !== "" },
    { label: "Diagnosa dipilih",   done: selectedDiagnosa.length > 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Form */}
        <div className="flex flex-col gap-4">

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardList} title="Identitas Surat Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Nomor Surat" required>
                  <input value={noSurat} onChange={e => setNoSurat(e.target.value)}
                    placeholder="RUJ/RJ/2026/..." className={cn(inputCls, "font-mono text-[11px]")} />
                </Field>
                <Field label="Tanggal" required>
                  <input type="date" value={tglKeluar} onChange={e => setTglKeluar(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Waktu" required>
                  <input type="time" value={jamKeluar} onChange={e => setJamKeluar(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Dokter Perujuk" required>
                <input value={dokterPerujuk} onChange={e => setDokterPerujuk(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={MapPin} title="Tujuan Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Tujuan PPK / Fasilitas Kesehatan" required hint="Nama RS atau fasilitas tujuan">
                <input value={tujuanPPK} onChange={e => setTujuanPPK(e.target.value)}
                  placeholder="Contoh: RSUP Prof. Dr. R.D. Kandou Manado" className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tujuan Ruangan / Poli" required>
                  <input value={tujuanPoli} onChange={e => setTujuanPoli(e.target.value)}
                    placeholder="Poli Jantung, Bedah Saraf..." className={inputCls} />
                </Field>
                <Field label="Tanggal Rencana Kunjungan">
                  <input type="date" value={tglRencana} onChange={e => setTglRencana(e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Tag} title="Klasifikasi Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Jenis Pelayanan <span className="text-rose-400">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PELAYANAN.map(opt => {
                    const Icon = opt.icon;
                    const sel = jenisPelayanan === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setJenisPelayanan(opt.id)}
                        className={cn("flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition", sel ? opt.sel : opt.idle)}>
                        <div className="flex w-full items-center gap-1.5">
                          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded",
                            sel ? "bg-white/60 text-current" : "bg-slate-100 text-slate-500")}>
                            <Icon size={11} />
                          </span>
                          {sel && <Check size={10} className="ml-auto shrink-0" />}
                        </div>
                        <p className="text-xs font-semibold leading-none">{opt.label}</p>
                        <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Jenis Rujukan <span className="text-rose-400">*</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {RUJUKAN.map(opt => {
                    const sel = jenisRujukan === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setJenisRujukan(opt.id)}
                        className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition", sel ? opt.sel : opt.idle)}>
                        <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                          sel ? "border-current bg-current text-white" : "border-slate-300 bg-white")}>
                          {sel && <Check size={9} className="text-white" />}
                        </span>
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <span className="ml-auto text-[10px] opacity-60">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map(d => {
                const sel = selectedDiagnosa.includes(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => toggleDiagnosa(d.id)}
                    className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                      sel ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white")}>
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                      d.tipe === "Utama" ? "bg-indigo-100 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200")}>
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BookOpen} title="Keterangan Klinis" />
            <div className="p-4">
              <textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} rows={4}
                placeholder="Ringkasan kondisi klinis, tatalaksana yang sudah diberikan, alasan rujukan, hal yang perlu diperhatikan..."
                className={textareaCls} />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Kelengkapan Form</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition",
                    done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300")}>
                    {done ? <Check size={9} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                  </span>
                  <span className={cn("text-[11px] transition", done ? "text-slate-700" : "text-slate-400")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-indigo-600 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-indigo-200" />
                <p className="text-xs font-semibold text-white">Preview Surat Rujukan</p>
              </div>
              <span className="rounded-md bg-indigo-500/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 ring-1 ring-indigo-400">Live</span>
            </div>
            <div className="p-5">
              <div className="mb-4 border-b border-slate-200 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Send size={13} />
                  </span>
                  <p className="text-sm font-bold text-slate-900">Surat Rujukan RJ</p>
                </div>
                <p className="font-mono text-[11px] text-slate-400">{noSurat || "—"}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <PreviewRow label="Tanggal" value={tglKeluar ? new Date(tglKeluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
                  <PreviewRow label="Waktu" value={jamKeluar || "—"} />
                </div>
                {tglRencana && <PreviewRow label="Rencana Kunjungan" value={new Date(tglRencana).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />}
                <div className="h-px bg-slate-100" />
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Pasien</p>
                  <div className="grid grid-cols-2 gap-2">
                    <PreviewRow label="Nama" value={patient.name} />
                    <PreviewRow label="No. RM" value={patient.noRM} mono />
                    <PreviewRow label="Usia / JK" value={`${patient.age} thn / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
                    <PreviewRow label="Penjamin" value={patient.penjamin.replace(/_/g, " ")} />
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="grid grid-cols-2 gap-3">
                  {pelayananDef && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Pelayanan</p>
                      <span className={cn("inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1", pelayananDef.sel)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", pelayananDef.dot)} />
                        {pelayananDef.label}
                      </span>
                    </div>
                  )}
                  {rujukanDef && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Rujukan</p>
                      <span className={cn("inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1", rujukanDef.sel)}>
                        {rujukanDef.label}
                      </span>
                    </div>
                  )}
                </div>
                {tujuanPPK && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                    <div className="flex items-start gap-2">
                      <ArrowRight size={13} className="mt-0.5 shrink-0 text-indigo-400" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Dirujuk Ke</p>
                        <p className="text-xs font-semibold text-indigo-800">{tujuanPPK}</p>
                        {tujuanPoli && (
                          <div className="mt-0.5 flex items-center gap-1">
                            <ChevronRight size={10} className="text-indigo-300" />
                            <p className="text-[11px] text-indigo-600">{tujuanPoli}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {diagnosaChosen.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa</p>
                    {diagnosaChosen.map(d => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{d.kodeIcd10}</span>
                        <span className="text-[11px] text-slate-700">{d.namaDiagnosis}</span>
                      </div>
                    ))}
                  </div>
                )}
                {keterangan && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Keterangan Klinis</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{keterangan}</p>
                  </div>
                )}
                <div className="h-px bg-slate-100" />
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Dokter Perujuk,</p>
                    <div className="my-5" />
                    <p className="border-t border-slate-300 pt-1 text-[11px] font-semibold text-slate-700">{dokterPerujuk || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!canSubmit && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700">
                Lengkapi semua field bertanda <span className="font-bold text-rose-500">*</span> untuk dapat mengirim surat rujukan.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          {canSubmit ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {tujuanPPK}
              </span>
              {tujuanPoli && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ChevronRight size={12} /> {tujuanPoli}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Lengkapi form rujukan untuk melanjutkan</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Printer size={13} /> Cetak
          </button>
          <button onClick={() => canSubmit && onSubmit()} disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
            <Send size={13} /> Kirim Surat Rujukan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admisi Rawat Inap Form ─────────────────────────────────

interface AdmisiFormProps {
  patient: RJPatientDetail;
  onSubmit: () => void;
}

function AdmisiRIForm({ patient, onSubmit }: AdmisiFormProps) {
  const [alasanAdmisi, setAlasanAdmisi]   = useState("");
  const [dpjp, setDpjp]                   = useState(patient.dokter);
  const [kelasRI, setKelasRI]             = useState<KelasRI | null>(null);
  const [catatanBangsal, setCatatanBangsal] = useState("");
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<string[]>(
    patient.diagnosa.filter(d => d.tipe === "Utama").map(d => d.id),
  );
  const [konfirmasi, setKonfirmasi]       = useState(false);

  const toggleDiagnosa = (id: string) =>
    setSelectedDiagnosa(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const kelasLabel = kelasRI ? KELAS_RI.find(k => k.id === kelasRI)?.label : null;
  const canSubmit = alasanAdmisi.trim() !== "" && kelasRI !== null && selectedDiagnosa.length > 0 && konfirmasi;

  const checklist = [
    { label: "Alasan admisi",    done: alasanAdmisi.trim() !== "" },
    { label: "Diagnosa masuk",   done: selectedDiagnosa.length > 0 },
    { label: "Kelas perawatan",  done: kelasRI !== null },
    { label: "Konfirmasi dokter",done: konfirmasi },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardList} title="Data Admisi" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Alasan Admisi Rawat Inap" required>
                <textarea value={alasanAdmisi} onChange={e => setAlasanAdmisi(e.target.value)} rows={3}
                  placeholder="Kondisi yang memerlukan perawatan rawat inap, alasan medis admisi..."
                  className={textareaCls} />
              </Field>
              <Field label="DPJP / Dokter Penanggungjawab">
                <input value={dpjp} onChange={e => setDpjp(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BedDouble} title="Kelas Perawatan" />
            <div className="p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Pilih Kelas <span className="text-rose-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KELAS_RI.map(opt => {
                  const sel = kelasRI === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => setKelasRI(opt.id)}
                      className={cn("flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition", sel ? opt.sel : opt.idle)}>
                      <div className="flex w-full items-center gap-1">
                        <p className="text-xs font-semibold leading-none">{opt.label}</p>
                        {sel && <Check size={10} className="ml-auto shrink-0" />}
                      </div>
                      <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Masuk" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map(d => {
                const sel = selectedDiagnosa.includes(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => toggleDiagnosa(d.id)}
                    className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                      sel ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white")}>
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                      d.tipe === "Utama" ? "bg-indigo-100 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200")}>
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BookOpen} title="Catatan ke Bangsal" />
            <div className="p-4">
              <textarea value={catatanBangsal} onChange={e => setCatatanBangsal(e.target.value)} rows={3}
                placeholder="Instruksi khusus, kondisi pasien, hal yang perlu diperhatikan bangsal..."
                className={textareaCls} />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={konfirmasi} onChange={e => setKonfirmasi(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600" />
                <p className="text-xs text-slate-700">
                  Saya, <span className="font-semibold">{dpjp || "dokter"}</span>, menyatakan bahwa pasien{" "}
                  <span className="font-semibold">{patient.name}</span> memerlukan perawatan rawat inap dan
                  telah mendapat penjelasan mengenai rencana perawatan.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Preview / checklist */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Kelengkapan Form</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition",
                    done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300")}>
                    {done ? <Check size={9} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                  </span>
                  <span className={cn("text-[11px] transition", done ? "text-slate-700" : "text-slate-400")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-emerald-600 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <BedDouble size={13} className="text-emerald-200" />
                <p className="text-xs font-semibold text-white">Preview Admisi</p>
              </div>
              <span className="rounded-md bg-emerald-500/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-400">Live</span>
            </div>
            <div className="p-5">
              <div className="mb-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <BedDouble size={13} />
                  </span>
                  <p className="text-sm font-bold text-slate-900">Surat Pengantar Admisi</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {patient.poli.replace(/_/g, " ")} → Rawat Inap {kelasLabel || "—"}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Pasien</p>
                  <div className="grid grid-cols-2 gap-2">
                    <PreviewRow label="Nama" value={patient.name} />
                    <PreviewRow label="No. RM" value={patient.noRM} mono />
                    <PreviewRow label="Usia / JK" value={`${patient.age} thn / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
                    <PreviewRow label="Penjamin" value={patient.penjamin.replace(/_/g, " ")} />
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                {kelasRI && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Kelas Perawatan</p>
                    <p className="text-xs font-semibold text-emerald-800">{kelasLabel}</p>
                  </div>
                )}
                <PreviewRow label="DPJP" value={dpjp} />
                {selectedDiagnosa.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa Masuk</p>
                    {patient.diagnosa.filter(d => selectedDiagnosa.includes(d.id)).map(d => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{d.kodeIcd10}</span>
                        <span className="text-[11px] text-slate-700">{d.namaDiagnosis}</span>
                      </div>
                    ))}
                  </div>
                )}
                {alasanAdmisi && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan Admisi</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{alasanAdmisi}</p>
                  </div>
                )}
                {catatanBangsal && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Catatan Bangsal</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{catatanBangsal}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canSubmit && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700">
                Lengkapi semua field dan centang konfirmasi dokter untuk melanjutkan.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          {kelasLabel ? (
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Admisi {kelasLabel}
            </span>
          ) : (
            <p className="text-xs text-slate-400">Pilih kelas perawatan untuk melanjutkan</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Printer size={13} /> Cetak
          </button>
          <button onClick={() => canSubmit && onSubmit()} disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
            <BedDouble size={13} /> Proses Admisi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────

function SuccessScreen({
  tipe, patient, onBack,
}: {
  tipe: DisposisiTipe;
  patient: RJPatientDetail;
  onBack: () => void;
}) {
  const MAP = {
    "rujuk-internal":  { label: "Rujuk Internal Berhasil Dikirim",     icon: ArrowRight, cls: "bg-sky-100 text-sky-600"     },
    "rujuk-eksternal": { label: "Surat Rujukan Berhasil Dibuat",        icon: Send,       cls: "bg-indigo-100 text-indigo-600" },
    "admisi-ri":       { label: "Surat Pengantar Admisi Berhasil Dibuat", icon: BedDouble,cls: "bg-emerald-100 text-emerald-600" },
  } as const;
  const def = MAP[tipe];
  const Icon = def.icon;
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <span className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", def.cls)}>
        <CheckCircle2 size={30} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{def.label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {patient.name} ({patient.noRM})
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
          <Printer size={13} /> Cetak Dokumen
        </button>
        <button onClick={onBack}
          className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
          Kembali ke Form
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────

export default function DisposisiRJTab({ patient }: { patient: RJPatientDetail }) {
  const [tipe, setTipe]           = useState<DisposisiTipe | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleTipeChange(newTipe: DisposisiTipe) {
    setTipe(newTipe);
    setSubmitted(false);
  }

  const penjaminLabel = patient.penjamin.replace(/_/g, " ");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Info bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pasien</p>
              <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM} · {patient.age} thn · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Stethoscope size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">DPJP</p>
              <p className="text-xs font-semibold text-slate-800">{patient.dokter}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Hospital size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Poli</p>
              <p className="text-xs font-semibold text-slate-800">{patient.poli.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kunjungan</p>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(patient.tanggalKunjungan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-[11px] text-slate-400">Daftar: {patient.waktuDaftar}</p>
            </div>
          </div>
          <div className="ml-auto">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {penjaminLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tipe selector ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Navigation} title="Jenis Disposisi" />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {DISPOSISI.map(opt => {
            const Icon = opt.icon;
            const sel = tipe === opt.id;
            return (
              <button key={opt.id} type="button" onClick={() => handleTipeChange(opt.id)}
                className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition", sel ? opt.sel : opt.idle)}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                  sel ? "bg-white/60 text-current" : "bg-slate-100 text-slate-500")}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                </div>
                {sel && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60">
                    <Check size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form area ── */}
      <AnimatePresence mode="wait">
        {!tipe && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Navigation size={22} />
            </span>
            <p className="font-semibold text-slate-500">Pilih jenis disposisi</p>
            <p className="mt-1 text-sm text-slate-400">Rujuk internal, rujuk eksternal, atau admisi rawat inap</p>
          </motion.div>
        )}

        {tipe && submitted && (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SuccessScreen tipe={tipe} patient={patient} onBack={() => setSubmitted(false)} />
          </motion.div>
        )}

        {tipe && !submitted && tipe === "rujuk-internal" && (
          <motion.div key="internal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <RujukInternalForm patient={patient} onSubmit={() => setSubmitted(true)} />
          </motion.div>
        )}

        {tipe && !submitted && tipe === "rujuk-eksternal" && (
          <motion.div key="eksternal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <RujukEksternalForm patient={patient} onSubmit={() => setSubmitted(true)} />
          </motion.div>
        )}

        {tipe && !submitted && tipe === "admisi-ri" && (
          <motion.div key="admisi" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <AdmisiRIForm patient={patient} onSubmit={() => setSubmitted(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
