"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ClipboardCheck, Activity, Zap, Stethoscope,
  Baby, BookOpen, ShieldAlert, Layers, BarChart2,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Base styles ────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";
const textareaCls =
  "w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";

// ── Shared primitives ──────────────────────────────────────────

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function Pill({
  label, score, selected, onClick,
}: {
  label: string; score?: number; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        selected
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-600",
      )}
    >
      {score !== undefined && (
        <span className={cn(
          "font-mono text-[10px] font-bold leading-none",
          selected ? "text-emerald-600" : "text-slate-400",
        )}>
          {score}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

function SaveBtn() {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-emerald-700"
    >
      Simpan Penilaian
    </button>
  );
}

function RiskBadge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold", cls)}>
      {label}
    </span>
  );
}

function ScoreBar({
  total, max, allFilled, level,
}: {
  total: number; max: number; allFilled: boolean;
  level: { label: string; cls: string; barCls: string } | null;
}) {
  const pct = allFilled ? Math.round((total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
      <div className="flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Total Skor</span>
          <span className={cn("font-mono text-sm font-bold", allFilled ? "text-slate-800" : "text-slate-400")}>
            {allFilled ? `${total} / ${max}` : `— / ${max}`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn("h-full rounded-full transition-all duration-500", level?.barCls ?? "bg-emerald-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {level && <RiskBadge label={level.label} cls={cn("border", level.cls)} />}
    </div>
  );
}

// ── Accordion ──────────────────────────────────────────────────

function AccordionItem({
  icon: Icon, title, subtitle, isOpen, onToggle, children,
}: {
  icon: LucideIcon; title: string; subtitle?: string;
  isOpen: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-white shadow-xs transition-colors duration-150",
      isOpen ? "border-emerald-200" : "border-slate-200",
    )}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
          isOpen ? "bg-emerald-50/50" : "hover:bg-slate-50",
        )}
      >
        <span className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          isOpen ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400",
        )}>
          <Icon size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-semibold leading-tight", isOpen ? "text-emerald-800" : "text-slate-800")}>
            {title}
          </p>
          {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0"
        >
          <ChevronDown size={13} className={cn(isOpen ? "text-emerald-500" : "text-slate-400")} />
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
            <div className="border-t border-emerald-100 px-3.5 py-3.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 1. FISIK ───────────────────────────────────────────────────

function FisikPanel() {
  const [form, setForm] = useState({ keadaanUmum: "", kesadaran: "", gizi: "", mobilitas: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["keadaanUmum", "Keadaan Umum",  "Baik / Sedang / Berat"],
          ["kesadaran",   "Kesadaran",     "Compos mentis / Apatis / ..."],
          ["gizi",        "Status Gizi",   "Baik / Kurang / Lebih"],
          ["mobilitas",   "Mobilitas",     "Mandiri / Dibantu / Bedrest"],
        ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
          <div key={key}>
            <Label>{label}</Label>
            <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
          </div>
        ))}
      </div>
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 2. NYERI ───────────────────────────────────────────────────

function NyeriPanel() {
  const [score, setScore] = useState(0);
  const [lokasi, setLokasi] = useState("");
  const [karakter, setKarakter] = useState("");
  const [durasi, setDurasi] = useState("");

  const level =
    score === 0 ? { label: "Tidak Nyeri",       cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" } :
    score <= 3  ? { label: "Nyeri Ringan",       cls: "bg-sky-100 text-sky-700 ring-1 ring-sky-200"           } :
    score <= 6  ? { label: "Nyeri Sedang",       cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"     } :
    score <= 9  ? { label: "Nyeri Berat",        cls: "bg-orange-100 text-orange-700 ring-1 ring-orange-200"  } :
                  { label: "Nyeri Sangat Berat", cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200"        };

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <Label>Skala Nyeri Numerik (NRS 0–10)</Label>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", level.cls)}>
            {score} — {level.label}
          </span>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i} type="button" onClick={() => setScore(i)}
              className={cn(
                "flex-1 cursor-pointer py-2 text-center text-[11px] font-bold transition-all",
                score === i ? "opacity-100 text-white" : "opacity-30 hover:opacity-60",
                i === 0 ? "bg-emerald-400" : i <= 3 ? "bg-sky-400" : i <= 6 ? "bg-amber-400" : i <= 9 ? "bg-orange-500" : "bg-rose-600",
              )}
            >
              {i}
            </button>
          ))}
        </div>
        <input
          type="range" min={0} max={10} step={1} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-600"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ["lokasi",   "Lokasi Nyeri",   lokasi,   setLokasi,   "Dada, kepala..."],
          ["karakter", "Karakter Nyeri", karakter, setKarakter, "Tumpul, tajam..."],
          ["durasi",   "Durasi",         durasi,   setDurasi,   "Intermiten, terus-menerus..."],
        ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
          <div key={key as string}>
            <Label>{label as string}</Label>
            <input
              value={val as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              placeholder={ph as string}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 3. STATUS KLINIS ───────────────────────────────────────────

const STATUS_OPTS = ["Stabil", "Tidak Stabil", "Kritis", "Mengancam Jiwa", "Meninggal"];
const KESADARAN_OPTS = ["Compos Mentis", "Apatis", "Somnolen", "Sopor", "Koma"];

function StatusPanel() {
  const [status, setStatus] = useState("");
  const [kesadaran, setKesadaran] = useState("");
  const [catatan, setCatatan] = useState("");

  const pillCls = (active: boolean) => cn(
    "cursor-pointer rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
    active
      ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600",
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label>Status Klinis</Label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((opt) => (
            <button key={opt} type="button" onClick={() => setStatus(opt === status ? "" : opt)} className={pillCls(status === opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Tingkat Kesadaran</Label>
        <div className="flex flex-wrap gap-1.5">
          {KESADARAN_OPTS.map((opt) => (
            <button key={opt} type="button" onClick={() => setKesadaran(opt === kesadaran ? "" : opt)} className={pillCls(kesadaran === opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Catatan Status</Label>
        <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan kondisi pasien saat ini..." className={textareaCls} />
      </div>
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 4. PEDIATRIK ───────────────────────────────────────────────

function PediatrikPanel() {
  const [beratLahir, setBeratLahir] = useState("");
  const [usiaGestasi, setUsiaGestasi] = useState("");
  const [imunisasi, setImunisasi] = useState("");
  const [tumbuhKembang, setTumbuhKembang] = useState("");
  const [catatan, setCatatan] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["beratLahir",    "Berat Lahir",      beratLahir,    setBeratLahir,    "Contoh: 3200 gram"],
          ["usiaGestasi",   "Usia Gestasi",     usiaGestasi,   setUsiaGestasi,   "Contoh: 38 minggu"],
          ["imunisasi",     "Status Imunisasi", imunisasi,     setImunisasi,     "Lengkap / Tidak lengkap / Tidak tahu"],
          ["tumbuhKembang", "Tumbuh Kembang",   tumbuhKembang, setTumbuhKembang, "Sesuai usia / Terlambat / ..."],
        ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
          <div key={key as string}>
            <Label>{label as string}</Label>
            <input
              value={val as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              placeholder={ph as string}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <div>
        <Label>Catatan Pediatrik</Label>
        <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Riwayat tumbuh kembang, kondisi khusus..." className={textareaCls} />
      </div>
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 5. DIAGNOSIS ───────────────────────────────────────────────

function DiagnosisPanel() {
  const [kerja, setKerja] = useState("");
  const [banding, setBanding] = useState("");
  const [penyerta, setPenyerta] = useState("");

  return (
    <div className="flex flex-col gap-3">
      {([
        ["kerja",    "Diagnosis Kerja",     kerja,    setKerja,    "Diagnosis utama yang ditegakkan..."],
        ["banding",  "Diagnosis Banding",   banding,  setBanding,  "Kemungkinan diagnosis lain..."],
        ["penyerta", "Komorbid / Penyerta", penyerta, setPenyerta, "Penyakit / kondisi penyerta..."],
      ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
        <div key={key as string}>
          <Label>{label as string}</Label>
          <textarea
            rows={2}
            value={val as string}
            onChange={(e) => (setter as (v: string) => void)(e.target.value)}
            placeholder={ph as string}
            className={textareaCls}
          />
        </div>
      ))}
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 6. RISIKO JATUH (Morse Fall Scale) ────────────────────────

const MORSE_ITEMS = [
  { key: "riwayatJatuh",      label: "Riwayat Jatuh (3 bln terakhir)",  options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 25 }] },
  { key: "diagnosisSekunder", label: "≥ 2 Diagnosis Sekunder",          options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 15 }] },
  { key: "alatBantu",         label: "Alat Bantu Jalan",                options: [{ label: "Tidak / Bed rest", score: 0 }, { label: "Kruk / Tongkat / Walker", score: 15 }, { label: "Perabot / Dinding", score: 30 }] },
  { key: "infus",             label: "Terpasang Infus / Heparin Lock",  options: [{ label: "Tidak", score: 0 }, { label: "Ya", score: 20 }] },
  { key: "caraBerjalan",      label: "Cara Berjalan / Berpindah",       options: [{ label: "Normal / Bed rest", score: 0 }, { label: "Lemah", score: 10 }, { label: "Terganggu", score: 20 }] },
  { key: "statusMental",      label: "Status Mental",                   options: [{ label: "Orientasi sesuai kemampuan diri", score: 0 }, { label: "Lupa keterbatasan diri", score: 15 }] },
] as const;

function MorsePanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(MORSE_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const level = !allFilled ? null :
    total < 25  ? { label: "Risiko Rendah",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" } :
    total <= 50 ? { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   } :
                  { label: "Risiko Tinggi",  cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    };

  return (
    <div className="flex flex-col gap-2.5">
      {MORSE_ITEMS.map((item) => (
        <div key={item.key}>
          <Label>{item.label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {item.options.map((opt) => (
              <Pill
                key={opt.score} label={opt.label} score={opt.score}
                selected={scores[item.key] === opt.score}
                onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
              />
            ))}
          </div>
        </div>
      ))}
      <ScoreBar total={total} max={125} allFilled={allFilled} level={level} />
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 7. RISIKO DEKUBITUS (Braden Scale) ────────────────────────

const BRADEN_ITEMS = [
  { key: "persepsi",   label: "Persepsi Sensorik", options: [{ label: "Terbatas total", score: 1 }, { label: "Sangat terbatas", score: 2 }, { label: "Agak terbatas", score: 3 }, { label: "Tidak terganggu", score: 4 }] },
  { key: "kelembaban", label: "Kelembaban Kulit",  options: [{ label: "Selalu basah", score: 1 }, { label: "Sering basah", score: 2 }, { label: "Kadang basah", score: 3 }, { label: "Jarang basah", score: 4 }] },
  { key: "aktivitas",  label: "Aktivitas",         options: [{ label: "Bedrest total", score: 1 }, { label: "Kursi roda", score: 2 }, { label: "Kadang berjalan", score: 3 }, { label: "Sering berjalan", score: 4 }] },
  { key: "mobilitas",  label: "Mobilitas",         options: [{ label: "Tidak bisa sama sekali", score: 1 }, { label: "Sangat terbatas", score: 2 }, { label: "Agak terbatas", score: 3 }, { label: "Tidak terganggu", score: 4 }] },
  { key: "nutrisi",    label: "Nutrisi",           options: [{ label: "Sangat buruk", score: 1 }, { label: "Kurang", score: 2 }, { label: "Cukup", score: 3 }, { label: "Sangat baik", score: 4 }] },
  { key: "gesekan",    label: "Gesekan & Tekanan", options: [{ label: "Masalah besar", score: 1 }, { label: "Masalah potensial", score: 2 }, { label: "Tidak ada masalah", score: 3 }] },
] as const;

function BradenPanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BRADEN_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const level = !allFilled ? null :
    total <= 9  ? { label: "Risiko Sangat Tinggi", cls: "bg-rose-100 text-rose-800 border-rose-300",    barCls: "bg-rose-600"    } :
    total <= 12 ? { label: "Risiko Tinggi",         cls: "bg-rose-50 text-rose-700 border-rose-200",     barCls: "bg-rose-500"    } :
    total <= 14 ? { label: "Risiko Sedang",          cls: "bg-amber-50 text-amber-700 border-amber-200",  barCls: "bg-amber-500"   } :
    total <= 18 ? { label: "Risiko Ringan",          cls: "bg-sky-50 text-sky-700 border-sky-200",        barCls: "bg-sky-500"     } :
                  { label: "Tidak Berisiko",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" };

  return (
    <div className="flex flex-col gap-2.5">
      {BRADEN_ITEMS.map((item) => (
        <div key={item.key}>
          <Label>{item.label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {item.options.map((opt) => (
              <Pill
                key={opt.score} label={opt.label} score={opt.score}
                selected={scores[item.key] === opt.score}
                onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
              />
            ))}
          </div>
        </div>
      ))}
      <ScoreBar total={total} max={23} allFilled={allFilled} level={level} />
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── 8. BARTHEL INDEX ───────────────────────────────────────────

const BARTHEL_ITEMS = [
  { key: "makan",      label: "Makan",                            options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Butuh bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "mandi",      label: "Mandi",                            options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Mandiri" }] },
  { key: "kebersihan", label: "Kebersihan diri",                  options: [{ s: 0, l: "Butuh bantuan" }, { s: 5, l: "Mandiri" }] },
  { key: "berpakaian", label: "Berpakaian",                       options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Dibantu" }, { s: 10, l: "Mandiri" }] },
  { key: "bak",        label: "BAK",                              options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang" }, { s: 10, l: "Kontinen" }] },
  { key: "bab",        label: "BAB",                              options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang" }, { s: 10, l: "Kontinen" }] },
  { key: "toilet",     label: "Penggunaan toilet",                options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "transfer",   label: "Transfer (kursi ↔ tempat tidur)", options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Bantuan besar" }, { s: 10, l: "Bantuan kecil" }, { s: 15, l: "Mandiri" }] },
  { key: "mobilitas",  label: "Mobilitas berjalan",              options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Kursi roda" }, { s: 10, l: "Dengan bantuan" }, { s: 15, l: "Mandiri" }] },
  { key: "tangga",     label: "Naik tangga",                     options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
] as const;

function BarthelPanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BARTHEL_ITEMS.map((i) => [i.key, null]))
  );

  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);

  const level = !allFilled ? null :
    total <= 20 ? { label: "Ketergantungan Total",  cls: "bg-rose-100 text-rose-800 border-rose-300",    barCls: "bg-rose-600"   } :
    total <= 60 ? { label: "Ketergantungan Berat",  cls: "bg-rose-50 text-rose-700 border-rose-200",     barCls: "bg-rose-500"   } :
    total <= 90 ? { label: "Ketergantungan Sedang", cls: "bg-amber-50 text-amber-700 border-amber-200",  barCls: "bg-amber-500"  } :
    total <= 99 ? { label: "Ketergantungan Ringan", cls: "bg-sky-50 text-sky-700 border-sky-200",        barCls: "bg-sky-400"    } :
                  { label: "Mandiri",               cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" };

  return (
    <div className="flex flex-col gap-3">
      <ScoreBar total={total} max={100} allFilled={allFilled} level={level} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aktivitas</th>
              <th className="w-10 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">Skor</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pilihan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {BARTHEL_ITEMS.map((item) => (
              <tr key={item.key} className="transition-colors hover:bg-slate-50/60">
                <td className="px-3 py-2 font-medium text-slate-700">{item.label}</td>
                <td className="px-2 py-2 text-center">
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                    scores[item.key] !== null
                      ? (scores[item.key] ?? 0) >= 10 ? "bg-emerald-100 text-emerald-700"
                        : (scores[item.key] ?? 0) >= 5 ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-400",
                  )}>
                    {scores[item.key] ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {item.options.map((opt) => (
                      <button
                        key={opt.s} type="button"
                        onClick={() => setScores((p) => ({ ...p, [item.key]: opt.s }))}
                        className={cn(
                          "cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 transition-all",
                          scores[item.key] === opt.s
                            ? "bg-emerald-600 text-white ring-emerald-600"
                            : "bg-white text-slate-500 ring-slate-200 hover:ring-emerald-300 hover:text-emerald-600",
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
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ── Item registry ──────────────────────────────────────────────

type PenilaianDef = {
  id: string; title: string; subtitle: string;
  icon: LucideIcon; content: () => ReactNode;
};

const PENILAIAN_ITEMS: PenilaianDef[] = [
  { id: "fisik",        title: "Penilaian Fisik",      subtitle: "Keadaan umum, kesadaran, status gizi",        icon: Activity,    content: () => <FisikPanel /> },
  { id: "nyeri",        title: "Penilaian Nyeri",      subtitle: "Numeric Rating Scale (NRS) 0–10",             icon: Zap,         content: () => <NyeriPanel /> },
  { id: "status",       title: "Status Klinis",        subtitle: "Kondisi dan tingkat kesadaran pasien",         icon: Stethoscope, content: () => <StatusPanel /> },
  { id: "pediatrik",    title: "Status Pediatrik",     subtitle: "Khusus pasien anak-anak",                     icon: Baby,        content: () => <PediatrikPanel /> },
  { id: "diagnosis",    title: "Penilaian Diagnosis",  subtitle: "Diagnosis kerja, banding, dan komorbid",       icon: BookOpen,    content: () => <DiagnosisPanel /> },
  { id: "risiko_jatuh", title: "Risiko Jatuh",         subtitle: "Morse Fall Scale",                            icon: ShieldAlert, content: () => <MorsePanel /> },
  { id: "dekubitus",    title: "Risiko Dekubitus",     subtitle: "Braden Scale",                                icon: Layers,      content: () => <BradenPanel /> },
  { id: "barthel",      title: "Barthel Index (ADL)",  subtitle: "Penilaian kemandirian aktivitas sehari-hari", icon: BarChart2,   content: () => <BarthelPanel /> },
];

// ── Main ───────────────────────────────────────────────────────

export default function PenilaianTab({ patient }: { patient: IGDPatientDetail }) {
  const [open, setOpen] = useState<string | null>("nyeri");

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <ClipboardCheck size={14} className="text-emerald-500" />
        <span className="text-xs font-semibold text-slate-700">Penilaian Klinis</span>
        <span className="ml-auto text-[11px] text-slate-400">Klik item untuk membuka form penilaian</span>
      </div>

      {PENILAIAN_ITEMS.map((item) => (
        <AccordionItem
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          isOpen={open === item.id}
          onToggle={() => setOpen(open === item.id ? null : item.id)}
        >
          {item.content()}
        </AccordionItem>
      ))}
    </div>
  );
}
