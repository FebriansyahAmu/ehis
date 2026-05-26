/**
 * Money Helpers — Rupiah arithmetic + format/parse.
 *
 * Konvensi: `Rupiah = bigint` bulat (tanpa sen). Sesuai akuntansi RS Indonesia
 * yang historically tidak track sen (semua dibulatkan ke rupiah utuh).
 * Pakai bigint mencegah floating-point drift untuk klaim ratusan juta.
 *
 * Math: SELALU pakai helper di file ini, JANGAN `Number(rp)` atau mix dengan
 * `number` untuk operasi (lossy at 2^53). Display-only conversion via
 * `rupiahToDisplayNumber()` — sudah di-mark unsafe.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 (renamed scope: dropped `parse → 125000000n`
 * sen suffix dari spek awal karena tipe Rupiah bulat tanpa sen).
 */

import type { Rupiah } from "./eklaimShared";

// ── Format ─────────────────────────────────────────────

/**
 * Format Rupiah ke string display "Rp 1.250.000".
 * Pakai locale `id-ID` untuk thousand separator titik.
 */
export function formatRupiah(rp: Rupiah): string {
  const sign = rp < 0n ? "-" : "";
  const abs = rp < 0n ? -rp : rp;
  const str = abs.toString();
  const withSep = str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${withSep}`;
}

/**
 * Format Rupiah short — "Rp 1,25 jt" / "Rp 125 rb" / "Rp 1,25 M".
 * Untuk KPI card / chart label yang space-constrained.
 */
export function formatRupiahShort(rp: Rupiah): string {
  const sign = rp < 0n ? "-" : "";
  const abs = rp < 0n ? -rp : rp;

  if (abs >= 1_000_000_000n) {
    const milyar = Number(abs) / 1_000_000_000;
    return `${sign}Rp ${milyar.toFixed(milyar >= 100 ? 0 : 2).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000n) {
    const juta = Number(abs) / 1_000_000;
    return `${sign}Rp ${juta.toFixed(juta >= 100 ? 0 : 1).replace(".", ",")} jt`;
  }
  if (abs >= 1_000n) {
    const ribu = Number(abs) / 1_000;
    return `${sign}Rp ${ribu.toFixed(ribu >= 100 ? 0 : 1).replace(".", ",")} rb`;
  }
  return `${sign}Rp ${abs.toString()}`;
}

// ── Parse ──────────────────────────────────────────────

/**
 * Parse string display ke Rupiah bigint.
 * Accept: "Rp 1.250.000" · "1.250.000" · "1250000" · "Rp 1,250,000".
 * Reject (return Err): empty · non-numeric · negative dengan prefix `+`.
 */
export function parseRupiah(input: string): Rupiah {
  const cleaned = input
    .trim()
    .replace(/^Rp\s*/i, "")
    .replace(/[.,\s]/g, "");
  if (!cleaned) throw new Error(`parseRupiah: empty input`);
  if (!/^-?\d+$/.test(cleaned)) throw new Error(`parseRupiah: not numeric "${input}"`);
  return BigInt(cleaned);
}

// ── Arithmetic ─────────────────────────────────────────

/** Sum N rupiah amounts. Empty list → 0n. */
export function addRupiah(...amounts: Rupiah[]): Rupiah {
  return amounts.reduce<Rupiah>((sum, x) => sum + x, 0n);
}

/** a - b. Negative result allowed (selisih bisa minus). */
export function subtractRupiah(a: Rupiah, b: Rupiah): Rupiah {
  return a - b;
}

/**
 * Multiply Rupiah by integer scalar (e.g. qty obat × harga satuan).
 * Float scalar (e.g. PPN 0.11) di-handle lewat `applyPercent()` agar lebih jelas.
 */
export function multiplyRupiah(rp: Rupiah, scalar: bigint | number): Rupiah {
  if (typeof scalar === "number") {
    if (!Number.isInteger(scalar)) {
      throw new Error(
        `multiplyRupiah: scalar harus integer (got ${scalar}). Pakai applyPercent() untuk persentase.`,
      );
    }
    return rp * BigInt(scalar);
  }
  return rp * scalar;
}

/**
 * Apply persentase ke Rupiah dengan rounding banker's (round-half-to-even).
 * Contoh: `applyPercent(1_000_000n, 11)` → 110_000n (PPN 11%).
 * Pakai `numerator/denominator` untuk avoid float drift.
 */
export function applyPercent(rp: Rupiah, percent: number): Rupiah {
  if (!Number.isFinite(percent)) throw new Error(`applyPercent: invalid percent ${percent}`);
  const num = BigInt(Math.round(percent * 10_000));
  const denom = 1_000_000n;
  return (rp * num + denom / 2n) / denom;
}

// ── Conversion (BOUNDARY ONLY) ─────────────────────────

/**
 * Convert number rupiah → Rupiah bigint.
 * Pakai HANYA untuk parse input form (boundary). Throw kalau float.
 */
export function rupiahFromNumber(rp: number): Rupiah {
  if (!Number.isInteger(rp)) {
    throw new Error(`rupiahFromNumber: nilai harus integer (got ${rp}). Bulatkan dulu.`);
  }
  return BigInt(rp);
}

/**
 * Convert Rupiah bigint → number untuk DISPLAY/CHART ONLY.
 * Loss precision di atas 2^53 (~9 quadrillion rupiah — safe untuk RS skala apapun).
 * JANGAN dipakai untuk math — pakai bigint helpers di atas.
 */
export function rupiahToDisplayNumber(rp: Rupiah): number {
  return Number(rp);
}

// ── Comparison ─────────────────────────────────────────

/** Equal check Rupiah (eslint kadang rewel dengan bigint ===). */
export function eqRupiah(a: Rupiah, b: Rupiah): boolean {
  return a === b;
}

/** Max of N rupiah amounts. Empty list → 0n. */
export function maxRupiah(...amounts: Rupiah[]): Rupiah {
  return amounts.reduce<Rupiah>((max, x) => (x > max ? x : max), 0n);
}

/** Min of N rupiah amounts. Empty list → 0n. */
export function minRupiah(...amounts: Rupiah[]): Rupiah {
  if (amounts.length === 0) return 0n;
  return amounts.reduce<Rupiah>((min, x) => (x < min ? x : min), amounts[0]);
}
