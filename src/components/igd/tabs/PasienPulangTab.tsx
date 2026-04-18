"use client";

import { useState } from "react";
import {
  Home, Bed, ArrowRightCircle, HeartOff, ShieldAlert,
  CheckCircle2, Clock, User, Stethoscope, FileText,
  AlertCircle, Calendar, Phone, Building2, Ambulance,
  ClipboardCheck, AlertTriangle, Check, X, Printer,
  Send, HeartPulse, Thermometer, Wind, Activity,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

type StatusPulang =
  | "Sembuh"
  | "Membaik"
  | "APS"
  | "Rawat_Inap"
  | "Dirujuk"
  | "Meninggal";

type KondisiUmum = "Baik" | "Sedang" | "Buruk" | "Kritis";
type JenisKematian = "Wajar" | "Tidak Wajar" | "Belum Ditentukan";

// ── Status config ─────────────────────────────────────────

interface StatusDef {
  id: StatusPulang;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  selected: string;
  idle: string;
  dot: string;
}

const STATUS_OPTIONS: StatusDef[] = [
  {
    id: "Sembuh",
    label: "Sembuh",
    sublabel: "Pulang ke rumah — kondisi baik",
    icon: Home,
    selected: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
  {
    id: "Membaik",
    label: "Membaik",
    sublabel: "Pulang ke rumah — perbaikan",
    icon: Activity,
    selected: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40",
    dot: "bg-teal-500",
  },
  {
    id: "Rawat_Inap",
    label: "Rawat Inap",
    sublabel: "Transfer ke bangsal",
    icon: Bed,
    selected: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40",
    dot: "bg-violet-500",
  },
  {
    id: "Dirujuk",
    label: "Dirujuk",
    sublabel: "Transfer ke RS lain",
    icon: ArrowRightCircle,
    selected: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40",
    dot: "bg-sky-500",
  },
  {
    id: "APS",
    label: "APS",
    sublabel: "Pulang atas permintaan sendiri",
    icon: ShieldAlert,
    selected: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40",
    dot: "bg-amber-500",
  },
  {
    id: "Meninggal",
    label: "Meninggal",
    sublabel: "Pasien meninggal dunia",
    icon: HeartOff,
    selected: "border-slate-600 bg-slate-800 text-white ring-1 ring-slate-700",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50",
    dot: "bg-slate-700",
  },
];

const KONDISI_OPTIONS: KondisiUmum[] = ["Baik", "Sedang", "Buruk", "Kritis"];

const KONDISI_CLS: Record<KondisiUmum, string> = {
  Baik:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Sedang: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Buruk:  "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Kritis: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

// ── Shared field ──────────────────────────────────────────

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
        {required && <span className="text-rose-400 normal-case font-bold">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

// ── Section header ────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  badge,
  dark,
}: {
  icon: LucideIcon;
  title: string;
  badge?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 border-b px-4 py-2.5",
      dark ? "border-slate-700 bg-slate-900" : "border-slate-100 bg-white",
    )}>
      <span className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
        dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500",
      )}>
        <Icon size={12} />
      </span>
      <p className={cn("text-xs font-semibold", dark ? "text-slate-100" : "text-slate-700")}>
        {title}
      </p>
      {badge && (
        <span className={cn(
          "rounded-md px-2 py-0.5 text-[10px] font-bold",
          dark ? "bg-rose-900/60 text-rose-300 ring-1 ring-rose-700" : "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
        )}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Right panels ──────────────────────────────────────────

function SembuhPanel({
  status,
  patient,
  instruksi,
  setInstruksi,
  obatPulang,
  setObatPulang,
  kontrolDate,
  setKontrolDate,
  kontrolPoli,
  setKontrolPoli,
}: {
  status: StatusPulang;
  patient: IGDPatientDetail;
  instruksi: string;
  setInstruksi: (v: string) => void;
  obatPulang: string;
  setObatPulang: (v: string) => void;
  kontrolDate: string;
  setKontrolDate: (v: string) => void;
  kontrolPoli: string;
  setKontrolPoli: (v: string) => void;
}) {
  const accent = status === "Sembuh"
    ? { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-700", body: "bg-white" }
    : { bg: "bg-teal-50", border: "border-teal-200", title: "text-teal-700", body: "bg-white" };

  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-sm", accent.border)}>
      <SectionHeader
        icon={status === "Sembuh" ? Home : Activity}
        title={status === "Sembuh" ? "Informasi Pulang Sembuh" : "Informasi Pulang Membaik"}
      />
      <div className="flex flex-col gap-4 p-4">
        <Field label="Instruksi Pulang & Edukasi Pasien" required>
          <textarea
            value={instruksi}
            onChange={(e) => setInstruksi(e.target.value)}
            rows={4}
            placeholder="Contoh: Istirahat cukup, hindari aktivitas berat. Minum obat sesuai anjuran. Segera kembali jika timbul sesak napas atau nyeri dada berulang..."
            className={textareaCls}
          />
        </Field>

        <Field label="Obat yang Dibawa Pulang">
          <textarea
            value={obatPulang}
            onChange={(e) => setObatPulang(e.target.value)}
            rows={3}
            placeholder="Contoh: Aspirin 80mg 1×1, Atorvastatin 20mg 1×1 malam, Bisoprolol 2.5mg 1×1 pagi..."
            className={textareaCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Jadwal Kontrol">
            <input
              type="date"
              value={kontrolDate}
              onChange={(e) => setKontrolDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Poliklinik Tujuan">
            <input
              value={kontrolPoli}
              onChange={(e) => setKontrolPoli(e.target.value)}
              placeholder="Contoh: Poli Jantung"
              className={inputCls}
            />
          </Field>
        </div>

        <div className={cn("rounded-xl border p-3", accent.bg, accent.border)}>
          <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-widest", accent.title)}>
            Ringkasan
          </p>
          <p className={cn("text-[11px]", accent.title)}>
            <span className="font-semibold">{patient.name}</span> ({patient.noRM}) diizinkan pulang dengan kondisi{" "}
            <span className="font-bold">{status === "Sembuh" ? "Sembuh" : "Membaik"}</span>. DPJP:{" "}
            <span className="font-medium">{patient.doctor}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function RawatInapPanel({
  bangsal, setBangsal,
  noBed, setNoBed,
  dpjpRawat, setDpjpRawat,
  catatanTransfer, setCatatanTransfer,
}: {
  bangsal: string; setBangsal: (v: string) => void;
  noBed: string; setNoBed: (v: string) => void;
  dpjpRawat: string; setDpjpRawat: (v: string) => void;
  catatanTransfer: string; setCatatanTransfer: (v: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 shadow-sm">
      <SectionHeader icon={Bed} title="Form Transfer Rawat Inap" />
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ruang / Bangsal Tujuan" required>
            <input
              value={bangsal}
              onChange={(e) => setBangsal(e.target.value)}
              placeholder="Contoh: Ruang Bougenville"
              className={inputCls}
            />
          </Field>
          <Field label="Nomor Tempat Tidur">
            <input
              value={noBed}
              onChange={(e) => setNoBed(e.target.value)}
              placeholder="Contoh: 305-B"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Dokter DPJP Rawat Inap" required>
          <input
            value={dpjpRawat}
            onChange={(e) => setDpjpRawat(e.target.value)}
            placeholder="Nama dokter DPJP yang menerima"
            className={inputCls}
          />
        </Field>
        <Field label="Catatan Transfer">
          <textarea
            value={catatanTransfer}
            onChange={(e) => setCatatanTransfer(e.target.value)}
            rows={4}
            placeholder="Kondisi terkini, tatalaksana yang sudah diberikan, hal yang perlu diperhatikan di bangsal..."
            className={textareaCls}
          />
        </Field>
        <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5">
          <p className="text-[11px] text-violet-700">
            Pastikan bangsal telah dikonfirmasi dan siap menerima pasien sebelum proses transfer.
          </p>
        </div>
      </div>
    </div>
  );
}

function RujukanPanel({
  rsName, setRsName,
  bagianTujuan, setBagianTujuan,
  alasan, setAlasan,
  stable, setStable,
  transport, setTransport,
  pendamping, setPendamping,
  noSurat, setNoSurat,
}: {
  rsName: string; setRsName: (v: string) => void;
  bagianTujuan: string; setBagianTujuan: (v: string) => void;
  alasan: string; setAlasan: (v: string) => void;
  stable: boolean; setStable: (v: boolean) => void;
  transport: string; setTransport: (v: string) => void;
  pendamping: string; setPendamping: (v: string) => void;
  noSurat: string; setNoSurat: (v: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 shadow-sm">
      <SectionHeader icon={Send} title="Surat Rujukan" />
      <div className="flex flex-col gap-4 p-4">
        <Field label="Nomor Surat Rujukan">
          <input
            value={noSurat}
            onChange={(e) => setNoSurat(e.target.value)}
            placeholder="Contoh: RUJ/2026/04/0023"
            className={inputCls}
          />
        </Field>
        <Field label="Rumah Sakit Tujuan" required>
          <input
            value={rsName}
            onChange={(e) => setRsName(e.target.value)}
            placeholder="Nama RS / Fasilitas Kesehatan tujuan"
            className={inputCls}
          />
        </Field>
        <Field label="Bagian / Spesialis Tujuan" required>
          <input
            value={bagianTujuan}
            onChange={(e) => setBagianTujuan(e.target.value)}
            placeholder="Contoh: Poli Jantung, ICU, Bedah Syaraf..."
            className={inputCls}
          />
        </Field>
        <Field label="Alasan Rujukan" required>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan klinis merujuk pasien ke fasilitas tersebut..."
            className={textareaCls}
          />
        </Field>
        <Field label="Kondisi Saat Dirujuk">
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setStable(val)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-medium transition",
                  stable === val
                    ? val
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {val ? "Stabil" : "Tidak Stabil"}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Transportasi">
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className={inputCls}
            >
              <option value="">Pilih...</option>
              <option>Ambulans RS</option>
              <option>Ambulans Swasta</option>
              <option>Kendaraan Pribadi</option>
            </select>
          </Field>
          <Field label="Nakes Pendamping">
            <input
              value={pendamping}
              onChange={(e) => setPendamping(e.target.value)}
              placeholder="Nama dokter / perawat"
              className={inputCls}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function APSPanel({
  alasanAPS, setAlasanAPS,
  edukasiDiberikan, setEdukasiDiberikan,
  namaPenandatangan, setNamaPenandatangan,
  hubungan, setHubungan,
  saksi, setSaksi,
  confirmed, setConfirmed,
}: {
  alasanAPS: string; setAlasanAPS: (v: string) => void;
  edukasiDiberikan: string; setEdukasiDiberikan: (v: string) => void;
  namaPenandatangan: string; setNamaPenandatangan: (v: string) => void;
  hubungan: string; setHubungan: (v: string) => void;
  saksi: string; setSaksi: (v: string) => void;
  confirmed: boolean; setConfirmed: (v: boolean) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 shadow-sm">
      <SectionHeader icon={ShieldAlert} title="Formulir Pernyataan APS" badge="Wajib" />
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[11px] text-amber-700">
              Pasien/keluarga telah menyatakan keinginan untuk pulang meskipun belum diizinkan secara medis.
              Seluruh risiko medis telah dijelaskan dan dipahami.
            </p>
          </div>
        </div>

        <Field label="Alasan Pulang APS" required>
          <textarea
            value={alasanAPS}
            onChange={(e) => setAlasanAPS(e.target.value)}
            rows={2}
            placeholder="Alasan pasien/keluarga meminta pulang..."
            className={textareaCls}
          />
        </Field>

        <Field label="Edukasi Risiko yang Telah Diberikan" required>
          <textarea
            value={edukasiDiberikan}
            onChange={(e) => setEdukasiDiberikan(e.target.value)}
            rows={3}
            placeholder="Jelaskan risiko medis yang telah dikomunikasikan kepada pasien/keluarga..."
            className={textareaCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Penandatangan" required>
            <input
              value={namaPenandatangan}
              onChange={(e) => setNamaPenandatangan(e.target.value)}
              placeholder="Nama pasien / keluarga"
              className={inputCls}
            />
          </Field>
          <Field label="Hubungan">
            <input
              value={hubungan}
              onChange={(e) => setHubungan(e.target.value)}
              placeholder="Pasien sendiri / Suami / Istri..."
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Nama Saksi">
          <input
            value={saksi}
            onChange={(e) => setSaksi(e.target.value)}
            placeholder="Nama perawat / dokter jaga sebagai saksi"
            className={inputCls}
          />
        </Field>

        <button
          type="button"
          onClick={() => setConfirmed(!confirmed)}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
            confirmed
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-amber-300",
          )}
        >
          <span className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
            confirmed ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white",
          )}>
            {confirmed && <Check size={10} />}
          </span>
          <p className="text-xs leading-relaxed">
            Saya menyatakan bahwa pasien / keluarga telah memahami dan menerima semua risiko dari
            keputusan pulang atas permintaan sendiri, serta telah menandatangani surat pernyataan.
          </p>
        </button>
      </div>
    </div>
  );
}

function MeninggalPanel({
  noSurat, setNoSurat,
  jamMeninggal, setJamMeninggal,
  sebabUtama, setSebabUtama,
  sebabPenyerta1, setSebabPenyerta1,
  sebabPenyerta2, setSebabPenyerta2,
  interval, setInterval,
  jenis, setJenis,
  dokterPemeriksa, setDokterPemeriksa,
  namaKeluarga, setNamaKeluarga,
  hubunganKeluarga, setHubunganKeluarga,
  noHpKeluarga, setNoHpKeluarga,
  confirmed, setConfirmed,
}: {
  noSurat: string; setNoSurat: (v: string) => void;
  jamMeninggal: string; setJamMeninggal: (v: string) => void;
  sebabUtama: string; setSebabUtama: (v: string) => void;
  sebabPenyerta1: string; setSebabPenyerta1: (v: string) => void;
  sebabPenyerta2: string; setSebabPenyerta2: (v: string) => void;
  interval: string; setInterval: (v: string) => void;
  jenis: JenisKematian; setJenis: (v: JenisKematian) => void;
  dokterPemeriksa: string; setDokterPemeriksa: (v: string) => void;
  namaKeluarga: string; setNamaKeluarga: (v: string) => void;
  hubunganKeluarga: string; setHubunganKeluarga: (v: string) => void;
  noHpKeluarga: string; setNoHpKeluarga: (v: string) => void;
  confirmed: boolean; setConfirmed: (v: boolean) => void;
}) {
  const darkField = (
    label: string,
    required: boolean,
    children: React.ReactNode,
    hint?: string,
  ) => (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );

  const darkInput =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
      <SectionHeader icon={FileText} title="Surat Keterangan Meninggal" badge="SKM" dark />

      <div className="flex flex-col gap-4 p-4">
        {/* SKM number + jam */}
        <div className="grid grid-cols-2 gap-3">
          {darkField("No. Surat Kematian", true,
            <input
              value={noSurat}
              onChange={(e) => setNoSurat(e.target.value)}
              placeholder="SKM/2026/04/..."
              className={darkInput}
            />
          )}
          {darkField("Jam Meninggal", true,
            <input
              type="time"
              value={jamMeninggal}
              onChange={(e) => setJamMeninggal(e.target.value)}
              className={darkInput}
            />
          )}
        </div>

        {/* Sebab kematian */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Sebab Kematian
          </p>
          <div className="flex flex-col gap-3">
            {darkField("Sebab Kematian Utama (Penyakit / Cedera yang Langsung Menyebabkan Kematian)", true,
              <input
                value={sebabUtama}
                onChange={(e) => setSebabUtama(e.target.value)}
                placeholder="Contoh: NSTEMI dengan Syok Kardiogenik — ICD-10: I21.4"
                className={darkInput}
              />
            )}
            {darkField("Sebab Penyerta 1 (Kondisi yang Mendasari Sebab Utama)", false,
              <input
                value={sebabPenyerta1}
                onChange={(e) => setSebabPenyerta1(e.target.value)}
                placeholder="Contoh: Hipertensi kronis — ICD-10: I10"
                className={darkInput}
              />
            )}
            {darkField("Sebab Penyerta 2 (Kondisi Lain yang Berkontribusi)", false,
              <input
                value={sebabPenyerta2}
                onChange={(e) => setSebabPenyerta2(e.target.value)}
                placeholder="Contoh: Diabetes Mellitus Tipe 2 — ICD-10: E11"
                className={darkInput}
              />
            )}
            {darkField("Interval Antara Awitan dan Kematian", false,
              <input
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                placeholder="Contoh: 3 jam, 2 hari, tidak diketahui"
                className={darkInput}
              />
            )}
          </div>
        </div>

        {/* Jenis kematian */}
        {darkField("Jenis Kematian", true,
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
        )}

        {/* Dokter pemeriksa */}
        {darkField("Dokter yang Menyatakan Meninggal", true,
          <input
            value={dokterPemeriksa}
            onChange={(e) => setDokterPemeriksa(e.target.value)}
            placeholder="Nama dan SIP dokter pemeriksa"
            className={darkInput}
          />
        )}

        {/* Penerima jenazah */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Identitas Penerima / Pengurus Jenazah
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {darkField("Nama Keluarga", true,
                <input
                  value={namaKeluarga}
                  onChange={(e) => setNamaKeluarga(e.target.value)}
                  placeholder="Nama lengkap"
                  className={darkInput}
                />
              )}
              {darkField("Hubungan dengan Pasien", true,
                <input
                  value={hubunganKeluarga}
                  onChange={(e) => setHubunganKeluarga(e.target.value)}
                  placeholder="Anak / Istri / Suami..."
                  className={darkInput}
                />
              )}
            </div>
            {darkField("Nomor HP", false,
              <input
                value={noHpKeluarga}
                onChange={(e) => setNoHpKeluarga(e.target.value)}
                placeholder="Nomor yang dapat dihubungi"
                className={darkInput}
              />
            )}
          </div>
        </div>

        {/* Confirmation */}
        <button
          type="button"
          onClick={() => setConfirmed(!confirmed)}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
            confirmed
              ? "border-rose-500 bg-rose-900/30 text-rose-200"
              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600",
          )}
        >
          <span className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
            confirmed ? "border-rose-500 bg-rose-500 text-white" : "border-slate-600 bg-slate-700",
          )}>
            {confirmed && <Check size={10} />}
          </span>
          <p className="text-xs leading-relaxed">
            Saya menyatakan bahwa kematian pasien telah dikonfirmasi secara medis dan semua informasi
            dalam surat keterangan meninggal ini adalah benar sesuai pemeriksaan.
          </p>
        </button>
      </div>
    </div>
  );
}

// ── Empty placeholder ─────────────────────────────────────

function SelectStatusPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <ClipboardCheck size={18} />
      </span>
      <p className="text-xs text-slate-400">Pilih status pemulangan untuk melanjutkan</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function PasienPulangTab({ patient }: { patient: IGDPatientDetail }) {
  // Main form state
  const [statusPulang, setStatusPulang]     = useState<StatusPulang | null>(null);
  const [dokterPulang, setDokterPulang]     = useState(patient.doctor);
  const [tanggalPulang, setTanggalPulang]   = useState(patient.tglKunjungan);
  const [jamPulang, setJamPulang]           = useState("");
  const [kondisiUmum, setKondisiUmum]       = useState<KondisiUmum | null>(null);
  const [diagnosaKeluar, setDiagnosaKeluar] = useState<string[]>(
    patient.diagnosa.filter((d) => d.tipe === "Utama").map((d) => d.id),
  );
  const [catatanUmum, setCatatanUmum]       = useState("");
  const [submitted, setSubmitted]           = useState(false);

  // TTV terakhir
  const [tdSis, setTdSis]   = useState(String(patient.vitalSigns.tdSistolik));
  const [tdDia, setTdDia]   = useState(String(patient.vitalSigns.tdDiastolik));
  const [nadi, setNadi]     = useState(String(patient.vitalSigns.nadi));
  const [rr, setRr]         = useState(String(patient.vitalSigns.respirasi));
  const [suhu, setSuhu]     = useState(String(patient.vitalSigns.suhu));
  const [spo2, setSpo2]     = useState(String(patient.vitalSigns.spo2));

  // Sembuh/Membaik
  const [instruksi, setInstruksi]       = useState("");
  const [obatPulang, setObatPulang]     = useState("");
  const [kontrolDate, setKontrolDate]   = useState("");
  const [kontrolPoli, setKontrolPoli]   = useState("");

  // Rawat Inap
  const [bangsal, setBangsal]               = useState("");
  const [noBed, setNoBed]                   = useState("");
  const [dpjpRawat, setDpjpRawat]           = useState("");
  const [catatanTransfer, setCatatanTransfer] = useState("");

  // Rujukan
  const [rsName, setRsName]           = useState("");
  const [bagianTujuan, setBagianTujuan] = useState("");
  const [alasanRujuk, setAlasanRujuk] = useState("");
  const [stable, setStable]           = useState(true);
  const [transport, setTransport]     = useState("");
  const [pendamping, setPendamping]   = useState("");
  const [noSuratRujuk, setNoSuratRujuk] = useState("");

  // APS
  const [alasanAPS, setAlasanAPS]       = useState("");
  const [edukasi, setEdukasi]           = useState("");
  const [penandatangan, setPenandatangan] = useState("");
  const [hubAPSsign, setHubAPSsign]     = useState("");
  const [saksi, setSaksi]               = useState("");
  const [apsConfirmed, setApsConfirmed] = useState(false);

  // Meninggal
  const [noSuratMeninggal, setNoSuratMeninggal] = useState("");
  const [jamMeninggal, setJamMeninggal]         = useState("");
  const [sebabUtama, setSebabUtama]             = useState("");
  const [sebabPenyerta1, setSebabPenyerta1]     = useState("");
  const [sebabPenyerta2, setSebabPenyerta2]     = useState("");
  const [intervalMati, setIntervalMati]         = useState("");
  const [jenisMati, setJenisMati]               = useState<JenisKematian>("Wajar");
  const [dokterPemeriksa, setDokterPemeriksa]   = useState(patient.doctor);
  const [namaKeluar, setNamaKeluar]             = useState(patient.namaKeluarga);
  const [hubKeluar, setHubKeluar]               = useState(patient.hubunganKeluarga);
  const [hpKeluar, setHpKeluar]                 = useState(patient.noHp);
  const [matiConfirmed, setMatiConfirmed]       = useState(false);

  const toggleDiagnosa = (id: string) =>
    setDiagnosaKeluar((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const canSubmit =
    statusPulang !== null &&
    kondisiUmum !== null &&
    jamPulang !== "" &&
    (statusPulang !== "Meninggal" || matiConfirmed) &&
    (statusPulang !== "APS" || apsConfirmed);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
  };

  // ── Success screen ──
  if (submitted && statusPulang) {
    const def = STATUS_OPTIONS.find((s) => s.id === statusPulang)!;
    const Icon = def.icon;
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <span className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          statusPulang === "Meninggal" ? "bg-slate-800 text-slate-200" : "bg-emerald-100 text-emerald-600",
        )}>
          {statusPulang === "Meninggal" ? <HeartOff size={30} /> : <CheckCircle2 size={30} />}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Proses Pemulangan Selesai</p>
          <p className="mt-1 text-xs text-slate-500">
            {patient.name} ({patient.noRM}) — Status:{" "}
            <span className="font-semibold text-slate-700">{def.label}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Dicatat oleh: {dokterPulang} · {tanggalPulang} {jamPulang}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak Dokumen
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const hasRightPanel = statusPulang !== null;
  const isMeninggal   = statusPulang === "Meninggal";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header info bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">DPJP</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Masuk</p>
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

      {/* ── Two-column grid ── */}
      <div className={cn(
        "grid grid-cols-1 gap-4",
        hasRightPanel && "lg:grid-cols-2",
      )}>

        {/* ── Left: Main discharge form ── */}
        <div className="flex flex-col gap-4">

          {/* Status pemulangan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardCheck} title="Status Pemulangan" />
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const sel  = statusPulang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusPulang(opt.id)}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-xl border px-3 py-3 text-left transition",
                      sel ? opt.selected : opt.idle,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                        sel
                          ? opt.id === "Meninggal" ? "bg-slate-700 text-slate-200" : "bg-white/60 text-current"
                          : "bg-slate-100 text-slate-500",
                      )}>
                        <Icon size={10} />
                      </span>
                      <span className="text-xs font-semibold leading-none">{opt.label}</span>
                      {sel && <Check size={10} className="ml-auto shrink-0" />}
                    </div>
                    <p className={cn(
                      "text-[10px] leading-snug",
                      sel
                        ? opt.id === "Meninggal" ? "text-slate-400" : "opacity-70"
                        : "text-slate-400",
                    )}>
                      {opt.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dokter + waktu */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Clock} title="Waktu & Penanggung Jawab" />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="Dokter Pemulang" required>
                <input
                  value={dokterPulang}
                  onChange={(e) => setDokterPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={isMeninggal ? "Tanggal Meninggal" : "Tanggal Pulang"} required>
                <input
                  type="date"
                  value={tanggalPulang}
                  onChange={(e) => setTanggalPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={isMeninggal ? "Jam Meninggal" : "Jam Pulang"} required>
                <input
                  type="time"
                  value={jamPulang}
                  onChange={(e) => setJamPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Kondisi umum */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Activity} title="Kondisi Saat Pulang" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Kondisi Umum" required>
                <div className="flex flex-wrap gap-2">
                  {KONDISI_OPTIONS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKondisiUmum(k)}
                      className={cn(
                        "rounded-lg border px-4 py-1.5 text-xs font-medium transition",
                        kondisiUmum === k
                          ? KONDISI_CLS[k]
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </Field>

              {/* TTV terakhir */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tanda Vital Terakhir
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    { label: "TD Sis", val: tdSis, set: setTdSis, unit: "mmHg", icon: HeartPulse },
                    { label: "TD Dia", val: tdDia, set: setTdDia, unit: "mmHg", icon: HeartPulse },
                    { label: "Nadi",   val: nadi,  set: setNadi,  unit: "×/mnt", icon: Activity },
                    { label: "RR",     val: rr,    set: setRr,    unit: "×/mnt", icon: Wind },
                    { label: "Suhu",   val: suhu,  set: setSuhu,  unit: "°C",    icon: Thermometer },
                    { label: "SpO₂",   val: spo2,  set: setSpo2,  unit: "%",     icon: Activity },
                  ].map(({ label, val, set, unit, icon: Icon }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-medium text-slate-400">{label}</label>
                      <div className="relative">
                        <input
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-2 pr-1 text-center text-xs font-semibold tabular-nums text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 text-center">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosa keluar */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Keluar" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map((d) => {
                const sel = diagnosaKeluar.includes(d.id);
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
                        : "bg-slate-100 text-slate-500 ring-slate-200",
                    )}>
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan umum */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardCheck} title="Catatan Penutup" />
            <div className="p-4">
              <textarea
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                rows={3}
                placeholder="Ringkasan perjalanan pasien, tatalaksana yang diberikan, respons terapi..."
                className={textareaCls}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Conditional panel ── */}
        {hasRightPanel ? (
          <div className="flex flex-col gap-4">
            {(statusPulang === "Sembuh" || statusPulang === "Membaik") && (
              <SembuhPanel
                status={statusPulang}
                patient={patient}
                instruksi={instruksi}
                setInstruksi={setInstruksi}
                obatPulang={obatPulang}
                setObatPulang={setObatPulang}
                kontrolDate={kontrolDate}
                setKontrolDate={setKontrolDate}
                kontrolPoli={kontrolPoli}
                setKontrolPoli={setKontrolPoli}
              />
            )}
            {statusPulang === "Rawat_Inap" && (
              <RawatInapPanel
                bangsal={bangsal} setBangsal={setBangsal}
                noBed={noBed} setNoBed={setNoBed}
                dpjpRawat={dpjpRawat} setDpjpRawat={setDpjpRawat}
                catatanTransfer={catatanTransfer} setCatatanTransfer={setCatatanTransfer}
              />
            )}
            {statusPulang === "Dirujuk" && (
              <RujukanPanel
                rsName={rsName} setRsName={setRsName}
                bagianTujuan={bagianTujuan} setBagianTujuan={setBagianTujuan}
                alasan={alasanRujuk} setAlasan={setAlasanRujuk}
                stable={stable} setStable={setStable}
                transport={transport} setTransport={setTransport}
                pendamping={pendamping} setPendamping={setPendamping}
                noSurat={noSuratRujuk} setNoSurat={setNoSuratRujuk}
              />
            )}
            {statusPulang === "APS" && (
              <APSPanel
                alasanAPS={alasanAPS} setAlasanAPS={setAlasanAPS}
                edukasiDiberikan={edukasi} setEdukasiDiberikan={setEdukasi}
                namaPenandatangan={penandatangan} setNamaPenandatangan={setPenandatangan}
                hubungan={hubAPSsign} setHubungan={setHubAPSsign}
                saksi={saksi} setSaksi={setSaksi}
                confirmed={apsConfirmed} setConfirmed={setApsConfirmed}
              />
            )}
            {statusPulang === "Meninggal" && (
              <MeninggalPanel
                noSurat={noSuratMeninggal} setNoSurat={setNoSuratMeninggal}
                jamMeninggal={jamMeninggal} setJamMeninggal={setJamMeninggal}
                sebabUtama={sebabUtama} setSebabUtama={setSebabUtama}
                sebabPenyerta1={sebabPenyerta1} setSebabPenyerta1={setSebabPenyerta1}
                sebabPenyerta2={sebabPenyerta2} setSebabPenyerta2={setSebabPenyerta2}
                interval={intervalMati} setInterval={setIntervalMati}
                jenis={jenisMati} setJenis={setJenisMati}
                dokterPemeriksa={dokterPemeriksa} setDokterPemeriksa={setDokterPemeriksa}
                namaKeluarga={namaKeluar} setNamaKeluarga={setNamaKeluar}
                hubunganKeluarga={hubKeluar} setHubunganKeluarga={setHubKeluar}
                noHpKeluarga={hpKeluar} setNoHpKeluarga={setHpKeluar}
                confirmed={matiConfirmed} setConfirmed={setMatiConfirmed}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* ── Sticky footer ── */}
      <div className={cn(
        "sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm",
        isMeninggal ? "border-slate-700 bg-slate-900" : "border-slate-200",
      )}>
        <div className="flex items-center gap-3">
          {!statusPulang ? (
            <p className={cn("text-xs", isMeninggal ? "text-slate-400" : "text-slate-400")}>
              Pilih status pemulangan dan lengkapi form
            </p>
          ) : (
            <div className="flex items-center gap-2">
              {statusPulang && (() => {
                const def = STATUS_OPTIONS.find((s) => s.id === statusPulang)!;
                return (
                  <span className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1",
                    isMeninggal
                      ? "bg-slate-800 text-slate-300 ring-slate-700"
                      : def.selected,
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", def.dot)} />
                    {def.label}
                  </span>
                );
              })()}
              {!canSubmit && (
                <p className={cn("text-[11px]", isMeninggal ? "text-slate-500" : "text-slate-400")}>
                  Lengkapi semua field wajib
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition",
              isMeninggal
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
              isMeninggal
                ? "bg-slate-700 hover:bg-slate-600"
                : statusPulang === "APS"
                ? "bg-amber-600 hover:bg-amber-700"
                : statusPulang === "Dirujuk"
                ? "bg-sky-600 hover:bg-sky-700"
                : statusPulang === "Rawat_Inap"
                ? "bg-violet-600 hover:bg-violet-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            )}
          >
            <Send size={13} />
            {!statusPulang
              ? "Selesaikan Pemulangan"
              : isMeninggal
              ? "Catat Kematian"
              : statusPulang === "APS"
              ? "Proses Pemulangan APS"
              : statusPulang === "Rawat_Inap"
              ? "Proses Transfer"
              : statusPulang === "Dirujuk"
              ? "Buat Surat Rujukan"
              : "Selesaikan Pemulangan"}
          </button>
        </div>
      </div>
    </div>
  );
}
