"use client";

import { useState } from "react";
import type { IGDPatientDetail, TriageLevel } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Compact form primitives ───────────────────────────────

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
      {required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

type ChipColor = "indigo" | "sky" | "emerald" | "rose" | "violet" | "amber" | "slate";

const CHIP_ACTIVE: Record<ChipColor, string> = {
  indigo:  "border-indigo-500 bg-indigo-500 text-white shadow-sm",
  sky:     "border-sky-500 bg-sky-500 text-white shadow-sm",
  emerald: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  rose:    "border-rose-500 bg-rose-500 text-white shadow-sm",
  violet:  "border-violet-500 bg-violet-500 text-white shadow-sm",
  amber:   "border-amber-500 bg-amber-500 text-white shadow-sm",
  slate:   "border-slate-700 bg-slate-700 text-white shadow-sm",
};

function RadioGroup({
  label,
  options,
  value,
  onChange,
  required,
  cols,
  color = "indigo",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  cols?: boolean;
  color?: ChipColor;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className={cn("flex flex-wrap gap-1.5", cols && "grid grid-cols-2")}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150",
              value === opt
                ? CHIP_ACTIVE[color]
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckGroup({
  label,
  options,
  values,
  onChange,
  color = "indigo",
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  color?: ChipColor;
}) {
  const toggle = (opt: string) =>
    onChange(
      values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt],
    );
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150",
              values.includes(opt)
                ? CHIP_ACTIVE[color]
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Compact section ───────────────────────────────────────

const LETTER_CLS: Record<string, string> = {
  A: "bg-sky-500",
  B: "bg-emerald-500",
  C: "bg-rose-500",
  D: "bg-violet-500",
  E: "bg-amber-500",
};

const LETTER_BORDER: Record<string, string> = {
  A: "border-l-sky-500",
  B: "border-l-emerald-500",
  C: "border-l-rose-500",
  D: "border-l-violet-500",
  E: "border-l-amber-500",
};

function Block({
  letter,
  title,
  children,
  className,
}: {
  letter?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const leftBorder = letter
    ? (LETTER_BORDER[letter] ?? "border-l-indigo-400")
    : "border-l-indigo-200";
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-xs border-l-4",
        leftBorder,
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        {letter && (
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
              LETTER_CLS[letter] ?? "bg-slate-400",
            )}
          >
            {letter}
          </span>
        )}
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Triage criteria table ─────────────────────────────────

const COL_HEADERS = [
  {
    key: "resusitasi",
    label: "Resusitasi",
    cls: "bg-red-600",
    text: "text-white",
  },
  {
    key: "emergency",
    label: "Emergency",
    cls: "bg-rose-500",
    text: "text-white",
  },
  { key: "urgent", label: "Urgent", cls: "bg-amber-500", text: "text-white" },
  {
    key: "lessUrgent",
    label: "Less Urgent",
    cls: "bg-emerald-500",
    text: "text-white",
  },
  {
    key: "nonUrgent",
    label: "Non Urgent",
    cls: "bg-sky-500",
    text: "text-white",
  },
  { key: "doa", label: "DOA", cls: "bg-slate-700", text: "text-white" },
] as const;

type ColKey = (typeof COL_HEADERS)[number]["key"];

const CRITERIA_ROWS: { parameter: string; values: Record<ColKey, string> }[] = [
  {
    parameter: "Airway",
    values: {
      resusitasi: "Tersumbat total / apnea",
      emergency: "Tersumbat parsial, stridor",
      urgent: "Bebas, perlu bantuan",
      lessUrgent: "Bebas",
      nonUrgent: "Bebas",
      doa: "—",
    },
  },
  {
    parameter: "Breathing / RR",
    values: {
      resusitasi: "Tidak bernapas / RR < 8",
      emergency: "RR > 30, distress berat, sianosis",
      urgent: "RR 21–30, distress sedang",
      lessUrgent: "Normal, sesak ringan",
      nonUrgent: "Normal",
      doa: "—",
    },
  },
  {
    parameter: "Sirkulasi / TD",
    values: {
      resusitasi: "Henti jantung / TD tidak terukur",
      emergency: "TD < 90 mmHg (syok)",
      urgent: "TD 90–100 mmHg",
      lessUrgent: "Stabil",
      nonUrgent: "Normal",
      doa: "—",
    },
  },
  {
    parameter: "Nadi",
    values: {
      resusitasi: "Tidak teraba",
      emergency: "< 50 atau > 130 ×/mnt",
      urgent: "100–130 ×/mnt (lemah)",
      lessUrgent: "Normal",
      nonUrgent: "Normal",
      doa: "—",
    },
  },
  {
    parameter: "Kesadaran (GCS)",
    values: {
      resusitasi: "≤ 8 · Koma",
      emergency: "9–12 · Somnolen",
      urgent: "13–14 · Apatis / Delirium",
      lessUrgent: "15 · Sadar penuh",
      nonUrgent: "15",
      doa: "—",
    },
  },
  {
    parameter: "Skala Nyeri (VAS)",
    values: {
      resusitasi: "—",
      emergency: "8–10 · Berat",
      urgent: "5–7 · Sedang",
      lessUrgent: "3–4 · Ringan-sedang",
      nonUrgent: "0–2",
      doa: "—",
    },
  },
  {
    parameter: "Waktu Respons",
    values: {
      resusitasi: "Segera · detik",
      emergency: "< 10 menit",
      urgent: "< 30 menit",
      lessUrgent: "< 60 menit",
      nonUrgent: "< 120 menit",
      doa: "Verifikasi kematian",
    },
  },
  {
    parameter: "Contoh Kasus",
    values: {
      resusitasi: "Henti napas / jantung, syok berat",
      emergency: "STEMI, stroke, distress napas berat",
      urgent: "Fraktur, nyeri dada moderat, kejang",
      lessUrgent: "Luka ringan, nyeri sedang",
      nonUrgent: "ISPA ringan, kontrol rutin",
      doa: "Meninggal saat tiba, tanpa tanda kehidupan",
    },
  },
];

function CriteriaTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-700">
          Tabel Kriteria Triase
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-32 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-600">
                Pemeriksaan
              </th>
              {COL_HEADERS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-center font-semibold",
                    col.cls,
                    col.text,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CRITERIA_ROWS.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-semibold text-slate-700">
                  {row.parameter}
                </td>
                {COL_HEADERS.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2.5 text-center leading-snug text-slate-600"
                  >
                    {row.values[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Triage decision cards ─────────────────────────────────

const TRIAGE_OPT: {
  id: TriageLevel;
  label: string;
  sub: string;
  desc: string;
  activeCls: string;
  inactiveDot: string;
  pulse: boolean;
}[] = [
  {
    id: "P1",
    label: "P1",
    sub: "MERAH",
    desc: "Kritis · Mengancam jiwa",
    inactiveDot: "bg-rose-400",
    activeCls: "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-200 scale-[1.03]",
    pulse: true,
  },
  {
    id: "P2",
    label: "P2",
    sub: "KUNING",
    desc: "Gawat · Segera ditangani",
    inactiveDot: "bg-amber-400",
    activeCls: "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200 scale-[1.03]",
    pulse: false,
  },
  {
    id: "P3",
    label: "P3",
    sub: "HIJAU",
    desc: "Tidak gawat darurat",
    inactiveDot: "bg-emerald-500",
    activeCls: "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-[1.03]",
    pulse: false,
  },
  {
    id: "P4",
    label: "P4",
    sub: "HITAM",
    desc: "Meninggal · Harapan sangat kecil",
    inactiveDot: "bg-slate-600",
    activeCls: "border-slate-800 bg-slate-800 text-white shadow-md shadow-slate-200 scale-[1.03]",
    pulse: false,
  },
];

// ── Form state ────────────────────────────────────────────

interface TriaseForm {
  caraMasuk: string;
  kondisiTiba: string;
  // Anamnesis
  keluhanUtama: string;
  onset: string;
  lokasiKeluhan: string;
  kualitasKeluhan: string;
  skalaBerat: string;
  faktorPemberat: string;
  faktorPeringan: string;
  gejalaPenyerta: string[];
  riwayatSerupa: string;
  // Primary survey
  airwayStatus: string;
  suaraNapasAbnormal: string[];
  breathingQuality: string;
  pergerakanDada: string;
  ototBantu: string;
  sianosis: string;
  nadiTeraba: string;
  kualitasNadi: string;
  crt: string;
  kondisiKulit: string;
  perdarahan: string;
  avpu: string;
  pupil: string;
  refleksCahaya: string;
  traumaLuka: string;
  lokasiLuka: string;
  suhuKulit: string;
  diagnosisSementara: string;
  tindakanTriase: string[];
  triageLevel: string;
  perawatTriase: string;
}

const EMPTY: TriaseForm = {
  caraMasuk: "",
  kondisiTiba: "",
  keluhanUtama: "",
  onset: "",
  lokasiKeluhan: "",
  kualitasKeluhan: "",
  skalaBerat: "",
  faktorPemberat: "",
  faktorPeringan: "",
  gejalaPenyerta: [],
  riwayatSerupa: "",
  airwayStatus: "",
  suaraNapasAbnormal: [],
  breathingQuality: "",
  pergerakanDada: "",
  ototBantu: "",
  sianosis: "",
  nadiTeraba: "",
  kualitasNadi: "",
  crt: "",
  kondisiKulit: "",
  perdarahan: "",
  avpu: "",
  pupil: "",
  refleksCahaya: "",
  traumaLuka: "",
  lokasiLuka: "",
  suhuKulit: "",
  diagnosisSementara: "",
  tindakanTriase: [],
  triageLevel: "",
  perawatTriase: "",
};

// ── Main component ────────────────────────────────────────

export default function TriaseTab({ patient }: { patient: IGDPatientDetail }) {
  const [form, setForm] = useState<TriaseForm>({
    ...EMPTY,
    triageLevel: patient.triage,
    keluhanUtama: patient.complaint,
  });
  const set = <K extends keyof TriaseForm>(k: K, v: TriaseForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-3">
      {/* Kedatangan */}
      <Block title="Informasi Kedatangan">
        <div className="grid gap-3 sm:grid-cols-2">
          <RadioGroup
            label="Cara Masuk"
            required
            options={[
              "Jalan Kaki",
              "Kursi Roda",
              "Brankar",
              "Ambulans RS",
              "Ambulans 118",
            ]}
            value={form.caraMasuk}
            onChange={(v) => set("caraMasuk", v)}
          />
          <RadioGroup
            label="Kondisi Saat Tiba"
            required
            options={[
              "Sadar",
              "Penurunan Kesadaran",
              "Tidak Sadar",
              "Gelisah / Agitasi",
            ]}
            value={form.kondisiTiba}
            onChange={(v) => set("kondisiTiba", v)}
          />
        </div>
      </Block>

      {/* Anamnesis Keluhan Utama */}
      <Block title="Anamnesis — Keluhan Utama">
        <div>
          <Label required>Keluhan Utama</Label>
          <textarea
            rows={2}
            value={form.keluhanUtama}
            onChange={(e) => set("keluhanUtama", e.target.value)}
            placeholder="Tuliskan keluhan utama pasien..."
            className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label required>Onset</Label>
            <input
              type="text"
              value={form.onset}
              onChange={(e) => set("onset", e.target.value)}
              placeholder="Contoh: 2 jam SMRS, mendadak..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <Label>Lokasi Keluhan</Label>
            <input
              type="text"
              value={form.lokasiKeluhan}
              onChange={(e) => set("lokasiKeluhan", e.target.value)}
              placeholder="Contoh: dada substernal, perut kanan..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <RadioGroup
            label="Skala Berat Keluhan"
            options={["Ringan", "Sedang", "Berat", "Sangat Berat"]}
            value={form.skalaBerat}
            onChange={(v) => set("skalaBerat", v)}
          />
        </div>
        <RadioGroup
          label="Kualitas Keluhan"
          options={[
            "Tumpul",
            "Tajam / Menusuk",
            "Seperti Ditekan",
            "Seperti Terbakar",
            "Berdenyut",
            "Kolik",
          ]}
          value={form.kualitasKeluhan}
          onChange={(v) => set("kualitasKeluhan", v)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Faktor Pemberat</Label>
            <input
              type="text"
              value={form.faktorPemberat}
              onChange={(e) => set("faktorPemberat", e.target.value)}
              placeholder="Contoh: aktivitas, saat berbaring..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <Label>Faktor Peringan</Label>
            <input
              type="text"
              value={form.faktorPeringan}
              onChange={(e) => set("faktorPeringan", e.target.value)}
              placeholder="Contoh: istirahat, obat tertentu..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <CheckGroup
          label="Gejala Penyerta"
          options={[
            "Mual",
            "Muntah",
            "Demam",
            "Sesak Napas",
            "Nyeri Kepala",
            "Pusing",
            "Keringat Dingin",
            "Lemas",
            "Pingsan",
            "Diare",
            "Batuk",
            "Kejang",
          ]}
          values={form.gejalaPenyerta}
          onChange={(v) => set("gejalaPenyerta", v)}
        />
        <div>
          <Label>Riwayat Keluhan Serupa</Label>
          <input
            type="text"
            value={form.riwayatSerupa}
            onChange={(e) => set("riwayatSerupa", e.target.value)}
            placeholder="Pernah mengalami keluhan serupa sebelumnya? Kapan?"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </Block>

      {/* Primary Survey — 2-col grid on sm+ */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* A */}
        <Block letter="A" title="Airway — Jalan Napas">
          <RadioGroup
            label="Status"
            required
            options={["Bebas / Paten", "Tersumbat Parsial", "Tersumbat Total"]}
            value={form.airwayStatus}
            onChange={(v) => set("airwayStatus", v)}
            color="sky"
          />
          <CheckGroup
            label="Suara Napas Abnormal"
            options={["Stridor", "Gurgling", "Snoring", "Tidak Ada"]}
            values={form.suaraNapasAbnormal}
            onChange={(v) => set("suaraNapasAbnormal", v)}
            color="sky"
          />
        </Block>

        {/* B */}
        <Block letter="B" title="Breathing — Pernapasan">
          <RadioGroup
            label="Kualitas Napas"
            required
            options={["Normal", "Sesak / Distress", "Tidak Bernapas"]}
            value={form.breathingQuality}
            onChange={(v) => set("breathingQuality", v)}
            color="emerald"
          />
          <div className="grid grid-cols-3 gap-2">
            <RadioGroup
              label="Pergerakan Dada"
              options={["Simetris", "Asimetris"]}
              value={form.pergerakanDada}
              onChange={(v) => set("pergerakanDada", v)}
              color="emerald"
            />
            <RadioGroup
              label="Otot Bantu"
              options={["Tidak", "Ya"]}
              value={form.ototBantu}
              onChange={(v) => set("ototBantu", v)}
              color="emerald"
            />
            <RadioGroup
              label="Sianosis"
              options={["Tidak", "Ya"]}
              value={form.sianosis}
              onChange={(v) => set("sianosis", v)}
              color="emerald"
            />
          </div>
        </Block>

        {/* C */}
        <Block letter="C" title="Circulation — Sirkulasi">
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup
              label="Nadi"
              required
              options={["Teraba", "Tidak Teraba"]}
              value={form.nadiTeraba}
              onChange={(v) => set("nadiTeraba", v)}
              color="rose"
            />
            <RadioGroup
              label="Kualitas Nadi"
              options={["Kuat & Teratur", "Lemah", "Tidak Teraba"]}
              value={form.kualitasNadi}
              onChange={(v) => set("kualitasNadi", v)}
              color="rose"
            />
            <RadioGroup
              label="CRT"
              options={["< 2 detik", "≥ 2 detik"]}
              value={form.crt}
              onChange={(v) => set("crt", v)}
              color="rose"
            />
            <RadioGroup
              label="Kondisi Kulit"
              options={["Hangat & Kering", "Pucat", "Dingin", "Lembab"]}
              value={form.kondisiKulit}
              onChange={(v) => set("kondisiKulit", v)}
              color="rose"
            />
          </div>
          <RadioGroup
            label="Perdarahan Aktif"
            options={[
              "Tidak Ada",
              "Ada — Terkontrol",
              "Ada — Tidak Terkontrol",
            ]}
            value={form.perdarahan}
            onChange={(v) => set("perdarahan", v)}
            color="rose"
          />
        </Block>

        {/* D */}
        <Block letter="D" title="Disability — Neurologis">
          <RadioGroup
            label="Tingkat Kesadaran (AVPU)"
            required
            options={["Alert", "Verbal", "Pain", "Unresponsive"]}
            value={form.avpu}
            onChange={(v) => set("avpu", v)}
            color="violet"
          />
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup
              label="Pupil"
              options={["Isokor", "Anisokor", "Miosis", "Midriasis"]}
              value={form.pupil}
              onChange={(v) => set("pupil", v)}
              color="violet"
            />
            <RadioGroup
              label="Refleks Cahaya"
              options={["+/+", "+/−", "−/−"]}
              value={form.refleksCahaya}
              onChange={(v) => set("refleksCahaya", v)}
              color="violet"
            />
          </div>
        </Block>

        {/* E */}
        <Block letter="E" title="Exposure — Paparan">
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup
              label="Trauma / Luka"
              options={["Tidak Ada", "Ada"]}
              value={form.traumaLuka}
              onChange={(v) => set("traumaLuka", v)}
              color="amber"
            />
            <RadioGroup
              label="Suhu Kulit"
              options={["Normal", "Hipertermi", "Hipotermi"]}
              value={form.suhuKulit}
              onChange={(v) => set("suhuKulit", v)}
              color="amber"
            />
          </div>
          {form.traumaLuka === "Ada" && (
            <div>
              <Label>Lokasi Luka / Trauma</Label>
              <input
                type="text"
                value={form.lokasiLuka}
                onChange={(e) => set("lokasiLuka", e.target.value)}
                placeholder="Contoh: kepala, ekstremitas kanan..."
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
        </Block>

        {/* Diagnosa + Tindakan */}
        <Block title="Diagnosa Sementara & Tindakan Awal">
          <div>
            <Label>Diagnosa / Kesan Klinis Sementara</Label>
            <textarea
              rows={2}
              value={form.diagnosisSementara}
              onChange={(e) => set("diagnosisSementara", e.target.value)}
              placeholder="Contoh: Suspect STEMI, Syok Hipovolemik..."
              className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <CheckGroup
            label="Tindakan di Area Triase"
            options={[
              "Pemberian O₂",
              "IV Line",
              "Monitor EKG",
              "NGT",
              "Kateter",
              "RJP",
              "Cairan IV",
              "Lainnya",
            ]}
            values={form.tindakanTriase}
            onChange={(v) => set("tindakanTriase", v)}
          />
        </Block>
      </div>

      {/* Criteria table */}
      <CriteriaTable />

      {/* Keputusan Triase */}
      <Block title="Keputusan Triase">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRIAGE_OPT.map((opt) => {
            const isActive = form.triageLevel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("triageLevel", opt.id)}
                className={cn(
                  "cursor-pointer flex flex-col items-center gap-1.5 rounded-xl border-2 py-3.5 text-center transition-all duration-200",
                  isActive
                    ? opt.activeCls
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span className="relative flex h-3 w-3">
                  {opt.pulse && isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex h-3 w-3 rounded-full",
                      isActive ? "bg-white/80" : opt.inactiveDot,
                    )}
                  />
                </span>
                <p className={cn("text-sm font-black leading-none", isActive ? "text-white" : "text-slate-700")}>
                  {opt.label}
                </p>
                <p className={cn("text-[10px] font-bold tracking-widest", isActive ? "text-white/80" : "text-slate-400")}>
                  {opt.sub}
                </p>
                <p className={cn("px-2 text-[9px] leading-tight", isActive ? "text-white/70" : "text-slate-400")}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Block>

      {/* Perawat Triase */}
      <Block title="Penanggung Jawab Triase">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label required>Nama Perawat Triase</Label>
            <input
              type="text"
              value={form.perawatTriase}
              onChange={(e) => set("perawatTriase", e.target.value)}
              placeholder="Nama perawat..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <Label>Waktu Triase</Label>
            <input
              type="datetime-local"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Block>

      {/* Save */}
      <div className="flex justify-end pb-1">
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          Simpan Pengkajian Triase
        </button>
      </div>
    </div>
  );
}
