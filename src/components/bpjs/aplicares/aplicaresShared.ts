/**
 * BP7 Aplicares — shared types + UI helpers.
 *
 * Scope: ReferensiKamarPage (BP7.1) + MapKelasPage (BP7.2) + KetersediaanKamarPage (BP7.3).
 * No "use client" — pure helper module (no hooks, no JSX).
 */

import type { BadgeTone } from "@/components/bpjs/shared/badge";
import type { AplicaresKamarRecord, MapKelasRecord } from "@/lib/bpjs/bpjsShared";
import type { KelasRawat } from "@/lib/eklaim/eklaimShared";

// ── Local CRUD row type ────────────────────────────────

/** `MapKelasRecord` dengan `id` lokal untuk client-side CRUD state. */
export interface MapRowLocal {
  id: string;
  kdKelasBPJS: string;
  namaKelasBPJS: string;
  kdKelasLokal: KelasRawat;
  namaKelasLokal: string;
  multiplier: number;
}

// ── Kelas BPJS helpers ─────────────────────────────────

export function kelasBPJSLabel(kode: string): string {
  const map: Record<string, string> = {
    NON: "Non-Kelas",
    VVP: "VVIP",
    VIP: "VIP",
    "1": "Kelas 1",
    "2": "Kelas 2",
    "3": "Kelas 3",
  };
  return map[kode] ?? kode;
}

export function kelasBPJSChipCls(kode: string): string {
  const map: Record<string, string> = {
    NON:  "bg-slate-100 text-slate-500",
    VVP:  "bg-pink-200 text-pink-800",
    VIP:  "bg-fuchsia-100 text-fuchsia-700",
    "1":  "bg-pink-100 text-pink-700",
    "2":  "bg-pink-50 text-pink-600",
    "3":  "bg-slate-100 text-slate-600",
  };
  return map[kode] ?? "bg-slate-100 text-slate-600";
}

/** Nama kelas untuk tampilan: Aplicares mengirim "-" untuk kode NON → pakai label kode. */
export function namaKelasTampil(kode: string, nama: string): string {
  const n = nama.trim();
  return n && n !== "-" ? n : kelasBPJSLabel(kode);
}

// ── Golongan kelas (Referensi Kamar) ───────────────────

export type GolonganKelas = "hak" | "naik" | "tanpa" | "lain";

/**
 * Golongan kode kelas terhadap hak rawat JKN. Warna mengikuti arti tetap badge BPJS:
 * emerald = berlaku (hak kelas), indigo = pembiayaan tambahan (naik kelas), slate = netral.
 */
export const GOLONGAN_KELAS: Record<GolonganKelas, { label: string; tone: BadgeTone; ket: string }> = {
  hak: {
    label: "Hak kelas JKN",
    tone: "emerald",
    ket: "Kelas hak rawat peserta JKN (kelas 1, 2, dan 3), sesuai kelas yang tercatat di kartu peserta.",
  },
  naik: {
    label: "Naik kelas",
    tone: "indigo",
    ket: "Di atas hak kelas JKN. Peserta yang naik ke kelas ini membayar selisih biaya; tidak berlaku untuk peserta PBI.",
  },
  tanpa: {
    label: "Tanpa kelas",
    tone: "slate",
    ket: "Kode untuk ruang rawat yang tidak memakai pembagian kelas.",
  },
  lain: {
    label: "Kode khusus",
    tone: "slate",
    ket: "Kode kelas khusus dari Aplicares.",
  },
};

export const URUTAN_GOLONGAN: readonly GolonganKelas[] = ["hak", "naik", "tanpa", "lain"];

export function golonganKelas(kode: string): GolonganKelas {
  if (kode === "1" || kode === "2" || kode === "3") return "hak";
  if (kode === "VIP" || kode === "VVP") return "naik";
  if (kode === "NON") return "tanpa";
  return "lain";
}

const URUTAN_KODE_KELAS = ["VVP", "VIP", "1", "2", "3", "NON"];

/** Pembanding urutan kode kelas BPJS (VVIP → VIP → 1 → 2 → 3 → non-kelas, kode lain di akhir). */
export function urutKodeKelas(a: string, b: string): number {
  const ia = URUTAN_KODE_KELAS.indexOf(a);
  const ib = URUTAN_KODE_KELAS.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
}

// ── Pemakaian kelas di RS (Referensi Kamar) ────────────

export interface PemakaianKelas {
  /** Ruangan RS yang dilaporkan ke Aplicares dengan kode kelas ini. */
  ruang: AplicaresKamarRecord[];
  /** Kelas RS lokal yang dipetakan ke kode kelas ini (Map Kelas). */
  lokal: MapKelasRecord[];
  kapasitas: number;
  terisi: number;
  tersedia: number;
}

export const PEMAKAIAN_KOSONG: PemakaianKelas = { ruang: [], lokal: [], kapasitas: 0, terisi: 0, tersedia: 0 };

/** Kelompokkan ruangan Aplicares + pemetaan kelas RS per kode kelas BPJS. */
export function pemakaianPerKelas(
  kamar: readonly AplicaresKamarRecord[],
  peta: readonly MapKelasRecord[],
): Map<string, PemakaianKelas> {
  const ruangPer = Object.groupBy(kamar, (k) => k.kdKelas);
  const lokalPer = Object.groupBy(peta, (m) => m.kdKelasBPJS);
  const kode = new Set<string>([...Object.keys(ruangPer), ...Object.keys(lokalPer)]);
  return new Map(
    [...kode].map((k) => {
      const ruang = ruangPer[k as keyof typeof ruangPer] ?? [];
      const hasil: PemakaianKelas = {
        ruang,
        lokal: lokalPer[k as keyof typeof lokalPer] ?? [],
        kapasitas: ruang.reduce((n, r) => n + r.kapasitas, 0),
        terisi: ruang.reduce((n, r) => n + r.terisi, 0),
        tersedia: ruang.reduce((n, r) => n + r.tersedia, 0),
      };
      return [k, hasil];
    }),
  );
}

/** Nada bilah keterisian: ≥ 90% merah muda, ≥ 75% kuning, selebihnya hijau. */
export function nadaKeterisian(terisi: number, kapasitas: number): BadgeTone {
  if (kapasitas <= 0) return "slate";
  const pct = (terisi / kapasitas) * 100;
  return pct >= 90 ? "rose" : pct >= 75 ? "amber" : "emerald";
}

/** Pengali tarif, mis. 1.3 → "1,30×". */
export function fmtPengali(m: number | undefined): string {
  return `${(m ?? 1).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
}

// ── Kelas lokal helpers ────────────────────────────────

export const KELAS_LOKAL_OPTIONS: KelasRawat[] = [
  "VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi", "KRIS",
];

export function kelasLokalLabel(kd: KelasRawat): string {
  const map: Record<KelasRawat, string> = {
    KRIS:    "KRIS",
    VIP:     "VIP",
    Kelas_1: "Kelas 1",
    Kelas_2: "Kelas 2",
    Kelas_3: "Kelas 3",
    ICU:     "ICU",
    HCU:     "HCU",
    Isolasi: "Isolasi",
  };
  return map[kd] ?? kd;
}

export function kelasLokalChipCls(kd: KelasRawat): string {
  const map: Record<KelasRawat, string> = {
    KRIS:    "bg-violet-100 text-violet-700",
    VIP:     "bg-fuchsia-100 text-fuchsia-700",
    Kelas_1: "bg-sky-100 text-sky-700",
    Kelas_2: "bg-sky-50 text-sky-600",
    Kelas_3: "bg-slate-100 text-slate-600",
    ICU:     "bg-rose-100 text-rose-700",
    HCU:     "bg-orange-100 text-orange-700",
    Isolasi: "bg-amber-100 text-amber-700",
  };
  return map[kd] ?? "bg-slate-100 text-slate-600";
}

// ── Multiplier badge ───────────────────────────────────

export function multiplierBadgeCls(m: number): string {
  if (m > 1)  return "bg-emerald-100 text-emerald-700";
  if (m < 1)  return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function multiplierLabel(m: number): string {
  return m.toFixed(2) + "×";
}

// ── CRUD helpers ───────────────────────────────────────

export function makeRowId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Guard: no duplicate (kdKelasBPJS, kdKelasLokal) pair.
 * Skip row with matching `id` (edit mode).
 */
export function isDuplicateMapping(
  rows: MapRowLocal[],
  kdBPJS: string,
  kdLokal: KelasRawat,
  skipId?: string,
): boolean {
  return rows.some(
    (r) => r.id !== skipId && r.kdKelasBPJS === kdBPJS && r.kdKelasLokal === kdLokal,
  );
}
