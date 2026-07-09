"use client";

// Rujuk Eksternal — MODE UMUM (non-JKN: Umum / Asuransi / Jamkesda).
// Surat rujukan RS umum tanpa payload V-Claim. Faithful ke format surat rujukan konvensional.

import { useState } from "react";
import {
  ClipboardList, MapPin, Tag, FileText, BookOpen, Send, Printer, AlertCircle,
  Check, ArrowRight, ChevronRight,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SectionHeader, Field, Checklist, PreviewRow, inputCls, textareaCls, type DisposisiResult,
} from "./shared";

const PELAYANAN = [
  { id: "Rawat_Jalan", label: "Rawat Jalan", sub: "Poli / Klinik" },
  { id: "Rawat_Inap", label: "Rawat Inap", sub: "Bangsal / Ward" },
] as const;
type JenisPelayanan = (typeof PELAYANAN)[number]["id"];

export default function RujukUmumForm({
  patient,
  onSubmit,
}: {
  patient: RJPatientDetail;
  onSubmit: (r: DisposisiResult) => void;
}) {
  const [noSurat, setNoSurat] = useState(
    () => `RUJ/RJ/2026/05/${Math.floor(Math.random() * 900 + 100)}`,
  );
  const [tglKeluar, setTglKeluar] = useState("");
  const [jamKeluar, setJamKeluar] = useState("");
  const [tglRencana, setTglRencana] = useState("");
  const [jenisPelayanan, setJenisPelayanan] = useState<JenisPelayanan | null>(null);
  const [tujuanPPK, setTujuanPPK] = useState("");
  const [tujuanPoli, setTujuanPoli] = useState("");
  const [dokterPerujuk, setDokterPerujuk] = useState(patient.dokter);
  const [keterangan, setKeterangan] = useState("");
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<string[]>(
    patient.diagnosa.filter((d) => d.tipe === "Utama").map((d) => d.id),
  );

  const toggleDiagnosa = (id: string) =>
    setSelectedDiagnosa((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const pelayananDef = jenisPelayanan ? PELAYANAN.find((p) => p.id === jenisPelayanan) : null;
  const diagnosaChosen = patient.diagnosa.filter((d) => selectedDiagnosa.includes(d.id));

  const canSubmit =
    tglKeluar !== "" && jamKeluar !== "" && jenisPelayanan !== null &&
    tujuanPPK.trim() !== "" && tujuanPoli.trim() !== "" && selectedDiagnosa.length > 0;

  const checklist = [
    { label: "Tanggal & Waktu", done: tglKeluar !== "" && jamKeluar !== "" },
    { label: "Jenis Pelayanan", done: jenisPelayanan !== null },
    { label: "Tujuan PPK", done: tujuanPPK.trim() !== "" },
    { label: "Tujuan Ruangan/Poli", done: tujuanPoli.trim() !== "" },
    { label: "Diagnosa dipilih", done: selectedDiagnosa.length > 0 },
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
                  <input value={noSurat} onChange={(e) => setNoSurat(e.target.value)} placeholder="RUJ/RJ/2026/..." className={cn(inputCls, "font-mono text-[11px]")} />
                </Field>
                <Field label="Tanggal" required>
                  <input type="date" value={tglKeluar} onChange={(e) => setTglKeluar(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Waktu" required>
                  <input type="time" value={jamKeluar} onChange={(e) => setJamKeluar(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Dokter Perujuk" required>
                <input value={dokterPerujuk} onChange={(e) => setDokterPerujuk(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={MapPin} title="Tujuan Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Tujuan PPK / Fasilitas Kesehatan" required hint="Nama RS atau fasilitas tujuan">
                <input value={tujuanPPK} onChange={(e) => setTujuanPPK(e.target.value)} placeholder="Contoh: RSUP Prof. Dr. R.D. Kandou Manado" className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tujuan Ruangan / Poli" required>
                  <input value={tujuanPoli} onChange={(e) => setTujuanPoli(e.target.value)} placeholder="Poli Jantung, Bedah Saraf..." className={inputCls} />
                </Field>
                <Field label="Tanggal Rencana Kunjungan">
                  <input type="date" value={tglRencana} onChange={(e) => setTglRencana(e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Tag} title="Jenis Pelayanan" />
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {PELAYANAN.map((opt) => {
                  const sel = jenisPelayanan === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setJenisPelayanan(opt.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition",
                        sel ? "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
                      )}
                    >
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
              {patient.diagnosa.map((d) => {
                const sel = selectedDiagnosa.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiagnosa(d.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                        sel ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white",
                      )}
                    >
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                        d.tipe === "Utama" ? "bg-indigo-100 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200",
                      )}
                    >
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
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={4}
                placeholder="Ringkasan kondisi klinis, tatalaksana yang sudah diberikan, alasan rujukan..."
                className={textareaCls}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <Checklist items={checklist} />

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
                {pelayananDef && (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Pelayanan</p>
                    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {pelayananDef.label}
                    </span>
                  </div>
                )}
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
                    {diagnosaChosen.map((d) => (
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
                Lengkapi semua field bertanda <span className="font-bold text-rose-500">*</span> untuk mengirim surat rujukan.
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
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={() => canSubmit && onSubmit({})}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={13} /> Kirim Surat Rujukan
          </button>
        </div>
      </div>
    </div>
  );
}
