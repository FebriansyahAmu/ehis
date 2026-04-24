"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ClipboardCheck } from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Shared primitives ──────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>
  );
}

function OptionBtn({
  label, score, selected, onClick, colorClass,
}: {
  label: string; score?: number; selected: boolean;
  onClick: () => void; colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
        selected
          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      <span>{label}</span>
      {score !== undefined && (
        <span className={cn(
          "ml-2 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
          selected ? "bg-indigo-200 text-indigo-800" : (colorClass ?? "bg-slate-100 text-slate-500"),
        )}>
          {score}
        </span>
      )}
    </button>
  );
}

function RiskBadge({ label, cls }: { label: string; cls: string }) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-center text-xs font-bold", cls)}>
      {label}
    </div>
  );
}

// ── Accordion item ─────────────────────────────────────────

function AccordionItem({
  id, title, subtitle, badge, isOpen, onToggle, children,
}: {
  id: string; title: string; subtitle?: string; badge?: React.ReactNode;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50",
          isOpen && "bg-slate-50/60",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {badge}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0"
        >
          <ChevronDown size={14} className="text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-slate-100 px-4 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 1. FISIK ───────────────────────────────────────────────

function FisikPanel() {
  const [form, setForm] = useState({
    keadaanUmum: "", kesadaran: "", gizi: "", mobilitas: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {([
        ["keadaanUmum", "Keadaan Umum",  "Baik / Sedang / Berat"],
        ["kesadaran",   "Kesadaran",     "Compos mentis / Apatis / ..."],
        ["gizi",        "Status Gizi",   "Baik / Kurang / Lebih"],
        ["mobilitas",   "Mobilitas",     "Mandiri / Dibantu / Bedrest"],
      ] as [keyof typeof form, string, string][]).map(([key, label, placeholder]) => (
        <div key={key}>
          <SectionLabel>{label}</SectionLabel>
          <input
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      ))}
    </div>
  );
}

// ── 2. NYERI (NRS slider) ─────────────────────────────────

function NyeriPanel() {
  const [score, setScore] = useState(0);
  const [lokasi, setLokasi] = useState("");
  const [karakter, setKarakter] = useState("");
  const [durasi, setDurasi] = useState("");

  const NYERI_LABEL = score === 0 ? "Tidak Nyeri" :
    score <= 3 ? "Nyeri Ringan" :
    score <= 6 ? "Nyeri Sedang" :
    score <= 9 ? "Nyeri Berat" : "Nyeri Sangat Berat";

  const NYERI_CLS = score === 0 ? "bg-emerald-100 text-emerald-700" :
    score <= 3 ? "bg-sky-100 text-sky-700" :
    score <= 6 ? "bg-amber-100 text-amber-700" :
    "bg-rose-100 text-rose-700";

  return (
    <div className="flex flex-col gap-4">
      {/* Slider */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Skala Nyeri Numerik (NRS 0–10)</SectionLabel>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", NYERI_CLS)}>
            {score} — {NYERI_LABEL}
          </span>
        </div>
        <input
          type="range" min={0} max={10} step={1}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className={cn(score === i ? "font-bold text-indigo-600" : "")}>{i}</span>
          ))}
        </div>
      </div>

      {/* Visual scale */}
      <div className="flex rounded-md overflow-hidden">
        {["0","1","2","3","4","5","6","7","8","9","10"].map((n, i) => (
          <div
            key={n}
            className={cn(
              "flex-1 py-1.5 text-center text-[10px] font-bold transition-all cursor-pointer",
              i === score ? "opacity-100 scale-y-110" : "opacity-40",
              i === 0 ? "bg-emerald-400 text-white" :
              i <= 3   ? "bg-sky-400 text-white" :
              i <= 6   ? "bg-amber-400 text-white" :
              "bg-rose-500 text-white",
            )}
            onClick={() => setScore(i)}
          >
            {n}
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["lokasi",   "Lokasi Nyeri",    lokasi,    setLokasi,   "Dada, kepala..."],
          ["karakter", "Karakter Nyeri",  karakter,  setKarakter, "Tumpul, tajam..."],
          ["durasi",   "Durasi",          durasi,    setDurasi,   "Intermiten, terus-menerus..."],
        ].map(([key, label, val, setter, ph]) => (
          <div key={key as string}>
            <SectionLabel>{label as string}</SectionLabel>
            <input
              value={val as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              placeholder={ph as string}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. STATUS ─────────────────────────────────────────────

const STATUS_OPTS = [
  "Stabil", "Tidak Stabil", "Kritis", "Mengancam Jiwa", "Meninggal",
];
const KESADARAN_OPTS = ["Compos Mentis", "Apatis", "Somnolen", "Sopor", "Koma"];

function StatusPanel() {
  const [status, setStatus] = useState("");
  const [kesadaran, setKesadaran] = useState("");
  const [catatan, setCatatan] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionLabel>Status Klinis</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt}
              onClick={() => setStatus(opt)}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                status === opt
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Tingkat Kesadaran</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {KESADARAN_OPTS.map((opt) => (
            <button
              key={opt}
              onClick={() => setKesadaran(opt)}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                kesadaran === opt
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Catatan Status</SectionLabel>
        <textarea
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan kondisi pasien saat ini..."
          className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    </div>
  );
}

// ── 4. STATUS PEDIATRIK ───────────────────────────────────

function PediatrikPanel() {
  const [beratLahir, setBeratLahir] = useState("");
  const [usiaGestasi, setUsiaGestasi] = useState("");
  const [imunisasi, setImunisasi] = useState("");
  const [tumbuhKembang, setTumbuhKembang] = useState("");
  const [catatan, setCatatan] = useState("");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {([
        ["beratLahir",    "Berat Lahir",         beratLahir,    setBeratLahir,    "Contoh: 3200 gram"],
        ["usiaGestasi",   "Usia Gestasi",         usiaGestasi,   setUsiaGestasi,   "Contoh: 38 minggu"],
        ["imunisasi",     "Status Imunisasi",     imunisasi,     setImunisasi,     "Lengkap / Tidak lengkap / Tidak tahu"],
        ["tumbuhKembang", "Tumbuh Kembang",       tumbuhKembang, setTumbuhKembang, "Sesuai usia / Terlambat / ..."],
      ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
        <div key={key}>
          <SectionLabel>{label}</SectionLabel>
          <input
            value={val}
            onChange={(e) => setter(e.target.value)}
            placeholder={ph}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      ))}
      <div className="sm:col-span-2">
        <SectionLabel>Catatan Pediatrik</SectionLabel>
        <textarea
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Riwayat tumbuh kembang, kondisi khusus..."
          className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    </div>
  );
}

// ── 5. DIAGNOSIS ──────────────────────────────────────────

function DiagnosisPanel() {
  const [kerja, setKerja] = useState("");
  const [banding, setBanding] = useState("");
  const [penyerta, setPenyerta] = useState("");

  return (
    <div className="flex flex-col gap-3">
      {([
        ["kerja",    "Diagnosis Kerja",          kerja,    setKerja,    "Diagnosis utama yang ditegakkan..."],
        ["banding",  "Diagnosis Banding",         banding,  setBanding,  "Kemungkinan diagnosis lain..."],
        ["penyerta", "Komorbid / Penyerta",       penyerta, setPenyerta, "Penyakit / kondisi penyerta..."],
      ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
        <div key={key}>
          <SectionLabel>{label}</SectionLabel>
          <textarea
            rows={2}
            value={val}
            onChange={(e) => setter(e.target.value)}
            placeholder={ph}
            className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      ))}
    </div>
  );
}

// ── 6. RISIKO JATUH (Morse Fall Scale) ───────────────────

const MORSE_ITEMS = [
  {
    key: "riwayatJatuh",
    label: "Riwayat Jatuh (3 bulan terakhir)",
    options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 25 }],
  },
  {
    key: "diagnosisSekunder",
    label: "Diagnosis Sekunder (≥ 2 diagnosis medis)",
    options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 15 }],
  },
  {
    key: "alatBantu",
    label: "Alat Bantu Jalan",
    options: [
      { label: "Tidak / Bed rest", score: 0 },
      { label: "Kruk / Tongkat / Walker", score: 15 },
      { label: "Perabot / Dinding", score: 30 },
    ],
  },
  {
    key: "infus",
    label: "Terpasang Infus / Heparin Lock",
    options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 20 }],
  },
  {
    key: "caraBerjalan",
    label: "Cara Berjalan / Berpindah",
    options: [
      { label: "Normal / Bed rest / Kursi roda", score: 0 },
      { label: "Lemah", score: 10 },
      { label: "Terganggu", score: 20 },
    ],
  },
  {
    key: "statusMental",
    label: "Status Mental",
    options: [
      { label: "Orientasi sesuai kemampuan diri", score: 0 },
      { label: "Lupa keterbatasan diri", score: 15 },
    ],
  },
] as const;

function MorsePanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(MORSE_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const risk = !allFilled ? null :
    total < 25  ? { label: "Risiko Rendah",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" } :
    total <= 50 ? { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200" } :
    { label: "Risiko Tinggi", cls: "bg-rose-50 text-rose-700 border-rose-200" };

  return (
    <div className="flex flex-col gap-4">
      {MORSE_ITEMS.map((item) => (
        <div key={item.key}>
          <SectionLabel>{item.label}</SectionLabel>
          <div className="flex flex-col gap-1">
            {item.options.map((opt) => (
              <OptionBtn
                key={opt.score}
                label={opt.label}
                score={opt.score}
                selected={scores[item.key] === opt.score}
                onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
                colorClass={opt.score >= 20 ? "bg-rose-100 text-rose-700" : opt.score > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="flex-1 text-xs text-slate-600">Total Skor Morse</span>
        <span className={cn(
          "rounded-lg border px-3 py-1 text-lg font-bold",
          !allFilled ? "border-slate-200 bg-white text-slate-400" :
          total < 25  ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
          total <= 50 ? "border-amber-200 bg-amber-50 text-amber-700" :
          "border-rose-200 bg-rose-50 text-rose-700",
        )}>
          {total}
        </span>
        {risk && <RiskBadge label={risk.label} cls={cn("border", risk.cls)} />}
      </div>
    </div>
  );
}

// ── 7. DEKUBITUS (Braden Scale) ───────────────────────────

const BRADEN_ITEMS = [
  {
    key: "persepsi",
    label: "Persepsi Sensorik",
    options: [
      { label: "Terbatas total (tidak merasakan)", score: 1 },
      { label: "Sangat terbatas",                  score: 2 },
      { label: "Agak terbatas",                    score: 3 },
      { label: "Tidak ada gangguan",               score: 4 },
    ],
  },
  {
    key: "kelembaban",
    label: "Kelembaban Kulit",
    options: [
      { label: "Selalu basah",    score: 1 },
      { label: "Sering basah",   score: 2 },
      { label: "Kadang basah",   score: 3 },
      { label: "Jarang basah",   score: 4 },
    ],
  },
  {
    key: "aktivitas",
    label: "Aktivitas",
    options: [
      { label: "Bedrest total",            score: 1 },
      { label: "Hanya di kursi roda",     score: 2 },
      { label: "Kadang berjalan",          score: 3 },
      { label: "Berjalan sering",          score: 4 },
    ],
  },
  {
    key: "mobilitas",
    label: "Mobilitas",
    options: [
      { label: "Tidak dapat bergerak sama sekali", score: 1 },
      { label: "Sangat terbatas",                  score: 2 },
      { label: "Agak terbatas",                    score: 3 },
      { label: "Tidak ada gangguan",               score: 4 },
    ],
  },
  {
    key: "nutrisi",
    label: "Nutrisi",
    options: [
      { label: "Sangat buruk (tidak mampu makan)", score: 1 },
      { label: "Kurang (jarang habis)",            score: 2 },
      { label: "Cukup (habis ½–¾ porsi)",         score: 3 },
      { label: "Sangat baik (habis porsi penuh)", score: 4 },
    ],
  },
  {
    key: "gesekan",
    label: "Gesekan & Tekanan",
    options: [
      { label: "Masalah (butuh bantuan penuh untuk bergerak)", score: 1 },
      { label: "Masalah potensial (butuh sedikit bantuan)",   score: 2 },
      { label: "Tidak ada masalah (bergerak mandiri)",        score: 3 },
    ],
  },
] as const;

function BradenPanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BRADEN_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const risk = !allFilled ? null :
    total <= 9  ? { label: "Risiko Sangat Tinggi", cls: "bg-rose-100 text-rose-800 border-rose-300"   } :
    total <= 12 ? { label: "Risiko Tinggi",         cls: "bg-rose-50 text-rose-700 border-rose-200"    } :
    total <= 14 ? { label: "Risiko Sedang",          cls: "bg-amber-50 text-amber-700 border-amber-200"} :
    total <= 18 ? { label: "Risiko Ringan",          cls: "bg-sky-50 text-sky-700 border-sky-200"      } :
    { label: "Tidak Berisiko",               cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };

  return (
    <div className="flex flex-col gap-4">
      {BRADEN_ITEMS.map((item) => (
        <div key={item.key}>
          <SectionLabel>{item.label}</SectionLabel>
          <div className="grid gap-1 sm:grid-cols-2">
            {item.options.map((opt) => (
              <OptionBtn
                key={opt.score}
                label={opt.label}
                score={opt.score}
                selected={scores[item.key] === opt.score}
                onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="flex-1 text-xs text-slate-600">Total Skor Braden (maks. 23)</span>
        <span className={cn(
          "rounded-lg border px-3 py-1 text-lg font-bold",
          !allFilled ? "border-slate-200 bg-white text-slate-400" :
          total <= 12 ? "border-rose-200 bg-rose-50 text-rose-700" :
          total <= 14 ? "border-amber-200 bg-amber-50 text-amber-700" :
          total <= 18 ? "border-sky-200 bg-sky-50 text-sky-700" :
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        )}>
          {total}
        </span>
        {risk && <RiskBadge label={risk.label} cls={cn("border", risk.cls)} />}
      </div>
    </div>
  );
}

// ── 8. BARTHEL INDEX ──────────────────────────────────────

const BARTHEL_ITEMS = [
  { key: "makan",      label: "Makan",                          options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Butuh bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "mandi",      label: "Mandi",                          options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Mandiri" }] },
  { key: "kebersihan", label: "Kebersihan diri (sisir, sikat gigi)", options: [{ s: 0, l: "Butuh bantuan" }, { s: 5, l: "Mandiri" }] },
  { key: "berpakaian", label: "Berpakaian",                     options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Dibantu" }, { s: 10, l: "Mandiri" }] },
  { key: "bak",        label: "BAK",                            options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang inkontinensia" }, { s: 10, l: "Kontinen" }] },
  { key: "bab",        label: "BAB",                            options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang inkontinensia" }, { s: 10, l: "Kontinen" }] },
  { key: "toilet",     label: "Penggunaan toilet",              options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "transfer",   label: "Transfer (kursi ↔ tempat tidur)", options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Bantuan besar" }, { s: 10, l: "Bantuan kecil" }, { s: 15, l: "Mandiri" }] },
  { key: "mobilitas",  label: "Mobilitas (berjalan)",           options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Kursi roda" }, { s: 10, l: "Dengan bantuan" }, { s: 15, l: "Mandiri" }] },
  { key: "tangga",     label: "Naik tangga",                    options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
] as const;

function BarthelPanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BARTHEL_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const level = !allFilled ? null :
    total <= 20  ? { label: "Ketergantungan Total",  cls: "bg-rose-100 text-rose-800 border-rose-300"   } :
    total <= 60  ? { label: "Ketergantungan Berat",  cls: "bg-rose-50 text-rose-700 border-rose-200"    } :
    total <= 90  ? { label: "Ketergantungan Sedang", cls: "bg-amber-50 text-amber-700 border-amber-200" } :
    total <= 99  ? { label: "Ketergantungan Ringan", cls: "bg-sky-50 text-sky-700 border-sky-200"       } :
    { label: "Mandiri (Independent)",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };

  return (
    <div className="flex flex-col gap-3">
      {/* Score summary */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-slate-600">Total Skor Barthel Index</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn("h-full rounded-full transition-all duration-300", total >= 80 ? "bg-emerald-500" : total >= 40 ? "bg-amber-500" : "bg-rose-500")}
              style={{ width: `${allFilled ? total : 0}%` }}
            />
          </div>
        </div>
        <span className={cn(
          "rounded-lg border px-3 py-1 text-lg font-bold",
          !allFilled ? "border-slate-200 bg-white text-slate-400" :
          total >= 80  ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
          total >= 40  ? "border-amber-200 bg-amber-50 text-amber-700" :
          "border-rose-200 bg-rose-50 text-rose-700",
        )}>
          {total} / 100
        </span>
        {level && <RiskBadge label={level.label} cls={cn("border text-[11px] max-w-28", level.cls)} />}
      </div>

      {/* Scoring table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aktivitas</th>
              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">Skor</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pilihan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {BARTHEL_ITEMS.map((item) => (
              <tr key={item.key} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-slate-700 leading-tight">{item.label}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 font-mono font-bold",
                    scores[item.key] !== null
                      ? (scores[item.key] ?? 0) >= 10 ? "bg-emerald-100 text-emerald-700" :
                        (scores[item.key] ?? 0) >= 5  ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-400",
                  )}>
                    {scores[item.key] ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {item.options.map((opt) => (
                      <button
                        key={opt.s}
                        onClick={() => setScores((p) => ({ ...p, [item.key]: opt.s }))}
                        className={cn(
                          "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors",
                          scores[item.key] === opt.s
                            ? "bg-indigo-600 text-white ring-indigo-600"
                            : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300",
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Item definitions ───────────────────────────────────────

const PENILAIAN_ITEMS = [
  {
    id: "fisik",
    title: "Penilaian Fisik",
    subtitle: "Keadaan umum, kesadaran, status gizi",
    content: (p: IGDPatientDetail) => <FisikPanel />,
  },
  {
    id: "nyeri",
    title: "Penilaian Nyeri",
    subtitle: "Numeric Rating Scale (NRS) 0–10",
    content: (p: IGDPatientDetail) => <NyeriPanel />,
  },
  {
    id: "status",
    title: "Status Klinis",
    subtitle: "Kondisi dan tingkat kesadaran pasien",
    content: (p: IGDPatientDetail) => <StatusPanel />,
  },
  {
    id: "pediatrik",
    title: "Status Pediatrik",
    subtitle: "Khusus pasien anak-anak",
    content: (p: IGDPatientDetail) => <PediatrikPanel />,
  },
  {
    id: "diagnosis",
    title: "Penilaian Diagnosis",
    subtitle: "Diagnosis kerja, banding, dan komorbid",
    content: (p: IGDPatientDetail) => <DiagnosisPanel />,
  },
  {
    id: "risiko_jatuh",
    title: "Risiko Jatuh",
    subtitle: "Morse Fall Scale",
    content: (p: IGDPatientDetail) => <MorsePanel />,
  },
  {
    id: "dekubitus",
    title: "Risiko Dekubitus",
    subtitle: "Braden Scale",
    content: (p: IGDPatientDetail) => <BradenPanel />,
  },
  {
    id: "barthel",
    title: "Barthel Index (ADL)",
    subtitle: "Penilaian kemandirian aktivitas sehari-hari",
    content: (p: IGDPatientDetail) => <BarthelPanel />,
  },
] as const;

// ── Main ──────────────────────────────────────────────────

export default function PenilaianTab({ patient }: { patient: IGDPatientDetail }) {
  const [open, setOpen] = useState<string | null>("nyeri");

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <ClipboardCheck size={14} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">Penilaian Klinis</span>
        <span className="ml-auto text-[11px] text-slate-400">
          Klik item untuk membuka form penilaian
        </span>
      </div>

      {/* Accordion list */}
      {PENILAIAN_ITEMS.map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
          isOpen={open === item.id}
          onToggle={() => setOpen(open === item.id ? null : item.id)}
        >
          {item.content(patient)}
          <div className="mt-4 flex justify-end">
            <button className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700">
              Simpan Penilaian
            </button>
          </div>
        </AccordionItem>
      ))}
    </div>
  );
}
