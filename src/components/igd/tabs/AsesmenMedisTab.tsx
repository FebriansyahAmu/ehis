"use client";

import { useState } from "react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Shared compact primitives ─────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function Block({ title, children, className }: {
  title?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea
        rows={rows} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function TI({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type="text" value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

// ── Sub-tab types ─────────────────────────────────────────

const SUB_TABS = ["Anamnesis", "Riwayat", "Edukasi", "Skrining Gizi Awal"] as const;
type SubTab = typeof SUB_TABS[number];

// ── Mock: previous medical notes ─────────────────────────

const PREV_NOTES = [
  {
    tanggal: "10 Jan 2026", unit: "Poli Jantung",
    dokter: "dr. Hendra Wijaya, Sp.JP",
    diagnosa: "CAD, Hipertensi Grade II",
    catatan: "Pasien kontrol rutin. TD 150/90 mmHg. Terapi dilanjutkan: amlodipine 5 mg, bisoprolol 2.5 mg.",
  },
  {
    tanggal: "15 Nov 2025", unit: "IGD",
    dokter: "dr. Rizal Akbar, Sp.EM",
    diagnosa: "Nyeri Dada Atipikal",
    catatan: "EKG: sinus rhythm, normal. Enzim jantung negatif. Dipulangkan dengan terapi simtomatik.",
  },
  {
    tanggal: "03 Agu 2025", unit: "Poli Penyakit Dalam",
    dokter: "dr. Anisa Putri, Sp.PD",
    diagnosa: "Hipertensi, DM Tipe 2",
    catatan: "HbA1c 8.2%. Gula darah puasa 180 mg/dL. Penyesuaian dosis metformin.",
  },
];

// ─────────────────────────────────────────────────────────
// ANAMNESIS sub-tab
// ─────────────────────────────────────────────────────────

function AnamnesisPane({ patient }: { patient: IGDPatientDetail }) {
  const [form, setForm] = useState({
    keluhanUtama: patient.complaint,
    rps: patient.riwayatPenyakitSekarang,
    mekanisme: patient.mekanismeCedera ?? "",
    alergi: patient.riwayatAlergi ?? "",
    obatSaatIni: patient.obatSaatIni ?? "",
    keadaanUmum: patient.pemeriksaanFisikUmum,
    sistemKepalaLeher: "", sistemKardio: "", sistemRespirasi: "",
    sistemAbdomen: "", sistemEkstremitas: "", sistemNeurologi: "",
    asesmenKlinis: patient.asesmenKlinis,
    rencanaTatalaksana: patient.rencanaTatalaksana,
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">

      {/* ── Left: form ── */}
      <div className="flex flex-col gap-3 md:flex-1 md:min-w-0">
        <Block title="Keluhan & Anamnesis">
          <TA label="Keluhan Utama" required value={form.keluhanUtama}
            onChange={(v) => set("keluhanUtama", v)} placeholder="Keluhan utama pasien..." />
          <TA label="Riwayat Penyakit Sekarang (RPS)" rows={3} value={form.rps}
            onChange={(v) => set("rps", v)} placeholder="Kronologis keluhan saat ini..." />
          <div className="grid gap-3 sm:grid-cols-2">
            <TI label="Mekanisme / Onset" value={form.mekanisme}
              onChange={(v) => set("mekanisme", v)} placeholder="Contoh: mendadak, 2 jam lalu..." />
            <TI label="Riwayat Alergi" value={form.alergi}
              onChange={(v) => set("alergi", v)} placeholder="Obat, makanan, lainnya..." />
          </div>
          <TA label="Obat yang Sedang Diminum" value={form.obatSaatIni}
            onChange={(v) => set("obatSaatIni", v)} placeholder="Nama obat, dosis, frekuensi..." />
        </Block>

        <Block title="Pemeriksaan Fisik">
          <TA label="Keadaan Umum" value={form.keadaanUmum}
            onChange={(v) => set("keadaanUmum", v)} placeholder="Tampak sakit sedang/berat, kesadaran..." />
          <div>
            <Label>Pemeriksaan Per Sistem</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["sistemKepalaLeher", "Kepala & Leher"],
                  ["sistemKardio",      "Kardiovaskuler"],
                  ["sistemRespirasi",   "Respirasi"],
                  ["sistemAbdomen",     "Abdomen"],
                  ["sistemEkstremitas", "Ekstremitas"],
                  ["sistemNeurologi",   "Neurologi"],
                ] as [keyof typeof form, string][]
              ).map(([key, lbl]) => (
                <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{lbl}</p>
                  <textarea
                    rows={2}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder="—"
                    className="w-full resize-none bg-transparent text-xs text-slate-700 placeholder:text-slate-300 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </Block>

        <Block title="Asesmen & Rencana Tatalaksana">
          <TA label="Asesmen Klinis (A)" rows={2} value={form.asesmenKlinis}
            onChange={(v) => set("asesmenKlinis", v)} placeholder="Diagnosis kerja / masalah klinis..." />
          <TA label="Rencana Tatalaksana (P)" rows={3} value={form.rencanaTatalaksana}
            onChange={(v) => set("rencanaTatalaksana", v)}
            placeholder="1. ...\n2. ...\n3. ..." />
        </Block>

        <div className="flex justify-end">
          <button type="button"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700">
            Simpan Asesmen
          </button>
        </div>
      </div>

      {/* ── Right: previous notes ── */}
      <div className="flex flex-col gap-2 md:w-96 md:shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-xs font-semibold text-slate-700">Catatan Medis Sebelumnya</span>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {PREV_NOTES.map((note, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                    {note.tanggal}
                  </span>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                    {note.unit}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-800">{note.diagnosa}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{note.catatan}</p>
                <p className="mt-2 text-[11px] italic text-slate-400">{note.dokter}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RIWAYAT sub-tab
// ─────────────────────────────────────────────────────────

function RiwayatPane({ patient }: { patient: IGDPatientDetail }) {
  const [form, setForm] = useState({
    rpd: patient.riwayatPenyakitDahulu ?? "",
    riwayatKeluarga: patient.riwayatKeluarga ?? "",
    riwayatOperasi: "",
    merokok: "", alkohol: "", pekerjaan: "", aktivitas: "",
    riwayatObat: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Block title="Riwayat Penyakit Dahulu (RPD)">
          <TA label="Penyakit / Kondisi yang Pernah Diderita" rows={3}
            value={form.rpd} onChange={(v) => set("rpd", v)}
            placeholder="Contoh: HT sejak 5 tahun, DM tipe 2, serangan jantung 2020..." />
          <TA label="Riwayat Pengobatan Sebelumnya" rows={2}
            value={form.riwayatObat} onChange={(v) => set("riwayatObat", v)}
            placeholder="Obat-obatan rutin yang pernah / sedang dikonsumsi..." />
        </Block>
        <Block title="Riwayat Operasi & Tindakan">
          <TA label="Riwayat Operasi / Tindakan Medis" rows={5}
            value={form.riwayatOperasi} onChange={(v) => set("riwayatOperasi", v)}
            placeholder="Contoh: CABG 2019 di RS X, appendektomi 2010..." />
        </Block>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Block title="Riwayat Penyakit Keluarga">
          <TA label="Penyakit Menurun / Herediter dalam Keluarga" rows={3}
            value={form.riwayatKeluarga} onChange={(v) => set("riwayatKeluarga", v)}
            placeholder="Contoh: ayah HT & DM, ibu Ca mammae..." />
        </Block>
        <Block title="Riwayat Sosial & Kebiasaan">
          <div className="grid grid-cols-2 gap-2">
            <TI label="Merokok" value={form.merokok} onChange={(v) => set("merokok", v)} placeholder="Ya / Tidak / Eks" />
            <TI label="Alkohol" value={form.alkohol} onChange={(v) => set("alkohol", v)} placeholder="Ya / Tidak" />
            <TI label="Pekerjaan" value={form.pekerjaan} onChange={(v) => set("pekerjaan", v)} placeholder="Profesi..." />
            <TI label="Aktivitas Fisik" value={form.aktivitas} onChange={(v) => set("aktivitas", v)} placeholder="Ringan / Sedang / Berat" />
          </div>
        </Block>
      </div>

      <div className="flex justify-end">
        <button type="button"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700">
          Simpan Riwayat
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// EDUKASI sub-tab
// ─────────────────────────────────────────────────────────

interface EdukasiEntry {
  id: string; waktu: string; topik: string; metode: string;
  media: string; verifikasi: string; edukator: string; catatan: string;
}

function EdukasiPane() {
  const [form, setForm] = useState({
    topik: "", metode: "", media: "", verifikasi: "", edukator: "", catatan: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const [entries, setEntries] = useState<EdukasiEntry[]>([]);

  const handleAdd = () => {
    if (!form.topik || !form.edukator) return;
    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setEntries((p) => [{ id: `edu-${Date.now()}`, waktu, ...form }, ...p]);
    setForm({ topik: "", metode: "", media: "", verifikasi: "", edukator: "", catatan: "" });
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <Block title="Tambah Catatan Edukasi" className="md:w-72 md:shrink-0">
        <TI label="Topik Edukasi" required value={form.topik}
          onChange={(v) => set("topik", v)} placeholder="Contoh: Penyakit jantung, diet..." />
        <div className="grid grid-cols-2 gap-2">
          <TI label="Metode" value={form.metode} onChange={(v) => set("metode", v)} placeholder="Lisan / Demonstrasi" />
          <TI label="Media" value={form.media} onChange={(v) => set("media", v)} placeholder="Leaflet / Video / Verbal" />
        </div>
        <TI label="Verifikasi Pemahaman" value={form.verifikasi}
          onChange={(v) => set("verifikasi", v)} placeholder="Paham / Belum paham / Perlu ulang" />
        <TI label="Edukator" required value={form.edukator}
          onChange={(v) => set("edukator", v)} placeholder="Nama petugas..." />
        <TA label="Catatan Tambahan" rows={2} value={form.catatan}
          onChange={(v) => set("catatan", v)} placeholder="Hambatan komunikasi, kondisi pasien..." />
        <button type="button" onClick={handleAdd} disabled={!form.topik || !form.edukator}
          className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40">
          Tambah Edukasi
        </button>
      </Block>

      {/* History */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Riwayat Edukasi
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {entries.length}
          </span>
        </p>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-sm">
            Belum ada catatan edukasi
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-semibold text-slate-500">{e.waktu}</span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{e.topik}</span>
                <span className="text-[11px] text-slate-500">{e.edukator}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
                {e.metode && <span className="text-slate-500">Metode: <span className="text-slate-700">{e.metode}</span></span>}
                {e.media && <span className="text-slate-500">Media: <span className="text-slate-700">{e.media}</span></span>}
                {e.verifikasi && <span className="text-slate-500">Verifikasi: <span className="text-slate-700">{e.verifikasi}</span></span>}
              </div>
              {e.catatan && <p className="mt-1.5 text-[11px] text-slate-400">{e.catatan}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SKRINING GIZI AWAL sub-tab (MUST)
// ─────────────────────────────────────────────────────────

type GiziScore = 0 | 1 | 2;

const MUST_Q = [
  {
    key: "bmi" as const,
    label: "1. Indeks Massa Tubuh (BMI)",
    options: [
      { label: "BMI > 20 kg/m²", score: 0 as GiziScore },
      { label: "BMI 18.5 – 20 kg/m²", score: 1 as GiziScore },
      { label: "BMI < 18.5 kg/m²", score: 2 as GiziScore },
    ],
  },
  {
    key: "bb" as const,
    label: "2. Penurunan Berat Badan (3–6 bulan terakhir)",
    options: [
      { label: "< 5%", score: 0 as GiziScore },
      { label: "5 – 10%", score: 1 as GiziScore },
      { label: "> 10%", score: 2 as GiziScore },
    ],
  },
  {
    key: "akut" as const,
    label: "3. Efek Penyakit Akut",
    options: [
      { label: "Tidak ada penyakit akut / asupan tetap adekuat", score: 0 as GiziScore },
      { label: "Sakit akut — asupan sangat kurang > 5 hari", score: 2 as GiziScore },
    ],
  },
];

const RISK: Record<number, { label: string; cls: string; action: string }> = {
  0: { label: "Risiko Rendah",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "Monitor dan catat asupan secara rutin." },
  1: { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200",       action: "Monitor dan dokumentasi asupan. Pertimbangkan konsultasi gizi." },
};

function GiziPane() {
  const [scores, setScores] = useState<Record<"bmi" | "bb" | "akut", GiziScore | null>>({ bmi: null, bb: null, akut: null });
  const [ahliGizi, setAhliGizi] = useState("");
  const [catatan, setCatatan] = useState("");

  const total = Object.values(scores).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);
  const risk = allFilled ? (total >= 2 ? { label: "Risiko Tinggi", cls: "bg-rose-50 text-rose-700 border-rose-200", action: "Rujuk ke Ahli Gizi. Buat rencana intervensi gizi segera." } : RISK[total]) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Block title="MUST — Malnutrition Universal Screening Tool">
          <div className="flex flex-col gap-4">
            {MUST_Q.map((q) => (
              <div key={q.key}>
                <Label>{q.label}</Label>
                <div className="flex flex-col gap-1">
                  {q.options.map((opt) => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => setScores((p) => ({ ...p, [q.key]: opt.score }))}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition",
                        scores[q.key] === opt.score
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span>{opt.label}</span>
                      <span className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                        opt.score === 0 ? "bg-slate-100 text-slate-500"
                          : opt.score === 1 ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700",
                      )}>
                        Skor {opt.score}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Block>

        <div className="flex flex-col gap-3">
          {/* Score result */}
          <Block title="Hasil Skrining">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Skor MUST</span>
              <span className={cn(
                "rounded-lg border px-3 py-1 text-lg font-bold",
                !allFilled ? "border-slate-200 bg-slate-50 text-slate-400"
                  : total === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : total === 1 ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              )}>
                {total}
              </span>
            </div>

            {risk ? (
              <div className={cn("rounded-md border p-3", risk.cls)}>
                <p className="text-xs font-bold">{risk.label}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">{risk.action}</p>
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-400">
                Isi semua pertanyaan untuk melihat hasil
              </div>
            )}

            {/* Score legend */}
            <div className="flex gap-2 text-[10px]">
              {[
                { s: "0", l: "Rendah",  cls: "bg-emerald-50 text-emerald-700" },
                { s: "1", l: "Sedang",  cls: "bg-amber-50 text-amber-700" },
                { s: "≥2", l: "Tinggi", cls: "bg-rose-50 text-rose-700" },
              ].map((r) => (
                <span key={r.s} className={cn("rounded-md px-2 py-0.5 font-semibold", r.cls)}>
                  {r.s} – {r.l}
                </span>
              ))}
            </div>
          </Block>

          <Block title="Tindak Lanjut">
            <TI label="Dirujuk ke Ahli Gizi" value={ahliGizi}
              onChange={setAhliGizi} placeholder="Nama ahli gizi / Tidak dirujuk" />
            <TA label="Catatan / Rencana Intervensi Gizi" rows={3}
              value={catatan} onChange={setCatatan}
              placeholder="Rencana diet, suplemen, konsultasi lanjutan..." />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Nama Petugas</Label>
                <input type="text" placeholder="Nama..."
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <Label>Tanggal Skrining</Label>
                <input type="date"
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
            <button type="button"
              className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
              Simpan Skrining Gizi
            </button>
          </Block>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

export default function AsesmenMedisTab({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<SubTab>("Anamnesis");

  return (
    <div className="flex flex-col gap-3">
      {/* Sub-tab nav — segmented control */}
      <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 shadow-sm">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition",
              active === tab
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "Anamnesis"          && <AnamnesisPane patient={patient} />}
      {active === "Riwayat"            && <RiwayatPane   patient={patient} />}
      {active === "Edukasi"            && <EdukasiPane />}
      {active === "Skrining Gizi Awal" && <GiziPane />}
    </div>
  );
}
