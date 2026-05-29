import type { RujukanRecord } from "@/lib/bpjs/bpjsShared";

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; results: RujukanRecord[] }
  | { status: "empty" }
  | { status: "error"; msg: string };

export function fmtDate(s: string): string {
  if (!s) return "—";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function jnsPelLabel(kode: string): string {
  return kode === "1" ? "Rawat Inap" : "Rawat Jalan";
}

export function statusCls(status: RujukanRecord["status"]): string {
  if (status === "Aktif") return "bg-teal-100 text-teal-700";
  if (status === "Expired") return "bg-rose-100 text-rose-600";
  return "bg-slate-100 text-slate-500";
}

export function asalBadgeCls(asal: "FKTP" | "FKRTL"): string {
  return asal === "FKTP"
    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80"
    : "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80";
}

export const SAMPLE_RUJUKAN_NOS = [
  { label: "FKTP-Mawar/0023", value: "RUJ/FKTP-Mawar/2026/05/0023", jenis: "FKTP" as const },
  { label: "FKRTL-Citra/0011", value: "RUJ/FKRTL-Citra/2026/05/0011", jenis: "FKRTL" as const },
  { label: "FKRTL-Bunda/0024", value: "RUJ/FKRTL-Bunda/2026/05/0024", jenis: "FKRTL" as const },
];

export const SAMPLE_KARTU_RUJUKAN = [
  { label: "Kartu 891", value: "0001234567891" },
  { label: "Kartu 892", value: "0001234567892" },
  { label: "Kartu 894", value: "0001234567894" },
];
