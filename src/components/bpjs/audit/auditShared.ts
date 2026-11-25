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

// ── Saringan lewat URL (tautan dari Beranda BPJS) ───────

export type SaringHasil = "semua" | "ok" | "gagal";

/** Saringan awal halaman Audit trail, mis. `/ehis-bpjs/audit?periode=hari&hasil=gagal`. */
export interface SaringAwal {
  periode?: Periode;
  hasil?: SaringHasil;
  layanan?: Layanan;
  q?: string;
}

const BATAS_Q = 120;
const PERIODE_SAH = new Set<string>(OPSI_PERIODE.map((o) => o.value));
const HASIL_SAH = new Set<string>(["semua", "ok", "gagal"]);
const LAYANAN_SAH = new Set<string>(["V-Claim", "Aplicares"]);

/**
 * Parameter URL → saringan awal. Hanya nilai dari daftar yang dikenal yang dipakai (selebihnya
 * diabaikan), teks pencarian dipangkas & dibatasi panjangnya — URL adalah masukan pengguna.
 */
export function bacaSaringAwal(sp: Record<string, string | string[] | undefined>): SaringAwal {
  const satu = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  const periode = satu("periode");
  const hasil = satu("hasil");
  const layanan = satu("layanan");
  const q = satu("q")?.trim().slice(0, BATAS_Q);
  return {
    ...(periode && PERIODE_SAH.has(periode) ? { periode: periode as Periode } : {}),
    ...(hasil && HASIL_SAH.has(hasil) ? { hasil: hasil as SaringHasil } : {}),
    ...(layanan && LAYANAN_SAH.has(layanan) ? { layanan: layanan as Layanan } : {}),
    ...(q ? { q } : {}),
  };
}

/** Tautan ke Audit trail dengan saringan awal (endpoint di log sudah disamarkan → aman di URL). */
export function urlAudit(s: SaringAwal = {}): string {
  const p = new URLSearchParams();
  if (s.periode && s.periode !== "semua") p.set("periode", s.periode);
  if (s.hasil && s.hasil !== "semua") p.set("hasil", s.hasil);
  if (s.layanan) p.set("layanan", s.layanan);
  if (s.q) p.set("q", s.q.slice(0, BATAS_Q));
  const qs = p.toString();
  return qs ? `/ehis-bpjs/audit?${qs}` : "/ehis-bpjs/audit";
}
