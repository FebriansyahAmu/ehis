"use client";

// ANT2 — Helper bersama board: meta status (nada badge), badge jenis/bayar, aturan aksi loket
// per status, jam berdetak, dan formatter. Warna badge selalu disertai teks (bukan warna saja).
// Dipakai juga oleh Monitoring (StatusBadge · JenisBadge), Beranda (todayISO), Struk (fmtJam).

import { useEffect, useState } from "react";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import type { AntreanRecord, AntreanStatus, CaraBayar, JenisPasienAntrean, SumberAntrean } from "@/lib/antrean/types";

// ── Status ─────────────────────────────────────────────────

export const STATUS_META: Record<AntreanStatus, { label: string; tone: BadgeTone }> = {
  Booked: { label: "Belum check-in", tone: "slate" },
  MenungguAdmisi: { label: "Menunggu admisi", tone: "amber" },
  DipanggilAdmisi: { label: "Dipanggil", tone: "blue" },
  DilayaniAdmisi: { label: "Dilayani admisi", tone: "cyan" },
  MenungguPoli: { label: "Menunggu poli", tone: "sky" },
  DilayaniPoli: { label: "Dilayani poli", tone: "teal" },
  MenungguFarmasi: { label: "Menunggu farmasi", tone: "indigo" },
  Selesai: { label: "Selesai", tone: "emerald" },
  TidakHadir: { label: "Tidak hadir", tone: "rose" },
  Batal: { label: "Batal", tone: "rose" },
};

/** Grup saring status board → daftar AntreanStatus (kosong = semua). */
export const STATUS_FILTERS = [
  { key: "semua", label: "Semua", match: [] },
  { key: "admisi", label: "Menunggu admisi", match: ["MenungguAdmisi"] },
  { key: "dipanggil", label: "Dipanggil", match: ["DipanggilAdmisi", "DilayaniAdmisi"] },
  { key: "poli", label: "Di poli", match: ["MenungguPoli", "DilayaniPoli"] },
  { key: "selesai", label: "Selesai", match: ["MenungguFarmasi", "Selesai"] },
  { key: "batal", label: "Batal / tidak hadir", match: ["Batal", "TidakHadir"] },
] as const satisfies readonly { key: string; label: string; match: readonly AntreanStatus[] }[];

export type KunciSaringStatus = (typeof STATUS_FILTERS)[number]["key"];

export function cocokStatus(status: AntreanStatus, kunci: KunciSaringStatus): boolean {
  const match: readonly AntreanStatus[] = STATUS_FILTERS.find((f) => f.key === kunci)?.match ?? [];
  return match.length === 0 || match.includes(status);
}

/** Status yang sudah hadir dan masih menunggu di depan loket (dasar hitung lama tunggu). */
export const STATUS_TUNGGU: readonly AntreanStatus[] = ["MenungguAdmisi", "DipanggilAdmisi"];

// ── Aturan aksi loket ──────────────────────────────────────

export interface AksiAntrean {
  /** Sudah selesai diproses (selesai/batal/tidak hadir) — tidak ada aksi loket. */
  terminal: boolean;
  /** Sudah ditangani poli/farmasi — loket admisi tidak berwenang lagi. */
  diLayanan: boolean;
  panggil: boolean;
  ulang: boolean;
  respon: boolean;
  batal: boolean;
}

/**
 * Aksi yang sah per status, TANPA melihat loket aktif (loket tertutup = semua aksi menunggu loket
 * dibuka; pemanggil yang memutuskan). Batal (task 99) hanya sebelum pasien dilayani poli — antrean
 * yang sudah dilayani tidak bisa dibatalkan di Antrol BPJS.
 */
export function aksiAntrean(rec: AntreanRecord): AksiAntrean {
  const s = rec.status;
  const terminal = s === "Selesai" || s === "Batal" || s === "TidakHadir";
  const diLayanan = s === "DilayaniPoli" || s === "MenungguFarmasi";
  return {
    terminal,
    diLayanan,
    panggil: s === "MenungguAdmisi",
    ulang: s === "DipanggilAdmisi",
    respon: s === "DipanggilAdmisi" || s === "DilayaniAdmisi" || s === "MenungguPoli",
    batal: !terminal && !diLayanan,
  };
}

// ── Badges ─────────────────────────────────────────────────

export function StatusBadge({ status }: { status: AntreanStatus }) {
  const m = STATUS_META[status];
  return (
    <BadgeNada tone={m.tone} titik>
      {m.label}
    </BadgeNada>
  );
}

export function JenisBadge({ jenis }: { jenis: JenisPasienAntrean }) {
  return (
    <BadgeNada tone={jenis === "Baru" ? "cyan" : "slate"}>
      {jenis === "Baru" ? "Pasien baru" : "Pasien lama"}
    </BadgeNada>
  );
}

export function BayarBadge({ caraBayar }: { caraBayar: CaraBayar }) {
  return <BadgeNada tone={caraBayar === "BPJS" ? "emerald" : "slate"}>{caraBayar === "BPJS" ? "BPJS" : "Umum"}</BadgeNada>;
}

export const SUMBER_LABEL: Record<SumberAntrean, string> = {
  Onsite: "Kiosk APM",
  MJKN: "Mobile JKN",
  Website: "Website",
};

// ── Waktu ──────────────────────────────────────────────────

/** Jam sekarang yang berdetak tiap `intervalMs` (bawaan 30 detik) untuk lama tunggu relatif. */
export function useSekarang(intervalMs = 30_000): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setT(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return t;
}

export function menitSejak(ms: number, sekarang: number): number {
  return Math.max(0, Math.floor((sekarang - ms) / 60_000));
}

/** 7 → "7 mnt" · 95 → "1 j 35 mnt". */
export function fmtDurasi(menit: number): string {
  if (menit < 1) return "< 1 mnt";
  if (menit < 60) return `${menit} mnt`;
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return m === 0 ? `${j} j` : `${j} j ${m} mnt`;
}

/** Nada lama tunggu: ≥ 60 menit rose, ≥ 30 menit amber. */
export function nadaTunggu(menit: number): BadgeTone {
  return menit >= 60 ? "rose" : menit >= 30 ? "amber" : "slate";
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

/** Usia dalam tahun dari tanggal lahir; null bila tidak terbaca. */
export function usiaTahun(v?: string, sekarang: number = Date.now()): number | null {
  if (!v) return null;
  const lahir = new Date(v);
  if (Number.isNaN(lahir.getTime())) return null;
  const kini = new Date(sekarang);
  let usia = kini.getFullYear() - lahir.getFullYear();
  const belumUlangTahun =
    kini.getMonth() < lahir.getMonth() || (kini.getMonth() === lahir.getMonth() && kini.getDate() < lahir.getDate());
  if (belumUlangTahun) usia -= 1;
  return usia >= 0 ? usia : null;
}

/** NIK disamarkan kecuali 4 digit terakhir: "•••• •••• •••• 0004". */
export function samarkanNik(nik?: string): string {
  if (!nik) return "—";
  const akhir = nik.slice(-4);
  return `•••• •••• •••• ${akhir}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
