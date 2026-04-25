"use client";

import { useState } from "react";
import {
  Send, User, Stethoscope, Calendar, FileText, Building2,
  MapPin, Check, CheckCircle2, Printer, Clock, Tag,
  AlertCircle, ClipboardList, BookOpen, ArrowRight,
  ChevronRight, Ambulance, Hospital, Microscope,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type JenisPelayanan =
  | "Rawat_Jalan"
  | "Rawat_Inap"
  | "Rawat_Darurat"
  | "ICU_Intensif";

type JenisRujukan =
  | "FKTP_ke_FKRTL"
  | "Antar_FKRTL"
  | "Spesialistik"
  | "Parsial"
  | "Rujukan_Balik";

// ── Config ─────────────────────────────────────────────────

interface PelayananDef {
  id: JenisPelayanan;
  label: string;
  sub: string;
  icon: LucideIcon;
  sel: string;
  idle: string;
  dot: string;
}

const PELAYANAN: PelayananDef[] = [
  {
    id: "Rawat_Jalan",
    label: "Rawat Jalan",
    sub: "Poli / Klinik",
    icon: BookOpen,
    sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
    dot: "bg-indigo-500",
  },
  {
    id: "Rawat_Inap",
    label: "Rawat Inap",
    sub: "Bangsal / Ward",
    icon: Building2,
    sel: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40",
    dot: "bg-violet-500",
  },
  {
    id: "Rawat_Darurat",
    label: "Rawat Darurat",
    sub: "IGD / Emergency",
    icon: Ambulance,
    sel: "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/40",
    dot: "bg-rose-500",
  },
  {
    id: "ICU_Intensif",
    label: "ICU / Intensif",
    sub: "Perawatan intensif",
    icon: Microscope,
    sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40",
    dot: "bg-amber-500",
  },
];

interface RujukanDef {
  id: JenisRujukan;
  label: string;
  sub: string;
  sel: string;
  idle: string;
}

const RUJUKAN: RujukanDef[] = [
  {
    id: "FKTP_ke_FKRTL",
    label: "FKTP ke FKRTL",
    sub: "Puskesmas / Klinik → RS",
    sel: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    idle: "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50/40",
  },
  {
    id: "Antar_FKRTL",
    label: "Antar FKRTL",
    sub: "RS → RS (horizontal/vertikal)",
    sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
    idle: "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/40",
  },
  {
    id: "Spesialistik",
    label: "Spesialistik / Konsul",
    sub: "Konsultasi dokter spesialis",
    sel: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/40",
  },
  {
    id: "Parsial",
    label: "Rujukan Parsial",
    sub: "Alih sebagian pelayanan",
    sel: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200",
    idle: "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-teal-50/40",
  },
  {
    id: "Rujukan_Balik",
    label: "Rujukan Balik",
    sub: "Kembali ke FKTP asal",
    sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    idle: "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50/40",
  },
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

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
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

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";

const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";

function PreviewRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          "text-xs font-medium text-slate-800",
          mono && "font-mono",
          highlight && "font-semibold text-indigo-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function RujukanKeluarTab({ patient }: { patient: IGDPatientDetail }) {
  // Core form
  const [noSurat, setNoSurat]           = useState(`RUJ/IGD/2026/04/${Math.floor(Math.random() * 900 + 100)}`);
  const [tglKeluar, setTglKeluar]       = useState("");
  const [jamKeluar, setJamKeluar]       = useState("");
  const [tglRencana, setTglRencana]     = useState("");
  const [jenisPelayanan, setJenisPelayanan] = useState<JenisPelayanan | null>(null);
  const [jenisRujukan, setJenisRujukan]     = useState<JenisRujukan | null>(null);
  const [tujuanPPK, setTujuanPPK]       = useState("");
  const [tujuanPoli, setTujuanPoli]     = useState("");
  const [dokterPerujuk, setDokterPerujuk] = useState(patient.doctor);
  const [keterangan, setKeterangan]     = useState("");
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<string[]>(
    patient.diagnosa.filter((d) => d.tipe === "Utama").map((d) => d.id),
  );
  const [submitted, setSubmitted]       = useState(false);

  const toggleDiagnosa = (id: string) =>
    setSelectedDiagnosa((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const pelayananDef  = jenisPelayanan ? PELAYANAN.find((p) => p.id === jenisPelayanan) : null;
  const rujukanDef    = jenisRujukan   ? RUJUKAN.find((r) => r.id === jenisRujukan)    : null;
  const diagnosaChosen = patient.diagnosa.filter((d) => selectedDiagnosa.includes(d.id));

  const canSubmit =
    tglKeluar !== "" &&
    jamKeluar !== "" &&
    jenisPelayanan !== null &&
    jenisRujukan   !== null &&
    tujuanPPK.trim()   !== "" &&
    tujuanPoli.trim()  !== "" &&
    selectedDiagnosa.length > 0;

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <CheckCircle2 size={30} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Surat Rujukan Berhasil Dibuat</p>
          <p className="mt-1 text-xs text-slate-500">
            {patient.name} ({patient.noRM}) — Rujukan ke{" "}
            <span className="font-semibold text-slate-700">{tujuanPPK}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            No. Surat: <span className="font-mono">{noSurat}</span> · Oleh: {dokterPerujuk}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak Surat Rujukan
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Kembali ke Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Info bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Perujuk</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kunjungan</p>
              <p className="text-xs font-semibold text-slate-800">{patient.tglKunjungan}</p>
              <p className="text-[11px] text-slate-400">Pukul {patient.arrivalTime}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Kunjungan</p>
              <p className="font-mono text-xs font-semibold text-slate-800">{patient.noKunjungan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Left column: Form ── */}
        <div className="flex flex-col gap-4">

          {/* Section 1: Identitas Surat */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardList} title="Identitas Surat Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Nomor Surat" required>
                  <input
                    value={noSurat}
                    onChange={(e) => setNoSurat(e.target.value)}
                    placeholder="RUJ/IGD/2026/..."
                    className={cn(inputCls, "font-mono text-[11px]")}
                  />
                </Field>
                <Field label="Tanggal Keluar" required>
                  <input
                    type="date"
                    value={tglKeluar}
                    onChange={(e) => setTglKeluar(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Waktu Keluar" required>
                  <input
                    type="time"
                    value={jamKeluar}
                    onChange={(e) => setJamKeluar(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Dokter Perujuk" required>
                <input
                  value={dokterPerujuk}
                  onChange={(e) => setDokterPerujuk(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Tujuan Rujukan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={MapPin} title="Tujuan Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Tujuan PPK / Fasilitas Kesehatan" required hint="Nama RS, Poli, atau Fasilitas Tujuan">
                <input
                  value={tujuanPPK}
                  onChange={(e) => setTujuanPPK(e.target.value)}
                  placeholder="Contoh: RSUP Prof. Dr. R.D. Kandou Manado"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tujuan Ruangan / Poli" required>
                  <input
                    value={tujuanPoli}
                    onChange={(e) => setTujuanPoli(e.target.value)}
                    placeholder="Contoh: Poli Jantung, ICU, Bedah Saraf..."
                    className={inputCls}
                  />
                </Field>
                <Field label="Tanggal Rencana Kunjungan">
                  <input
                    type="date"
                    value={tglRencana}
                    onChange={(e) => setTglRencana(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section 3: Klasifikasi Rujukan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Tag} title="Klasifikasi Rujukan" />
            <div className="flex flex-col gap-4 p-4">

              {/* Jenis Pelayanan */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Jenis Pelayanan <span className="text-rose-400">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PELAYANAN.map((opt) => {
                    const Icon = opt.icon;
                    const sel = jenisPelayanan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setJenisPelayanan(opt.id)}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition",
                          sel ? opt.sel : opt.idle,
                        )}
                      >
                        <div className="flex w-full items-center gap-1.5">
                          <span className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                            sel ? "bg-white/60 text-current" : "bg-slate-100 text-slate-500",
                          )}>
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

              {/* Jenis Rujukan */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Jenis Rujukan <span className="text-rose-400">*</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {RUJUKAN.map((opt) => {
                    const sel = jenisRujukan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setJenisRujukan(opt.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                          sel ? opt.sel : opt.idle,
                        )}
                      >
                        <span className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                          sel ? "border-current bg-current text-white" : "border-slate-300 bg-white",
                        )}>
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

          {/* Section 4: Diagnosa */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map((d) => {
                const sel = selectedDiagnosa.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiagnosa(d.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                      sel ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white",
                    )}>
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                      d.tipe === "Utama"
                        ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                        : d.tipe === "Sekunder"
                        ? "bg-sky-100 text-sky-700 ring-sky-200"
                        : "bg-slate-100 text-slate-500 ring-slate-200",
                    )}>
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Keterangan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BookOpen} title="Keterangan Klinis" />
            <div className="p-4">
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={4}
                placeholder="Ringkasan kondisi klinis, tatalaksana yang sudah diberikan di IGD, alasan rujukan, hal yang perlu diperhatikan di fasilitas tujuan..."
                className={textareaCls}
              />
            </div>
          </div>
        </div>

        {/* ── Right column: Live preview ── */}
        <div className="flex flex-col gap-4">

          {/* Completion checklist */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Kelengkapan Form</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
              {[
                { label: "Tanggal & Waktu Keluar", done: tglKeluar !== "" && jamKeluar !== "" },
                { label: "Jenis Pelayanan",         done: jenisPelayanan !== null },
                { label: "Jenis Rujukan",            done: jenisRujukan !== null },
                { label: "Tujuan PPK",               done: tujuanPPK.trim() !== "" },
                { label: "Tujuan Ruangan / Poli",    done: tujuanPoli.trim() !== "" },
                { label: "Diagnosa dipilih",         done: selectedDiagnosa.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition",
                    done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300",
                  )}>
                    {done ? <Check size={9} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                  </span>
                  <span className={cn(
                    "text-[11px] transition",
                    done ? "text-slate-700" : "text-slate-400",
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview — letter */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-indigo-600 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-indigo-200" />
                <p className="text-xs font-semibold text-white">Preview Surat Rujukan</p>
              </div>
              <span className="rounded-md bg-indigo-500/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 ring-1 ring-indigo-400">
                Live
              </span>
            </div>

            <div className="p-5">
              {/* Letter header */}
              <div className="mb-4 border-b border-slate-200 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Send size={13} />
                  </span>
                  <p className="text-sm font-bold text-slate-900">Surat Rujukan IGD</p>
                </div>
                <p className="font-mono text-[11px] text-slate-400">
                  {noSurat || "—"}
                </p>
              </div>

              <div className="flex flex-col gap-3">

                {/* Waktu keluar */}
                <div className="grid grid-cols-2 gap-3">
                  <PreviewRow
                    label="Tanggal Keluar"
                    value={tglKeluar ? new Date(tglKeluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  />
                  <PreviewRow label="Waktu Keluar" value={jamKeluar || "—"} />
                </div>

                {tglRencana && (
                  <PreviewRow
                    label="Rencana Kunjungan"
                    value={new Date(tglRencana).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  />
                )}

                <div className="h-px bg-slate-100" />

                {/* Patient info */}
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Pasien</p>
                  <div className="grid grid-cols-2 gap-2">
                    <PreviewRow label="Nama" value={patient.name} />
                    <PreviewRow label="No. RM" value={patient.noRM} mono />
                    <PreviewRow label="Usia / JK" value={`${patient.age} thn / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
                    <PreviewRow label="Penjamin" value={patient.penjamin} />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Rujukan detail */}
                <div className="grid grid-cols-2 gap-3">
                  {pelayananDef && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Pelayanan</p>
                      <span className={cn(
                        "inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
                        pelayananDef.sel,
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", pelayananDef.dot)} />
                        {pelayananDef.label}
                      </span>
                    </div>
                  )}
                  {rujukanDef && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Rujukan</p>
                      <span className={cn(
                        "inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
                        rujukanDef.sel,
                      )}>
                        {rujukanDef.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tujuan */}
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

                {/* Diagnosa */}
                {diagnosaChosen.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa</p>
                    <div className="flex flex-col gap-1">
                      {diagnosaChosen.map((d) => (
                        <div key={d.id} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">{d.kodeIcd10}</span>
                          <span className="text-[11px] text-slate-700">{d.namaDiagnosis}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keterangan */}
                {keterangan && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Keterangan Klinis</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{keterangan}</p>
                  </div>
                )}

                <div className="h-px bg-slate-100" />

                {/* Dokter tanda tangan area */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Dokter Perujuk,</p>
                    <div className="my-5" />
                    <p className="border-t border-slate-300 pt-1 text-[11px] font-semibold text-slate-700">
                      {dokterPerujuk || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning if incomplete */}
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

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {canSubmit ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {tujuanPPK}
              </span>
              {tujuanPoli && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ChevronRight size={12} />
                  {tujuanPoli}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Lengkapi form rujukan untuk melanjutkan</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={() => canSubmit && setSubmitted(true)}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={13} />
            Kirim Surat Rujukan
          </button>
        </div>
      </div>
    </div>
  );
}
