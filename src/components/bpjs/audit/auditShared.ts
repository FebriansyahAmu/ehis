// Helper halaman Audit Trail BPJS: layanan (V-Claim/Aplicares) dari endpoint, arti kode respons,
// format & nada durasi, kunci hari LOKAL (bukan `timestamp.slice(0, 10)` yang UTC), periode
// cepat, dan nada metode HTTP (mengikuti arti tetap badge BPJS).

import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { geserHari, hariIniISO, keISO } from "@/components/bpjs/shared/tanggal";
import { BPJS_CODE_MESSAGES, isBPJSCode, type BPJSAuditEntry, type BPJSAuditMethod } from "@/lib/bpjs/bpjsShared";

export type Layanan = "V-Claim" | "Aplicares";

/** Aplicares: path mock lama `/Aplicares/...` + path nyata `/ref/kelas`, `/bed/...`. */
export function layananDari(endpoint: string): Layanan {
  return /^\/(aplicares|ref\/kelas|bed\/)/i.test(endpoint) ? "Aplicares" : "V-Claim";
}

/** Arti kode respons BPJS; "ERR" = panggilan tidak sampai/terputus. */
export function artiKode(kode: string): string {
  if (isBPJSCode(kode)) return BPJS_CODE_MESSAGES[kode];
  if (kode === "ERR") return "Gagal terhubung";
  return "Kode tidak dikenal";
}

/** Durasi, mis. 312 → "312 ms", 5002 → "5,0 dtk". */
export function fmtDurasi(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dtk` : `${ms} ms`;
}

/** ≥ 5 detik = lambat (rose), ≥ 2 detik = agak lambat (amber). */
export const BATAS_LAMBAT_MS = 5000;

export function nadaDurasi(ms: number): BadgeTone | null {
  if (ms >= BATAS_LAMBAT_MS) return "rose";
  if (ms >= 2000) return "amber";
  return null;
}

/** Arti tetap badge: GET = baca (slate) · POST = kirim/terbit (emerald) · PUT = diperbarui (blue) · DELETE = hapus (rose). */
export const NADA_METODE: Record<BPJSAuditMethod, BadgeTone> = {
  GET: "slate",
  POST: "emerald",
  PUT: "blue",
  DELETE: "rose",
};

export const URUTAN_METODE: readonly BPJSAuditMethod[] = ["GET", "POST", "PUT", "DELETE"];

/** Instan ISO → kunci hari lokal "yyyy-mm-dd". */
export function hariLokal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : keISO(d);
}

/** Jam lokal dengan detik, mis. "10.15.44". */
export function jamLokal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Judul hari, mis. "Sabtu, 30 Mei 2026". */
export function judulHari(hari: string): string {
  const [y, m, d] = hari.split("-").map(Number);
  if (!y || !m || !d) return hari;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export type Periode = "semua" | "hari" | "7" | "30";

export const OPSI_PERIODE: readonly { value: Periode; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "hari", label: "Hari ini" },
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
];

/** Hari pertama (lokal, inklusif) untuk periode; null = tanpa batas. */
export function awalPeriode(p: Periode): string | null {
  const hariIni = hariIniISO();
  if (p === "hari") return hariIni;
  if (p === "7") return geserHari(hariIni, -6);
  if (p === "30") return geserHari(hariIni, -29);
  return null;
}

export function dalamPeriode(e: BPJSAuditEntry, p: Periode): boolean {
  const awal = awalPeriode(p);
  return awal === null || hariLokal(e.timestamp) >= awal;
}

/** Rentang tanggal yang benar-benar tercakup entri (untuk judul laporan cetak). */
export function rentangEntri(list: readonly BPJSAuditEntry[]): { from: string; to: string } | null {
  const hari = list.map((e) => hariLokal(e.timestamp)).filter(Boolean);
  if (hari.length === 0) return null;
  const urut = hari.toSorted();
  return { from: urut[0], to: urut[urut.length - 1] };
}
