// DTO "Riwayat Sebelumnya" (longitudinal, read-only) untuk panel di samping form Riwayat
// Medis. Per sub-menu (9 domain riwayat), anamnesis TERBARU per kunjungan lintas semua
// kunjungan pasien (IGD/RJ/RI) + ringkasan singkat. Kesinambungan asuhan (SNARS AP 1.2).

export const RIWAYAT_DOMAIN_KEYS = [
  "penyakitDahulu", "obat", "gayaHidup", "faktorResiko",
  "penyakitKeluarga", "tuberkulosis", "ginekologi", "perawatan", "obstetri",
] as const;
export type RiwayatDomainKey = typeof RIWAYAT_DOMAIN_KEYS[number];

export interface RiwayatEpisodeDTO {
  kunjunganId: string;
  noKunjungan: string;
  unit: string; // IGD | RawatJalan | RawatInap
  unitLabel: string;
  poli: string | null;
  tanggal: string; // YYYY-MM-DD (WIB) — saat asesmen dicatat
  isCurrent: boolean; // = kunjungan yang sedang dibuka
  pemeriksa: string;
  summary: string; // ringkasan domain-spesifik (mis. "DM, Hipertensi" / "3 obat" / "G2P1A0")
}

export interface RiwayatSebelumnyaDTO {
  kunjunganId: string;
  patientId: string;
  domains: Record<RiwayatDomainKey, RiwayatEpisodeDTO[]>; // per domain, terbaru dulu
}
