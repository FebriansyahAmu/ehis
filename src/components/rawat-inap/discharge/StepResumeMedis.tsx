"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, Printer, ShieldCheck, Lock, AlertCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import type { ResumeMedis, DischargeAsesmen } from "./dischargeShared";
import { KONDISI_PULANG_CONFIG } from "./dischargeShared";

type Props = {
  data:     ResumeMedis;
  onChange: (d: ResumeMedis) => void;
  patient:  RawatInapPatientDetail;
  asesmen:  DischargeAsesmen;
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
        {value || <span className="italic text-slate-400">—</span>}
      </div>
    </div>
  );
}

function FormField({
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
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

// ── Live document preview (right panel) ───────────────────

function LivePreview({
  data, patient, asesmen,
}: { data: ResumeMedis; patient: RawatInapPatientDetail; asesmen: DischargeAsesmen }) {
  const kondisiCfg = asesmen.kondisiPulang
    ? KONDISI_PULANG_CONFIG[asesmen.kondisiPulang as keyof typeof KONDISI_PULANG_CONFIG]
    : null;

  function PreviewField({ label, value }: { label: string; value: string }) {
    return (
      <div className="border-b border-slate-100 pb-2 last:border-0">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={cn("mt-0.5 text-[10px] leading-relaxed", value ? "text-slate-700" : "italic text-slate-300")}>
          {value || "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Paper header */}
      <div className="border-b-2 border-slate-700 bg-slate-800 px-4 py-2.5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white">Resume Medis Rawat Inap</p>
        <p className="text-[8px] text-slate-400">PMK 269/2008</p>
      </div>

      <div className="space-y-3 p-4">
        {/* Patient identity */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          {[
            ["Pasien",   patient.name],
            ["No. RM",   patient.noRM],
            ["DPJP",     patient.dpjp],
            ["MRS",      patient.tglMasuk],
            ["Ruangan",  `${patient.ruangan} / ${patient.noBed}`],
            ["KRS",      asesmen.tanggalRencanaKRS
              ? new Date(asesmen.tanggalRencanaKRS).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : "—"],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="text-[10px] font-medium text-slate-700 leading-tight">{val}</p>
            </div>
          ))}
        </div>

        {/* Kondisi badge */}
        {kondisiCfg && (
          <div className="flex items-center gap-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Kondisi Pulang:</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold ring-1", kondisiCfg.badge, kondisiCfg.ring)}>
              {asesmen.kondisiPulang}
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          <PreviewField label="Diagnosis Masuk"   value={data.diagnosaMasuk} />
          <PreviewField label="Diagnosis Akhir"   value={data.diagnosaAkhir} />
          <PreviewField label="Prosedur"           value={data.prosedurUtama} />
          <PreviewField label="Ringkasan Penyakit" value={data.ringkasanPenyakit.slice(0, 300) + (data.ringkasanPenyakit.length > 300 ? "..." : "")} />
          <PreviewField label="Kondisi Saat Pulang" value={data.kondisiSaatPulang} />
          <PreviewField label="Instruksi Pulang"   value={data.instruksiPulang.slice(0, 200) + (data.instruksiPulang.length > 200 ? "..." : "")} />
          {data.pembatasanAktivitas && <PreviewField label="Pembatasan Aktivitas" value={data.pembatasanAktivitas} />}
          {data.dietPulang          && <PreviewField label="Diet Pulang"           value={data.dietPulang}          />}
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg border border-slate-200 p-2 text-center">
            <p className="text-[8px] font-bold uppercase text-slate-400">Perawat / PPA</p>
            <div className="my-5" />
            <div className="border-t border-slate-300" />
            <p className="mt-1 text-[8px] text-slate-400">( _________ )</p>
          </div>
          <div className={cn(
            "rounded-lg border p-2 text-center",
            data.dpjpApproved ? "border-emerald-200 bg-emerald-50" : "border-slate-200",
          )}>
            <p className="text-[8px] font-bold uppercase text-slate-400">DPJP</p>
            <p className="text-[9px] font-medium text-slate-700 mt-0.5 leading-tight">{patient.dpjp}</p>
            <div className="my-3" />
            {data.dpjpApproved ? (
              <div className="flex flex-col items-center gap-0.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className="text-[8px] font-semibold text-emerald-600">Telah Disetujui</p>
              </div>
            ) : (
              <>
                <div className="border-t border-slate-300" />
                <p className="mt-1 text-[8px] text-slate-400">( TTD & Cap )</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Print modal ───────────────────────────────────────────

function PrintModal({
  data, patient, asesmen, onClose,
}: { data: ResumeMedis; patient: RawatInapPatientDetail; asesmen: DischargeAsesmen; onClose: () => void }) {
  const kondisiCfg = asesmen.kondisiPulang
    ? KONDISI_PULANG_CONFIG[asesmen.kondisiPulang as keyof typeof KONDISI_PULANG_CONFIG]
    : null;

  function handlePrint() {
    const content = document.getElementById("resume-print-content")?.innerHTML ?? "";
    const html = `<!DOCTYPE html><html><head><title>Resume Medis — ${patient.name}</title>
<style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; } h1 { font-size: 14px; text-align: center; } .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 12px 0 6px; } .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .field-label { font-size: 9px; font-weight: bold; color: #777; text-transform: uppercase; } .field-value { font-size: 11px; padding: 4px 0; border-bottom: 1px solid #eee; min-height: 20px; } .sign-area { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; } .sign-box { border: 1px solid #ddd; padding: 10px; border-radius: 4px; } .sign-box-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #777; margin-bottom: 40px; } .sign-line { border-top: 1px solid #333; font-size: 9px; padding-top: 4px; } hr { border: none; border-top: 1px solid #ddd; margin: 8px 0; }</style></head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (win) win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Preview Resume Medis</p>
                <p className="text-[11px] text-slate-500">PMK 269/2008 — Dokumen wajib saat pemulangan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700">
                <Printer size={13} /> Print / Cetak
              </button>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div id="resume-print-content" className="space-y-4 font-sans">
              <div className="border-b-2 border-slate-800 pb-3 text-center">
                <h1 className="text-base font-bold text-slate-800">RUMAH SAKIT UMUM DAERAH</h1>
                <p className="text-xs text-slate-600">Jl. Contoh No. 1, Jakarta · (021) 000-0000</p>
                <div className="mt-2 rounded-md bg-slate-800 py-1">
                  <p className="text-sm font-bold tracking-widest text-white">RESUME MEDIS RAWAT INAP</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {[["Nama Pasien", patient.name], ["No. Rekam Medis", patient.noRM], ["Kelamin / Usia", `${patient.gender === "L" ? "Laki-laki" : "Perempuan"}, ${patient.age} tahun`], ["No. Kunjungan", patient.noKunjungan], ["Ruangan / Bed", `${patient.ruangan} / ${patient.noBed} (${patient.kelas.replace(/_/g, " ")})`], ["DPJP", patient.dpjp], ["Tanggal MRS", patient.tglMasuk], ["Tanggal KRS", asesmen.tanggalRencanaKRS ? new Date(asesmen.tanggalRencanaKRS).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"]].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="text-xs font-medium text-slate-700">{val}</p>
                  </div>
                ))}
              </div>
              {kondisiCfg && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Kondisi Pulang:</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", kondisiCfg.badge, kondisiCfg.ring)}>{asesmen.kondisiPulang}</span>
                </div>
              )}
              <hr className="border-slate-200" />
              {[{ label: "Diagnosis Masuk", val: data.diagnosaMasuk }, { label: "Diagnosis Akhir (ICD-10)", val: data.diagnosaAkhir }, { label: "Prosedur / Tindakan", val: data.prosedurUtama }].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">{val || "—"}</p>
                </div>
              ))}
              <hr className="border-slate-200" />
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ringkasan Perjalanan Penyakit & Tatalaksana</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.ringkasanPenyakit || "—"}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Kondisi Saat Pulang</p><p className="mt-0.5 text-xs leading-relaxed text-slate-700">{data.kondisiSaatPulang || "—"}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Terapi yang Diberikan</p><p className="mt-0.5 text-xs leading-relaxed text-slate-700">{data.terapiYangDiberikan || "—"}</p></div>
              <hr className="border-slate-200" />
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Instruksi Pulang</p><p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{data.instruksiPulang || "—"}</p></div>
              {data.pembatasanAktivitas && <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pembatasan Aktivitas</p><p className="mt-0.5 text-xs text-slate-700">{data.pembatasanAktivitas}</p></div>}
              {data.dietPulang && <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Diet Pulang</p><p className="mt-0.5 text-xs text-slate-700">{data.dietPulang}</p></div>}
              <div className="mt-6 grid grid-cols-2 gap-8">
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Diverifikasi Oleh</p>
                  <p className="text-[10px] text-slate-500">Perawat / PPA</p>
                  <div className="my-8 border-b border-slate-300" />
                  <p className="text-[10px] font-medium text-slate-700">( _________________ )</p>
                </div>
                <div className={cn("rounded-lg border p-3 text-center", data.dpjpApproved ? "border-emerald-200 bg-emerald-50" : "border-slate-200")}>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">DPJP</p>
                  <p className="text-[10px] font-semibold text-slate-700">{patient.dpjp}</p>
                  <div className="my-6 border-b border-slate-300" />
                  {data.dpjpApproved ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <p className="text-[9px] font-semibold text-emerald-600">Telah Disetujui</p>
                      <p className="text-[9px] text-slate-500">{data.dpjpApprovedAt}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">( TTD & Cap )</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function StepResumeMedis({ data, patient, asesmen, onChange }: Props) {
  const [showPrint, setShowPrint] = useState(false);

  function set<K extends keyof ResumeMedis>(key: K, val: ResumeMedis[K]) {
    onChange({ ...data, [key]: val });
  }

  const canApprove = data.ringkasanPenyakit.trim().length > 0 &&
    data.kondisiSaatPulang.trim().length > 0 &&
    data.instruksiPulang.trim().length > 0;

  function handleApprove() {
    if (!canApprove) return;
    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    onChange({ ...data, dpjpApproved: true, dpjpApprovedAt: now });
  }

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row">

        {/* ── Left: Form ── */}
        <div className="min-w-0 flex-1 space-y-3">

          {/* Auto-fill info */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-indigo-600" />
                <p className="text-xs font-bold text-slate-700">Identitas & Data Episode</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Auto-fill</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ReadOnlyField label="Nama Pasien"     value={patient.name} />
              <ReadOnlyField label="No. Rekam Medis" value={patient.noRM} />
              <ReadOnlyField label="DPJP"            value={patient.dpjp} />
              <ReadOnlyField label="Tanggal MRS"     value={patient.tglMasuk} />
              <ReadOnlyField label="Ruangan / Bed"   value={`${patient.ruangan} / ${patient.noBed}`} />
              <ReadOnlyField label="Diagnosis Utama" value={patient.diagnosis} />
            </div>
          </div>

          {/* Clinical summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Klinis</p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Diagnosis Masuk" value={data.diagnosaMasuk} onChange={v => set("diagnosaMasuk", v)} rows={2} placeholder="Keluhan / diagnosis saat masuk RS..." />
                <FormField label="Diagnosis Akhir (ICD-10)" value={data.diagnosaAkhir} onChange={v => set("diagnosaAkhir", v)} rows={2} placeholder="Diagnosis akhir ICD-10..." />
              </div>
              <FormField label="Prosedur / Tindakan" value={data.prosedurUtama} onChange={v => set("prosedurUtama", v)} rows={2} placeholder="Prosedur diagnostik dan terapeutik..." />
              <FormField label="Ringkasan Perjalanan Penyakit & Tatalaksana" value={data.ringkasanPenyakit} onChange={v => set("ringkasanPenyakit", v)} rows={6} required placeholder="Anamnesis, pemeriksaan, terapi, dan perkembangan klinis..." />
              <FormField label="Kondisi Saat Pulang" value={data.kondisiSaatPulang} onChange={v => set("kondisiSaatPulang", v)} rows={3} required placeholder="Tanda vital, status umum, kondisi klinis saat dipulangkan..." />
              <FormField label="Terapi yang Diberikan" value={data.terapiYangDiberikan} onChange={v => set("terapiYangDiberikan", v)} rows={2} placeholder="Obat dan terapi selama perawatan..." />
            </div>
          </div>

          {/* Instruksi */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Instruksi Pasca Pulang</p>
            <div className="space-y-3">
              <FormField label="Instruksi Pulang" value={data.instruksiPulang} onChange={v => set("instruksiPulang", v)} rows={5} required placeholder="Instruksi yang harus diikuti pasien setelah pulang..." />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Pembatasan Aktivitas" value={data.pembatasanAktivitas} onChange={v => set("pembatasanAktivitas", v)} rows={3} placeholder="Aktivitas yang perlu dibatasi..." />
                <FormField label="Diet Pulang" value={data.dietPulang} onChange={v => set("dietPulang", v)} rows={3} placeholder="Panduan diet pasca pulang..." />
              </div>
            </div>
          </div>

          {/* DPJP Approve */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={13} className="text-indigo-600" />
              <p className="text-xs font-bold text-slate-700">Persetujuan DPJP</p>
            </div>

            {!canApprove && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">Lengkapi ringkasan penyakit, kondisi pulang, dan instruksi untuk mengaktifkan persetujuan.</p>
              </div>
            )}

            {data.dpjpApproved ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                    <CheckCircle2 size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Resume Medis Disetujui</p>
                    <p className="text-xs text-emerald-700">{patient.dpjp} · {data.dpjpApprovedAt}</p>
                  </div>
                </div>
                <Lock size={15} className="text-emerald-500" />
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={!canApprove}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                  canApprove
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99]"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                )}
              >
                <ShieldCheck size={14} /> Setujui Resume Medis — {patient.dpjp}
              </button>
            )}

            <p className="mt-2 text-center text-[11px] text-slate-400">
              PMK 269/2008 · Resume medis wajib tersedia saat pemulangan
            </p>
          </div>

        </div>

        {/* ── Right: Live Preview ── */}
        <div className="w-full shrink-0 xl:w-72">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preview Dokumen</p>
              <button
                onClick={() => setShowPrint(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Printer size={11} /> Cetak
              </button>
            </div>
            <LivePreview data={data} patient={patient} asesmen={asesmen} />
          </div>
        </div>

      </div>

      {showPrint && (
        <PrintModal
          data={data}
          patient={patient}
          asesmen={asesmen}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
}
