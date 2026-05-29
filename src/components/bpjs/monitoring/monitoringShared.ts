import type { BPJSError } from "@/lib/bpjs/bpjsShared";

export function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

export function fmtDate(s: string): string {
  if (!s) return "—";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${parts[2]} ${months[Number(parts[1]) - 1]} ${parts[0]}`;
}

export function fmtRupiah(s: string): string {
  const n = Number(s);
  if (!n || isNaN(n)) return "Rp 0";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function jnsLabel(jns: string): string {
  return jns === "1" || jns === "R.Inap" ? "R.Inap" : "R.Jalan";
}

export function jnsChipCls(jns: string): string {
  return jns === "R.Inap" || jns === "1"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60";
}

export function statusKlaimChipCls(status: string): string {
  if (status === "Klaim") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60";
  if (status === "Proses Verifikasi") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60";
  return "bg-slate-100 text-slate-500 ring-1 ring-slate-200/40";
}

export function kelasChipCls(kelas: string | null | undefined): string {
  if (!kelas) return "bg-slate-100 text-slate-400";
  if (kelas.includes("1") || kelas === "1")
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60";
  if (kelas.includes("2") || kelas === "2")
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200/40";
}

export function dijaminChipCls(status: string): string {
  return status === "Dijamin"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60";
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

export function exportCsv(rows: (string | number | null | undefined)[][], filename: string): void {
  const BOM = "﻿";
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const SAMPLE_KUNJUNGAN_DATES = ["2026-05-01", "2026-05-10", "2026-04-11"] as const;
export const SAMPLE_KARTU_HISTORI   = ["0001234567891", "0001234567892"] as const;
