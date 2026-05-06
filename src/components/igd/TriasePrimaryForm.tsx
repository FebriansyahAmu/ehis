"use client";

import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

export interface TriaseEntryForm {
  namaPasien: string;
  jenisKelamin: "L" | "P" | "";
  usia: string;
  noKTP: string;
  caraMasuk: string;
  kondisiTiba: string;
  keluhanUtama: string;
  onset: string;
  lokasiKeluhan: string;
  kualitasKeluhan: string;
  skalaBerat: string;
  faktorPemberat: string;
  faktorPeringan: string;
  gejalaPenyerta: string[];
  riwayatSerupa: string;
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
  waktuTriase: string;
}

export const EMPTY_FORM: TriaseEntryForm = {
  namaPasien: "", jenisKelamin: "", usia: "", noKTP: "",
  caraMasuk: "", kondisiTiba: "",
  keluhanUtama: "", onset: "", lokasiKeluhan: "", kualitasKeluhan: "",
  skalaBerat: "", faktorPemberat: "", faktorPeringan: "",
  gejalaPenyerta: [], riwayatSerupa: "",
  airwayStatus: "", suaraNapasAbnormal: [],
  breathingQuality: "", pergerakanDada: "", ototBantu: "", sianosis: "",
  nadiTeraba: "", kualitasNadi: "", crt: "", kondisiKulit: "", perdarahan: "",
  avpu: "", pupil: "", refleksCahaya: "",
  traumaLuka: "", lokasiLuka: "", suhuKulit: "",
  diagnosisSementara: "", tindakanTriase: [],
  triageLevel: "", perawatTriase: "", waktuTriase: "",
};

// ── Form primitives ───────────────────────────────────────

type ChipColor = "indigo" | "sky" | "emerald" | "rose" | "violet" | "amber";

const CHIP_ACT: Record<ChipColor, string> = {
  indigo:  "border-indigo-500 bg-indigo-500 text-white shadow-sm",
  sky:     "border-sky-500 bg-sky-500 text-white shadow-sm",
  emerald: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  rose:    "border-rose-500 bg-rose-500 text-white shadow-sm",
  violet:  "border-violet-500 bg-violet-500 text-white shadow-sm",
  amber:   "border-amber-500 bg-amber-500 text-white shadow-sm",
};
const CHIP_IDLE = "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50";

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </p>
  );
}

export function RadioGroup({
  label, options, value, onChange, required, color = "indigo",
}: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; required?: boolean; color?: ChipColor;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150",
              value === opt ? CHIP_ACT[color] : CHIP_IDLE)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckGroup({
  label, options, values, onChange, color = "indigo",
}: {
  label: string; options: string[]; values: string[];
  onChange: (v: string[]) => void; color?: ChipColor;
}) {
  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150",
              values.includes(opt) ? CHIP_ACT[color] : CHIP_IDLE)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

const LBORDER: Record<string, string> = {
  A: "border-l-sky-400", B: "border-l-emerald-400",
  C: "border-l-rose-400", D: "border-l-violet-400", E: "border-l-amber-400",
};
const LBG: Record<string, string> = {
  A: "bg-sky-500", B: "bg-emerald-500",
  C: "bg-rose-500", D: "bg-violet-500", E: "bg-amber-500",
};

export function Block({
  letter, title, children, className,
}: {
  letter?: string; title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-slate-200 bg-white border-l-4",
      letter ? (LBORDER[letter] ?? "border-l-indigo-300") : "border-l-indigo-200",
      className,
    )}>
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        {letter && (
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black text-white",
            LBG[letter] ?? "bg-slate-400")}>
            {letter}
          </span>
        )}
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

// ── Primary Survey ────────────────────────────────────────

interface PrimaryProps {
  form: TriaseEntryForm;
  set: <K extends keyof TriaseEntryForm>(k: K, v: TriaseEntryForm[K]) => void;
}

export function TriasePrimaryForm({ form, set }: PrimaryProps) {
  const inp = "h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">

        <Block letter="A" title="Airway — Jalan Napas">
          <RadioGroup label="Status" required
            options={["Bebas / Paten", "Tersumbat Parsial", "Tersumbat Total"]}
            value={form.airwayStatus} onChange={(v) => set("airwayStatus", v)} color="sky" />
          <CheckGroup label="Suara Napas Abnormal"
            options={["Stridor", "Gurgling", "Snoring", "Tidak Ada"]}
            values={form.suaraNapasAbnormal} onChange={(v) => set("suaraNapasAbnormal", v)} color="sky" />
        </Block>

        <Block letter="B" title="Breathing — Pernapasan">
          <RadioGroup label="Kualitas Napas" required
            options={["Normal", "Sesak / Distress", "Tidak Bernapas"]}
            value={form.breathingQuality} onChange={(v) => set("breathingQuality", v)} color="emerald" />
          <div className="grid grid-cols-3 gap-2">
            <RadioGroup label="Pergerakan Dada" options={["Simetris", "Asimetris"]}
              value={form.pergerakanDada} onChange={(v) => set("pergerakanDada", v)} color="emerald" />
            <RadioGroup label="Otot Bantu" options={["Tidak", "Ya"]}
              value={form.ototBantu} onChange={(v) => set("ototBantu", v)} color="emerald" />
            <RadioGroup label="Sianosis" options={["Tidak", "Ya"]}
              value={form.sianosis} onChange={(v) => set("sianosis", v)} color="emerald" />
          </div>
        </Block>

        <Block letter="C" title="Circulation — Sirkulasi">
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup label="Nadi" required options={["Teraba", "Tidak Teraba"]}
              value={form.nadiTeraba} onChange={(v) => set("nadiTeraba", v)} color="rose" />
            <RadioGroup label="Kualitas Nadi" options={["Kuat & Teratur", "Lemah", "Tidak Teraba"]}
              value={form.kualitasNadi} onChange={(v) => set("kualitasNadi", v)} color="rose" />
            <RadioGroup label="CRT" options={["< 2 detik", "≥ 2 detik"]}
              value={form.crt} onChange={(v) => set("crt", v)} color="rose" />
            <RadioGroup label="Kondisi Kulit" options={["Hangat & Kering", "Pucat", "Dingin", "Lembab"]}
              value={form.kondisiKulit} onChange={(v) => set("kondisiKulit", v)} color="rose" />
          </div>
          <RadioGroup label="Perdarahan Aktif"
            options={["Tidak Ada", "Ada — Terkontrol", "Ada — Tidak Terkontrol"]}
            value={form.perdarahan} onChange={(v) => set("perdarahan", v)} color="rose" />
        </Block>

        <Block letter="D" title="Disability — Neurologis">
          <RadioGroup label="Tingkat Kesadaran (AVPU)" required
            options={["Alert", "Verbal", "Pain", "Unresponsive"]}
            value={form.avpu} onChange={(v) => set("avpu", v)} color="violet" />
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup label="Pupil" options={["Isokor", "Anisokor", "Miosis", "Midriasis"]}
              value={form.pupil} onChange={(v) => set("pupil", v)} color="violet" />
            <RadioGroup label="Refleks Cahaya" options={["+/+", "+/−", "−/−"]}
              value={form.refleksCahaya} onChange={(v) => set("refleksCahaya", v)} color="violet" />
          </div>
        </Block>

        <Block letter="E" title="Exposure — Paparan">
          <div className="grid grid-cols-2 gap-2">
            <RadioGroup label="Trauma / Luka" options={["Tidak Ada", "Ada"]}
              value={form.traumaLuka} onChange={(v) => set("traumaLuka", v)} color="amber" />
            <RadioGroup label="Suhu Kulit" options={["Normal", "Hipertermi", "Hipotermi"]}
              value={form.suhuKulit} onChange={(v) => set("suhuKulit", v)} color="amber" />
          </div>
          {form.traumaLuka === "Ada" && (
            <div>
              <Label>Lokasi Luka / Trauma</Label>
              <input type="text" value={form.lokasiLuka}
                onChange={(e) => set("lokasiLuka", e.target.value)}
                placeholder="Kepala, ekstremitas kanan..." className={inp} />
            </div>
          )}
        </Block>

        <Block title="Diagnosa & Tindakan Awal">
          <div>
            <Label>Diagnosa / Kesan Klinis Sementara</Label>
            <textarea rows={2} value={form.diagnosisSementara}
              onChange={(e) => set("diagnosisSementara", e.target.value)}
              placeholder="Suspect STEMI, Syok Hipovolemik..."
              className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </div>
          <CheckGroup label="Tindakan di Area Triase"
            options={["Pemberian O₂", "IV Line", "Monitor EKG", "NGT", "Kateter", "RJP", "Cairan IV", "Lainnya"]}
            values={form.tindakanTriase} onChange={(v) => set("tindakanTriase", v)} />
        </Block>

      </div>

      <Block title="Penanggung Jawab Triase">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label required>Nama Perawat Triase</Label>
            <input type="text" value={form.perawatTriase}
              onChange={(e) => set("perawatTriase", e.target.value)}
              placeholder="Nama lengkap perawat triase..." className={inp} />
          </div>
          <div>
            <Label>Waktu Triase</Label>
            <input type="datetime-local" value={form.waktuTriase}
              onChange={(e) => set("waktuTriase", e.target.value)} className={inp} />
          </div>
        </div>
      </Block>
    </div>
  );
}
