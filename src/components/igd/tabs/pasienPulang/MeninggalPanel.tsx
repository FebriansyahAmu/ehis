"use client";

import { useState } from "react";
import { FileText, Check } from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./pasienPulangShared";

type JenisKematian = "Wajar" | "Tidak Wajar" | "Belum Ditentukan";

const darkInput =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500";

const darkTextarea =
  "w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500";

function DarkField({
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
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

interface Props {
  patient: IGDPatientDetail;
  onConfirmedChange: (v: boolean) => void;
}

export default function MeninggalPanel({ patient, onConfirmedChange }: Props) {
  const [noSurat, setNoSurat]             = useState("");
  const [jamMeninggal, setJamMeninggal]   = useState("");
  const [sebabUtama, setSebabUtama]       = useState("");
  const [sebabPenyerta1, setSebabPenyerta1] = useState("");
  const [sebabPenyerta2, setSebabPenyerta2] = useState("");
  const [interval, setInterval]           = useState("");
  const [jenis, setJenis]                 = useState<JenisKematian>("Wajar");
  const [dokterPemeriksa, setDokterPemeriksa] = useState(patient.doctor);
  const [namaKeluarga, setNamaKeluarga]   = useState(patient.namaKeluarga);
  const [hubKeluarga, setHubKeluarga]     = useState(patient.hubunganKeluarga);
  const [noHpKeluarga, setNoHpKeluarga]   = useState(patient.noHp);
  const [confirmed, setConfirmed]         = useState(false);

  const toggle = () => {
    const next = !confirmed;
    setConfirmed(next);
    onConfirmedChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
      <SectionHeader icon={FileText} title="Surat Keterangan Meninggal" badge="SKM" dark />

      <div className="flex flex-col gap-4 p-4">
        {/* SKM number + jam */}
        <div className="grid grid-cols-2 gap-3">
          <DarkField label="No. Surat Kematian" required>
            <input
              value={noSurat}
              onChange={(e) => setNoSurat(e.target.value)}
              placeholder="SKM/2026/05/..."
              className={darkInput}
            />
          </DarkField>
          <DarkField label="Jam Meninggal" required>
            <input
              type="time"
              value={jamMeninggal}
              onChange={(e) => setJamMeninggal(e.target.value)}
              className={darkInput}
            />
          </DarkField>
        </div>

        {/* Sebab kematian */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Sebab Kematian
          </p>
          <div className="flex flex-col gap-3">
            <DarkField label="Penyebab Langsung (Sebab Utama)" required>
              <input
                value={sebabUtama}
                onChange={(e) => setSebabUtama(e.target.value)}
                placeholder="Penyakit / cedera yang langsung menyebabkan kematian — ICD-10: ..."
                className={darkInput}
              />
            </DarkField>
            <DarkField label="Sebab Penyerta 1 (Kondisi yang Mendasari)">
              <input
                value={sebabPenyerta1}
                onChange={(e) => setSebabPenyerta1(e.target.value)}
                placeholder="Contoh: Hipertensi kronis — ICD-10: I10"
                className={darkInput}
              />
            </DarkField>
            <DarkField label="Sebab Penyerta 2 (Kondisi Lain yang Berkontribusi)">
              <input
                value={sebabPenyerta2}
                onChange={(e) => setSebabPenyerta2(e.target.value)}
                placeholder="Contoh: Diabetes Mellitus Tipe 2 — ICD-10: E11"
                className={darkInput}
              />
            </DarkField>
            <DarkField label="Interval Awitan hingga Kematian">
              <input
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                placeholder="Contoh: 3 jam, 2 hari, tidak diketahui"
                className={darkInput}
              />
            </DarkField>
          </div>
        </div>

        {/* Jenis kematian */}
        <DarkField label="Jenis Kematian" required>
          <div className="flex gap-2">
            {(["Wajar", "Tidak Wajar", "Belum Ditentukan"] as JenisKematian[]).map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJenis(j)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-medium transition",
                  jenis === j
                    ? j === "Tidak Wajar"
                      ? "border-rose-500 bg-rose-900/40 text-rose-300"
                      : j === "Wajar"
                      ? "border-slate-500 bg-slate-700 text-slate-200"
                      : "border-amber-500 bg-amber-900/40 text-amber-300"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300",
                )}
              >
                {j}
              </button>
            ))}
          </div>
        </DarkField>

        {/* Dokter pemeriksa */}
        <DarkField label="Dokter yang Menyatakan Meninggal" required>
          <input
            value={dokterPemeriksa}
            onChange={(e) => setDokterPemeriksa(e.target.value)}
            placeholder="Nama dan SIP dokter pemeriksa"
            className={darkInput}
          />
        </DarkField>

        {/* Penerima jenazah */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Identitas Penerima / Pengurus Jenazah
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <DarkField label="Nama Keluarga" required>
                <input
                  value={namaKeluarga}
                  onChange={(e) => setNamaKeluarga(e.target.value)}
                  className={darkInput}
                />
              </DarkField>
              <DarkField label="Hubungan dengan Pasien" required>
                <input
                  value={hubKeluarga}
                  onChange={(e) => setHubKeluarga(e.target.value)}
                  placeholder="Anak / Istri / Suami..."
                  className={darkInput}
                />
              </DarkField>
            </div>
            <DarkField label="Nomor HP">
              <input
                value={noHpKeluarga}
                onChange={(e) => setNoHpKeluarga(e.target.value)}
                placeholder="Nomor yang dapat dihubungi"
                className={darkInput}
              />
            </DarkField>
          </div>
        </div>

        {/* Confirmation */}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
            confirmed
              ? "border-rose-500 bg-rose-900/30 text-rose-200"
              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
              confirmed ? "border-rose-500 bg-rose-500 text-white" : "border-slate-600 bg-slate-700",
            )}
          >
            {confirmed && <Check size={10} />}
          </span>
          <p className="text-xs leading-relaxed">
            Saya menyatakan bahwa kematian pasien telah dikonfirmasi secara medis dan seluruh
            informasi dalam surat keterangan meninggal ini adalah benar sesuai pemeriksaan.
          </p>
        </button>
      </div>
    </div>
  );
}
