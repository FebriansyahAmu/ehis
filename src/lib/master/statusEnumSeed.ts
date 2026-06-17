/**
 * Status Enum — SEED DATA (plain, Node-loadable: tanpa import lucide/@runtime).
 *
 * LINGKUP (revisi 2026-06-17): hanya **3 grup** yang benar-benar dipakai sebagai vocab
 * operasional free-string lintas modul. 6 grup lama DIHAPUS karena punya otoritas lain /
 * typed-union / vocab baku (kelas-perawatan→Ruangan/Tarif · rute-obat→Obat/KFA ·
 * profesi-edukator→Pegawai · status-pulang→Disposisi+BPJS · kondisi-umum & tingkat-kesadaran→
 * union `KU`/`KesadaranPF`). Lihat docs/BACKEND-MASTER-TEMPLATE&ENUM.md §2.3/§5.
 *
 * Single source data 3 grup × entri. Dikonsumsi:
 *   - prisma/scripts/seed-statusEnum.mts (insert ke master.enum_entry; KODE di-GENERATE
 *     `<PREFIX>-NNN` per grup berdasar urutan array)
 *   - src/lib/master/statusEnumMock.ts (compose STATUS_ENUM_GROUPS: + ikon lucide via
 *     ICON_REGISTRY + kode generated formula yang sama → FE & DB konsisten)
 *
 * Kode di sini SENGAJA tidak disimpan (auto-gen). `iconKey`/entry `icon` = string key
 * ICON_REGISTRY. `prefix` per grup = scope counter (selaras ENUM_GROUP_PREFIX di schema Zod).
 */

export interface EnumEntrySeed {
  label: string;
  deskripsi?: string;
  tone: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
  icon?: string;
}

export interface EnumGroupSeed {
  key: string;       // StatusEnumKey
  prefix: string;    // scope counter (KTR, MTR, HKL) — selaras ENUM_GROUP_PREFIX
  label: string;
  deskripsi: string;
  iconKey: string;   // key ICON_REGISTRY (ikon grup)
  konsumen: string[];
  entries: EnumEntrySeed[];
}

export const STATUS_ENUM_SEED: EnumGroupSeed[] = [
  {
    key: "kondisi-transfer",
    prefix: "KTR",
    label: "Kondisi Transfer",
    deskripsi: "Status kondisi pasien saat transfer antar ruangan/RS.",
    iconKey: "ArrowRightCircle",
    konsumen: ["SBAR Transfer IGD→RI", "Rujukan eksternal", "Handover"],
    entries: [
      { label: "Stabil",       deskripsi: "Vital sign stabil, transfer aman tanpa intervensi", tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { label: "Tidak Stabil", deskripsi: "Memerlukan monitoring ketat selama transfer",        tone: "amber",   urutan: 2, status: "Aktif", icon: "AlertTriangle" },
      { label: "Kritis",       deskripsi: "Memerlukan dokter pendamping + alat resusitasi",     tone: "rose",    urutan: 3, status: "Aktif", icon: "Skull" },
    ],
  },
  {
    key: "mode-transport",
    prefix: "MTR",
    label: "Mode Transport",
    deskripsi: "Cara transportasi pasien antar lokasi (dalam/luar RS).",
    iconKey: "Bed",
    konsumen: ["SBAR Transfer", "Handover", "Rujukan"],
    entries: [
      { label: "Jalan Kaki",          deskripsi: "Pasien dapat berjalan tanpa bantuan",       tone: "emerald", urutan: 1, status: "Aktif", icon: "Activity" },
      { label: "Kursi Roda",          deskripsi: "Pasien duduk di kursi roda",                tone: "sky",     urutan: 2, status: "Aktif", icon: "User2" },
      { label: "Brankar",             deskripsi: "Pasien dibawa dengan brankar/tempat tidur", tone: "indigo",  urutan: 3, status: "Aktif", icon: "Bed" },
      { label: "Ambulance Internal",  deskripsi: "Ambulance RS untuk transfer internal",      tone: "violet",  urutan: 4, status: "Aktif", icon: "Hospital" },
      { label: "Ambulance Eksternal", deskripsi: "Ambulance untuk rujukan keluar RS",         tone: "rose",    urutan: 5, status: "Aktif", icon: "Hospital" },
    ],
  },
  {
    key: "hubungan-keluarga",
    prefix: "HKL",
    label: "Hubungan Keluarga / Caregiver",
    deskripsi: "Hubungan keluarga pasien dengan caregiver / penanggung jawab.",
    iconKey: "Users",
    konsumen: ["Informed Consent (penanda tangan)", "Caregiver", "Penanggung jawab"],
    entries: [
      { label: "Suami",     tone: "indigo", urutan: 1, status: "Aktif", icon: "User2" },
      { label: "Istri",     tone: "rose",   urutan: 2, status: "Aktif", icon: "User2" },
      { label: "Anak",      tone: "sky",    urutan: 3, status: "Aktif", icon: "Users" },
      { label: "Orang Tua", tone: "violet", urutan: 4, status: "Aktif", icon: "Users" },
      { label: "Saudara",   tone: "teal",   urutan: 5, status: "Aktif", icon: "GitBranch" },
      { label: "Wali",      deskripsi: "Wali hukum yang bukan keluarga inti", tone: "amber", urutan: 6, status: "Aktif", icon: "ShieldAlert" },
      { label: "Lainnya",   tone: "slate",  urutan: 7, status: "Aktif", icon: "Users" },
    ],
  },
];

/** Kode `<PREFIX>-NNN` (pad 3) — formula SAMA dipakai seed script & statusEnumMock (FE/DB konsisten). */
export function formatEnumKode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
