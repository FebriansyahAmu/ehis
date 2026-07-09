"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, User, Stethoscope, Calendar, FileText, ClipboardList, BookOpen,
  Check, CheckCircle2, Printer, AlertCircle, Hospital, BedDouble, Send,
  type LucideIcon,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import RujukEksternalForm from "./disposisi/RujukEksternalForm";
import RujukanCetakModal from "./disposisi/RujukanCetakModal";
import { SectionHeader, Field, PreviewRow, inputCls, textareaCls, type DisposisiResult } from "./disposisi/shared";

// ── Types ──────────────────────────────────────────────────

type DisposisiTipe = "rujuk-eksternal" | "admisi-ri";
type KelasRI = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";

// ── Config ─────────────────────────────────────────────────

interface DisposisiDef {
  id: DisposisiTipe;
  label: string;
  sub: string;
  icon: LucideIcon;
  sel: string;
  idle: string;
  dot: string;
}

const DISPOSISI: DisposisiDef[] = [
  {
    id: "rujuk-eksternal",
    label: "Rujuk Eksternal",
    sub: "FKRTL / RS lain",
    icon: Send,
    sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
    dot: "bg-indigo-500",
  },
  {
    id: "admisi-ri",
    label: "Admisi Rawat Inap",
    sub: "Masuk bangsal / perawatan",
    icon: BedDouble,
    sel: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
];

const KELAS_RI: { id: KelasRI; label: string; sub: string; sel: string; idle: string }[] = [
  { id: "VIP",     label: "VIP",     sub: "Suite / VIP",       sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",     idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40"   },
  { id: "Kelas_1", label: "Kelas 1", sub: "Satu tempat tidur",  sel: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",              idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40"      },
  { id: "Kelas_2", label: "Kelas 2", sub: "Dua tempat tidur",   sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",  idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40" },
  { id: "Kelas_3", label: "Kelas 3", sub: "Bangsal umum",       sel: "border-slate-400 bg-slate-50 text-slate-800 ring-1 ring-slate-200",      idle: "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"     },
  { id: "ICU",     label: "ICU",     sub: "Intensive Care",     sel: "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-200",          idle: "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/40"    },
  { id: "HCU",     label: "HCU",     sub: "High Care Unit",     sel: "border-orange-400 bg-orange-50 text-orange-800 ring-1 ring-orange-200",  idle: "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50/40" },
  { id: "Isolasi", label: "Isolasi", sub: "Ruang isolasi",      sel: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200",  idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40" },
];

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
  tipe, patient, result, onBack,
}: {
  tipe: DisposisiTipe;
  patient: RJPatientDetail;
  result: DisposisiResult | null;
  onBack: () => void;
}) {
  const MAP = {
    "rujuk-eksternal": { label: "Surat Rujukan Berhasil Dibuat",          cls: "bg-indigo-100 text-indigo-600" },
    "admisi-ri":       { label: "Surat Pengantar Admisi Berhasil Dibuat", cls: "bg-emerald-100 text-emerald-600" },
  } as const;
  const def = MAP[tipe];
  const [cetakOpen, setCetakOpen] = useState(false);
  const hasSurat = !!result?.rujukan;
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <RujukanCetakModal open={cetakOpen} onClose={() => setCetakOpen(false)} data={result?.rujukan ?? null} />
      <span className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", def.cls)}>
        <CheckCircle2 size={30} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{def.label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {patient.name} ({patient.noRM})
        </p>
        {result?.noRujukan && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            No. Rujukan BPJS: {result.noRujukan}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {hasSurat ? (
          <button onClick={() => setCetakOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
            <Printer size={13} /> Cetak Surat Rujukan
          </button>
        ) : (
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Printer size={13} /> Cetak Dokumen
          </button>
        )}
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
  const [tipe, setTipe]     = useState<DisposisiTipe | null>(null);
  const [result, setResult] = useState<DisposisiResult | null>(null);

  function handleTipeChange(newTipe: DisposisiTipe) {
    setTipe(newTipe);
    setResult(null);
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
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
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
            <p className="mt-1 text-sm text-slate-400">Rujuk eksternal atau admisi rawat inap</p>
          </motion.div>
        )}

        {tipe && result && (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SuccessScreen tipe={tipe} patient={patient} result={result} onBack={() => setResult(null)} />
          </motion.div>
        )}

        {tipe && !result && tipe === "rujuk-eksternal" && (
          <motion.div key="eksternal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <RujukEksternalForm patient={patient} onSubmit={(r) => setResult(r)} />
          </motion.div>
        )}

        {tipe && !result && tipe === "admisi-ri" && (
          <motion.div key="admisi" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <AdmisiRIForm patient={patient} onSubmit={() => setResult({})} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
