"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Stethoscope, Baby, BookOpen, ShieldAlert,
  Layers, BarChart2, Heart, Microscope, ClipboardCheck,
  FileText, Clock, Calendar, User, type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Styles ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
const textareaCls =
  "w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

// ── Auto-resize textarea ───────────────────────────────────────
function AutoTextarea({
  value, onChange, placeholder, className, minRows = 3,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.max(ref.current.scrollHeight, minRows * 26)}px`;
  }, [value, minRows]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ overflow: "hidden" }}
      className={cn(textareaCls, className)}
    />
  );
}

// ── Shared primitives ──────────────────────────────────────────
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function SectionHead({
  icon: Icon, title, subtitle, iconCls = "text-slate-400",
}: {
  icon: LucideIcon; title: string; subtitle?: string; iconCls?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
      <Icon size={12} className={iconCls} />
      <div>
        <p className="text-xs font-bold text-slate-700">{title}</p>
        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
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
          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600",
      )}
    >
      {score !== undefined && (
        <span className={cn("font-mono text-[10px] font-bold leading-none", selected ? "text-indigo-600" : "text-slate-400")}>
          {score}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

function SaveBtn({ label = "Simpan" }: { label?: string }) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.97]"
    >
      {label}
    </button>
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
            className={cn("h-full rounded-full transition-all duration-500", level?.barCls ?? "bg-indigo-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {level && (
        <span className={cn("shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold", level.cls)}>
          {level.label}
        </span>
      )}
    </div>
  );
}

// ── Previous notes panel ───────────────────────────────────────
type NoteEntry = { date: string; author: string; content: string; tag?: string };

function NoteCard({ note }: { note: NoteEntry }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-xs">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={10} className="text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-500">{note.date}</span>
        </div>
        {note.tag && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-500 ring-1 ring-indigo-100">
            {note.tag}
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-600">{note.content}</p>
      <div className="mt-1.5 flex items-center gap-1">
        <User size={9} className="text-slate-300" />
        <span className="text-[10px] text-slate-400">{note.author}</span>
      </div>
    </div>
  );
}

function HistoryPanel({ title, notes }: { title: string; notes: NoteEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
        <Clock size={11} className="text-indigo-400" />
        <p className="text-[11px] font-semibold text-slate-600">Riwayat {title}</p>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileText size={20} className="text-slate-200" />
          <p className="text-[11px] text-slate-400">Belum ada catatan sebelumnya</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note, i) => <NoteCard key={i} note={note} />)}
        </div>
      )}
    </div>
  );
}

// ── Two-panel layout ───────────────────────────────────────────
function TwoPanel({ form, history }: { form: ReactNode; history: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
      <div className="min-w-0 flex-1">{form}</div>
      <div className="shrink-0 lg:w-68 xl:w-72">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">{history}</div>
      </div>
    </div>
  );
}

// ── Utility ────────────────────────────────────────────────────
const toggleItem = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

// ── 1. FISIK ───────────────────────────────────────────────────
const FISIK_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "KU: Tampak sakit sedang\nKesadaran: Compos mentis, GCS E4V5M6\nStatus gizi: Cukup, BB ~68kg\nMobilitas: Dibantu sebagian",
  },
  {
    date: "28 Jan 2025", author: "dr. Sari Sp.PD", tag: "Poli",
    content: "KU: Baik, tidak tampak sakit\nKesadaran: Compos mentis\nStatus gizi: Baik\nMobilitas: Mandiri",
  },
];

function FisikPanel() {
  const [pemFisik, setPemFisik] = useState("");
  const [form, setForm] = useState({ keadaanUmum: "", kesadaran: "", gizi: "", mobilitas: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div>
            <Label>Pemeriksaan Fisik Umum</Label>
            <AutoTextarea
              value={pemFisik}
              onChange={setPemFisik}
              placeholder="Deskripsikan hasil pemeriksaan fisik secara sistematis (kepala, leher, thoraks, abdomen, ekstremitas)..."
              minRows={4}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["keadaanUmum", "Keadaan Umum",  "Baik / Sedang / Berat"],
              ["kesadaran",   "Kesadaran",     "Compos mentis / Apatis / Somnolen"],
              ["gizi",        "Status Gizi",   "Baik / Kurang / Lebih"],
              ["mobilitas",   "Mobilitas",     "Mandiri / Dibantu / Bedrest"],
            ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="flex justify-end"><SaveBtn label="Simpan Penilaian Fisik" /></div>
        </div>
      }
      history={<HistoryPanel title="Pemeriksaan Fisik" notes={FISIK_NOTES} />}
    />
  );
}

// ── 2. NYERI ───────────────────────────────────────────────────
const NYERI_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "NRS: 7 — Nyeri Berat\nLokasi: Dada kiri menjalar ke lengan kiri\nKarakter: Terjepet, berat\nDurasi: Terus-menerus ±2 jam",
  },
];

function NyeriPanel() {
  const [score, setScore] = useState(0);
  const [lokasi, setLokasi] = useState("");
  const [karakter, setKarakter] = useState("");
  const [durasi, setDurasi] = useState("");
  const [catatan, setCatatan] = useState("");

  const level =
    score === 0 ? { label: "Tidak Nyeri",       cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" } :
    score <= 3  ? { label: "Nyeri Ringan",       cls: "bg-sky-100 text-sky-700 ring-1 ring-sky-200"           } :
    score <= 6  ? { label: "Nyeri Sedang",       cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"     } :
    score <= 9  ? { label: "Nyeri Berat",        cls: "bg-orange-100 text-orange-700 ring-1 ring-orange-200"  } :
                  { label: "Nyeri Sangat Berat", cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200"        };

  return (
    <TwoPanel
      form={
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
              className="mt-2 w-full accent-indigo-600"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["lokasi",   "Lokasi Nyeri",   lokasi,   setLokasi,   "Dada, kepala, perut..."],
              ["karakter", "Karakter Nyeri", karakter, setKarakter, "Tumpul, tajam, terbakar..."],
              ["durasi",   "Durasi",         durasi,   setDurasi,   "Intermiten, terus-menerus..."],
            ] as [string, string, string, (v: string) => void, string][]).map(([key, label, val, setter, ph]) => (
              <div key={key as string}>
                <Label>{label as string}</Label>
                <input value={val as string} onChange={(e) => setter(e.target.value)} placeholder={ph as string} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <Label>Catatan Tambahan</Label>
            <AutoTextarea value={catatan} onChange={setCatatan} placeholder="Faktor pemberat/peringan, karakteristik lain..." minRows={2} />
          </div>
          <div className="flex justify-end"><SaveBtn label="Simpan Penilaian Nyeri" /></div>
        </div>
      }
      history={<HistoryPanel title="Penilaian Nyeri" notes={NYERI_NOTES} />}
    />
  );
}

// ── 3. STATUS KLINIS ───────────────────────────────────────────
const STATUS_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "Status: Tidak Stabil\nKesadaran: Somnolen, GCS E3V4M5\nCatatan: Penurunan kesadaran mendadak saat tiba di IGD",
  },
];

function StatusPanel() {
  const [status, setStatus] = useState("");
  const [kesadaran, setKesadaran] = useState("");
  const [catatan, setCatatan] = useState("");

  const pillCls = (active: boolean) => cn(
    "cursor-pointer rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
    active
      ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600",
  );

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div>
            <Label>Status Klinis</Label>
            <div className="flex flex-wrap gap-1.5">
              {["Stabil", "Tidak Stabil", "Kritis", "Mengancam Jiwa", "Meninggal"].map((opt) => (
                <button key={opt} type="button" onClick={() => setStatus(opt === status ? "" : opt)} className={pillCls(status === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Tingkat Kesadaran</Label>
            <div className="flex flex-wrap gap-1.5">
              {["Compos Mentis", "Apatis", "Somnolen", "Sopor", "Koma"].map((opt) => (
                <button key={opt} type="button" onClick={() => setKesadaran(opt === kesadaran ? "" : opt)} className={pillCls(kesadaran === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Catatan Status Klinis</Label>
            <AutoTextarea value={catatan} onChange={setCatatan} placeholder="Kondisi pasien saat ini, temuan klinis relevan..." minRows={3} />
          </div>
          <div className="flex justify-end"><SaveBtn label="Simpan Status Klinis" /></div>
        </div>
      }
      history={<HistoryPanel title="Status Klinis" notes={STATUS_NOTES} />}
    />
  );
}

// ── 4. PEDIATRIK ───────────────────────────────────────────────
function PediatrikPanel() {
  const [form, setForm] = useState({ beratLahir: "", usiaGestasi: "", imunisasi: "", tumbuhKembang: "" });
  const [catatan, setCatatan] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["beratLahir",    "Berat Lahir",      "Contoh: 3200 gram"],
              ["usiaGestasi",   "Usia Gestasi",     "Contoh: 38 minggu"],
              ["imunisasi",     "Status Imunisasi", "Lengkap / Tidak lengkap"],
              ["tumbuhKembang", "Tumbuh Kembang",   "Sesuai usia / Terlambat"],
            ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <Label>Catatan Pediatrik</Label>
            <AutoTextarea value={catatan} onChange={setCatatan} placeholder="Riwayat tumbuh kembang, kondisi khusus, riwayat terapi..." minRows={3} />
          </div>
          <div className="flex justify-end"><SaveBtn label="Simpan Status Pediatrik" /></div>
        </div>
      }
      history={<HistoryPanel title="Status Pediatrik" notes={[]} />}
    />
  );
}

// ── 5. DIAGNOSIS ───────────────────────────────────────────────
const DIAGNOSIS_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "Dx Utama: NSTEMI (I21.4)\nDx Banding: UAP, Perikarditis akut\nKomorbid: DM Tipe 2, Hipertensi Grade II",
  },
  {
    date: "28 Jan 2025", author: "dr. Sari Sp.PD", tag: "Poli",
    content: "Dx Utama: Hipertensi Grade II terkontrol\nKomorbid: DM Tipe 2 — HbA1c 7.8%",
  },
];

function DiagnosisPanel() {
  const [catatan, setCatatan] = useState("");
  const [banding, setBanding] = useState("");
  const [komorbid, setKomorbid] = useState("");
  const [rencana, setRencana] = useState("");

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div>
            <Label>Catatan Diagnosis Klinis</Label>
            <AutoTextarea
              value={catatan}
              onChange={setCatatan}
              placeholder="Tuliskan diagnosis kerja beserta dasar penegakannya secara lengkap (anamnesis, pemeriksaan fisik, penunjang)..."
              minRows={5}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Diagnosis Banding</Label>
              <input value={banding} onChange={(e) => setBanding(e.target.value)} placeholder="Kemungkinan diagnosis lain..." className={inputCls} />
            </div>
            <div>
              <Label>Komorbid / Penyerta</Label>
              <input value={komorbid} onChange={(e) => setKomorbid(e.target.value)} placeholder="Penyakit / kondisi penyerta..." className={inputCls} />
            </div>
          </div>
          <div>
            <Label>Rencana Tatalaksana</Label>
            <AutoTextarea value={rencana} onChange={setRencana} placeholder="Rencana pemeriksaan lanjutan, terapi, dan tindak lanjut..." minRows={2} />
          </div>
          <div className="flex justify-end"><SaveBtn label="Simpan Penilaian Diagnosis" /></div>
        </div>
      }
      history={<HistoryPanel title="Diagnosis" notes={DIAGNOSIS_NOTES} />}
    />
  );
}

// ── 6. RISIKO JATUH (Morse Fall Scale) ────────────────────────
const JATUH_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "Ns. Rina, S.Kep", tag: "IGD",
    content: "Morse Score: 55 — Risiko Tinggi\nRiwayat jatuh: Ya (tergelincir di kamar mandi)\nAlat bantu: Tidak\nStatus mental: Orientasi baik",
  },
];

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
    total < 25  ? { label: "Risiko Rendah", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" } :
    total <= 50 ? { label: "Risiko Sedang", cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   } :
                  { label: "Risiko Tinggi", cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    };

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-2.5">
          {MORSE_ITEMS.map((item) => (
            <div key={item.key}>
              <Label>{item.label}</Label>
              <div className="flex flex-wrap gap-1.5">
                {item.options.map((opt) => (
                  <Pill key={opt.score} label={opt.label} score={opt.score}
                    selected={scores[item.key] === opt.score}
                    onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
                  />
                ))}
              </div>
            </div>
          ))}
          <ScoreBar total={total} max={125} allFilled={allFilled} level={level} />
          <div className="flex justify-end"><SaveBtn label="Simpan Risiko Jatuh" /></div>
        </div>
      }
      history={<HistoryPanel title="Risiko Jatuh" notes={JATUH_NOTES} />}
    />
  );
}

// ── 7. DEKUBITUS (Braden Scale) ───────────────────────────────
const BRADEN_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "Ns. Rina, S.Kep", tag: "IGD",
    content: "Braden Score: 14 — Risiko Sedang\nPersepsi: Agak terbatas\nKelembaban: Kadang basah\nNutrisi: Cukup",
  },
];

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
    total <= 9  ? { label: "Risiko Sangat Tinggi", cls: "bg-rose-100 text-rose-800 border-rose-300",         barCls: "bg-rose-600"    } :
    total <= 12 ? { label: "Risiko Tinggi",         cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    } :
    total <= 14 ? { label: "Risiko Sedang",          cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   } :
    total <= 18 ? { label: "Risiko Ringan",          cls: "bg-sky-50 text-sky-700 border-sky-200",             barCls: "bg-sky-500"     } :
                  { label: "Tidak Berisiko",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" };

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-2.5">
          {BRADEN_ITEMS.map((item) => (
            <div key={item.key}>
              <Label>{item.label}</Label>
              <div className="flex flex-wrap gap-1.5">
                {item.options.map((opt) => (
                  <Pill key={opt.score} label={opt.label} score={opt.score}
                    selected={scores[item.key] === opt.score}
                    onClick={() => setScores((p) => ({ ...p, [item.key]: opt.score }))}
                  />
                ))}
              </div>
            </div>
          ))}
          <ScoreBar total={total} max={23} allFilled={allFilled} level={level} />
          <div className="flex justify-end"><SaveBtn label="Simpan Risiko Dekubitus" /></div>
        </div>
      }
      history={<HistoryPanel title="Risiko Dekubitus" notes={BRADEN_NOTES} />}
    />
  );
}

// ── 8. BARTHEL INDEX ──────────────────────────────────────────
const BARTHEL_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "Ns. Rina, S.Kep", tag: "IGD",
    content: "Barthel Score: 75 — Ketergantungan Sedang\nMakan: Butuh bantuan\nTransfer: Bantuan kecil\nMobilitas: Dengan bantuan",
  },
];

const BARTHEL_ITEMS = [
  { key: "makan",      label: "Makan",                           options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Butuh bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "mandi",      label: "Mandi",                           options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Mandiri" }] },
  { key: "kebersihan", label: "Kebersihan diri",                 options: [{ s: 0, l: "Butuh bantuan" }, { s: 5, l: "Mandiri" }] },
  { key: "berpakaian", label: "Berpakaian",                      options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Dibantu" }, { s: 10, l: "Mandiri" }] },
  { key: "bak",        label: "BAK",                             options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang" }, { s: 10, l: "Kontinen" }] },
  { key: "bab",        label: "BAB",                             options: [{ s: 0, l: "Inkontinensia" }, { s: 5, l: "Kadang" }, { s: 10, l: "Kontinen" }] },
  { key: "toilet",     label: "Penggunaan toilet",               options: [{ s: 0, l: "Tergantung" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
  { key: "transfer",   label: "Transfer (kursi ↔ tempat tidur)",options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Bantuan besar" }, { s: 10, l: "Bantuan kecil" }, { s: 15, l: "Mandiri" }] },
  { key: "mobilitas",  label: "Mobilitas berjalan",             options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Kursi roda" }, { s: 10, l: "Dengan bantuan" }, { s: 15, l: "Mandiri" }] },
  { key: "tangga",     label: "Naik tangga",                    options: [{ s: 0, l: "Tidak bisa" }, { s: 5, l: "Perlu bantuan" }, { s: 10, l: "Mandiri" }] },
] as const;

function BarthelPanel() {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BARTHEL_ITEMS.map((i) => [i.key, null]))
  );
  const total = Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0);
  const allFilled = Object.values(scores).every((v) => v !== null);
  const level = !allFilled ? null :
    total <= 20 ? { label: "Ketergantungan Total",  cls: "bg-rose-100 text-rose-800 border-rose-300",         barCls: "bg-rose-600"    } :
    total <= 60 ? { label: "Ketergantungan Berat",  cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    } :
    total <= 90 ? { label: "Ketergantungan Sedang", cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   } :
    total <= 99 ? { label: "Ketergantungan Ringan", cls: "bg-sky-50 text-sky-700 border-sky-200",             barCls: "bg-sky-400"     } :
                  { label: "Mandiri",               cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" };

  return (
    <TwoPanel
      form={
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
                          <button key={opt.s} type="button"
                            onClick={() => setScores((p) => ({ ...p, [item.key]: opt.s }))}
                            className={cn(
                              "cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 transition-all",
                              scores[item.key] === opt.s
                                ? "bg-indigo-600 text-white ring-indigo-600"
                                : "bg-white text-slate-500 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-600",
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
          <div className="flex justify-end"><SaveBtn label="Simpan Barthel Index" /></div>
        </div>
      }
      history={<HistoryPanel title="Barthel Index" notes={BARTHEL_NOTES} />}
    />
  );
}

// ── 9. JANTUNG ────────────────────────────────────────────────
const JANTUNG_NOTES: NoteEntry[] = [
  {
    date: "28 Jan 2025", author: "dr. Budi Sp.JP", tag: "Poli Jantung",
    content: "Dx: CHF NYHA III, HHD\nEF: 35% (ekokardiografi Jan 2025)\nEKG: Sinus ritme, LVH\nRiwayat PCI LAD 2022\nObat: Bisoprolol 5mg, Ramipril 5mg, Furosemide 40mg",
  },
];

const FAKTOR_RISIKO_OPTS = ["Hipertensi", "Diabetes Melitus", "Dislipidemia", "Merokok", "Obesitas", "Riwayat Keluarga", "Gagal Ginjal Kronik", "Sindrom Metabolik"];
const EKG_OPTS = ["Normal Sinus Ritme", "ST Elevasi", "ST Depresi", "T Inversi", "LBBB", "RBBB", "Atrial Fibrilasi", "VT / VF", "Blok AV", "LVH"];
const KILLIP_ITEMS = [
  { k: "I",   title: "Killip I",   desc: "Tidak ada tanda gagal jantung, tidak ada ronkhi, tidak ada S3" },
  { k: "II",  title: "Killip II",  desc: "Gagal jantung ringan — ronkhi <50% lapang paru, S3 gallop" },
  { k: "III", title: "Killip III", desc: "Edema paru — ronkhi >50% lapang paru" },
  { k: "IV",  title: "Killip IV",  desc: "Syok kardiogenik — TD <90 mmHg, tanda hipoperfusi" },
];
const NYHA_ITEMS = [
  { k: "I",   desc: "Tidak ada gejala saat aktivitas fisik biasa" },
  { k: "II",  desc: "Gejala ringan saat aktivitas sedang, nyaman saat istirahat" },
  { k: "III", desc: "Gejala saat aktivitas ringan, nyaman hanya saat istirahat" },
  { k: "IV",  desc: "Gejala saat istirahat, tidak dapat melakukan aktivitas apapun" },
];
const TIMI_ITEMS = [
  { key: "usia65",     label: "Usia ≥ 65 tahun" },
  { key: "faktor3",   label: "≥ 3 faktor risiko CAD" },
  { key: "stenosis",  label: "Stenosis arteri koroner ≥ 50%" },
  { key: "stDeviasi", label: "Deviasi segmen ST pada EKG" },
  { key: "angina2",   label: "≥ 2 episode angina dalam 24 jam" },
  { key: "aspirin",   label: "Pemakaian aspirin dalam 7 hari terakhir" },
  { key: "biomarker", label: "Peningkatan biomarker jantung (Troponin / CK-MB)" },
] as const;

function JantungPanel() {
  const [background, setBackground] = useState("");
  const [faktorRisiko, setFaktorRisiko] = useState<string[]>([]);
  const [keluhan, setKeluhan] = useState("");
  const [ekg, setEkg] = useState<string[]>([]);
  const [troponin, setTroponin] = useState("");
  const [ckmb, setCkmb] = useState("");
  const [bnp, setBnp] = useState("");
  const [killip, setKillip] = useState("");
  const [temuanPerawatan, setTemuanPerawatan] = useState("");
  const [komplikasi, setKomplikasi] = useState("");
  const [tatalaksana, setTatalaksana] = useState("");
  const [nyha, setNyha] = useState("");
  const [timiScores, setTimiScores] = useState<Record<string, boolean>>(
    Object.fromEntries(TIMI_ITEMS.map((i) => [i.key, false]))
  );
  const [kesimpulan, setKesimpulan] = useState("");

  const timiTotal = Object.values(timiScores).filter(Boolean).length;
  const timiLevel =
    timiTotal <= 2 ? { label: "Risiko Rendah", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", barCls: "bg-emerald-500" } :
    timiTotal <= 4 ? { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200",       barCls: "bg-amber-500"   } :
                    { label: "Risiko Tinggi",   cls: "bg-rose-50 text-rose-700 border-rose-200",          barCls: "bg-rose-500"    };

  const tagPill = (active: boolean, scheme: "rose" | "sky" | "indigo") => {
    const m = {
      rose:   "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      sky:    "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200",
      indigo: "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    };
    return cn(
      "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
      active ? m[scheme] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
    );
  };

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-5">
          {/* Background */}
          <div>
            <SectionHead icon={Heart} title="Background" subtitle="Riwayat kondisi jantung sebelumnya" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Riwayat Penyakit Jantung</Label>
                <AutoTextarea value={background} onChange={setBackground}
                  placeholder="Riwayat CAD, CHF, aritmia, prosedur kardiovaskular (PCI, CABG, pemasangan alat)..." minRows={3} />
              </div>
              <div>
                <Label>Faktor Risiko Kardiovaskular</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FAKTOR_RISIKO_OPTS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setFaktorRisiko((a) => toggleItem(a, opt))}
                      className={tagPill(faktorRisiko.includes(opt), "rose")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Finding at Time of Admission */}
          <div>
            <SectionHead icon={Heart} title="Finding at Time of Admission" subtitle="Temuan klinis saat pasien masuk IGD" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Keluhan Utama & Anamnesis</Label>
                <AutoTextarea value={keluhan} onChange={setKeluhan}
                  placeholder="Keluhan utama, onset, karakter, lokasi, faktor pencetus dan pengurang, gejala penyerta..." minRows={3} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ["Troponin I / T", troponin, setTroponin, "ng/L"],
                  ["CK-MB",          ckmb,     setCkmb,     "IU/L"],
                  ["BNP / NT-proBNP", bnp,     setBnp,      "pg/mL"],
                ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <input value={val} onChange={(e) => setter(e.target.value)} placeholder={ph} className={inputCls} />
                  </div>
                ))}
              </div>
              <div>
                <Label>Temuan EKG</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EKG_OPTS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setEkg((a) => toggleItem(a, opt))}
                      className={tagPill(ekg.includes(opt), "sky")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Killip Classification (Acute MI)</Label>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {KILLIP_ITEMS.map((opt) => (
                    <button key={opt.k} type="button"
                      onClick={() => setKillip(killip === opt.k ? "" : opt.k)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all",
                        killip === opt.k
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50/30",
                      )}
                    >
                      <span className="text-[11px] font-bold">{opt.title}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Findings During Hospital Stay */}
          <div>
            <SectionHead icon={Heart} title="Findings During Hospital Stay" subtitle="Perkembangan dan temuan selama perawatan" iconCls="text-rose-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Perkembangan Klinis</Label>
                <AutoTextarea value={temuanPerawatan} onChange={setTemuanPerawatan}
                  placeholder="Kondisi hemodinamik, respons tatalaksana, perubahan temuan klinis dari hari ke hari..." minRows={3} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Komplikasi</Label>
                  <AutoTextarea value={komplikasi} onChange={setKomplikasi}
                    placeholder="Komplikasi yang muncul selama perawatan..." minRows={2} />
                </div>
                <div>
                  <Label>Tatalaksana Utama</Label>
                  <AutoTextarea value={tatalaksana} onChange={setTatalaksana}
                    placeholder="Intervensi, prosedur, dan obat utama yang diberikan..." minRows={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Scoring */}
          <div>
            <SectionHead icon={Heart} title="Klasifikasi & Skoring" subtitle="NYHA · TIMI Risk Score" iconCls="text-rose-400" />
            <div className="flex flex-col gap-4">
              <div>
                <Label>NYHA Heart Failure Classification</Label>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {NYHA_ITEMS.map((opt) => (
                    <button key={opt.k} type="button"
                      onClick={() => setNyha(nyha === opt.k ? "" : opt.k)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                        nyha === opt.k
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/20",
                      )}
                    >
                      <span className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        nyha === opt.k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
                      )}>
                        {opt.k}
                      </span>
                      <span className="text-[11px]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>TIMI Risk Score (NSTEMI / UA)</Label>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", timiLevel.cls)}>
                    {timiTotal}/7 — {timiLevel.label}
                  </span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {TIMI_ITEMS.map((item) => (
                    <button key={item.key} type="button"
                      onClick={() => setTimiScores((p) => ({ ...p, [item.key]: !p[item.key] }))}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] text-left transition-all",
                        timiScores[item.key]
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200",
                      )}
                    >
                      <span className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] font-bold",
                        timiScores[item.key] ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white",
                      )}>
                        {timiScores[item.key] && "✓"}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <ScoreBar total={timiTotal} max={7} allFilled={true} level={timiLevel} />
                </div>
              </div>

              <div>
                <Label>Kesimpulan Klinis Jantung</Label>
                <AutoTextarea value={kesimpulan} onChange={setKesimpulan}
                  placeholder="Kesimpulan penilaian kardiovaskular dan rekomendasi tatalaksana..." minRows={2} />
              </div>
            </div>
          </div>

          <div className="flex justify-end"><SaveBtn label="Simpan Penilaian Jantung" /></div>
        </div>
      }
      history={<HistoryPanel title="Kardiovaskular" notes={JANTUNG_NOTES} />}
    />
  );
}

// ── 10. KANKER ───────────────────────────────────────────────
const HISTOLOGI_OPTS = ["Karsinoma", "Adenokarsinoma", "Karsinoma Sel Skuamosa", "Sarkoma", "Limfoma", "Leukemia", "Melanoma", "Sel Kecil", "Karsinoid", "Lainnya"];
const LATERALITAS_OPTS = ["Kanan", "Kiri", "Bilateral", "Garis Tengah", "Tidak Aplikabel"];
const GRADE_OPTS = [
  { k: "GX", desc: "Grade tidak dapat dinilai" },
  { k: "G1", desc: "Berdiferensiasi baik (Low grade)" },
  { k: "G2", desc: "Berdiferensiasi sedang (Intermediate)" },
  { k: "G3", desc: "Berdiferensiasi buruk (High grade)" },
];
const T_OPTS = ["TX", "T0", "Tis", "T1", "T1a", "T1b", "T2", "T2a", "T2b", "T3", "T4", "T4a", "T4b"];
const N_OPTS = ["NX", "N0", "N1", "N1a", "N1b", "N2", "N2a", "N2b", "N3"];
const M_OPTS = ["MX", "M0", "M1", "M1a", "M1b", "M1c"];
const STADIUM_OPTS = ["0", "I", "IA", "IB", "IC", "II", "IIA", "IIB", "IIC", "III", "IIIA", "IIIB", "IIIC", "IV", "IVA", "IVB"];
const METASTASIS_LOKASI = ["Paru", "Hati", "Tulang", "Otak", "KGB Regional", "KGB Jauh", "Ginjal", "Adrenal", "Peritoneum", "Pleura", "Lainnya"];
const ECOG_ITEMS = [
  { k: "0", title: "0 — Aktif penuh",              desc: "Dapat melakukan semua aktivitas tanpa hambatan" },
  { k: "1", title: "1 — Terbatas aktivitas berat",  desc: "Ambulatori, dapat melakukan pekerjaan ringan-sedang" },
  { k: "2", title: "2 — Ambulatori, tidak bekerja", desc: "Ambulatori >50% waktu bangun, tidak dapat bekerja" },
  { k: "3", title: "3 — Perawatan diri terbatas",   desc: "Mampu merawat diri, >50% waktu di tempat tidur" },
  { k: "4", title: "4 — Tidak dapat merawat diri",  desc: "Seluruhnya di tempat tidur atau kursi roda" },
];

function KankerPanel() {
  const [jenisTumor, setJenisTumor] = useState("");
  const [lokasiPrimer, setLokasiPrimer] = useState("");
  const [histologi, setHistologi] = useState<string[]>([]);
  const [lateralitas, setLateralitas] = useState("");
  const [grade, setGrade] = useState("");
  const [tStage, setTStage] = useState("");
  const [nStage, setNStage] = useState("");
  const [mStage, setMStage] = useState("");
  const [stadium, setStadium] = useState("");
  const [perluasan, setPerluasan] = useState("");
  const [metastasisStatus, setMetastasisStatus] = useState("");
  const [metastasisLokasi, setMetastasisLokasi] = useState<string[]>([]);
  const [metastasisCatatan, setMetastasisCatatan] = useState("");
  const [ecog, setEcog] = useState("");

  const tnmDisplay = [tStage, nStage, mStage].filter(Boolean).join(" ");

  const tnmBtnCls = (active: boolean, scheme: "indigo" | "sky" | "rose") => {
    const m = {
      indigo: "border-indigo-500 bg-indigo-600 text-white",
      sky:    "border-sky-500 bg-sky-600 text-white",
      rose:   "border-rose-500 bg-rose-600 text-white",
    };
    return cn(
      "rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold transition-all",
      active ? m[scheme] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
    );
  };

  const stadiumColor = (opt: string, active: boolean) => {
    if (!active) return "border-slate-200 bg-white text-slate-500 hover:border-slate-300";
    if (opt === "IV" || opt.startsWith("IV")) return "border-rose-500 bg-rose-600 text-white";
    if (opt.startsWith("III")) return "border-orange-500 bg-orange-500 text-white";
    if (opt.startsWith("II")) return "border-amber-500 bg-amber-500 text-white";
    return "border-sky-500 bg-sky-500 text-white";
  };

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-5">
          {/* Literasi Tumor */}
          <div>
            <SectionHead icon={Microscope} title="Literasi Tumor" iconCls="text-violet-400" />
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Jenis / Nama Tumor</Label>
                  <input value={jenisTumor} onChange={(e) => setJenisTumor(e.target.value)}
                    placeholder="Ca. Mammae, Ca. Paru, Ca. Kolorektal..." className={inputCls} />
                </div>
                <div>
                  <Label>Lokasi Primer</Label>
                  <input value={lokasiPrimer} onChange={(e) => setLokasiPrimer(e.target.value)}
                    placeholder="Payudara kiri, paru kanan, kolon sigmoid..." className={inputCls} />
                </div>
              </div>
              <div>
                <Label>Histologi / Morfologi</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HISTOLOGI_OPTS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setHistologi((a) => toggleItem(a, opt))}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                        histologi.includes(opt)
                          ? "border-violet-400 bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Lateralitas</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LATERALITAS_OPTS.map((opt) => (
                      <button key={opt} type="button"
                        onClick={() => setLateralitas(lateralitas === opt ? "" : opt)}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                          lateralitas === opt
                            ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                            : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Grade Histologi</Label>
                  <div className="flex flex-col gap-1.5">
                    {GRADE_OPTS.map((g) => (
                      <button key={g.k} type="button"
                        onClick={() => setGrade(grade === g.k ? "" : g.k)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all",
                          grade === g.k
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-amber-200",
                        )}
                      >
                        <span className={cn(
                          "flex h-5 w-7 shrink-0 items-center justify-center rounded text-[9px] font-bold",
                          grade === g.k ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500",
                        )}>
                          {g.k}
                        </span>
                        <span>{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TNM */}
          <div>
            <SectionHead icon={Microscope} title="TNM Klinis" subtitle="Berdasarkan AJCC/UICC TNM Classification" iconCls="text-violet-400" />
            {tnmDisplay && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5">
                <span className="text-[10px] font-semibold text-indigo-500">TNM:</span>
                <span className="font-mono text-xs font-bold text-indigo-800">{tnmDisplay}</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div>
                <Label>T — Tumor Primer</Label>
                <div className="flex flex-wrap gap-1">
                  {T_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setTStage(tStage === opt ? "" : opt)} className={tnmBtnCls(tStage === opt, "indigo")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>N — Kelenjar Getah Bening Regional</Label>
                <div className="flex flex-wrap gap-1">
                  {N_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setNStage(nStage === opt ? "" : opt)} className={tnmBtnCls(nStage === opt, "sky")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>M — Metastasis Jauh</Label>
                <div className="flex flex-wrap gap-1">
                  {M_OPTS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setMStage(mStage === opt ? "" : opt)} className={tnmBtnCls(mStage === opt, "rose")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stadium */}
          <div>
            <SectionHead icon={Microscope} title="Stadium" iconCls="text-violet-400" />
            <div className="flex flex-wrap gap-1.5">
              {STADIUM_OPTS.map((opt) => (
                <button key={opt} type="button"
                  onClick={() => setStadium(stadium === opt ? "" : opt)}
                  className={cn("rounded-md border px-2.5 py-1 text-[11px] font-bold transition-all", stadiumColor(opt, stadium === opt))}
                >
                  {opt}
                </button>
              ))}
            </div>
            {stadium && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                Stadium terpilih: <span className="font-bold text-slate-800">Stadium {stadium}</span>
              </div>
            )}
          </div>

          {/* Perluasan Tumor */}
          <div>
            <SectionHead icon={Microscope} title="Perluasan Tumor Sebelum Terapi" iconCls="text-violet-400" />
            <AutoTextarea value={perluasan} onChange={setPerluasan}
              placeholder="Ukuran tumor, ekstensi lokal, infiltrasi ke jaringan sekitar, keterlibatan pembuluh darah/saraf/organ tetangga..." minRows={3} />
          </div>

          {/* Metastasis */}
          <div>
            <SectionHead icon={Microscope} title="Metastasis" iconCls="text-violet-400" />
            <div className="flex flex-col gap-3">
              <div>
                <Label>Status Metastasis</Label>
                <AutoTextarea value={metastasisStatus} onChange={setMetastasisStatus}
                  placeholder="Deskripsi klinis status metastasis berdasarkan pemeriksaan dan pencitraan..." minRows={2} />
              </div>
              <div>
                <Label>Lokasi Metastasis</Label>
                <div className="flex flex-wrap gap-1.5">
                  {METASTASIS_LOKASI.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setMetastasisLokasi((a) => toggleItem(a, opt))}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                        metastasisLokasi.includes(opt)
                          ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Catatan Metastasis</Label>
                <AutoTextarea value={metastasisCatatan} onChange={setMetastasisCatatan}
                  placeholder="Detail lokasi, ukuran, dan karakteristik metastasis..." minRows={2} />
              </div>
            </div>
          </div>

          {/* ECOG */}
          <div>
            <SectionHead icon={Microscope} title="ECOG Performance Status" iconCls="text-violet-400" />
            <div className="flex flex-col gap-1.5">
              {ECOG_ITEMS.map((opt) => (
                <button key={opt.k} type="button"
                  onClick={() => setEcog(ecog === opt.k ? "" : opt.k)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
                    ecog === opt.k
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-100 hover:bg-indigo-50/20",
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    ecog === opt.k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
                  )}>
                    {opt.k}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold">{opt.title}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end"><SaveBtn label="Simpan Penilaian Kanker" /></div>
        </div>
      }
      history={<HistoryPanel title="Onkologi" notes={[]} />}
    />
  );
}

// ── Tab registry ───────────────────────────────────────────────
type TabDef = { id: string; short: string; title: string; icon: LucideIcon; content: () => ReactNode };

const TABS: TabDef[] = [
  { id: "fisik",     short: "Fisik",       title: "Penilaian Fisik",      icon: Activity,    content: () => <FisikPanel /> },
  { id: "nyeri",     short: "Nyeri",       title: "Penilaian Nyeri",      icon: Zap,         content: () => <NyeriPanel /> },
  { id: "status",    short: "Status",      title: "Status Klinis",        icon: Stethoscope, content: () => <StatusPanel /> },
  { id: "pediatrik", short: "Pediatrik",   title: "Status Pediatrik",     icon: Baby,        content: () => <PediatrikPanel /> },
  { id: "diagnosis", short: "Diagnosis",   title: "Penilaian Diagnosis",  icon: BookOpen,    content: () => <DiagnosisPanel /> },
  { id: "jatuh",     short: "Risiko Jatuh",title: "Risiko Jatuh",         icon: ShieldAlert, content: () => <MorsePanel /> },
  { id: "dekubitus", short: "Dekubitus",   title: "Risiko Dekubitus",     icon: Layers,      content: () => <BradenPanel /> },
  { id: "barthel",   short: "Barthel",     title: "Barthel Index (ADL)",  icon: BarChart2,   content: () => <BarthelPanel /> },
  { id: "jantung",   short: "Jantung",     title: "Penilaian Jantung",    icon: Heart,       content: () => <JantungPanel /> },
  { id: "kanker",    short: "Kanker",      title: "Penilaian Kanker",     icon: Microscope,  content: () => <KankerPanel /> },
];

// ── Main ───────────────────────────────────────────────────────
export default function PenilaianTab({ patient: _patient }: { patient: IGDPatientDetail }) {
  const [activeId, setActiveId] = useState("fisik");
  const tabBarRef = useRef<HTMLDivElement>(null);
  const activeTab = TABS.find((t) => t.id === activeId) ?? TABS[0];

  useEffect(() => {
    const el = tabBarRef.current?.querySelector(`[data-tabid="${activeId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <ClipboardCheck size={14} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">Penilaian Klinis</span>
        <span className="ml-auto text-[11px] text-slate-400">{activeTab.title}</span>
      </div>

      {/* Scrollable tab bar */}
      <div
        ref={tabBarRef}
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              data-tabid={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              <Icon size={11} />
              <span>{tab.short}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
        >
          {activeTab.content()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
