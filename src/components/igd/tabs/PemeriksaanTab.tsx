"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, HeartPulse, ScanLine, FlaskConical,
  Plus, Trash2, Upload, CheckSquare, Square,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type SubTab = "vital" | "fisik" | "anatomi" | "penunjang";

interface HasilEntry {
  id: string;
  jenis: string;
  nama: string;
  nilai: string;
  satuan: string;
  normal: string;
  tanggal: string;
}

// ── Sub-tab config ─────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string; Icon: React.ElementType }[] = [
  { id: "vital",    label: "Tanda Vital",  Icon: HeartPulse  },
  { id: "fisik",    label: "Fisik",        Icon: Activity    },
  { id: "anatomi",  label: "Anatomi",      Icon: ScanLine    },
  { id: "penunjang",label: "Penunjang",    Icon: FlaskConical},
];

// ── Shared components ──────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function AutoTextarea({
  value, onChange, placeholder, className, minRows = 2,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.max(ref.current.scrollHeight, minRows * 22)}px`;
  }, [value, minRows]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      style={{ overflow: "hidden", resize: "none" }}
      className={className}
    />
  );
}

function VitalInput({
  label, value, onChange, unit, min, max, status,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; min?: number; max?: number;
  status?: "normal" | "warning" | "danger";
}) {
  const statusColor = {
    normal:  "border-l-emerald-400 bg-emerald-50/30",
    warning: "border-l-amber-400 bg-amber-50/30",
    danger:  "border-l-rose-400 bg-rose-50/30",
    undefined: "border-l-slate-200",
  }[status ?? "undefined"];

  return (
    <div className={cn("rounded-md border-l-2 px-3 py-2", statusColor, !status && "bg-white border border-slate-200 border-l-indigo-300")}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder="—"
          className="w-full bg-transparent text-base font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:text-sm"
        />
        {unit && <span className="shrink-0 text-[11px] text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

// ── TANDA VITAL pane ───────────────────────────────────────

function TandaVitalPane({ patient }: { patient: IGDPatientDetail }) {
  const vs = patient.vitalSigns;
  const [form, setForm] = useState({
    tdSis:  String(vs.tdSistolik),
    tdDia:  String(vs.tdDiastolik),
    nadi:   String(vs.nadi),
    suhu:   String(vs.suhu),
    rr:     String(vs.respirasi),
    spo2:   String(vs.spo2),
    gcse:   String(vs.gcsEye),
    gcsv:   String(vs.gcsVerbal),
    gcsm:   String(vs.gcsMotor),
    nyeri:  String(vs.skalaNyeri),
    bb:     String(vs.beratBadan),
    tb:     String(vs.tinggiBadan),
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const gcsTotal = (Number(form.gcse) || 0) + (Number(form.gcsv) || 0) + (Number(form.gcsm) || 0);

  function tdStatus(): "normal" | "warning" | "danger" | undefined {
    const s = Number(form.tdSis); const d = Number(form.tdDia);
    if (!s) return undefined;
    if (s < 90 || s > 180 || d < 60 || d > 120) return "danger";
    if (s > 140 || d > 90) return "warning";
    return "normal";
  }

  function nadiStatus(): "normal" | "warning" | "danger" | undefined {
    const n = Number(form.nadi);
    if (!n) return undefined;
    if (n < 50 || n > 130) return "danger";
    if (n > 100) return "warning";
    return "normal";
  }

  function spo2Status(): "normal" | "warning" | "danger" | undefined {
    const s = Number(form.spo2);
    if (!s) return undefined;
    if (s < 90) return "danger";
    if (s < 95) return "warning";
    return "normal";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hemodinamik */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Hemodinamik</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <div className={cn(
            "rounded-md border-l-2 px-3 py-2",
            tdStatus() === "danger"  ? "border-l-rose-400 bg-rose-50/30" :
            tdStatus() === "warning" ? "border-l-amber-400 bg-amber-50/30" :
            tdStatus() === "normal"  ? "border-l-emerald-400 bg-emerald-50/30" :
            "border-l-indigo-300 border border-slate-200 bg-white",
          )}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tekanan Darah</p>
            <div className="flex items-baseline gap-0.5">
              <input type="number" value={form.tdSis} onChange={(e) => set("tdSis", e.target.value)}
                placeholder="—" className="w-10 bg-transparent text-base font-bold text-slate-800 outline-none placeholder:text-slate-300" />
              <span className="text-slate-400">/</span>
              <input type="number" value={form.tdDia} onChange={(e) => set("tdDia", e.target.value)}
                placeholder="—" className="w-10 bg-transparent text-base font-bold text-slate-800 outline-none placeholder:text-slate-300" />
              <span className="ml-1 shrink-0 text-[11px] text-slate-400">mmHg</span>
            </div>
          </div>

          <VitalInput label="Nadi" value={form.nadi} onChange={(v) => set("nadi", v)}
            unit="×/mnt" min={0} max={300} status={nadiStatus()} />
          <VitalInput label="SpO₂" value={form.spo2} onChange={(v) => set("spo2", v)}
            unit="%" min={0} max={100} status={spo2Status()} />
          <VitalInput label="Suhu" value={form.suhu} onChange={(v) => set("suhu", v)}
            unit="°C" min={30} max={45} />
          <VitalInput label="Laju Napas (RR)" value={form.rr} onChange={(v) => set("rr", v)}
            unit="×/mnt" min={0} max={60} />
        </div>
      </div>

      {/* GCS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">GCS (Glasgow Coma Scale)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <VitalInput label="Eye (E)" value={form.gcse} onChange={(v) => set("gcse", v)} min={1} max={4} />
          <VitalInput label="Verbal (V)" value={form.gcsv} onChange={(v) => set("gcsv", v)} min={1} max={5} />
          <VitalInput label="Motor (M)" value={form.gcsm} onChange={(v) => set("gcsm", v)} min={1} max={6} />
          <div className={cn(
            "rounded-md border-l-2 px-3 py-2",
            gcsTotal >= 14 ? "border-l-emerald-400 bg-emerald-50/30" :
            gcsTotal >= 9  ? "border-l-amber-400 bg-amber-50/30" :
            gcsTotal >= 1  ? "border-l-rose-400 bg-rose-50/30" :
            "border-l-slate-200 bg-slate-50",
          )}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total GCS</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800">{gcsTotal || "—"}</span>
              <span className="text-[11px] text-slate-400">/ 15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skala nyeri + antropometri */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Skala Nyeri (NRS)</p>
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={10} step={1}
              value={form.nyeri}
              onChange={(e) => set("nyeri", e.target.value)}
              className="flex-1 accent-indigo-600"
            />
            <span className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              Number(form.nyeri) === 0    ? "bg-emerald-100 text-emerald-700" :
              Number(form.nyeri) <= 3     ? "bg-sky-100 text-sky-700" :
              Number(form.nyeri) <= 6     ? "bg-amber-100 text-amber-700" :
              "bg-rose-100 text-rose-700",
            )}>
              {form.nyeri}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            <span>Tidak nyeri</span>
            <span>Sangat berat</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Antropometri</p>
          <div className="grid grid-cols-2 gap-2">
            <VitalInput label="Berat Badan" value={form.bb} onChange={(v) => set("bb", v)} unit="kg" />
            <VitalInput label="Tinggi Badan" value={form.tb} onChange={(v) => set("tb", v)} unit="cm" />
          </div>
          {form.bb && form.tb && Number(form.tb) > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              BMI:{" "}
              <span className="font-bold text-slate-800">
                {(Number(form.bb) / Math.pow(Number(form.tb) / 100, 2)).toFixed(1)}
              </span>{" "}
              kg/m²
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700">
          Simpan Tanda Vital
        </button>
      </div>
    </div>
  );
}

// ── FISIK pane ─────────────────────────────────────────────

const FISIK_CHECKS: { id: string; label: string }[] = [
  { id: "nyeri_tekan",    label: "Nyeri tekan"        },
  { id: "hepatomegali",   label: "Hepatomegali"       },
  { id: "splenomegali",   label: "Splenomegali"       },
  { id: "edema",          label: "Edema ekstremitas"  },
  { id: "sianosis",       label: "Sianosis"           },
  { id: "ikterus",        label: "Ikterus"            },
  { id: "ronkhi",         label: "Ronkhi"             },
  { id: "wheezing",       label: "Wheezing"           },
  { id: "distensi_vena",  label: "Distensi vena jugular" },
  { id: "refleks_pupil",  label: "Refleks pupil normal"  },
];

const SISTEM_FIELDS = [
  { key: "kepalaLeher",  label: "Kepala & Leher"  },
  { key: "kardio",       label: "Kardiovaskuler"  },
  { key: "respirasi",    label: "Respirasi"       },
  { key: "abdomen",      label: "Abdomen"         },
  { key: "ekstremitas",  label: "Ekstremitas"     },
  { key: "neurologi",    label: "Neurologi"       },
] as const;

function FisikPane() {
  const [keadaanUmum, setKeadaanUmum] = useState("");
  const [sistem, setSistem] = useState<Record<string, string>>(
    Object.fromEntries(SISTEM_FIELDS.map((f) => [f.key, ""]))
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [catatan, setCatatan] = useState("");

  function toggleCheck(id: string) {
    setChecked((p) => {
      const next = new Set(p);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Keadaan umum */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Keadaan Umum</p>
        <AutoTextarea
          value={keadaanUmum}
          onChange={setKeadaanUmum}
          placeholder="Tampak sakit sedang/berat, kesadaran compos mentis..."
          minRows={2}
          className="w-full border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
      </div>

      {/* Pemeriksaan per sistem */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Pemeriksaan Per Sistem</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {SISTEM_FIELDS.map(({ key, label }) => (
            <div key={key} className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <textarea
                rows={2}
                value={sistem[key]}
                onChange={(e) => setSistem((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="—"
                className="w-full resize-none bg-transparent text-xs text-slate-700 placeholder:text-slate-300 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Temuan fisik */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Temuan Fisik</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
          {FISIK_CHECKS.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                  isChecked
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {isChecked
                  ? <CheckSquare size={12} className="shrink-0 text-indigo-500" />
                  : <Square size={12} className="shrink-0 text-slate-300" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catatan tambahan */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Catatan Tambahan</p>
        <textarea
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Temuan lain yang perlu dicatat..."
          className="w-full resize-none border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex justify-end">
        <button className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700">
          Simpan Pemeriksaan Fisik
        </button>
      </div>
    </div>
  );
}

// ── ANATOMI pane ───────────────────────────────────────────

const BODY_REGIONS = [
  { id: "kepala",        label: "Kepala",        col: 2, row: 1 },
  { id: "leher",         label: "Leher",         col: 2, row: 2 },
  { id: "dada_kiri",     label: "Dada Kiri",     col: 1, row: 3 },
  { id: "dada_kanan",    label: "Dada Kanan",    col: 3, row: 3 },
  { id: "abdomen",       label: "Abdomen",       col: 2, row: 4 },
  { id: "pinggang_kiri", label: "Pinggang Kiri", col: 1, row: 4 },
  { id: "pinggang_kanan",label: "Pinggang Kanan",col: 3, row: 4 },
  { id: "panggul",       label: "Panggul",       col: 2, row: 5 },
  { id: "paha_kiri",     label: "Paha Kiri",     col: 1, row: 6 },
  { id: "paha_kanan",    label: "Paha Kanan",    col: 3, row: 6 },
  { id: "lutut_kiri",    label: "Lutut Kiri",    col: 1, row: 7 },
  { id: "lutut_kanan",   label: "Lutut Kanan",   col: 3, row: 7 },
  { id: "kaki_kiri",     label: "Kaki Kiri",     col: 1, row: 8 },
  { id: "kaki_kanan",    label: "Kaki Kanan",    col: 3, row: 8 },
  { id: "bahu_kiri",     label: "Bahu Kiri",     col: 0, row: 3 },
  { id: "bahu_kanan",    label: "Bahu Kanan",    col: 4, row: 3 },
  { id: "lengan_kiri",   label: "Lengan Kiri",   col: 0, row: 4 },
  { id: "lengan_kanan",  label: "Lengan Kanan",  col: 4, row: 4 },
  { id: "tangan_kiri",   label: "Tangan Kiri",   col: 0, row: 5 },
  { id: "tangan_kanan",  label: "Tangan Kanan",  col: 4, row: 5 },
];

interface RegionNote { region: string; label: string; catatan: string }

function AnatomiPane() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<RegionNote[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function toggleRegion(id: string, label: string) {
    setSelected((p) => {
      const next = new Set(p);
      if (next.has(id)) {
        next.delete(id);
        setNotes((n) => n.filter((r) => r.region !== id));
        if (editing === id) setEditing(null);
      } else {
        next.add(id);
        setNotes((n) => [...n, { region: id, label, catatan: "" }]);
        setEditing(id);
        setEditText("");
      }
      return next;
    });
  }

  function saveNote(region: string) {
    setNotes((p) => p.map((n) => n.region === region ? { ...n, catatan: editText } : n));
    setEditing(null);
  }

  const gridCols = 5;
  const gridRows = 8;
  const grid: (typeof BODY_REGIONS[0] | null)[][] = Array.from({ length: gridRows }, (_, r) =>
    Array.from({ length: gridCols }, (_, c) =>
      BODY_REGIONS.find((b) => b.row === r + 1 && b.col === c) ?? null
    )
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Body grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-64 md:shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Klik area tubuh untuk menandai
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {grid.flat().map((region, idx) =>
            region ? (
              <button
                key={region.id}
                onClick={() => toggleRegion(region.id, region.label)}
                title={region.label}
                className={cn(
                  "cursor-pointer rounded px-1 py-1.5 text-[9px] font-medium leading-tight transition-colors",
                  selected.has(region.id)
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700",
                )}
              >
                {region.label.split(" ").map((w) => w[0]).join("")}
              </button>
            ) : (
              <div key={idx} />
            )
          )}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500 mr-1" />
          Area yang ditandai
        </p>
      </div>

      {/* Notes */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Catatan Area Tubuh
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {selected.size}
          </span>
        </p>
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Klik area tubuh di kiri untuk menandai dan mencatat temuan
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.region} className="rounded-xl border border-rose-100 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">{n.label}</span>
                <button
                  onClick={() => toggleRegion(n.region, n.label)}
                  aria-label="Hapus"
                  className="shrink-0 cursor-pointer text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {editing === n.region ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Temuan / catatan..."
                    className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => saveNote(n.region)}
                    className="cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-700"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(n.region); setEditText(n.catatan); }}
                  className="mt-1.5 w-full cursor-pointer text-left text-[11px] text-slate-500 hover:text-indigo-600"
                >
                  {n.catatan || <span className="italic text-slate-300">Klik untuk tambah catatan...</span>}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── PENUNJANG pane ─────────────────────────────────────────

const JENIS_OPTIONS = ["Laboratorium", "Radiologi", "EKG", "USG", "Lainnya"];

function PenunjangPane() {
  const [entries, setEntries] = useState<HasilEntry[]>([]);
  const [form, setForm] = useState<Omit<HasilEntry, "id">>({
    jenis: "Laboratorium", nama: "", nilai: "", satuan: "", normal: "", tanggal: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleAdd() {
    if (!form.nama) return;
    setEntries((p) => [...p, { id: `p-${Date.now()}`, ...form }]);
    setForm((p) => ({ ...p, nama: "", nilai: "", satuan: "", normal: "", tanggal: "" }));
  }

  const grouped = entries.reduce<Record<string, HasilEntry[]>>((acc, e) => {
    (acc[e.jenis] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-72 md:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tambah Hasil Pemeriksaan</p>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis</p>
          <div className="flex flex-wrap gap-1">
            {JENIS_OPTIONS.map((j) => (
              <button
                key={j}
                onClick={() => set("jenis", j)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
                  form.jenis === j
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300",
                )}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Pemeriksaan</p>
          <input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Contoh: Hemoglobin, foto toraks..."
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai / Hasil</p>
            <input value={form.nilai} onChange={(e) => set("nilai", e.target.value)}
              placeholder="12.5"
              className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Satuan</p>
            <input value={form.satuan} onChange={(e) => set("satuan", e.target.value)}
              placeholder="g/dL"
              className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
          </div>
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Normal</p>
          <input value={form.normal} onChange={(e) => set("normal", e.target.value)}
            placeholder="12.0 – 16.0 g/dL"
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400" />
        </div>

        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</p>
          <input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)}
            className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400" />
        </div>

        <button
          onClick={handleAdd}
          disabled={!form.nama}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Tambah Hasil
        </button>
      </div>

      {/* Results table */}
      <div className="flex flex-1 flex-col gap-3">
        {/* Upload area */}
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30">
          <Upload size={18} className="text-slate-300" />
          <span className="text-xs font-medium text-slate-500">Upload file hasil lab / radiologi</span>
          <span className="text-[11px] text-slate-400">PDF, JPG, PNG — maks. 10 MB</span>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
        </label>

        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Belum ada hasil pemeriksaan
          </div>
        ) : (
          Object.entries(grouped).map(([jenis, items]) => (
            <div key={jenis} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                <span className="text-[11px] font-semibold text-slate-600">{jenis}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pemeriksaan</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hasil</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Normal</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-700">{item.nama}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">
                        {item.nilai} <span className="font-normal text-slate-400">{item.satuan}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{item.normal || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.tanggal || "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setEntries((p) => p.filter((e) => e.id !== item.id))}
                          aria-label="Hapus"
                          className="cursor-pointer text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PemeriksaanTab({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<SubTab>("vital");

  return (
    <div className="flex flex-col gap-3">
      {/* Sticky sub-tab nav with Framer Motion layoutId underline */}
      <div className="sticky top-0 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors",
                active === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
              {active === id && (
                <motion.div
                  layoutId="pemeriksaan-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content with transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {active === "vital"     && <TandaVitalPane  patient={patient} />}
          {active === "fisik"     && <FisikPane />}
          {active === "anatomi"   && <AnatomiPane />}
          {active === "penunjang" && <PenunjangPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
