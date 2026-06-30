/**
 * Master Template Anamnesis — tipe & konfigurasi UI (FE-facing).
 *
 * Konsumen: AnamnesisPane IGD + RI + RJ + halaman master /ehis-master/template-anamnesis.
 * Data NYATA dibaca dari DB via API (`@/lib/api/master/templateAnamnesis`). Data awal
 * (dulu TEMPLATE_ANAMNESIS_MOCK) sudah dipindah ke `templateAnamnesisSeed.ts` + di-seed ke
 * `master.template_anamnesis`. File ini hanya menyimpan tipe + config tampilan + helper.
 *
 * Tiap template punya context_tags (modul mana yang relevan) + chief complaint
 * (kategori keluhan utama) + isi pre-fill field anamnesis. Schema 1:1 ke DB.
 */

export type ModulContext = "IGD" | "RI" | "RJ";

export type ChiefComplaintCategory =
  | "Kardiovaskular"
  | "Respirasi"
  | "Neurologi"
  | "Pencernaan"
  | "Endokrin"
  | "Infeksi"
  | "Trauma"
  | "Muskuloskeletal"
  | "Urologi"
  | "Mata_THT"
  | "Kontrol_Rutin"
  | "Lainnya";

export interface TemplateAnamnesisItem {
  id: string;
  label: string;
  kategori: ChiefComplaintCategory;
  contextTags: ModulContext[];
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera?: string;
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  catatanPerawat?: string;
  status: "Aktif" | "NonAktif";
}

// ── Config: kategori display ──────────────────────────────

export const KATEGORI_CFG: Record<
  ChiefComplaintCategory,
  { label: string; tone: string; bg: string; text: string; ring: string }
> = {
  Kardiovaskular:   { label: "Kardiovaskular",  tone: "rose",    bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  Respirasi:        { label: "Respirasi",       tone: "sky",     bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  Neurologi:        { label: "Neurologi",       tone: "violet",  bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200" },
  Pencernaan:       { label: "Pencernaan",      tone: "amber",   bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  Endokrin:         { label: "Endokrin",        tone: "teal",    bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200" },
  Infeksi:          { label: "Infeksi",         tone: "orange",  bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200" },
  Trauma:           { label: "Trauma",          tone: "rose",    bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  Muskuloskeletal:  { label: "Muskuloskeletal", tone: "indigo",  bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200" },
  Urologi:          { label: "Urologi",         tone: "sky",     bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  Mata_THT:         { label: "Mata / THT",      tone: "pink",    bg: "bg-pink-50",    text: "text-pink-700",    ring: "ring-pink-200" },
  Kontrol_Rutin:    { label: "Kontrol Rutin",   tone: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Lainnya:          { label: "Lainnya",         tone: "slate",   bg: "bg-slate-50",   text: "text-slate-700",   ring: "ring-slate-200" },
};

export const KATEGORI_LIST: ChiefComplaintCategory[] = [
  "Kardiovaskular", "Respirasi", "Neurologi", "Pencernaan", "Endokrin",
  "Infeksi", "Trauma", "Muskuloskeletal", "Urologi", "Mata_THT",
  "Kontrol_Rutin", "Lainnya",
];

// ── Context config ────────────────────────────────────────

export const CONTEXT_CFG: Record<
  ModulContext,
  { label: string; long: string; bg: string; text: string; dot: string }
> = {
  IGD: { label: "IGD", long: "Instalasi Gawat Darurat", bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500" },
  RI:  { label: "RI",  long: "Rawat Inap",              bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  RJ:  { label: "RJ",  long: "Rawat Jalan / Poliklinik", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const CONTEXT_LIST: ModulContext[] = ["IGD", "RI", "RJ"];

// ── Helpers ───────────────────────────────────────────────

export function emptyTemplateAnamnesis(): TemplateAnamnesisItem {
  return {
    id: `ta-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: "",
    kategori: "Lainnya",
    contextTags: ["IGD"],
    keluhanUtama: "",
    rps: "",
    onsetDurasi: "",
    faktorPemberat: "",
    faktorPemerut: "",
    statusGeneralis: "",
    catatanPerawat: "",
    status: "Aktif",
  };
}

export function isTemplateValid(t: TemplateAnamnesisItem): boolean {
  return (
    t.label.trim() !== "" &&
    t.keluhanUtama.trim() !== "" &&
    t.contextTags.length > 0
  );
}

export function countByContext(items: TemplateAnamnesisItem[], ctx: ModulContext): number {
  return items.filter((t) => t.contextTags.includes(ctx)).length;
}
