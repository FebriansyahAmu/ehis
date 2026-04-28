"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, Utensils, ShieldAlert, AlertTriangle,
  Trash2, Plus, CheckCircle2, HelpCircle, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
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

const SUB_TABS = ["Anamnesis", "Riwayat", "Alergi", "Edukasi", "Skrining Gizi Awal"] as const;
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
// ALERGI sub-tab
// ─────────────────────────────────────────────────────────

type AllergyCategory = "Obat" | "Makanan" | "Lainnya";
type AllergySeverity = "Ringan" | "Sedang" | "Berat";
type AllergyStatus   = "Terkonfirmasi" | "Dicurigai";

interface AllergyEntry {
  id: string;
  category: AllergyCategory;
  allergen: string;
  reactions: string[];
  severity: AllergySeverity;
  status: AllergyStatus;
  keterangan: string;
  snomedCode?: string;
}

// ── SNOMED CT mock codes ──────────────────────────────────

const SNOMED_CODES: { code: string; display: string }[] = [
  { code: "372687004",  display: "Amoksisilin (Amoxicillin)"          },
  { code: "7947003",    display: "Aspirin"                             },
  { code: "764146007",  display: "Penisilin (Penicillin)"             },
  { code: "387207008",  display: "Ibuprofen"                          },
  { code: "260421004",  display: "Kodein (Codeine)"                   },
  { code: "419199007",  display: "Kacang Tanah (Peanut)"              },
  { code: "227493005",  display: "Kacang Pohon (Tree Nut)"            },
  { code: "735029006",  display: "Susu Sapi (Cow's Milk)"             },
  { code: "102263004",  display: "Telur (Egg)"                        },
  { code: "1003755004", display: "Lateks (Natural Rubber Latex)"      },
];

// ── Allergy config ────────────────────────────────────────

const CAT_CFG: Record<AllergyCategory, { icon: LucideIcon; label: string; activeCls: string; iconCls: string }> = {
  Obat:    { icon: Pill,        label: "Obat",    activeCls: "border-indigo-400 bg-indigo-50 text-indigo-700", iconCls: "text-indigo-500" },
  Makanan: { icon: Utensils,    label: "Makanan", activeCls: "border-orange-300 bg-orange-50 text-orange-700", iconCls: "text-orange-500" },
  Lainnya: { icon: ShieldAlert, label: "Lainnya", activeCls: "border-teal-400   bg-teal-50   text-teal-700",   iconCls: "text-teal-500"   },
};

const SEV_CFG: Record<AllergySeverity, { activeCls: string; badgeCls: string; borderL: string }> = {
  Ringan: {
    activeCls: "border-emerald-400 bg-emerald-50 text-emerald-700",
    badgeCls:  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    borderL:   "border-l-4 border-l-emerald-400",
  },
  Sedang: {
    activeCls: "border-amber-400 bg-amber-50 text-amber-700",
    badgeCls:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    borderL:   "border-l-4 border-l-amber-400",
  },
  Berat: {
    activeCls: "border-rose-500 bg-rose-50 text-rose-700",
    badgeCls:  "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    borderL:   "border-l-4 border-l-rose-500",
  },
};

const QUICK_PICKS: Record<AllergyCategory, string[]> = {
  Obat: [
    "Penisilin", "Amoksisilin", "Aspirin", "Ibuprofen",
    "Sulfa", "Kodein", "Tetrasiklin", "Ciprofloxacin",
    "Kontras Radiologi", "Metronidazol", "Tramadol",
  ],
  Makanan: [
    "Kacang Tanah", "Seafood", "Susu Sapi", "Telur",
    "Gandum / Gluten", "Kedelai", "Ikan", "Kacang Pohon",
  ],
  Lainnya: [
    "Lateks", "Serbuk Sari", "Debu", "Bulu Hewan",
    "Nikel", "Lebah / Serangga", "Parfum", "Getah",
  ],
};

const REACTIONS: string[] = [
  "Anafilaksis", "Angioedema", "Bronkospasme",
  "Urtikaria", "Ruam / Eritema", "Pruritus",
  "Mual / Muntah", "Diare", "Rinitis", "Sesak Napas",
];

// ── Mock allergy data ─────────────────────────────────────

const ALLERGY_MOCK: Record<string, AllergyEntry[]> = {
  "RM-2025-005": [
    {
      id: "alg-s1",
      category: "Obat",
      allergen: "Penisilin",
      reactions: ["Anafilaksis", "Urtikaria", "Angioedema"],
      severity: "Berat",
      status: "Terkonfirmasi",
      keterangan: "Riwayat reaksi anafilaktoid. Hindari semua golongan beta-laktam.",
      snomedCode: "764146007",
    },
    {
      id: "alg-s2",
      category: "Makanan",
      allergen: "Seafood",
      reactions: ["Urtikaria", "Pruritus"],
      severity: "Sedang",
      status: "Dicurigai",
      keterangan: "Dilaporkan pasien, belum terkonfirmasi tes alergi.",
    },
  ],
  "RM-2025-012": [
    {
      id: "alg-s3",
      category: "Obat",
      allergen: "Aspirin",
      reactions: ["Bronkospasme", "Sesak Napas"],
      severity: "Berat",
      status: "Terkonfirmasi",
      keterangan: "Aspirin-exacerbated respiratory disease (AERD). Hindari seluruh golongan NSAID.",
      snomedCode: "7947003",
    },
    {
      id: "alg-s4",
      category: "Lainnya",
      allergen: "Lateks",
      reactions: ["Urtikaria", "Pruritus"],
      severity: "Ringan",
      status: "Dicurigai",
      keterangan: "",
      snomedCode: "1003755004",
    },
  ],
};

// ── Allergy card ──────────────────────────────────────────

function AllergyCard({
  entry,
  onDelete,
}: {
  entry: AllergyEntry;
  onDelete: (id: string) => void;
}) {
  const cat    = CAT_CFG[entry.category];
  const sev    = SEV_CFG[entry.severity];
  const CatIcon = cat.icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-sm",
        sev.borderL,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Category icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <CatIcon size={14} className={cat.iconCls} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800">{entry.allergen}</p>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", sev.badgeCls)}>
              {entry.severity}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                entry.status === "Terkonfirmasi"
                  ? "bg-indigo-50 text-indigo-600 ring-indigo-200"
                  : "bg-slate-100 text-slate-500 ring-slate-200",
              )}
            >
              {entry.status === "Terkonfirmasi"
                ? <CheckCircle2 size={9} />
                : <HelpCircle size={9} />
              }
              {entry.status}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {entry.category}
            </span>
          </div>

          {/* Reaction chips */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.reactions.map((r) => (
              <span
                key={r}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {r}
              </span>
            ))}
          </div>

          {entry.snomedCode && (
            <p className="mt-1.5 flex items-center gap-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
                SNOMED
              </span>
              <span className="font-mono text-[10px] text-slate-500">{entry.snomedCode}</span>
              <span className="text-[10px] text-slate-400">
                — {SNOMED_CODES.find((s) => s.code === entry.snomedCode)?.display ?? ""}
              </span>
            </p>
          )}

          {entry.keterangan && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 italic">
              {entry.keterangan}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label={`Hapus alergi ${entry.allergen}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Allergy pane ──────────────────────────────────────────

function AllergyPane({ patient }: { patient: IGDPatientDetail }) {
  const [entries, setEntries] = useState<AllergyEntry[]>(
    () => structuredClone(ALLERGY_MOCK[patient.noRM] ?? []),
  );
  const [noKA, setNoKA] = useState(false);
  const [form, setForm] = useState<{
    category: AllergyCategory;
    allergen: string;
    reactions: string[];
    severity: AllergySeverity;
    status: AllergyStatus;
    keterangan: string;
    snomedCode: string;
  }>({
    category: "Obat",
    allergen: "",
    reactions: [],
    severity: "Sedang",
    status: "Terkonfirmasi",
    keterangan: "",
    snomedCode: "",
  });

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleReaction = (r: string) =>
    setF(
      "reactions",
      form.reactions.includes(r)
        ? form.reactions.filter((x) => x !== r)
        : [...form.reactions, r],
    );

  const canAdd = form.allergen.trim() !== "" && form.reactions.length > 0;

  function handleAdd() {
    if (!canAdd) return;
    setEntries((p) => [
      {
        id: `alg-${Date.now()}`,
        category: form.category,
        allergen: form.allergen.trim(),
        reactions: form.reactions,
        severity: form.severity,
        status: form.status,
        keterangan: form.keterangan.trim(),
        snomedCode: form.snomedCode || undefined,
      },
      ...p,
    ]);
    setNoKA(false);
    setForm({ ...form, allergen: "", reactions: [], keterangan: "", snomedCode: "" });
  }

  const handleDelete = (id: string) => setEntries((p) => p.filter((e) => e.id !== id));

  const severeEntries = entries.filter((e) => e.severity === "Berat");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Severe allergy alert banner ── */}
      <AnimatePresence>
        {severeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle size={14} className="text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Peringatan Alergi — Risiko Tinggi
              </p>
              <p className="mt-0.5 text-[11px] text-rose-600">
                {severeEntries.map((e) => (
                  <span key={e.id} className="mr-2 font-semibold">
                    {e.allergen} ({e.reactions.join(", ")})
                  </span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">

        {/* ── Left: Add form ── */}
        <div
          className={cn(
            "flex flex-col gap-3 transition-opacity md:w-64 md:shrink-0",
            noKA && "pointer-events-none opacity-40",
          )}
        >
          <Block title="Tambah Alergi Baru">

            {/* Category selector */}
            <div>
              <Label required>Kategori</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Obat", "Makanan", "Lainnya"] as AllergyCategory[]).map((cat) => {
                  const cfg  = CAT_CFG[cat];
                  const Icon = cfg.icon;
                  const active = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setF("category", cat)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-semibold transition",
                        active
                          ? cfg.activeCls
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      <Icon size={14} className={active ? undefined : "text-slate-400"} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergen name */}
            <div>
              <Label required>Nama Alergen</Label>
              <input
                type="text"
                value={form.allergen}
                onChange={(e) => setF("allergen", e.target.value)}
                placeholder="Ketik nama alergen..."
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {/* Quick picks */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {QUICK_PICKS[form.category].map((pick) => (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => setF("allergen", pick)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-medium transition",
                      form.allergen === pick
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600",
                    )}
                  >
                    {pick}
                  </button>
                ))}
              </div>
            </div>

            {/* SNOMED CT code */}
            <div>
              <Label>Kode SNOMED CT</Label>
              <select
                value={form.snomedCode}
                onChange={(e) => setF("snomedCode", e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">— Pilih kode SNOMED CT —</option>
                {SNOMED_CODES.map((s) => (
                  <option key={s.code} value={s.code}>
                    [{s.code}] {s.display}
                  </option>
                ))}
              </select>
            </div>

            {/* Reactions */}
            <div>
              <Label required>Jenis Reaksi</Label>
              <div className="flex flex-wrap gap-1">
                {REACTIONS.map((r) => {
                  const sel = form.reactions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleReaction(r)}
                      className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-semibold transition",
                        sel
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                          : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <Label required>Tingkat Keparahan</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Ringan", "Sedang", "Berat"] as AllergySeverity[]).map((sev) => {
                  const cfg    = SEV_CFG[sev];
                  const active = form.severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setF("severity", sev)}
                      className={cn(
                        "rounded-lg border py-1.5 text-[11px] font-semibold transition",
                        active
                          ? cfg.activeCls
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status Konfirmasi</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["Terkonfirmasi", "Dicurigai"] as AllergyStatus[]).map((s) => {
                  const Icon   = s === "Terkonfirmasi" ? CheckCircle2 : HelpCircle;
                  const active = form.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setF("status", s)}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-semibold transition",
                        active
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      <Icon size={11} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <Label>Keterangan</Label>
              <textarea
                rows={2}
                value={form.keterangan}
                onChange={(e) => setF("keterangan", e.target.value)}
                placeholder="Catatan tambahan, kondisi khusus..."
                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} />
              Tambah Alergi
            </button>
          </Block>
        </div>

        {/* ── Right: Allergy list ── */}
        <div className="flex flex-1 flex-col gap-3 md:min-w-0">

          {/* NKA toggle */}
          <button
            type="button"
            onClick={() => setNoKA((p) => !p)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              noKA
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            )}
          >
            {/* Toggle switch */}
            <div
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                noKA ? "bg-emerald-500" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                  noKA ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </div>
            <div className="flex-1">
              <p className={cn("text-xs font-semibold", noKA ? "text-emerald-800" : "text-slate-600")}>
                Tidak Ada Riwayat Alergi yang Diketahui (NKA)
              </p>
              <p className={cn("text-[10px]", noKA ? "text-emerald-600" : "text-slate-400")}>
                {noKA ? "Pasien tidak memiliki riwayat alergi tercatat" : "Aktifkan jika pasien tidak memiliki riwayat alergi"}
              </p>
            </div>
            {noKA && <ShieldCheck size={16} className="shrink-0 text-emerald-500" />}
          </button>

          {/* Allergy count header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Daftar Alergi
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {entries.length}
              </span>
            </p>
            {entries.length > 0 && (
              <div className="flex gap-1.5 text-[10px]">
                {(["Berat", "Sedang", "Ringan"] as AllergySeverity[]).map((sev) => {
                  const count = entries.filter((e) => e.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <span key={sev} className={cn("rounded-md px-2 py-0.5 font-semibold", SEV_CFG[sev].badgeCls)}>
                      {count} {sev}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* List */}
          {noKA && entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center">
              <ShieldCheck size={22} className="text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700">Tidak Ada Riwayat Alergi Diketahui</p>
              <p className="text-[11px] text-emerald-500">NKA telah dikonfirmasi dan dicatat</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
              <ShieldAlert size={22} className="text-slate-300" />
              <p className="text-xs font-medium text-slate-400">Belum ada alergi yang dicatat</p>
              <p className="text-[11px] text-slate-400">Tambahkan alergi dari panel kiri</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AllergyCard entry={entry} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Save button */}
          {entries.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Simpan Data Alergi
              </button>
            </div>
          )}
        </div>

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
      {active === "Alergi"             && <AllergyPane   patient={patient} />}
      {active === "Edukasi"            && <EdukasiPane />}
      {active === "Skrining Gizi Awal" && <GiziPane />}
    </div>
  );
}
