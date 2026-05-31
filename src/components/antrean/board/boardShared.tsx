"use client";

// ANT2 — Helper bersama board: meta status, badge jenis/bayar, formatter.

import { cn } from "@/lib/utils";
import type { AntreanStatus, CaraBayar, JenisPasienAntrean } from "@/lib/antrean/types";

// ── Status meta ────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  dot: string;
  badge: string;
}

export const STATUS_META: Record<AntreanStatus, StatusMeta> = {
  Booked: { label: "Booked", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
  MenungguAdmisi: { label: "Menunggu Admisi", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  DipanggilAdmisi: { label: "Dipanggil", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  DilayaniAdmisi: { label: "Dilayani Admisi", dot: "bg-cyan-500", badge: "bg-cyan-50 text-cyan-700" },
  MenungguPoli: { label: "Menunggu Poli", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700" },
  DilayaniPoli: { label: "Dilayani Poli", dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700" },
  MenungguFarmasi: { label: "Menunggu Farmasi", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  Selesai: { label: "Selesai", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  TidakHadir: { label: "Tidak Hadir", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700" },
  Batal: { label: "Batal", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700" },
};

/** Grup filter status board → daftar AntreanStatus. */
export const STATUS_FILTERS: { key: string; label: string; match: AntreanStatus[] }[] = [
  { key: "semua", label: "Semua", match: [] },
  { key: "admisi", label: "Menunggu Admisi", match: ["MenungguAdmisi"] },
  { key: "dipanggil", label: "Dipanggil", match: ["DipanggilAdmisi", "DilayaniAdmisi"] },
  { key: "poli", label: "Menunggu Poli", match: ["MenungguPoli", "DilayaniPoli"] },
  { key: "selesai", label: "Selesai", match: ["Selesai", "MenungguFarmasi"] },
  { key: "batal", label: "Batal / Tidak Hadir", match: ["Batal", "TidakHadir"] },
];

// ── Badges ─────────────────────────────────────────────────

export function StatusBadge({ status }: { status: AntreanStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 m-tiny font-semibold", m.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function JenisBadge({ jenis }: { jenis: JenisPasienAntrean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 m-tiny font-bold",
        jenis === "Baru" ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200" : "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
      )}
    >
      {jenis}
    </span>
  );
}

export function BayarBadge({ caraBayar }: { caraBayar: CaraBayar }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 m-tiny font-semibold",
        caraBayar === "BPJS" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {caraBayar === "BPJS" ? "BPJS" : "Umum"}
    </span>
  );
}

// ── Formatters ─────────────────────────────────────────────

export function fmtJam(ms?: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Tanggal lahir → "12 Mar 1980" (terima ISO / yyyy-mm-dd / sudah-format). */
export function fmtTglLahir(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
