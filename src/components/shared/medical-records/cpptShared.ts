import type { CPPTProfesi } from "@/lib/data";

export const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export const PROFESI_CLS: Record<CPPTProfesi, string> = {
  Dokter:      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Perawat:     "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Bidan:       "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  Apoteker:    "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Gizi:        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Fisioterapi: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Lainnya:     "bg-slate-100 text-slate-600",
};

export const PROFESI_LIST: CPPTProfesi[] = [
  "Dokter","Perawat","Bidan","Apoteker","Gizi","Fisioterapi","Lainnya",
];

export const SOAP_BADGE: Record<string, string> = {
  S: "bg-sky-100 text-sky-700",
  O: "bg-violet-100 text-violet-700",
  A: "bg-amber-100 text-amber-700",
  P: "bg-emerald-100 text-emerald-700",
  I: "bg-rose-100 text-rose-700",
};
