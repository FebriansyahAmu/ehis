/**
 * Status Enum — SEED DATA (plain, Node-loadable: tanpa import lucide/@runtime).
 *
 * Single source data 9 grup × entri. Dikonsumsi:
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
  prefix: string;    // scope counter (SPL, KUM, …) — selaras ENUM_GROUP_PREFIX
  label: string;
  deskripsi: string;
  iconKey: string;   // key ICON_REGISTRY (ikon grup)
  konsumen: string[];
  entries: EnumEntrySeed[];
}

export const STATUS_ENUM_SEED: EnumGroupSeed[] = [
  {
    key: "status-pulang",
    prefix: "SPL",
    label: "Status Pulang",
    deskripsi: "Status akhir kepulangan pasien (IGD + RI + RJ). Dipakai PasienPulangTab, Resume Medik, klaim BPJS.",
    iconKey: "Home",
    konsumen: ["IGD pasien pulang", "RI pasien pulang", "Resume medik", "Klaim BPJS"],
    entries: [
      { label: "Sembuh",         deskripsi: "Pulang dalam kondisi sembuh penuh",                      tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { label: "Membaik",        deskripsi: "Pulang dengan kondisi membaik, perlu kontrol lanjutan",  tone: "teal",    urutan: 2, status: "Aktif", icon: "Activity" },
      { label: "Rawat Inap",     deskripsi: "Transfer dari IGD ke bangsal via SBAR",                  tone: "violet",  urutan: 3, status: "Aktif", icon: "Bed" },
      { label: "Dirujuk RS Lain", deskripsi: "Memerlukan penanganan di fasilitas lebih tinggi",       tone: "sky",     urutan: 4, status: "Aktif", icon: "ArrowRightCircle" },
      { label: "APS",            deskripsi: "Atas Permintaan Sendiri — sebelum izin dokter",          tone: "amber",   urutan: 5, status: "Aktif", icon: "ShieldAlert" },
      { label: "Belum Sembuh",   deskripsi: "Pulang dengan kondisi belum sembuh atas alasan tertentu", tone: "orange", urutan: 6, status: "Aktif", icon: "AlertTriangle" },
      { label: "Meninggal",      deskripsi: "Pasien meninggal selama perawatan",                      tone: "slate",   urutan: 7, status: "Aktif", icon: "HeartOff" },
    ],
  },
  {
    key: "kondisi-umum",
    prefix: "KUM",
    label: "Kondisi Umum (KU)",
    deskripsi: "Kondisi umum pasien saat asesmen. Dipakai StatusFisikPane, anamnesis, resume.",
    iconKey: "Stethoscope",
    konsumen: ["StatusFisikPane (IGD+RI+RJ)", "Asesmen awal", "TTV"],
    entries: [
      { label: "Baik",   deskripsi: "Tidak ada distress, vital sign stabil",       tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { label: "Sedang", deskripsi: "Tampak sakit ringan-sedang, perlu observasi", tone: "amber",   urutan: 2, status: "Aktif", icon: "AlertCircle" },
      { label: "Buruk",  deskripsi: "Tampak sakit berat, distress jelas",          tone: "orange",  urutan: 3, status: "Aktif", icon: "AlertTriangle" },
      { label: "Kritis", deskripsi: "Mengancam jiwa, perlu intervensi segera",     tone: "rose",    urutan: 4, status: "Aktif", icon: "Skull" },
    ],
  },
  {
    key: "tingkat-kesadaran",
    prefix: "TKS",
    label: "Tingkat Kesadaran",
    deskripsi: "Skala kualitatif tingkat kesadaran. Komplementer dengan skala GCS (kuantitatif).",
    iconKey: "Brain",
    konsumen: ["TTVTab", "StatusFisikPane", "Asesmen awal"],
    entries: [
      { label: "Compos Mentis", deskripsi: "Sadar penuh, orientasi waktu/tempat/orang baik",        tone: "emerald", urutan: 1, status: "Aktif", icon: "Eye" },
      { label: "Apatis",        deskripsi: "Acuh tak acuh terhadap rangsangan",                      tone: "sky",     urutan: 2, status: "Aktif", icon: "Eye" },
      { label: "Delirium",      deskripsi: "Gelisah, disorientasi, halusinasi",                      tone: "amber",   urutan: 3, status: "Aktif", icon: "AlertCircle" },
      { label: "Somnolen",      deskripsi: "Mengantuk, masih dapat dibangunkan dengan rangsangan",   tone: "orange",  urutan: 4, status: "Aktif", icon: "Moon" },
      { label: "Sopor",         deskripsi: "Hanya respon dengan rangsangan nyeri kuat",              tone: "rose",    urutan: 5, status: "Aktif", icon: "MoonStar" },
      { label: "Koma",          deskripsi: "Tidak ada respon terhadap rangsangan apapun",            tone: "slate",   urutan: 6, status: "Aktif", icon: "EyeOff" },
    ],
  },
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
    konsumen: ["Disposisi", "PasienPulang", "Transfer", "Rujukan"],
    entries: [
      { label: "Jalan Kaki",          deskripsi: "Pasien dapat berjalan tanpa bantuan",       tone: "emerald", urutan: 1, status: "Aktif", icon: "Activity" },
      { label: "Kursi Roda",          deskripsi: "Pasien duduk di kursi roda",                tone: "sky",     urutan: 2, status: "Aktif", icon: "User2" },
      { label: "Brankar",             deskripsi: "Pasien dibawa dengan brankar/tempat tidur", tone: "indigo",  urutan: 3, status: "Aktif", icon: "Bed" },
      { label: "Ambulance Internal",  deskripsi: "Ambulance RS untuk transfer internal",      tone: "violet",  urutan: 4, status: "Aktif", icon: "Hospital" },
      { label: "Ambulance Eksternal", deskripsi: "Ambulance untuk rujukan keluar RS",         tone: "rose",    urutan: 5, status: "Aktif", icon: "Hospital" },
    ],
  },
  {
    key: "kelas-perawatan",
    prefix: "KPW",
    label: "Kelas Perawatan",
    deskripsi: "Kelas kamar rawat inap. Source of truth untuk RIKelas type, billing tarif, asuransi coverage.",
    iconKey: "Building2",
    konsumen: ["Registrasi RI", "Tarif matrix", "Penjamin coverage", "RIBoard"],
    entries: [
      { label: "VIP",     deskripsi: "Kamar VIP single bed, fasilitas premium", tone: "violet", urutan: 1, status: "Aktif", icon: "Crown" },
      { label: "Kelas 1", deskripsi: "Maks 2 bed/kamar",                         tone: "indigo", urutan: 2, status: "Aktif", icon: "Star" },
      { label: "Kelas 2", deskripsi: "3-4 bed/kamar",                            tone: "sky",    urutan: 3, status: "Aktif", icon: "Building2" },
      { label: "Kelas 3", deskripsi: "≥5 bed/kamar (bangsal umum)",             tone: "teal",   urutan: 4, status: "Aktif", icon: "Building2" },
      { label: "ICU",     deskripsi: "Intensive Care Unit — perawatan kritis",  tone: "rose",   urutan: 5, status: "Aktif", icon: "Heart" },
      { label: "HCU",     deskripsi: "High Care Unit — antara ICU dan bangsal", tone: "orange", urutan: 6, status: "Aktif", icon: "Heart" },
      { label: "Isolasi", deskripsi: "Kamar isolasi infeksius (TB, COVID, dll)", tone: "amber", urutan: 7, status: "Aktif", icon: "ShieldAlert" },
    ],
  },
  {
    key: "hubungan-keluarga",
    prefix: "HKL",
    label: "Hubungan Keluarga / Caregiver",
    deskripsi: "Hubungan keluarga pasien dengan caregiver / penanggung jawab.",
    iconKey: "Users",
    konsumen: ["Caregiver discharge", "Informed consent", "Penanggung jawab"],
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
  {
    key: "profesi-edukator",
    prefix: "PED",
    label: "Profesi Edukator",
    deskripsi: "Profesi tenaga kesehatan yang memberikan edukasi pasien.",
    iconKey: "User2",
    konsumen: ["EdukasiPane IGD", "DischargeEdukasi RI", "Konseling apoteker"],
    entries: [
      { label: "Dokter",       tone: "violet",  urutan: 1, status: "Aktif", icon: "Stethoscope" },
      { label: "Perawat",      tone: "sky",     urutan: 2, status: "Aktif", icon: "Heart" },
      { label: "Apoteker",     tone: "emerald", urutan: 3, status: "Aktif", icon: "Pill" },
      { label: "Ahli Gizi",    tone: "teal",    urutan: 4, status: "Aktif", icon: "Sparkles" },
      { label: "Fisioterapis", tone: "orange",  urutan: 5, status: "Aktif", icon: "Activity" },
      { label: "Psikolog",     tone: "indigo",  urutan: 6, status: "Aktif", icon: "Brain" },
    ],
  },
  {
    key: "rute-obat",
    prefix: "ROB",
    label: "Rute Pemberian Obat",
    deskripsi: "Cara pemberian obat. Catatan: master dasar ada di Katalog Obat. Disimpan di sini untuk kompatibilitas mock asesmen.",
    iconKey: "Pill",
    konsumen: ["AsesmenMedis (rekonsiliasi)", "Resep order", "MAR"],
    entries: [
      { label: "Oral / PO",        deskripsi: "Per oral / mulut",              tone: "emerald", urutan: 1,  status: "Aktif", icon: "Pill" },
      { label: "Intravena (IV)",   deskripsi: "Injeksi melalui vena",          tone: "rose",    urutan: 2,  status: "Aktif", icon: "Syringe" },
      { label: "Intramuskular (IM)", deskripsi: "Injeksi ke otot",             tone: "orange",  urutan: 3,  status: "Aktif", icon: "Syringe" },
      { label: "Subkutan (SC)",    deskripsi: "Injeksi bawah kulit",           tone: "amber",   urutan: 4,  status: "Aktif", icon: "Syringe" },
      { label: "Sublingual",       deskripsi: "Diletakkan di bawah lidah",     tone: "teal",    urutan: 5,  status: "Aktif", icon: "Hand" },
      { label: "Topikal",          deskripsi: "Dioleskan di kulit",            tone: "sky",     urutan: 6,  status: "Aktif", icon: "Hand" },
      { label: "Inhalasi",         deskripsi: "Dihirup melalui saluran nafas", tone: "indigo",  urutan: 7,  status: "Aktif", icon: "Wind" },
      { label: "Rektal",           deskripsi: "Melalui anus (suppositoria)",   tone: "violet",  urutan: 8,  status: "Aktif", icon: "Droplet" },
      { label: "Nasal",            deskripsi: "Melalui hidung (spray/tetes)",  tone: "sky",     urutan: 9,  status: "Aktif", icon: "Wind" },
      { label: "Per NGT",          deskripsi: "Melalui Nasogastric Tube",      tone: "slate",   urutan: 10, status: "Aktif", icon: "Droplet" },
    ],
  },
];

/** Kode `<PREFIX>-NNN` (pad 3) — formula SAMA dipakai seed script & statusEnumMock (FE/DB konsisten). */
export function formatEnumKode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
