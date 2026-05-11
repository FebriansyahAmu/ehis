"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Circle, FileText, Lock,
  Printer, ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type PasienPulangData, type ResumeMedisRI,
  checkResumeCompletion,
} from "./pasienPulangShared";
import { STATUS_KEPULANGAN_CONFIG } from "./pasienPulangShared";

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

function FormArea({
  label, value, onChange, rows = 3, required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
        {value || <span className="italic text-slate-400">—</span>}
      </div>
    </div>
  );
}

// ── Print Preview Modal ───────────────────────────────────

function PrintPreviewModal({
  data, patient, onClose,
}: { data: PasienPulangData; patient: RawatInapPatientDetail; onClose: () => void }) {
  const diagnosaPrimer = patient.diagnosa.find(d => d.tipe === "Utama");
  const diagnosaLain   = patient.diagnosa.filter(d => d.tipe !== "Utama");
  const statusCfg      = data.status ? STATUS_KEPULANGAN_CONFIG[data.status] : null;

  const lamaRawat = (() => {
    if (!data.tanggalPulang || !patient.admitDate) return "—";
    const ms   = new Date(data.tanggalPulang).getTime() - new Date(patient.admitDate).getTime();
    const days = Math.ceil(ms / 86400000);
    return `${days} hari`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-500" />
            <p className="text-sm font-bold text-slate-700">Resume Medis — Preview</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600">
              <Printer size={12} /> Cetak
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="p-8 font-mono text-xs leading-relaxed text-slate-800">
          {/* Header RS */}
          <div className="mb-4 border-b-2 border-slate-800 pb-3 text-center">
            <p className="text-base font-bold uppercase tracking-wider">RESUME MEDIS PASIEN RAWAT INAP</p>
            <p className="text-[10px] text-slate-500">Rumah Sakit EHIS · Jl. Kesehatan No. 1, Jakarta</p>
          </div>

          {/* Identitas */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">I. IDENTITAS PASIEN</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div><span className="font-bold">Nama</span>          : {patient.name}</div>
              <div><span className="font-bold">No. RM</span>        : {patient.noRM}</div>
              <div><span className="font-bold">Umur / Jenis Kelamin</span>: {patient.age} tahun / {patient.gender === "L" ? "Laki-laki" : "Perempuan"}</div>
              <div><span className="font-bold">Penjamin</span>      : {patient.penjamin.replace(/_/g, " ")}{patient.noBpjs ? ` (${patient.noBpjs})` : ""}</div>
              <div className="col-span-2"><span className="font-bold">Alamat</span>        : {patient.alamat}</div>
            </div>
          </section>

          {/* Periode rawat */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">II. PERIODE PERAWATAN</p>
            <div className="grid grid-cols-3 gap-x-4 text-[11px]">
              <div><span className="font-bold">Tanggal Masuk</span> : {patient.tglMasuk}</div>
              <div><span className="font-bold">Tanggal Pulang</span>: {data.tanggalPulang ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
              <div><span className="font-bold">Lama Rawat</span>    : {lamaRawat}</div>
              <div><span className="font-bold">Ruangan / Kelas</span>: {patient.ruangan} / {patient.kelas.replace("_", " ")}</div>
              <div><span className="font-bold">DPJP</span>          : {patient.dpjp}</div>
              <div><span className="font-bold">Status Pulang</span> : {data.status || "—"}</div>
            </div>
          </section>

          {/* Diagnosa */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">III. DIAGNOSA</p>
            <div className="text-[11px]">
              <p><span className="font-bold">Diagnosa Masuk</span>   : {patient.diagnosis}</p>
              {diagnosaPrimer && (
                <p><span className="font-bold">Diagnosa Keluar (Primer)</span>: {diagnosaPrimer.namaDiagnosis} ({diagnosaPrimer.kodeIcd10})</p>
              )}
              {diagnosaLain.map(d => (
                <p key={d.id}><span className="font-bold">  {d.tipe}</span>: {d.namaDiagnosis} ({d.kodeIcd10})</p>
              ))}
            </div>
          </section>

          {/* Klinis */}
          {[
            ["IV. ANAMNESIS SINGKAT & PEMERIKSAAN FISIK", data.resume.ringkasanAnamnesis],
            ["V. HASIL PENUNJANG BERMAKNA",               data.resume.hasilPemeriksaan],
            ["VI. TERAPI YANG DIBERIKAN",                 data.resume.terapiDiberikan],
            ["VII. KONDISI SAAT PULANG",                  data.resume.kondisiSaatPulang],
            ["VIII. INSTRUKSI & ANJURAN",                 data.resume.instruksiPulang],
            ["IX. PEMBATASAN AKTIVITAS",                  data.resume.pembatasanAktivitas],
            ["X. DIET",                                   data.resume.dietPulang],
          ].map(([title, content]) => (
            <section key={title} className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
              <p className="whitespace-pre-wrap text-[11px]">{content || "—"}</p>
            </section>
          ))}

          {/* Obat pulang */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">XI. OBAT YANG DIBAWA PULANG</p>
            {data.obatPulang.length === 0 ? (
              <p className="text-[11px]">—</p>
            ) : (
              <div className="text-[11px]">
                {data.obatPulang.map((ob, i) => (
                  <p key={ob.id}>{i + 1}. {ob.namaObat} {ob.dosis} — {ob.frekuensi}, selama {ob.durasi}</p>
                ))}
              </div>
            )}
          </section>

          {/* Jadwal kontrol */}
          <section className="mb-6">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">XII. RENCANA FOLLOW-UP</p>
            {data.jadwalKontrol.length === 0 ? (
              <p className="text-[11px]">—</p>
            ) : (
              <div className="text-[11px]">
                {data.jadwalKontrol.map(jk => (
                  <p key={jk.id}>
                    • {new Date(jk.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} — {jk.poli}{jk.dokter ? ` (${jk.dokter})` : ""}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* TTD */}
          <div className="mt-8 border-t border-slate-300 pt-4">
            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div className="text-center">
                <p>Yang Menerima,</p>
                <p>Pasien / Wali</p>
                <div className="my-8" />
                <p className="border-t border-slate-400 pt-1">( _________________________ )</p>
              </div>
              <div className="text-center">
                <p>Dokter Penanggung Jawab,</p>
                <p>{patient.dpjp}</p>
                <div className="my-8" />
                <p className="border-t border-slate-400 pt-1">( {patient.dpjp} )</p>
                {statusCfg && data.resume.dpjpApproved && (
                  <p className="mt-1 text-[9px] text-emerald-600">Ditandatangani: {data.resume.dpjpApprovedAt}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ResumeMedisPane({ data, onChange, patient }: Props) {
  const [showPrint, setShowPrint] = useState(false);

  function setResume<K extends keyof ResumeMedisRI>(key: K, val: ResumeMedisRI[K]) {
    onChange({ ...data, resume: { ...data.resume, [key]: val } });
  }

  function handleApprove() {
    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    onChange({ ...data, resume: { ...data.resume, dpjpApproved: true, dpjpApprovedAt: now } });
  }

  const hasDiagnosa   = patient.diagnosa.length > 0;
  const completions   = checkResumeCompletion(data, hasDiagnosa);
  const doneCount     = completions.filter(c => c.done).length;
  const canPrint      = completions.every(c => c.done);
  const diagnosaPrimer = patient.diagnosa.find(d => d.tipe === "Utama");

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row">

        {/* ── Left: Form ── */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* Auto-fill identity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identitas (Auto-fill)</p>
            <div className="grid grid-cols-2 gap-2">
              <ReadOnly label="Nama Pasien"       value={patient.name} />
              <ReadOnly label="No. Rekam Medis"   value={patient.noRM} />
              <ReadOnly label="Umur / Jenis Kelamin" value={`${patient.age} tahun / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
              <ReadOnly label="Penjamin"          value={patient.penjamin.replace(/_/g, " ")} />
              <ReadOnly label="Tanggal Masuk"     value={patient.tglMasuk} />
              <ReadOnly label="DPJP"              value={patient.dpjp} />
            </div>
          </div>

          {/* Diagnosa auto-fill */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Diagnosa (dari Tab Diagnosa)</p>
            {hasDiagnosa ? (
              <div className="space-y-1.5">
                {patient.diagnosa.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold",
                      d.tipe === "Utama" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500",
                    )}>{d.tipe}</span>
                    <span className="text-slate-700">{d.namaDiagnosis}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">({d.kodeIcd10})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 text-amber-500" />
                <p className="text-[11px] text-amber-700">Belum ada diagnosa — isi di tab Diagnosa rekam medis</p>
              </div>
            )}
          </div>

          {/* Manual sections */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Anamnesis & Pemeriksaan</p>
            <div className="space-y-3">
              <FormArea
                label="Anamnesis Singkat & Pemeriksaan Fisik" rows={4}
                value={data.resume.ringkasanAnamnesis}
                onChange={v => setResume("ringkasanAnamnesis", v)}
                placeholder="Keluhan masuk, riwayat singkat, pemeriksaan fisik bermakna saat masuk..."
              />
              <FormArea
                label="Hasil Penunjang Bermakna" rows={3}
                value={data.resume.hasilPemeriksaan}
                onChange={v => setResume("hasilPemeriksaan", v)}
                placeholder="Lab, radiologi, dan pemeriksaan khusus yang bermakna..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Terapi & Kondisi Pulang</p>
            <div className="space-y-3">
              <FormArea
                label="Terapi yang Diberikan *" rows={3} required
                value={data.resume.terapiDiberikan}
                onChange={v => setResume("terapiDiberikan", v)}
                placeholder="Obat, tindakan, prosedur, konsultasi yang dilakukan selama rawat inap..."
              />
              <FormArea
                label="Kondisi Saat Pulang *" rows={3} required
                value={data.resume.kondisiSaatPulang}
                onChange={v => setResume("kondisiSaatPulang", v)}
                placeholder="Kondisi objektif pasien saat pulang (TTV, keluhan, status fungsional)..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Instruksi & Diet</p>
            <div className="space-y-3">
              <FormArea
                label="Instruksi & Anjuran Pulang *" rows={4} required
                value={data.resume.instruksiPulang}
                onChange={v => setResume("instruksiPulang", v)}
                placeholder="Instruksi kepulangan, anjuran, tanda bahaya yang harus segera ke RS..."
              />
              <FormArea
                label="Pembatasan Aktivitas" rows={2}
                value={data.resume.pembatasanAktivitas}
                onChange={v => setResume("pembatasanAktivitas", v)}
                placeholder="Aktivitas yang diperbolehkan / dibatasi..."
              />
              <FormArea
                label="Diet Pulang" rows={2}
                value={data.resume.dietPulang}
                onChange={v => setResume("dietPulang", v)}
                placeholder="Anjuran diet di rumah..."
              />
            </div>
          </div>

        </div>

        {/* ── Right: Completion checker ── */}
        <div className="w-full shrink-0 space-y-3 xl:w-64">

          {/* Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan Resume</p>

            <div className="mb-3 flex items-end justify-between">
              <p className={cn("text-2xl font-bold", canPrint ? "text-emerald-600" : "text-amber-600")}>
                {doneCount}/{completions.length}
              </p>
              <p className="text-[10px] text-slate-400">item</p>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", canPrint ? "bg-emerald-400" : "bg-amber-400")}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((doneCount / completions.length) * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="mt-3 space-y-1.5">
              {completions.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={12} className="mt-0.5 shrink-0 text-red-300" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[11px]",
                      item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700",
                    )}>
                      {item.label}
                    </p>
                    {!item.done && (
                      <p className="text-[9px] text-slate-400">{item.hint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DPJP sign-off */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">TTD DPJP</p>
            {data.resume.dpjpApproved ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800">Ditandatangani</p>
                    <p className="text-[10px] text-emerald-600">{data.resume.dpjpApprovedAt}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={!completions.filter(c => c.id !== "c7").every(c => c.done)}
                className={cn(
                  "w-full rounded-xl py-2.5 text-[11px] font-bold transition",
                  completions.filter(c => c.id !== "c7").every(c => c.done)
                    ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                )}
              >
                {completions.filter(c => c.id !== "c7").every(c => c.done)
                  ? "Tandatangani Resume Medis"
                  : "Lengkapi data terlebih dahulu"
                }
              </button>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={() => setShowPrint(true)}
            disabled={!canPrint}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              canPrint
                ? "bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {canPrint ? (
              <><Printer size={14} /> Cetak Resume Medis</>
            ) : (
              <><Lock size={13} /> {completions.length - doneCount} item belum lengkap</>
            )}
          </button>

          {!canPrint && (
            <p className="text-center text-[10px] text-slate-400">
              Lengkapi semua item di atas untuk mengaktifkan cetak
            </p>
          )}

        </div>
      </div>

      {/* Print modal */}
      <AnimatePresence>
        {showPrint && (
          <PrintPreviewModal data={data} patient={patient} onClose={() => setShowPrint(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
