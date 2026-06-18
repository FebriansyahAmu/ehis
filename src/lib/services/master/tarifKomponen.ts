// Aturan komponen tarif (PMK 85/2015 — Pola Tarif Nasional). Dipakai bersama 3 service tarif
// (Tindakan/Lab/Rad): bila ADA komponen diisi → harga TOTAL = jumlah komponen (single source,
// anti-drift); bila TIDAK ada → mode total-only (harga manual, komponen di-null-kan).

export interface KomponenInput {
  harga: number;
  jasaSarana?: number;
  jasaMedis?: number;
  jasaParamedis?: number;
}

export interface KomponenResolved {
  harga: number;
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
}

export function resolveKomponen(input: KomponenInput): KomponenResolved {
  const ada =
    input.jasaSarana !== undefined || input.jasaMedis !== undefined || input.jasaParamedis !== undefined;
  if (!ada) {
    return { harga: input.harga, jasaSarana: null, jasaMedis: null, jasaParamedis: null };
  }
  const jasaSarana = input.jasaSarana ?? 0;
  const jasaMedis = input.jasaMedis ?? 0;
  const jasaParamedis = input.jasaParamedis ?? 0;
  return { harga: jasaSarana + jasaMedis + jasaParamedis, jasaSarana, jasaMedis, jasaParamedis };
}
