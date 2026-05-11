"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, AlertCircle, CheckCircle2, Circle, FileCheck2,
  FlaskConical, Lock, Pill, Printer, Radiation,
  ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type AsalMasuk, type PasienPulangData, type ResumeMedikData,
  type ResumeMedikCompletionItem,
  checkResumeMedikCompletion, STATUS_KEPULANGAN_CONFIG,
} from "./pasienPulangShared";

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

// ── Helpers ───────────────────────────────────────────────

const FLAG_STYLE: Record<string, string> = {
  kritis: "bg-red-100 text-red-700 border border-red-200",
  tinggi: "bg-amber-100 text-amber-700 border border-amber-200",
  rendah: "bg-sky-100 text-sky-700 border border-sky-200",
  normal: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const FLAG_LABEL: Record<string, string> = {
  kritis: "KRITIS", tinggi: "↑ Tinggi", rendah: "↓ Rendah", normal: "Normal",
};

function SectionHeader({ icon: Icon, title, badge }: {
  icon: React.ElementType; title: string; badge?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={13} className="text-slate-400" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      {badge && (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-sky-600">
          {badge}
        </span>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
        {value || <span className="italic text-slate-400">—</span>}
      </div>
    </div>
  );
}

function FormArea({
  label, value, onChange, rows = 3, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label} <span className="text-red-400">*</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

// ── Print Preview ─────────────────────────────────────────

function PrintPreviewMedik({
  data, patient, onClose,
}: { data: PasienPulangData; patient: RawatInapPatientDetail; onClose: () => void }) {
  const rm               = data.resumeMedik;
  const diagnosaPrimer   = patient.diagnosa.find(d => d.tipe === "Utama");
  const diagnosaLain     = patient.diagnosa.filter(d => d.tipe !== "Utama");
  const statusCfg        = data.status ? STATUS_KEPULANGAN_CONFIG[data.status] : null;

  const lamaRawat = (() => {
    if (!data.tanggalPulang || !patient.admitDate) return "—";
    const ms   = new Date(data.tanggalPulang).getTime() - new Date(patient.admitDate).getTime();
    const days = Math.ceil(ms / 86400000);
    return `${days} hari`;
  })();

  const ttvRows = [
    ["Tekanan Darah (mmHg)", rm.ttvMasuk?.tekananDarah, rm.ttvPulang?.tekananDarah],
    ["Nadi (×/mnt)",         String(rm.ttvMasuk?.nadi ?? "—"), String(rm.ttvPulang?.nadi ?? "—")],
    ["RR (×/mnt)",           String(rm.ttvMasuk?.rr ?? "—"),   String(rm.ttvPulang?.rr ?? "—")],
    ["Suhu (°C)",            String(rm.ttvMasuk?.suhu ?? "—"), String(rm.ttvPulang?.suhu ?? "—")],
    ["SpO₂ (%)",             String(rm.ttvMasuk?.spo2 ?? "—"), String(rm.ttvPulang?.spo2 ?? "—")],
    ["GCS",                  String(rm.ttvMasuk?.gcs ?? "—"),  String(rm.ttvPulang?.gcs ?? "—")],
    ["Kesadaran",            rm.ttvMasuk?.kesadaran ?? "—",    rm.ttvPulang?.kesadaran ?? "—"],
  ];

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
            <FileCheck2 size={14} className="text-slate-500" />
            <p className="text-sm font-bold text-slate-700">Resume Medik — Preview Cetak</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700">
              <Printer size={12} /> Cetak
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-8 font-mono text-xs leading-relaxed text-slate-800">
          {/* Header */}
          <div className="mb-4 border-b-2 border-slate-800 pb-3 text-center">
            <p className="text-base font-bold uppercase tracking-wider">RESUME MEDIK RAWAT INAP</p>
            <p className="text-[9px] text-slate-500">Kelengkapan Rekam Medis · Dokumen Klaim BPJS INA-CBG</p>
            <p className="text-[10px] text-slate-500">Rumah Sakit EHIS · Jl. Kesehatan No. 1, Jakarta</p>
          </div>

          {/* I. Identitas */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">I. IDENTITAS PASIEN</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
              <div><b>Nama</b>           : {patient.name}</div>
              <div><b>No. RM</b>         : {patient.noRM}</div>
              <div><b>Umur / JK</b>      : {patient.age} thn / {patient.gender === "L" ? "Laki-laki" : "Perempuan"}</div>
              <div><b>Penjamin</b>        : {patient.penjamin.replace(/_/g, " ")}{patient.noBpjs ? ` (${patient.noBpjs})` : ""}</div>
              <div className="col-span-2"><b>Alamat</b>          : {patient.alamat}</div>
            </div>
          </section>

          {/* II. Periode */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">II. PERIODE PERAWATAN</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[11px]">
              <div><b>Asal Masuk</b>      : {rm.asalMasuk || "—"}</div>
              {rm.asalMasuk === "IGD" && (
                <div className="col-span-2"><b>Masuk IGD</b>       : {rm.tanggalMasukIGD} · Dx: {rm.diagnosisIGD}</div>
              )}
              <div><b>Tgl MRS</b>         : {patient.tglMasuk}</div>
              <div><b>Tgl KRS</b>         : {data.tanggalPulang ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
              <div><b>LOS</b>             : {lamaRawat}</div>
              <div><b>Ruangan / Kelas</b> : {patient.ruangan} / {patient.kelas.replace("_", " ")}</div>
              <div><b>DPJP</b>            : {patient.dpjp}</div>
              <div><b>Status KRS</b>      : {data.status || "—"}</div>
            </div>
          </section>

          {/* III. Diagnosa */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">III. DIAGNOSA (ICD-10)</p>
            <div className="text-[11px]">
              {diagnosaPrimer
                ? <p><b>Utama</b> : {diagnosaPrimer.namaDiagnosis} [{diagnosaPrimer.kodeIcd10}]</p>
                : <p className="italic text-slate-400">Belum ada diagnosa utama</p>
              }
              {diagnosaLain.map(d => (
                <p key={d.id}><b>{d.tipe}</b> : {d.namaDiagnosis} [{d.kodeIcd10}]</p>
              ))}
            </div>
          </section>

          {/* IV. Tindakan */}
          {rm.tindakan.length > 0 && (
            <section className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">IV. TINDAKAN / PROSEDUR (ICD-9-CM)</p>
              <div className="text-[11px]">
                {rm.tindakan.map((t, i) => (
                  <p key={i}>{t.kodeIcd9} — {t.namaTindakan} ({t.tanggal})</p>
                ))}
              </div>
            </section>
          )}

          {/* V. TTV */}
          <section className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">V. TTV MASUK vs PULANG</p>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-0.5 text-left font-bold">Parameter</th>
                  <th className="py-0.5 text-center font-bold">Masuk ({rm.ttvMasuk?.tanggal ?? "—"})</th>
                  <th className="py-0.5 text-center font-bold">Pulang ({rm.ttvPulang?.tanggal ?? "—"})</th>
                </tr>
              </thead>
              <tbody>
                {ttvRows.map(([param, masuk, pulang]) => (
                  <tr key={param} className="border-b border-slate-100">
                    <td className="py-0.5">{param}</td>
                    <td className="py-0.5 text-center">{masuk ?? "—"}</td>
                    <td className="py-0.5 text-center">{pulang ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* VI. Lab */}
          {rm.hasilLabAbnormal.length > 0 && (
            <section className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">VI. HASIL LAB ABNORMAL</p>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300">
                    {["Pemeriksaan", "Nilai", "Satuan", "Rujukan", "Flag", "Tanggal"].map(h => (
                      <th key={h} className="py-0.5 text-left font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rm.hasilLabAbnormal.map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-0.5">{l.nama}</td>
                      <td className="py-0.5 font-bold">{l.nilai}</td>
                      <td className="py-0.5">{l.satuan}</td>
                      <td className="py-0.5 text-slate-500">{l.rujukan}</td>
                      <td className="py-0.5">{FLAG_LABEL[l.flag]}</td>
                      <td className="py-0.5 text-slate-500">{l.tanggal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* VII. Rad */}
          {rm.hasilRad.length > 0 && (
            <section className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">VII. HASIL RADIOLOGI</p>
              {rm.hasilRad.map((r, i) => (
                <p key={i} className="text-[11px]"><b>{r.jenis}</b> ({r.tanggal}): {r.kesimpulan}</p>
              ))}
            </section>
          )}

          {/* VIII. Obat */}
          {rm.obatSelamaRawat.length > 0 && (
            <section className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">VIII. OBAT SELAMA RAWAT</p>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300">
                    {["Nama Obat", "Dosis", "Rute", "Mulai", "Selesai"].map(h => (
                      <th key={h} className="py-0.5 text-left font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rm.obatSelamaRawat.map((o, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-0.5">{o.namaObat}{o.isHAM ? " ⚠" : ""}</td>
                      <td className="py-0.5">{o.dosis}</td>
                      <td className="py-0.5">{o.rute}</td>
                      <td className="py-0.5 text-slate-500">{o.mulaiTanggal}</td>
                      <td className="py-0.5 text-slate-500">{o.akhirTanggal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* IX–XI. Narasi klinis */}
          {[
            ["IX. KONDISI MASUK",       rm.kondisiMasuk],
            ["X. KONDISI PULANG",       rm.kondisiPulang],
            ["XI. RINGKASAN KLINIS",    rm.ringkasanKlinis],
          ].map(([title, content]) => (
            <section key={title} className="mb-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
              <p className="whitespace-pre-wrap text-[11px]">{content || "—"}</p>
            </section>
          ))}

          {/* TTD */}
          <div className="mt-6 border-t border-slate-300 pt-4 text-center text-[11px]">
            <p>Jakarta, {data.tanggalPulang ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "____________"}</p>
            <p className="mt-1">Dokter Penanggung Jawab Pasien (DPJP)</p>
            <p className="font-bold">{patient.dpjp}</p>
            <div className="my-8" />
            <p className="border-t border-slate-400 pt-1">( {patient.dpjp} )</p>
            {rm.dpjpApproved && (
              <p className="mt-1 text-[9px] text-emerald-600">Ditandatangani secara elektronik: {rm.dpjpApprovedAt}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ResumeMedikPane({ data, onChange, patient }: Props) {
  const [showPrint, setShowPrint] = useState(false);

  function setMedik<K extends keyof ResumeMedikData>(key: K, val: ResumeMedikData[K]) {
    onChange({ ...data, resumeMedik: { ...data.resumeMedik, [key]: val } });
  }

  function handleApprove() {
    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    onChange({ ...data, resumeMedik: { ...data.resumeMedik, dpjpApproved: true, dpjpApprovedAt: now } });
  }

  const hasDiagnosa   = patient.diagnosa.length > 0;
  const completions   = checkResumeMedikCompletion(data, hasDiagnosa);
  const doneCount     = completions.filter(c => c.done).length;
  const canPrint      = completions.every(c => c.done);
  const tabItems      = completions.filter(c => c.source === "tab-lain");
  const formItems     = completions.filter(c => c.source === "form-ini");
  const tabDone       = tabItems.every(c => c.done);

  const rm            = data.resumeMedik;
  const diagnosaPrimer = patient.diagnosa.find(d => d.tipe === "Utama");

  const lamaRawat = (() => {
    if (!data.tanggalPulang || !patient.admitDate) return "—";
    const ms   = new Date(data.tanggalPulang).getTime() - new Date(patient.admitDate).getTime();
    const days = Math.ceil(ms / 86400000);
    return `${days} hari`;
  })();

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row">

        {/* ── Left: content ── */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* Prerequisites banner */}
          <div className={cn(
            "rounded-xl border p-3",
            tabDone ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
          )}>
            <p className={cn("mb-2 text-[10px] font-bold uppercase tracking-wide", tabDone ? "text-emerald-700" : "text-amber-700")}>
              {tabDone ? "✓ Data dari tab terkait sudah lengkap" : "Prerequisite — Data dari tab terkait"}
            </p>
            <div className="flex flex-wrap gap-2">
              {tabItems.map(item => (
                <div key={item.id} className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  item.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white text-amber-700 ring-1 ring-amber-300",
                )}>
                  {item.done
                    ? <CheckCircle2 size={10} />
                    : <AlertCircle size={10} />
                  }
                  {item.label}
                  {!item.done && item.tab && (
                    <span className="text-amber-500">→ buka tab {item.tab === "status" ? "Status Kepulangan" : "Obat & Jadwal"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Identitas & Episode */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Identitas & Episode" badge="Auto" />
            <div className="mb-3 grid grid-cols-2 gap-2">
              <ReadOnly label="Nama Pasien"          value={patient.name} />
              <ReadOnly label="No. Rekam Medis"      value={patient.noRM} />
              <ReadOnly label="Umur / Jenis Kelamin" value={`${patient.age} tahun / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
              <ReadOnly label="Penjamin"             value={patient.penjamin.replace(/_/g, " ")} />
              <ReadOnly label="Tanggal MRS"          value={patient.tglMasuk} />
              <ReadOnly label="DPJP"                 value={patient.dpjp} />
              <ReadOnly label="Ruangan / Kelas"      value={`${patient.ruangan} / ${patient.kelas.replace("_", " ")}`} />
              <ReadOnly label="LOS"                  value={lamaRawat} />
              <ReadOnly label="Status Kepulangan"    value={data.status || "—"} />
              <ReadOnly label="Tanggal KRS"          value={data.tanggalPulang ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
            </div>
            {/* Asal Masuk */}
            <div className="border-t border-slate-100 pt-3">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Asal Masuk <span className="text-red-400">*</span>
              </label>
              <select
                value={rm.asalMasuk}
                onChange={e => setMedik("asalMasuk", e.target.value as AsalMasuk)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">— Pilih asal masuk —</option>
                {(["IGD", "Poliklinik", "Transfer RS Lain", "Langsung"] as AsalMasuk[]).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <AnimatePresence>
                {rm.asalMasuk === "IGD" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 grid grid-cols-2 gap-2 overflow-hidden"
                  >
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Tanggal Masuk IGD</label>
                      <input
                        type="text"
                        value={rm.tanggalMasukIGD}
                        onChange={e => setMedik("tanggalMasukIGD", e.target.value)}
                        placeholder="cth: 10 Mei 2025"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Diagnosis di IGD</label>
                      <input
                        type="text"
                        value={rm.diagnosisIGD}
                        onChange={e => setMedik("diagnosisIGD", e.target.value)}
                        placeholder="Diagnosis saat masuk IGD"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Diagnosa & Tindakan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Diagnosa & Tindakan" badge="Auto dari Tab Diagnosa" />
            {hasDiagnosa ? (
              <div className="mb-3 space-y-1.5">
                {patient.diagnosa.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold",
                      d.tipe === "Utama" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
                    )}>{d.tipe}</span>
                    <span className="text-slate-700">{d.namaDiagnosis}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">({d.kodeIcd10})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 text-amber-500" />
                <p className="text-[11px] text-amber-700">Belum ada diagnosa — isi di tab Diagnosa rekam medis</p>
              </div>
            )}
            {rm.tindakan.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">Tindakan / Prosedur ICD-9-CM</p>
                <div className="space-y-1">
                  {rm.tindakan.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{t.kodeIcd9}</span>
                      <span className="text-slate-700">{t.namaTindakan}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-400">{t.tanggal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TTV Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="TTV Masuk vs Pulang" badge="Auto dari TTV" />
            {rm.ttvMasuk ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-1.5 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">Parameter</th>
                      <th className="py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">Masuk<br/><span className="text-[8px] font-normal">{rm.ttvMasuk.tanggal}</span></th>
                      <th className="py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">Pulang<br/><span className="text-[8px] font-normal">{rm.ttvPulang?.tanggal ?? "—"}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["TD (mmHg)",  rm.ttvMasuk.tekananDarah,         rm.ttvPulang?.tekananDarah ?? "—"],
                      ["Nadi (×/m)", String(rm.ttvMasuk.nadi),          String(rm.ttvPulang?.nadi ?? "—")],
                      ["RR (×/m)",   String(rm.ttvMasuk.rr),            String(rm.ttvPulang?.rr ?? "—")],
                      ["Suhu (°C)",  String(rm.ttvMasuk.suhu),          String(rm.ttvPulang?.suhu ?? "—")],
                      ["SpO₂ (%)",   String(rm.ttvMasuk.spo2),          String(rm.ttvPulang?.spo2 ?? "—")],
                      ["GCS",        String(rm.ttvMasuk.gcs),           String(rm.ttvPulang?.gcs ?? "—")],
                      ["Kesadaran",  rm.ttvMasuk.kesadaran,             rm.ttvPulang?.kesadaran ?? "—"],
                    ].map(([param, masuk, pulang]) => (
                      <tr key={param} className="border-b border-slate-50">
                        <td className="py-1 text-slate-500">{param}</td>
                        <td className="py-1 text-center font-semibold text-slate-700">{masuk}</td>
                        <td className="py-1 text-center font-semibold text-emerald-600">{pulang}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] italic text-slate-400">Data TTV belum tersedia</p>
            )}
          </div>

          {/* Lab & Rad */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Lab */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader icon={FlaskConical} title="Hasil Lab Abnormal" badge="Auto dari Order Lab" />
              {rm.hasilLabAbnormal.length === 0 ? (
                <p className="text-[11px] italic text-slate-400">Tidak ada hasil lab abnormal</p>
              ) : (
                <div className="space-y-1.5">
                  {rm.hasilLabAbnormal.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold", FLAG_STYLE[l.flag])}>
                        {FLAG_LABEL[l.flag]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-700">{l.nama}</p>
                        <p className="text-[10px] text-slate-400">{l.nilai} {l.satuan} · rujukan {l.rujukan}</p>
                      </div>
                      <span className="shrink-0 text-[9px] text-slate-400">{l.tanggal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rad */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader icon={Radiation} title="Hasil Radiologi" badge="Auto dari Order Rad" />
              {rm.hasilRad.length === 0 ? (
                <p className="text-[11px] italic text-slate-400">Tidak ada hasil radiologi</p>
              ) : (
                <div className="space-y-2.5">
                  {rm.hasilRad.map((r, i) => (
                    <div key={i}>
                      <p className="text-[11px] font-semibold text-slate-700">{r.jenis}</p>
                      <p className="text-[10px] text-slate-500">{r.tanggal}</p>
                      <p className="mt-0.5 text-[11px] italic text-slate-600">{r.kesimpulan}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Obat Selama Rawat */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Pill} title="Obat Selama Rawat" badge="Auto dari MAR" />
            {rm.obatSelamaRawat.length === 0 ? (
              <p className="text-[11px] italic text-slate-400">Tidak ada data obat</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {["Nama Obat", "Dosis", "Rute", "Mulai", "Selesai"].map(h => (
                        <th key={h} className="py-1 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rm.obatSelamaRawat.map((o, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-1.5">
                          <span className="font-medium text-slate-700">{o.namaObat}</span>
                          {o.isHAM && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-700">HAM</span>
                          )}
                        </td>
                        <td className="py-1.5 text-slate-600">{o.dosis}</td>
                        <td className="py-1.5 text-slate-500">{o.rute}</td>
                        <td className="py-1.5 text-slate-400">{o.mulaiTanggal}</td>
                        <td className="py-1.5 text-slate-400">{o.akhirTanggal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manual DPJP fields */}
          <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Narasi Klinis (diisi DPJP)" />
            <div className="space-y-3">
              <FormArea
                label="Kondisi Masuk" rows={3}
                value={rm.kondisiMasuk}
                onChange={v => setMedik("kondisiMasuk", v)}
                placeholder="Deskripsi kondisi klinis objektif saat pasien masuk RS (TTV, keluhan utama, temuan fisik bermakna)..."
              />
              <FormArea
                label="Kondisi Pulang" rows={3}
                value={rm.kondisiPulang}
                onChange={v => setMedik("kondisiPulang", v)}
                placeholder="Kondisi klinis saat pasien dipulangkan (TTV, perkembangan keluhan, status fungsional)..."
              />
              <FormArea
                label="Ringkasan Klinis DPJP" rows={5}
                value={rm.ringkasanKlinis}
                onChange={v => setMedik("ringkasanKlinis", v)}
                placeholder="Ringkasan perjalanan klinis selama rawat inap: diagnosis kerja, tindakan, respons terapi, konsultasi, dan rencana tindak lanjut..."
              />
            </div>
          </div>

        </div>

        {/* ── Right: Completion + sign-off ── */}
        <div className="w-full shrink-0 space-y-3 xl:w-64">

          {/* Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan Resume Medik</p>
            <div className="mb-3 flex items-end justify-between">
              <p className={cn("text-2xl font-bold", canPrint ? "text-emerald-600" : "text-sky-600")}>
                {doneCount}/{completions.length}
              </p>
              <p className="text-[10px] text-slate-400">item</p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", canPrint ? "bg-emerald-400" : "bg-sky-400")}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((doneCount / completions.length) * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Tab items */}
            <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-400">Dari Tab Lain</p>
            <div className="space-y-1.5">
              {tabItems.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={11} className="mt-0.5 shrink-0 text-amber-400" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px]", item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700")}>
                      {item.label}
                    </p>
                    {!item.done && <p className="text-[9px] text-amber-500">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Form items */}
            <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-400">Form Ini</p>
            <div className="space-y-1.5">
              {formItems.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={11} className="mt-0.5 shrink-0 text-red-300" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px]", item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700")}>
                      {item.label}
                    </p>
                    {!item.done && <p className="text-[9px] text-slate-400">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DPJP sign-off */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">TTD DPJP</p>
            {rm.dpjpApproved ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800">Ditandatangani</p>
                    <p className="text-[10px] text-emerald-600">{rm.dpjpApprovedAt}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={!completions.filter(c => c.id !== "m8").every(c => c.done)}
                className={cn(
                  "w-full rounded-xl py-2.5 text-[11px] font-bold transition",
                  completions.filter(c => c.id !== "m8").every(c => c.done)
                    ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                )}
              >
                {completions.filter(c => c.id !== "m8").every(c => c.done)
                  ? "Tandatangani Resume Medik"
                  : "Lengkapi data terlebih dahulu"
                }
              </button>
            )}
          </div>

          {/* Print */}
          <button
            onClick={() => setShowPrint(true)}
            disabled={!canPrint}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              canPrint
                ? "bg-sky-600 text-white shadow-md shadow-sky-200 hover:bg-sky-700 active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {canPrint ? (
              <><Printer size={14} /> Cetak Resume Medik</>
            ) : (
              <><Lock size={13} /> {completions.length - doneCount} item belum lengkap</>
            )}
          </button>

          {!canPrint && (
            <p className="text-center text-[10px] text-slate-400">
              Lengkapi semua item untuk mengaktifkan cetak
            </p>
          )}

          {/* Info */}
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="text-[10px] font-semibold text-sky-700">Dokumen Klaim BPJS</p>
            <p className="mt-1 text-[10px] text-sky-600">
              Resume Medik digunakan sebagai kelengkapan berkas klaim INA-CBG. Pastikan diagnosa ICD-10 dan tindakan ICD-9 sudah lengkap sebelum pengajuan klaim.
            </p>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {showPrint && (
          <PrintPreviewMedik data={data} patient={patient} onClose={() => setShowPrint(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
