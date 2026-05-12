"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KU, KesadaranPF, StatusGizi, SistemFisikKey, PemeriksaanFisikEntry } from "@/lib/data";

// ── Exported form state type ────────────────────────────────

export type PemeriksaanFormState = Omit<PemeriksaanFisikEntry, "id">;

// ── Constants ───────────────────────────────────────────────

const KU_OPTIONS: KU[] = ["Baik", "Sedang", "Berat"];
const KESADARAN_OPTIONS: KesadaranPF[] = ["Composmentis", "Apatis", "Delirium", "Somnolen", "Sopor", "Koma"];
const GIZI_OPTIONS: StatusGizi[] = ["Baik", "Kurang", "Lebih", "Obesitas"];

interface SistemDef { key: SistemFisikKey; label: string; normalText: string }

export const SISTEM_DEF: SistemDef[] = [
  { key: "kepala",      label: "Kepala",                       normalText: "Normocephali, rambut distribusi merata, tidak ada nyeri tekan." },
  { key: "mata",        label: "Mata",                         normalText: "Konjungtiva tidak anemis, sklera tidak ikterik, pupil isokor bulat ∅3mm, refleks cahaya +/+, gerakan bola mata baik ke semua arah." },
  { key: "tht",         label: "THT (Telinga-Hidung-Tenggorok)", normalText: "Hidung: simetris, sekret (-). Telinga: aurikula normal, membran timpani intak. Mulut: mukosa lembab, faring tidak hiperemis, tonsil T1/T1." },
  { key: "leher",       label: "Leher",                        normalText: "Tidak ada pembesaran KGB, tidak ada deviasi trakea, tidak ada peningkatan JVP, tidak ada pembesaran tiroid." },
  { key: "toraks_paru", label: "Toraks / Paru",                normalText: "Simetris statis dan dinamis. Fremitus vokal sama kanan dan kiri. Sonor pada perkusi. Suara napas vesikuler +/+, ronkhi -/-, wheezing -/-." },
  { key: "jantung",     label: "Jantung / Kardiovaskuler",     normalText: "Iktus kordis tidak tampak, tidak teraba. Batas jantung dalam batas normal. Bunyi jantung S1 S2 normal, reguler, tidak ada murmur, tidak ada gallop." },
  { key: "abdomen",     label: "Abdomen",                      normalText: "Datar, supel. Bising usus (+) normal. Tidak ada nyeri tekan, tidak ada defense musculaire. Hepar dan lien tidak teraba. Perkusi timpani." },
  { key: "urogenital",  label: "Urogenital",                   normalText: "Tidak ada nyeri ketuk kostovertebra. Kandung kemih tidak teraba. BAK tidak ada keluhan." },
  { key: "ekstremitas", label: "Ekstremitas",                  normalText: "Akral hangat, CRT <2 detik. Tidak ada edema. ROM baik. Kekuatan motorik 5/5/5/5." },
  { key: "neurologi",   label: "Neurologi",                    normalText: "Kaku kuduk (-). Refleks fisiologis +/+ normal. Refleks patologis (-). Kekuatan motorik 5555/5555. Sensorik baik." },
  { key: "kulit",       label: "Kulit / Integumen",            normalText: "Turgor kulit baik, tidak ikterik, tidak sianosis, tidak ada lesi, tidak ada luka tekan." },
];

const TEMUAN_OPTIONS = [
  { id: "edema",         label: "Edema" },
  { id: "sianosis",      label: "Sianosis" },
  { id: "ikterus",       label: "Ikterus" },
  { id: "pucat",         label: "Pucat / Anemis" },
  { id: "ronkhi",        label: "Ronkhi" },
  { id: "wheezing",      label: "Wheezing" },
  { id: "nyeri_tekan",   label: "Nyeri tekan abdomen" },
  { id: "hepatomegali",  label: "Hepatomegali" },
  { id: "splenomegali",  label: "Splenomegali" },
  { id: "asites",        label: "Asites" },
  { id: "jvp_meningkat", label: "JVP meningkat" },
  { id: "akral_dingin",  label: "Akral dingin" },
  { id: "dekubitus",     label: "Luka dekubitus" },
  { id: "penurunan_ku",  label: "Penurunan KU" },
];

export function emptyFormState(): PemeriksaanFormState {
  const today = new Date();
  return {
    tanggal: today.toISOString().slice(0, 10),
    jam:     today.toTimeString().slice(0, 5),
    dokter:  "",
    perawat: "",
    ku:      "Baik",
    kesadaran: "Composmentis",
    gizi:    "Baik",
    orientasi: { waktu: true, tempat: true, orang: true },
    sistem: Object.fromEntries(SISTEM_DEF.map((d) => [d.key, ""])) as Record<SistemFisikKey, string>,
    temuanAbnormal: [],
    catatanUmum: "",
    bodyMarkings: [],
  };
}

// ── UI Primitives ───────────────────────────────────────────

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

function PillGroup<T extends string>({
  options, value, onChange, colorFn,
}: {
  options: T[]; value: T; onChange: (v: T) => void;
  colorFn?: (opt: T, active: boolean) => string;
}) {
  const defaultColor = (_: T, active: boolean) =>
    active
      ? "bg-indigo-600 text-white ring-indigo-600"
      : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700";
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 transition-all",
              (colorFn ?? defaultColor)(opt, active),
            )}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── SistemPanel (accordion) ─────────────────────────────────

function SistemPanel({ def, value, onChange }: { def: SistemDef; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const isNormal   = value === def.normalText;
  const hasContent = value.trim().length > 0;

  function handleNormal() {
    if (isNormal) { onChange(""); } else { onChange(def.normalText); setOpen(true); }
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-lg border transition-all duration-150",
      open ? "border-indigo-200" : "border-slate-200",
      hasContent && !isNormal && "border-amber-200",
    )}>
      <div
        className={cn(
          "flex cursor-pointer select-none items-center gap-2 px-3 py-2 transition-colors",
          open ? "bg-indigo-50/60" : "bg-white hover:bg-slate-50",
        )}
        onClick={() => setOpen((p) => !p)}
      >
        {open
          ? <ChevronDown size={13} className="shrink-0 text-slate-400" />
          : <ChevronRight size={13} className="shrink-0 text-slate-300" />}
        <span className="flex-1 text-xs font-medium text-slate-700">{def.label}</span>

        {hasContent && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold",
            isNormal ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
          )}>
            {isNormal ? "Normal" : "Abnormal"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleNormal(); }}
          className={cn(
            "shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
            isNormal
              ? "bg-emerald-500 text-white ring-emerald-500"
              : "bg-white text-slate-500 ring-slate-200 hover:ring-emerald-400 hover:text-emerald-700",
          )}
        >
          ✓ Normal
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-3 pb-3 pt-2">
          <AutoTextarea
            value={value}
            onChange={onChange}
            placeholder={`Temuan pemeriksaan ${def.label.toLowerCase()}...`}
            minRows={2}
            className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-300 outline-none"
          />
          {!isNormal && value.trim() && (
            <button type="button" onClick={handleNormal}
              className="mt-1 text-[10px] text-slate-400 transition hover:text-emerald-600">
              Gunakan teks normal →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────

interface Props {
  initial?: PemeriksaanFormState;
  onSave: (data: PemeriksaanFormState) => void;
}

export default function StatusFisikPane({ initial, onSave }: Props) {
  const [form, setForm] = useState<PemeriksaanFormState>(initial ?? emptyFormState());
  const set = <K extends keyof PemeriksaanFormState>(k: K, v: PemeriksaanFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function toggleTemuan(id: string) {
    setForm((p) => ({
      ...p,
      temuanAbnormal: p.temuanAbnormal.includes(id)
        ? p.temuanAbnormal.filter((t) => t !== id)
        : [...p.temuanAbnormal, id],
    }));
  }

  function setSistem(key: SistemFisikKey, v: string) {
    setForm((p) => ({ ...p, sistem: { ...p.sistem, [key]: v } }));
  }

  function handleAllNormal() {
    setForm((p) => ({
      ...p,
      ku: "Baik", kesadaran: "Composmentis", gizi: "Baik",
      orientasi: { waktu: true, tempat: true, orang: true },
      sistem: Object.fromEntries(SISTEM_DEF.map((d) => [d.key, d.normalText])) as Record<SistemFisikKey, string>,
      temuanAbnormal: [],
    }));
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Status Generalis */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Generalis</p>
          <button type="button" onClick={handleAllNormal}
            className="cursor-pointer rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
            ✓ Semua Normal
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Keadaan Umum</p>
            <PillGroup
              options={KU_OPTIONS} value={form.ku} onChange={(v) => set("ku", v)}
              colorFn={(opt, active) => {
                if (!active) return "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700";
                if (opt === "Baik")   return "bg-emerald-500 text-white ring-emerald-500";
                if (opt === "Sedang") return "bg-amber-500 text-white ring-amber-500";
                return "bg-rose-500 text-white ring-rose-500";
              }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Kesadaran</p>
            <PillGroup
              options={KESADARAN_OPTIONS} value={form.kesadaran} onChange={(v) => set("kesadaran", v)}
              colorFn={(opt, active) => {
                if (!active) return "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700";
                if (opt === "Composmentis") return "bg-emerald-500 text-white ring-emerald-500";
                if (opt === "Apatis" || opt === "Delirium") return "bg-amber-500 text-white ring-amber-500";
                return "bg-rose-500 text-white ring-rose-500";
              }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status Gizi</p>
            <PillGroup options={GIZI_OPTIONS} value={form.gizi} onChange={(v) => set("gizi", v)} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Orientasi</p>
            <div className="flex gap-1.5">
              {(["waktu", "tempat", "orang"] as const).map((k) => (
                <button key={k} type="button"
                  onClick={() => set("orientasi", { ...form.orientasi, [k]: !form.orientasi[k] })}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 capitalize transition-all",
                    form.orientasi[k]
                      ? "bg-emerald-500 text-white ring-emerald-500"
                      : "bg-rose-50 text-rose-600 ring-rose-200",
                  )}>
                  {form.orientasi[k] ? "✓" : "✗"} {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-sistem accordion */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pemeriksaan Per Sistem (Head-to-toe)</p>
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          {SISTEM_DEF.map((def) => (
            <SistemPanel
              key={def.key}
              def={def}
              value={form.sistem[def.key]}
              onChange={(v) => setSistem(def.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Temuan abnormal */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Temuan Abnormal (Checklist Cepat)</p>
        <div className="flex flex-wrap gap-1.5">
          {TEMUAN_OPTIONS.map(({ id, label }) => {
            const active = form.temuanAbnormal.includes(id);
            return (
              <button key={id} type="button" onClick={() => toggleTemuan(id)}
                className={cn(
                  "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
                  active
                    ? "bg-rose-500 text-white ring-rose-500"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-rose-300 hover:text-rose-600",
                )}>
                {active ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Catatan umum */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Catatan Umum</p>
        <AutoTextarea
          value={form.catatanUmum}
          onChange={(v) => set("catatanUmum", v)}
          placeholder="Catatan atau temuan lain yang perlu dicatat..."
          minRows={2}
          className="w-full border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button type="button" onClick={() => onSave(form)}
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700">
          Simpan Pemeriksaan Fisik
        </button>
      </div>
    </div>
  );
}
