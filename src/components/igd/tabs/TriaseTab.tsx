"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Check, AlertCircle, ClipboardList } from "lucide-react";
import type { IGDPatientDetail, TriageLevel } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getTriase, saveTriase } from "@/lib/api/triase";
import { listPegawai } from "@/lib/api/pegawai";
import { listTriaseProtocols } from "@/lib/api/triaseProtocol";
import type { TriaseDTO } from "@/lib/schemas/triase";
import type { TriaseRecordDTO } from "@/lib/schemas/triaseProtocol";
import { ApiError } from "@/lib/api/client";
import { Select } from "@/components/shared/inputs/Select";

// id kunjungan DB = UUID; id demo/mock ("igd-1") tak tersimpan ke DB.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
// SUMBER UTAMA = master Triase IGD (protokol default) via GET /master/triase-igd/default.
// Konstanta di bawah hanya FALLBACK degradasi (API gagal / belum login / belum ada default).

// tone (vocab master TriaseLevelTone) → kelas header kolom. Selaras TRIASE_TONE_CFG master.
const TONE_BG: Record<string, string> = {
  "red-dark": "bg-red-600",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  slate: "bg-slate-700",
  violet: "bg-violet-500",
};

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

interface CriteriaCol { key: string; label: string; bg: string; sub?: string }
interface CriteriaRow { parameterKode: string; parameterLabel: string; values: Record<string, string[]> }

// Kriteria triase yang dicentang (snapshot). Identitas natural = (parameterKode, levelKode, nilai).
export interface SelectedCriterion {
  parameterKode: string;
  parameterLabel: string;
  levelKode: string;
  levelLabel: string;
  nilai: string;
}
const critKey = (c: { parameterKode: string; levelKode: string; nilai: string }) =>
  `${c.parameterKode}|${c.levelKode}|${c.nilai}`;

// Fallback (konstanta hardcode) → bentuk generik kolom/baris. Sel single-string → daftar
// (string[]); "—" = tak applicable → [] (renderer tampilkan "—").
const FALLBACK_COLS: CriteriaCol[] = COL_HEADERS.map((c) => ({ key: c.key, label: c.label, bg: c.cls }));
const FALLBACK_ROWS: CriteriaRow[] = CRITERIA_ROWS.map((r) => ({
  parameterKode: r.parameter,
  parameterLabel: r.parameter,
  values: Object.fromEntries(
    Object.entries(r.values).map(([k, v]) => [k, v === "—" ? [] : [v]]),
  ),
}));

function CriteriaTable({
  protocols, loading, selectedId, onSelectProtocol, selectedKeys, onToggle,
}: {
  protocols: TriaseRecordDTO[] | null;
  loading: boolean;
  selectedId: string;
  onSelectProtocol: (id: string) => void;
  selectedKeys: Set<string>;
  onToggle: (c: SelectedCriterion) => void;
}) {
  const protocol = useMemo(
    () => protocols?.find((p) => p.id === selectedId) ?? null,
    [protocols, selectedId],
  );

  // Protokol master bila ada; else fallback konstanta (degradasi anggun).
  const cols: CriteriaCol[] = protocol
    ? protocol.levels.map((l) => ({
        key: l.kode,
        label: l.label,
        bg: TONE_BG[l.tone] ?? "bg-slate-600",
        sub: l.responsTime || undefined,
      }))
    : FALLBACK_COLS;
  const rows: CriteriaRow[] = protocol
    ? protocol.parameters.map((p) => ({ parameterKode: p.kode, parameterLabel: p.label, values: p.values }))
    : FALLBACK_ROWS;

  const hasProtocols = !!protocols && protocols.length > 0;
  // Centang hanya aktif bila ada protokol nyata (fallback offline = referensi read-only).
  const interactive = !!protocol;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-700">
          Tabel Kriteria Triase
          <span className="ml-1.5 font-normal text-slate-400">— centang temuan observasi</span>
        </span>
        {loading ? (
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Loader2 size={11} className="animate-spin" /> Memuat protokol…
          </span>
        ) : hasProtocols ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Protokol
            </span>
            <div className="w-56">
              <Select
                id="triase-protocol-select"
                value={selectedId}
                onChange={onSelectProtocol}
                icon={ClipboardList}
                options={protocols!.map((p) => ({
                  value: p.id,
                  label: p.isDefault ? `${p.nama} (default)` : p.nama,
                }))}
              />
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">Protokol bawaan (offline)</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-32 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-600">
                Pemeriksaan
              </th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-3 py-2.5 text-center font-semibold text-white", col.bg)}
                >
                  <span className="block">{col.label}</span>
                  {col.sub && (
                    <span className="block text-[9px] font-medium opacity-80">{col.sub}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="align-top hover:bg-slate-50/60">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-semibold text-slate-700">
                  {row.parameterLabel}
                </td>
                {cols.map((col) => {
                  const items = row.values[col.key] ?? [];
                  if (items.length === 0) {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center text-slate-300">—</td>
                    );
                  }
                  return (
                    <td key={col.key} className="px-2 py-2 leading-snug text-slate-600">
                      <ul className="space-y-1">
                        {items.map((nilai, k) => {
                          const c: SelectedCriterion = {
                            parameterKode: row.parameterKode,
                            parameterLabel: row.parameterLabel,
                            levelKode: col.key,
                            levelLabel: col.label,
                            nilai,
                          };
                          if (!interactive) {
                            return (
                              <li key={k} className="flex gap-1">
                                <span className="text-slate-300">•</span>
                                <span>{nilai}</span>
                              </li>
                            );
                          }
                          const checked = selectedKeys.has(critKey(c));
                          return (
                            <li key={k}>
                              <label
                                className={cn(
                                  "flex cursor-pointer items-start gap-1.5 rounded-md px-1.5 py-1 transition-colors",
                                  checked
                                    ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200"
                                    : "hover:bg-slate-100",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggle(c)}
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-indigo-600"
                                />
                                <span className={cn("text-left", checked && "font-medium")}>{nilai}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
          <span>Centang kriteria yang sesuai temuan — tersimpan bersama pengkajian triase.</span>
          <span className="font-semibold text-indigo-600">{selectedKeys.size} kriteria dipilih</span>
        </div>
      )}
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
  waktuTriase: string;
  // Protokol panduan + kriteria observasi yang dicentang.
  protocolId: string;
  protocolKode: string;
  protocolNama: string;
  selectedCriteria: SelectedCriterion[];
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
  waktuTriase: "",
  protocolId: "",
  protocolKode: "",
  protocolNama: "",
  selectedCriteria: [],
};

// ── DB ↔ form mapping ─────────────────────────────────────

// ISO ("…Z") → "YYYY-MM-DDTHH:mm" untuk <input datetime-local> (UTC wall-clock,
// konsisten dgn konvensi simpan/format waktu lain di modul IGD).
const toLocalInput = (iso: string): string => iso.slice(0, 16);

function dtoToForm(d: TriaseDTO): TriaseForm {
  return {
    caraMasuk: d.caraMasuk,
    kondisiTiba: d.kondisiTiba,
    keluhanUtama: d.keluhanUtama,
    onset: d.onset,
    lokasiKeluhan: d.lokasiKeluhan ?? "",
    kualitasKeluhan: d.kualitasKeluhan ?? "",
    skalaBerat: d.skalaBerat ?? "",
    faktorPemberat: d.faktorPemberat ?? "",
    faktorPeringan: d.faktorPeringan ?? "",
    gejalaPenyerta: d.gejalaPenyerta,
    riwayatSerupa: d.riwayatSerupa ?? "",
    airwayStatus: d.airwayStatus,
    suaraNapasAbnormal: d.suaraNapasAbnormal,
    breathingQuality: d.breathingQuality,
    pergerakanDada: d.pergerakanDada ?? "",
    ototBantu: d.ototBantu ?? "",
    sianosis: d.sianosis ?? "",
    nadiTeraba: d.nadiTeraba,
    kualitasNadi: d.kualitasNadi ?? "",
    crt: d.crt ?? "",
    kondisiKulit: d.kondisiKulit ?? "",
    perdarahan: d.perdarahan ?? "",
    avpu: d.avpu,
    pupil: d.pupil ?? "",
    refleksCahaya: d.refleksCahaya ?? "",
    traumaLuka: d.traumaLuka ?? "",
    lokasiLuka: d.lokasiLuka ?? "",
    suhuKulit: d.suhuKulit ?? "",
    diagnosisSementara: d.diagnosisSementara ?? "",
    tindakanTriase: d.tindakanTriase,
    triageLevel: d.triageLevel,
    perawatTriase: d.perawatTriase,
    waktuTriase: toLocalInput(d.waktuTriase),
    protocolId: d.protocolId ?? "",
    protocolKode: d.protocolKode ?? "",
    protocolNama: d.protocolNama ?? "",
    selectedCriteria: d.selectedCriteria.map((s) => ({
      parameterKode: s.parameterKode,
      parameterLabel: s.parameterLabel,
      levelKode: s.levelKode,
      levelLabel: s.levelLabel,
      nilai: s.nilai,
    })),
  };
}

// Field wajib (selaras TriaseInput Zod server) — guard pra-submit utk pesan ramah.
const REQUIRED_TEXT: (keyof TriaseForm)[] = [
  "caraMasuk", "kondisiTiba", "keluhanUtama", "onset",
  "airwayStatus", "breathingQuality", "nadiTeraba", "avpu", "perawatTriase",
];

// ── Main component ────────────────────────────────────────

export default function TriaseTab({ patient }: { patient: IGDPatientDetail }) {
  const isPersisted = UUID_RE.test(patient.id);
  const [form, setForm] = useState<TriaseForm>({
    ...EMPTY,
    triageLevel: patient.triage ?? "",
    keluhanUtama: patient.complaint,
  });
  const set = <K extends keyof TriaseForm>(k: K, v: TriaseForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const [loading, setLoading] = useState(isPersisted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Protokol triase aktif (Default / Obgyn / dst) — dipilih saat observasi.
  const [protocols, setProtocols] = useState<TriaseRecordDTO[] | null>(null);
  const [protocolsLoading, setProtocolsLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    listTriaseProtocols(ctrl.signal)
      .then((items) => setProtocols(items.filter((p) => p.status === "Aktif")))
      .catch(() => {}) // diam → CriteriaTable pakai fallback konstanta
      .finally(() => setProtocolsLoading(false));
    return () => ctrl.abort();
  }, []);

  // Pilih default protokol bila belum ada pilihan. Tunggu pengkajian DB termuat
  // (loading=false) agar tak balapan dgn dtoToForm yang memulihkan protocolId tersimpan.
  useEffect(() => {
    if (loading || !protocols || protocols.length === 0) return;
    setForm((f) => {
      if (f.protocolId && protocols.some((p) => p.id === f.protocolId)) return f;
      const def = protocols.find((p) => p.isDefault) ?? protocols[0];
      return { ...f, protocolId: def.id, protocolKode: def.kode, protocolNama: def.nama };
    });
  }, [protocols, loading]);

  const selectedKeys = useMemo(
    () => new Set(form.selectedCriteria.map(critKey)),
    [form.selectedCriteria],
  );

  // Ganti protokol → kriteria lama tak berlaku (beda matrix) → reset pilihan.
  const handleSelectProtocol = useCallback((id: string) => {
    setForm((f) => {
      if (f.protocolId === id) return f;
      const p = protocols?.find((x) => x.id === id);
      if (!p) return f;
      return { ...f, protocolId: p.id, protocolKode: p.kode, protocolNama: p.nama, selectedCriteria: [] };
    });
  }, [protocols]);

  const handleToggleCriterion = useCallback((c: SelectedCriterion) => {
    setForm((f) => {
      const key = critKey(c);
      const exists = f.selectedCriteria.some((x) => critKey(x) === key);
      return {
        ...f,
        selectedCriteria: exists
          ? f.selectedCriteria.filter((x) => critKey(x) !== key)
          : [...f.selectedCriteria, c],
      };
    });
  }, []);

  // Daftar perawat (PJ triase) — dari master pegawai profesi "Perawat".
  const [perawatList, setPerawatList] = useState<string[]>([]);
  const [perawatLoading, setPerawatLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const { items } = await listPegawai({ profesi: "Perawat", aktif: "true", limit: 50 }, ac.signal);
        if (ac.signal.aborted) return;
        setPerawatList(items.map((p) => p.namaTampil));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Gagal muat daftar perawat tak memblok form — dropdown jatuh ke nilai tersimpan saja.
      } finally {
        if (!ac.signal.aborted) setPerawatLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Sertakan nilai tersimpan walau tak ada di daftar (mis. perawat nonaktif / record lama).
  const perawatOptions = useMemo(() => {
    const set = new Set(perawatList);
    if (form.perawatTriase) set.add(form.perawatTriase);
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [perawatList, form.perawatTriase]);

  // Muat pengkajian terbaru dari DB (kunjungan nyata). Mock → form awal dari patient.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const dto = await getTriase(patient.id, ac.signal);
        if (ac.signal.aborted) return;
        if (dto) { setForm(dtoToForm(dto)); setSavedAt(dto.createdAt); }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat data triase.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [patient.id, isPersisted]);

  async function handleSave() {
    if (saving) return;
    if (!isPersisted) { setError("Pasien demo — pengkajian triase tidak tersimpan ke database."); return; }
    if (!form.triageLevel) { setError("Pilih Keputusan Triase (P1–P4) sebelum menyimpan."); return; }
    if (REQUIRED_TEXT.some((k) => !String(form[k]).trim())) {
      setError("Lengkapi semua field wajib (bertanda *)."); return;
    }
    setSaving(true);
    setError(null);
    try {
      const dto = await saveTriase(patient.id, { ...form, triageLevel: form.triageLevel as TriageLevel });
      setForm(dtoToForm(dto));
      setSavedAt(dto.createdAt);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan pengkajian triase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <Loader2 size={13} className="animate-spin" /> Memuat data triase dari rekam medis…
        </div>
      )}
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
      <CriteriaTable
        protocols={protocols}
        loading={protocolsLoading}
        selectedId={form.protocolId}
        onSelectProtocol={handleSelectProtocol}
        selectedKeys={selectedKeys}
        onToggle={handleToggleCriterion}
      />

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
            <select
              value={form.perawatTriase}
              onChange={(e) => set("perawatTriase", e.target.value)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">{perawatLoading ? "Memuat perawat…" : "— Pilih perawat —"}</option>
              {perawatOptions.map((nama) => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Waktu Triase</Label>
            <input
              type="datetime-local"
              value={form.waktuTriase}
              onChange={(e) => set("waktuTriase", e.target.value)}
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Block>

      {/* Save */}
      <div className="flex flex-col items-end gap-2 pb-1">
        {error && (
          <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
            <AlertCircle size={13} className="shrink-0" /> {error}
          </div>
        )}
        {!error && savedAt && (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
            <Check size={13} className="shrink-0" /> Tersimpan · {savedAt.slice(0, 16).replace("T", " ")} WIB
          </div>
        )}
        {!isPersisted && !error && (
          <p className="text-[11px] text-amber-600">Pasien demo — perubahan tidak tersimpan ke database.</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white shadow-sm transition",
            saving ? "cursor-not-allowed bg-slate-300" : "bg-indigo-600 hover:bg-indigo-700",
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? "Menyimpan…" : "Simpan Pengkajian Triase"}
        </button>
      </div>
    </div>
  );
}
