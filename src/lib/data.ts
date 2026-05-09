// ── Types ─────────────────────────────────────────────────

export type PatientStatus   = "Selesai" | "Menunggu" | "Dalam Perawatan" | "Kritis";
export type PatientUnit     = "Rawat Jalan" | "Rawat Inap" | "IGD" | "Farmasi";
export type TriageLevel     = "P1" | "P2" | "P3" | "P4";
export type IGDStatus       = "Triage" | "Menunggu" | "Dalam Penanganan" | "Observasi" | "Selesai";

export interface Patient {
  id: string;
  noRM: string;
  name: string;
  age: number;
  unit: PatientUnit;
  status: PatientStatus;
  doctor: string;
  time: string;
}

export interface IGDPatient {
  id: string;
  noRM: string;
  name: string;
  age: number;
  gender: "L" | "P";
  triage: TriageLevel;
  status: IGDStatus;
  complaint: string;
  arrivalTime: string;
  waitDuration: string;
  doctor: string;
  notes?: string;
  bed?: {
    nomor: string;
    ruangan: string;
    kategori: "BEDAH" | "NON_BEDAH" | "IRDA" | "IRDO";
  };
}

export interface StatCard {
  label: string;
  value: number;
  unit: string;
  trend: number;
  color: "indigo" | "emerald" | "sky" | "rose";
}

export interface Activity {
  id: string;
  action: string;
  actor: string;
  time: string;
  type: "patient" | "lab" | "pharmacy" | "billing";
}

// ── Dashboard mock data ───────────────────────────────────

export const stats: StatCard[] = [
  { label: "Total Pasien Hari Ini", value: 248, unit: "pasien", trend: 12,  color: "indigo"  },
  { label: "Pasien Rawat Jalan",    value: 136, unit: "pasien", trend: 8,   color: "sky"     },
  { label: "Pasien Rawat Inap",     value: 74,  unit: "pasien", trend: -3,  color: "emerald" },
  { label: "Pasien IGD",            value: 38,  unit: "pasien", trend: 21,  color: "rose"    },
];

export const recentPatients: Patient[] = [
  { id: "1", noRM: "RM-2025-001", name: "Budi Santoso",    age: 45, unit: "Rawat Jalan", status: "Selesai",          doctor: "dr. Anisa Putri, Sp.PD",   time: "08:30" },
  { id: "2", noRM: "RM-2025-002", name: "Siti Rahayu",     age: 32, unit: "IGD",         status: "Dalam Perawatan",  doctor: "dr. Hendra Wijaya, Sp.EM",  time: "09:15" },
  { id: "3", noRM: "RM-2025-003", name: "Ahmad Fauzi",     age: 67, unit: "Rawat Inap",  status: "Dalam Perawatan",  doctor: "dr. Dewi Kusuma, Sp.JP",    time: "07:45" },
  { id: "4", noRM: "RM-2025-004", name: "Rina Marlina",    age: 28, unit: "Rawat Jalan", status: "Menunggu",         doctor: "dr. Faisal Rahman, Sp.OG",  time: "10:00" },
  { id: "5", noRM: "RM-2025-005", name: "Joko Prasetyo",   age: 55, unit: "IGD",         status: "Kritis",           doctor: "dr. Hendra Wijaya, Sp.EM",  time: "10:22" },
  { id: "6", noRM: "RM-2025-006", name: "Dewi Anggraini",  age: 41, unit: "Rawat Jalan", status: "Selesai",          doctor: "dr. Anisa Putri, Sp.PD",    time: "11:05" },
  { id: "7", noRM: "RM-2025-007", name: "Hasan Basri",     age: 72, unit: "Rawat Inap",  status: "Dalam Perawatan",  doctor: "dr. Dewi Kusuma, Sp.JP",    time: "06:30" },
];

export const recentActivities: Activity[] = [
  { id: "1", action: "Pasien baru Budi Santoso didaftarkan ke poli penyakit dalam", actor: "Petugas Pendaftaran", time: "2 menit lalu",  type: "patient"  },
  { id: "2", action: "Hasil laboratorium Joko Prasetyo tersedia",                   actor: "Laboratorium",        time: "15 menit lalu", type: "lab"      },
  { id: "3", action: "Resep untuk Siti Rahayu telah disiapkan",                     actor: "Farmasi",             time: "28 menit lalu", type: "pharmacy" },
  { id: "4", action: "Tagihan pasien Ahmad Fauzi telah dibuat",                     actor: "Billing",             time: "45 menit lalu", type: "billing"  },
  { id: "5", action: "Pasien Rina Marlina dipindahkan ke ruang rawat inap",         actor: "Perawat Jaga",        time: "1 jam lalu",    type: "patient"  },
];

// ── IGD mock data ─────────────────────────────────────────

export const igdPatients: IGDPatient[] = [
  {
    id: "igd-1",
    noRM: "RM-2025-005",
    name: "Joko Prasetyo",
    age: 55,
    gender: "L",
    triage: "P1",
    status: "Observasi",
    complaint: "Nyeri dada hebat, sesak napas, keringat dingin",
    arrivalTime: "10:22",
    waitDuration: "2 jam 15 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    notes: "Riwayat jantung koroner, perlu EKG segera",
    bed: { nomor: "IRDA-1", ruangan: "Ruang IRDA", kategori: "IRDA" },
  },
  {
    id: "igd-2",
    noRM: "RM-2025-012",
    name: "Kartini Wulandari",
    age: 38,
    gender: "P",
    triage: "P1",
    status: "Observasi",
    complaint: "Penurunan kesadaran mendadak, GCS 10",
    arrivalTime: "11:05",
    waitDuration: "1 jam 32 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    notes: "Gula darah 45 mg/dL saat tiba",
    bed: { nomor: "IRDA-2", ruangan: "Ruang IRDA", kategori: "IRDA" },
  },
  {
    id: "igd-3",
    noRM: "RM-2025-002",
    name: "Siti Rahayu",
    age: 32,
    gender: "P",
    triage: "P2",
    status: "Observasi",
    complaint: "Patah tulang lenang kanan akibat kecelakaan lalu lintas",
    arrivalTime: "09:15",
    waitDuration: "3 jam 22 mnt",
    doctor: "dr. Rizal Akbar, Sp.OT",
    bed: { nomor: "M1", ruangan: "R. Bedah Mayor", kategori: "BEDAH" },
  },
  {
    id: "igd-4",
    noRM: "RM-2025-018",
    name: "Darmawan Santoso",
    age: 62,
    gender: "L",
    triage: "P2",
    status: "Observasi",
    complaint: "Sesak napas, batuk berdahak sejak 3 hari lalu",
    arrivalTime: "11:48",
    waitDuration: "49 mnt",
    doctor: "dr. Anisa Putri, Sp.PD",
    notes: "Saturasi O2 88%, perlu nebulisasi",
    bed: { nomor: "A1", ruangan: "R. Non Bedah A", kategori: "NON_BEDAH" },
  },
  {
    id: "igd-5",
    noRM: "RM-2025-021",
    name: "Mega Lestari",
    age: 24,
    gender: "P",
    triage: "P2",
    status: "Observasi",
    complaint: "Demam tinggi 39.8°C, kejang 1× di rumah",
    arrivalTime: "12:10",
    waitDuration: "27 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    bed: { nomor: "A2", ruangan: "R. Non Bedah A", kategori: "NON_BEDAH" },
  },
  {
    id: "igd-6",
    noRM: "RM-2025-009",
    name: "Bambang Nugroho",
    age: 47,
    gender: "L",
    triage: "P3",
    status: "Observasi",
    complaint: "Luka laserasi jari tangan kanan, perlu hecting",
    arrivalTime: "11:30",
    waitDuration: "1 jam 7 mnt",
    doctor: "dr. Rizal Akbar, Sp.OT",
    bed: { nomor: "B1", ruangan: "R. Bedah Minor", kategori: "BEDAH" },
  },
  {
    id: "igd-7",
    noRM: "RM-2025-033",
    name: "Nurul Hidayah",
    age: 19,
    gender: "P",
    triage: "P3",
    status: "Observasi",
    complaint: "Diare dan muntah sejak pagi, dehidrasi ringan",
    arrivalTime: "09:45",
    waitDuration: "Selesai",
    doctor: "dr. Anisa Putri, Sp.PD",
    bed: { nomor: "B1", ruangan: "R. Non Bedah B", kategori: "NON_BEDAH" },
  },
  {
    id: "igd-8",
    noRM: "RM-2025-041",
    name: "Hendra Kurniawan",
    age: 35,
    gender: "L",
    triage: "P3",
    status: "Observasi",
    complaint: "Nyeri kepala hebat sejak 2 jam lalu, riwayat migrain",
    arrivalTime: "12:00",
    waitDuration: "37 mnt",
    doctor: "dr. Dewi Kusuma, Sp.JP",
    bed: { nomor: "B2", ruangan: "R. Non Bedah B", kategori: "NON_BEDAH" },
  },
];

// ── IGD Patient Detail types ──────────────────────────────

export type StatusKesadaran = "Compos_Mentis" | "Apatis" | "Somnolen" | "Sopor" | "Koma";
export type Disposisi       = "Pulang" | "Rawat_Inap" | "Rujuk" | "Meninggal" | "APS" | null;
export type CPPTProfesi     = "Dokter" | "Perawat" | "Bidan" | "Apoteker" | "Gizi" | "Fisioterapi" | "Lainnya";
export type DiagnosaTipe    = "Utama" | "Sekunder" | "Komplikasi" | "Komorbid";
export type DiagnosaStatus  = "Pasti" | "Dicurigai" | "Diferensial";
export type StatusLuaran    = "Teratasi" | "Teratasi_Sebagian" | "Belum_Teratasi" | "Dipantau";
export type ShiftType       = "Pagi" | "Siang" | "Malam";

export interface EvaluasiShift {
  id:           string;
  tanggal:      string;
  jam:          string;
  shift:        ShiftType;
  subjektif:    string;
  objektif:     string;
  statusLuaran: StatusLuaran;
  perawat:      string;
}

export interface AsuhanKeperawatanEntry {
  id:           string;
  kodeSdki:     string;
  dataMayor:    { subjektif: string; objektif: string };
  dataMinor:    { subjektif: string; objektif: string };
  faktorResiko: string;
  diagnosa:     string;
  penyebab:     string;
  tujuanDurasi: string;
  tujuanUnit:   "Jam" | "Hari";
  selama:       string;
  kriteriaHasil: string[];
  intervensi:   { observasi: string[]; terapeutik: string[]; edukasi: string[]; kolaborasi: string[] };
  tanggalInput: string;
  perawat:      string;
  verified:     boolean;
  verifiedBy:   string;
  verifiedAt:   string;
  statusLuaran: StatusLuaran;
  evaluasi:     EvaluasiShift[];
  aktif:        boolean;
}

// ── Pemeriksaan Fisik types ───────────────────────────────

export type KU          = "Baik" | "Sedang" | "Berat";
export type KesadaranPF = "Composmentis" | "Apatis" | "Delirium" | "Somnolen" | "Sopor" | "Koma";
export type StatusGizi  = "Baik" | "Kurang" | "Lebih" | "Obesitas";
export type SistemFisikKey =
  "kepala" | "mata" | "tht" | "leher" | "toraks_paru" |
  "jantung" | "abdomen" | "urogenital" | "ekstremitas" | "neurologi" | "kulit";

export interface OrientasiState {
  waktu:  boolean;
  tempat: boolean;
  orang:  boolean;
}

export interface PemeriksaanFisikEntry {
  id:             string;
  tanggal:        string;
  jam:            string;
  dokter:         string;
  perawat:        string;
  ku:             KU;
  kesadaran:      KesadaranPF;
  gizi:           StatusGizi;
  orientasi:      OrientasiState;
  sistem:         Record<SistemFisikKey, string>;
  temuanAbnormal: string[];
  catatanUmum:    string;
  bodyMarkings:   { region: string; label: string; catatan: string }[];
}

// ── Intake / Output types ─────────────────────────────────

export type IntakeKategori = "Oral" | "IV" | "NGT" | "Transfusi" | "Lainnya";
export type OutputKategori = "Urine" | "Drainase" | "Feses" | "Muntah" | "Perdarahan" | "Lainnya";

export interface IOEntry {
  id:           string;
  waktu:        string;          // "HH:MM"
  tanggal:      string;          // "YYYY-MM-DD"
  shift:        RIShift;
  tipe:         "intake" | "output";
  kategori:     IntakeKategori | OutputKategori;
  subKategori?: string;
  volume:       number;          // mL
  catatan?:     string;
}

export interface IOTargetDPJP {
  restriksiIntake?: number;      // mL/24jam, undefined = no restriction
  targetBalance?:   number;      // mL/24jam, negatif = target deficit
  catatan?:         string;
  updatedBy?:       string;
  updatedAt?:       string;
}

export interface IntakeOutputData {
  entries:     IOEntry[];
  targetDPJP?: IOTargetDPJP;
}

export interface IGDVitalSigns {
  tdSistolik: number;
  tdDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  skalaNyeri: number;
  beratBadan?: number;
  tinggiBadan?: number;
}

export interface IGDDiagnosa {
  id: string;
  kodeIcd10: string;
  namaDiagnosis: string;
  tipe: DiagnosaTipe;
  status?: DiagnosaStatus;
  alasan?: string;
  analisa?: string;
}

export interface CPPTEntry {
  id: string;
  waktu: string;
  tanggal?: string;       // "2025-05-08" ISO – used in Rawat Inap context
  profesi: CPPTProfesi;
  penulis: string;
  subjektif?: string;
  objektif?: string;
  asesmen?: string;
  planning?: string;
  instruksi?: string;
  verified?: boolean;     // SNARS: co-sign verification by DPJP
  verifiedBy?: string;
  verifiedAt?: string;    // "8 Mei 2025, 17:00"
  flagged?: boolean;      // tindak lanjut diperlukan
}

export interface IGDTindakanItem {
  id: string;
  nama: string;
  kode: string;
  waktu: string;
  dilakukanOleh: string;
  jumlah: number;
}

export interface IGDPatientDetail extends IGDPatient {
  noKunjungan: string;
  tglKunjungan: string;
  caraMasuk: string;
  penjamin: string;
  noBpjs?: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  noHp: string;
  namaKeluarga: string;
  hubunganKeluarga: string;
  vitalSigns: IGDVitalSigns;
  statusKesadaran: StatusKesadaran;
  mekanismeCedera?: string;
  riwayatAlergi?: string;
  obatSaatIni?: string;
  riwayatPenyakitSekarang: string;
  riwayatPenyakitDahulu?: string;
  riwayatKeluarga?: string;
  pemeriksaanFisikUmum: string;
  asesmenKlinis: string;
  rencanaTatalaksana: string;
  diagnosa: IGDDiagnosa[];
  cppt: CPPTEntry[];
  tindakan: IGDTindakanItem[];
  disposisi: Disposisi;
}

export const igdPatientDetails: Record<string, IGDPatientDetail> = {
  "igd-1": {
    id: "igd-1", noRM: "RM-2025-005", name: "Joko Prasetyo", age: 55, gender: "L",
    triage: "P1", status: "Observasi",
    complaint: "Nyeri dada hebat, sesak napas, keringat dingin",
    arrivalTime: "10:22", waitDuration: "2 jam 15 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    notes: "Riwayat jantung koroner, perlu EKG segera",
    noKunjungan: "IGD/2026/04/0023", tglKunjungan: "14 April 2026",
    caraMasuk: "Datang Sendiri", penjamin: "BPJS Non PBI", noBpjs: "0001234567890",
    tempatLahir: "Kotamobagu", tanggalLahir: "12 Maret 1971",
    alamat: "Jl. Merdeka No. 45, Kel. Motoboi Kecil, Kec. Kotamobagu Barat",
    noHp: "081234567890", namaKeluarga: "Sartini", hubunganKeluarga: "Istri",
    vitalSigns: {
      tdSistolik: 80, tdDiastolik: 50, nadi: 122, respirasi: 28,
      suhu: 36.4, spo2: 88, gcsEye: 4, gcsVerbal: 4, gcsMotor: 5,
      skalaNyeri: 9, beratBadan: 72, tinggiBadan: 168,
    },
    statusKesadaran: "Compos_Mentis",
    mekanismeCedera: "Nyeri dada substernal onset mendadak saat istirahat, menjalar ke lengan kiri dan rahang bawah",
    riwayatAlergi: "Tidak ada alergi yang diketahui",
    obatSaatIni: "Aspirin 80mg/hari, Atorvastatin 20mg/malam",
    riwayatPenyakitSekarang: "Pasien laki-laki 55 tahun datang dengan keluhan nyeri dada substernal yang dirasakan sejak 2 jam SMRS. Nyeri dirasakan seperti ditekan benda berat, menjalar ke lengan kiri dan rahang. Disertai sesak napas, keringat dingin, dan mual. Pasien memiliki riwayat hipertensi dan dislipidemia.",
    riwayatPenyakitDahulu: "Hipertensi (10 tahun), Dislipidemia (5 tahun), PJK (3 tahun)",
    riwayatKeluarga: "Ayah meninggal akibat serangan jantung pada usia 60 tahun",
    pemeriksaanFisikUmum: "KU tampak sakit berat, CM, pucat, diaforesis. Akral dingin, nadi lemah dan cepat. JVP meningkat, ronki basah basal bilateral.",
    asesmenKlinis: "NSTEMI dengan Killip Class III, Syok Kardiogenik",
    rencanaTatalaksana: "1. O2 via NRM 15 lpm, target SpO2 >94%\n2. IVFD NaCl 0,9% loading 250cc\n3. Aspirin 300mg + Clopidogrel 300mg loading\n4. Morfin 3mg IV\n5. EKG serial, konsul kardiologi\n6. Persiapkan ICU",
    diagnosa: [
      { id: "d1", kodeIcd10: "I21.4", namaDiagnosis: "Non-ST elevation myocardial infarction", tipe: "Utama",    status: "Pasti",     alasan: "EKG: ST depresi V4-V6, troponin T 2.4 ng/mL" },
      { id: "d2", kodeIcd10: "R57.0", namaDiagnosis: "Cardiogenic shock",                       tipe: "Sekunder", status: "Pasti",     alasan: "MAP <65 mmHg, akral dingin, UO menurun" },
      { id: "d3", kodeIcd10: "I10",   namaDiagnosis: "Essential (primary) hypertension",         tipe: "Komorbid", status: "Pasti",     alasan: "Riwayat 10 tahun, rutin amlodipine" },
      { id: "d4", kodeIcd10: "E78.5", namaDiagnosis: "Hyperlipidaemia, unspecified",              tipe: "Komorbid", status: "Dicurigai", alasan: "LDL belum ada hasil lab saat ini" },
    ],
    cppt: [
      {
        id: "c1", waktu: "10:25", profesi: "Dokter", penulis: "dr. Hendra Wijaya, Sp.EM",
        subjektif: "Pasien mengeluh nyeri dada sangat berat, sesak, keringat dingin sejak 2 jam lalu.",
        objektif: "TD 80/50 mmHg, Nadi 122×/mnt lemah ireguler, RR 28×/mnt, SpO2 88%. EKG: depresi ST lead II, III, aVF, V4-V6.",
        asesmen: "NSTEMI, Syok Kardiogenik, Killip Class III.",
        planning: "O2 NRM 15 lpm. IV line ×2. Aspirin 300mg + Clopidogrel 300mg loading. Morfin 3mg IV. EKG serial. Konsul kardiologi. Siapkan ICU.",
      },
      {
        id: "c2", waktu: "10:40", profesi: "Perawat", penulis: "Ns. Ratih Permata",
        subjektif: "Pasien masih nyeri dada, skala 7/10 (membaik). Sesak berkurang.",
        objektif: "TD 95/60 mmHg (membaik), Nadi 108×/mnt, SpO2 93% dengan NRM. Akral masih dingin.",
        asesmen: "Respons parsial terhadap terapi awal.",
        planning: "Monitor TTV tiap 15 menit. Dopamin 5 mcg/kg/mnt disiapkan jika TD tidak naik.",
      },
    ],
    tindakan: [
      { id: "t1", nama: "EKG 12 Lead", kode: "IGD-001", waktu: "10:28", dilakukanOleh: "Ns. Ratih Permata", jumlah: 1 },
      { id: "t2", nama: "Pemasangan IV Line", kode: "IGD-010", waktu: "10:30", dilakukanOleh: "Ns. Ratih Permata", jumlah: 2 },
      { id: "t3", nama: "Pemberian O2 via NRM", kode: "IGD-015", waktu: "10:26", dilakukanOleh: "Ns. Ratih Permata", jumlah: 1 },
      { id: "t4", nama: "Pemeriksaan Darah Lengkap + Troponin", kode: "LAB-001", waktu: "10:35", dilakukanOleh: "dr. Hendra Wijaya, Sp.EM", jumlah: 1 },
    ],
    disposisi: "Rawat_Inap",
  },
  "igd-2": {
    id: "igd-2", noRM: "RM-2025-012", name: "Kartini Wulandari", age: 38, gender: "P",
    triage: "P1", status: "Observasi",
    complaint: "Penurunan kesadaran mendadak, GCS 10",
    arrivalTime: "11:05", waitDuration: "1 jam 32 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    notes: "Gula darah 45 mg/dL saat tiba",
    noKunjungan: "IGD/2026/04/0024", tglKunjungan: "14 April 2026",
    caraMasuk: "Datang Sendiri", penjamin: "Umum/Mandiri",
    tempatLahir: "Manado", tanggalLahir: "22 Juli 1988",
    alamat: "Jl. Veteran No. 12, Kelurahan Matali",
    noHp: "085678901234", namaKeluarga: "Andi Wulandari", hubunganKeluarga: "Suami",
    vitalSigns: {
      tdSistolik: 100, tdDiastolik: 70, nadi: 98, respirasi: 20,
      suhu: 36.8, spo2: 96, gcsEye: 3, gcsVerbal: 4, gcsMotor: 3,
      skalaNyeri: 0, beratBadan: 58, tinggiBadan: 160,
    },
    statusKesadaran: "Somnolen",
    mekanismeCedera: "Penurunan kesadaran mendadak di rumah, sudah minum OAD pagi ini tapi belum sarapan",
    riwayatAlergi: "Sulfa",
    obatSaatIni: "Metformin 500mg 2× sehari, Glibenklamid 5mg 1× sehari",
    riwayatPenyakitSekarang: "Pasien wanita 38 tahun diantar keluarga dengan penurunan kesadaran mendadak sejak 1 jam SMRS. Riwayat DM tipe 2. Pagi ini sudah minum obat tapi belum sarapan.",
    riwayatPenyakitDahulu: "Diabetes Mellitus Tipe 2 (5 tahun)",
    riwayatKeluarga: "Ibu: DM tipe 2",
    pemeriksaanFisikUmum: "KU lemah, GCS E3V4M3=10, tidak ada tanda trauma. Pucat, berkeringat, akral dingin.",
    asesmenKlinis: "Hipoglikemia berat dengan penurunan kesadaran pada pasien DM tipe 2",
    rencanaTatalaksana: "1. D40% 2 flakon IV bolus\n2. Infus D10% maintenance\n3. Monitor GDS tiap 30 menit\n4. Observasi 4 jam",
    diagnosa: [
      { id: "d1", kodeIcd10: "E16.0", namaDiagnosis: "Drug-induced hypoglycaemia without coma",        tipe: "Utama",    status: "Pasti", alasan: "GDS 32 mg/dL, riwayat injeksi insulin 2U malam kemarin" },
      { id: "d2", kodeIcd10: "E11.9", namaDiagnosis: "Type 2 diabetes mellitus without complications", tipe: "Komorbid", status: "Pasti", alasan: "Riwayat 5 tahun, HbA1c terakhir 8.2%" },
    ],
    cppt: [
      {
        id: "c1", waktu: "11:10", profesi: "Dokter", penulis: "dr. Hendra Wijaya, Sp.EM",
        subjektif: "Pasien tidak sadar, diantar keluarga. Riwayat DM tipe 2, belum sarapan setelah minum OAD.",
        objektif: "GCS E3V4M3=10. GDS 45 mg/dL. TD 100/70, Nadi 98×/mnt, SpO2 96%.",
        asesmen: "Hipoglikemia berat dengan penurunan kesadaran pada DM tipe 2.",
        planning: "D40% 2 flakon IV bolus. Infus D10%. Monitor GDS tiap 30 menit. Observasi 4 jam.",
      },
    ],
    tindakan: [
      { id: "t1", nama: "Pemeriksaan GDS", kode: "LAB-GDS", waktu: "11:08", dilakukanOleh: "Ns. Dina Safitri", jumlah: 1 },
      { id: "t2", nama: "Pemasangan IV Line", kode: "IGD-010", waktu: "11:10", dilakukanOleh: "Ns. Dina Safitri", jumlah: 1 },
      { id: "t3", nama: "Pemberian Dextrose 40% IV Bolus", kode: "FAR-D40", waktu: "11:12", dilakukanOleh: "Ns. Dina Safitri", jumlah: 2 },
    ],
    disposisi: null,
  },
};

// ── IGD summary stats ─────────────────────────────────────

export const igdStats = {
  total: 38,
  p1: 8,
  p2: 17,
  p3: 13,
  bedsAvailable: 4,
  bedsTotal: 12,
  avgWait: "42 mnt",
};

// ── IGD Room Classification types ─────────────────────────

export type IGDKategoriRuangan = "BEDAH" | "NON_BEDAH" | "IRDA" | "IRDO" | "BOARDING_BED";
export type BedStatus = "Tersedia" | "Terisi" | "Maintenance";

export interface IGDBed {
  id: string;
  nomor: string;
  status: BedStatus;
  pasienNama?: string;
  pasienRM?: string;
  triage?: TriageLevel;
  masukSejak?: string;
  boardingJam?: number;
}

export interface IGDRuangan {
  id: string;
  nama: string;
  kategori: IGDKategoriRuangan;
  beds: IGDBed[];
}

export const igdRuangan: IGDRuangan[] = [
  // ── BEDAH ────────────────────────────────────────────────
  {
    id: "bedah-minor",
    nama: "R. Bedah Minor",
    kategori: "BEDAH",
    beds: [
      { id: "bm1", nomor: "B1", status: "Terisi",   pasienNama: "Bambang Nugroho",  pasienRM: "RM-2025-009", triage: "P3", masukSejak: "11:30" },
      { id: "bm2", nomor: "B2", status: "Terisi",   pasienNama: "Ari Susanto",      pasienRM: "RM-2025-044", triage: "P2", masukSejak: "10:15" },
      { id: "bm3", nomor: "B3", status: "Tersedia" },
      { id: "bm4", nomor: "B4", status: "Tersedia" },
    ],
  },
  {
    id: "bedah-mayor",
    nama: "R. Bedah Mayor",
    kategori: "BEDAH",
    beds: [
      { id: "bM1", nomor: "M1", status: "Terisi",     pasienNama: "Siti Rahayu",    pasienRM: "RM-2025-002", triage: "P2", masukSejak: "09:15" },
      { id: "bM2", nomor: "M2", status: "Terisi",     pasienNama: "Farhan Maulana", pasienRM: "RM-2025-051", triage: "P1", masukSejak: "08:45" },
      { id: "bM3", nomor: "M3", status: "Tersedia" },
      { id: "bM4", nomor: "M4", status: "Maintenance" },
    ],
  },
  // ── NON BEDAH ─────────────────────────────────────────────
  {
    id: "nonbedah-a",
    nama: "R. Non Bedah A",
    kategori: "NON_BEDAH",
    beds: [
      { id: "na1", nomor: "A1", status: "Terisi",   pasienNama: "Darmawan Santoso", pasienRM: "RM-2025-018", triage: "P2", masukSejak: "11:48" },
      { id: "na2", nomor: "A2", status: "Terisi",   pasienNama: "Mega Lestari",     pasienRM: "RM-2025-021", triage: "P2", masukSejak: "12:10" },
      { id: "na3", nomor: "A3", status: "Tersedia" },
      { id: "na4", nomor: "A4", status: "Tersedia" },
    ],
  },
  {
    id: "nonbedah-b",
    nama: "R. Non Bedah B",
    kategori: "NON_BEDAH",
    beds: [
      { id: "nb1", nomor: "B1", status: "Terisi",   pasienNama: "Nurul Hidayah",    pasienRM: "RM-2025-033", triage: "P3", masukSejak: "09:45" },
      { id: "nb2", nomor: "B2", status: "Terisi",   pasienNama: "Hendra Kurniawan", pasienRM: "RM-2025-041", triage: "P3", masukSejak: "12:00" },
      { id: "nb3", nomor: "B3", status: "Terisi",   pasienNama: "Lina Marliana",    pasienRM: "RM-2025-058", triage: "P3", masukSejak: "10:55" },
      { id: "nb4", nomor: "B4", status: "Tersedia" },
    ],
  },
  {
    id: "nonbedah-c",
    nama: "R. Non Bedah C",
    kategori: "NON_BEDAH",
    beds: [
      { id: "nc1", nomor: "C1", status: "Terisi",   pasienNama: "Rudi Hermawan",    pasienRM: "RM-2025-062", triage: "P2", masukSejak: "07:30" },
      { id: "nc2", nomor: "C2", status: "Tersedia" },
      { id: "nc3", nomor: "C3", status: "Tersedia" },
      { id: "nc4", nomor: "C4", status: "Tersedia" },
    ],
  },
  // ── IRDA ──────────────────────────────────────────────────
  {
    id: "irda-1",
    nama: "Ruang IRDA",
    kategori: "IRDA",
    beds: [
      { id: "irda1", nomor: "IRDA-1", status: "Terisi",   pasienNama: "Joko Prasetyo",     pasienRM: "RM-2025-005", triage: "P1", masukSejak: "10:22" },
      { id: "irda2", nomor: "IRDA-2", status: "Terisi",   pasienNama: "Kartini Wulandari", pasienRM: "RM-2025-012", triage: "P1", masukSejak: "11:05" },
      { id: "irda3", nomor: "IRDA-3", status: "Terisi",   pasienNama: "Wahyu Santoso",     pasienRM: "RM-2025-067", triage: "P1", masukSejak: "09:30" },
      { id: "irda4", nomor: "IRDA-4", status: "Tersedia" },
    ],
  },
  // ── IRDO ──────────────────────────────────────────────────
  {
    id: "irdo-1",
    nama: "Ruang IRDO",
    kategori: "IRDO",
    beds: [
      { id: "irdo1", nomor: "IRDO-1", status: "Terisi",   pasienNama: "Agus Prasetyo", pasienRM: "RM-2025-071", triage: "P2", masukSejak: "08:15" },
      { id: "irdo2", nomor: "IRDO-2", status: "Terisi",   pasienNama: "Sri Mulyani",   pasienRM: "RM-2025-073", triage: "P1", masukSejak: "07:45" },
      { id: "irdo3", nomor: "IRDO-3", status: "Tersedia" },
      { id: "irdo4", nomor: "IRDO-4", status: "Tersedia" },
    ],
  },
  // ── BOARDING BED ──────────────────────────────────────────
  {
    id: "boarding-1",
    nama: "R. Boarding",
    kategori: "BOARDING_BED",
    beds: [
      { id: "bb1", nomor: "BB-1", status: "Terisi",   pasienNama: "Supriadi Raharjo",  pasienRM: "RM-2025-079", triage: "P2", masukSejak: "06:30", boardingJam: 7 },
      { id: "bb2", nomor: "BB-2", status: "Terisi",   pasienNama: "Yeni Anggraini",    pasienRM: "RM-2025-081", triage: "P3", masukSejak: "08:15", boardingJam: 5 },
      { id: "bb3", nomor: "BB-3", status: "Terisi",   pasienNama: "Mulyono Hartanto",  pasienRM: "RM-2025-084", triage: "P3", masukSejak: "09:00", boardingJam: 4 },
      { id: "bb4", nomor: "BB-4", status: "Terisi",   pasienNama: "Dewi Novitasari",   pasienRM: "RM-2025-087", triage: "P2", masukSejak: "10:30", boardingJam: 3 },
      { id: "bb5", nomor: "BB-5", status: "Tersedia" },
      { id: "bb6", nomor: "BB-6", status: "Tersedia" },
    ],
  },
];

// ── Patient Master types ──────────────────────────────────

export type GolonganDarah    = "A" | "B" | "AB" | "O" | "-";
export type StatusPerkawinan = "Belum Menikah" | "Menikah" | "Janda" | "Duda";
export type UnitKunjungan    = "IGD" | "Rawat Jalan" | "Rawat Inap" | "Laboratorium" | "Radiologi" | "Farmasi";
export type StatusTagihan    = "Lunas" | "Belum Lunas" | "Proses Klaim" | "Ditanggung";
export type TipePenjamin     = "Umum" | "BPJS_Non_PBI" | "BPJS_PBI" | "Asuransi" | "Jamkesda";

export interface PenjaminData {
  tipe: TipePenjamin;
  nama: string;
  nomor?: string;
  kelas?: "1" | "2" | "3";
  berlakuSampai?: string;
  noSEP?: string;
  noPolis?: string;
}

export interface KontakDarurat {
  nama: string;
  hubungan: string;
  noHp: string;
  alamat?: string;
}

export interface KunjunganRecord {
  id: string;
  noPendaftaran: string;
  noKunjungan: string;
  tanggal: string;
  unit: UnitKunjungan;
  dokter: string;
  keluhan: string;
  diagnosa: string;
  penjamin?: string;
  noPenjamin?: string;
  noSEP?: string;
  kodeICD?: string;
  caraMasuk?: string;
  klinisPath?: string;
  orderedServices?: { unit: UnitKunjungan; selesai: boolean }[];
  dokumen?: {
    generalConsent?: "Ditandatangani" | "Belum Ditandatangani" | "Digital";
    rujukan?: "Ada" | "Tidak Ada";
    pengantarPasien?: "Ada" | "Tidak Ada";
  };
  status: "Selesai" | "Aktif" | "Dibatalkan";
  detailPath?: string;
  jadwalKontrol?: {
    tanggal: string;
    jam?: string;
    dokter: string;
    unit: UnitKunjungan;
    poli?: string;
    keterangan?: string;
    status: "Dijadwalkan" | "Selesai" | "Tidak Hadir" | "Batal";
  };
}

export interface BillingRincian { nama: string; qty: number; harga: number }

export interface BillingRecord {
  id: string;
  noTagihan: string;
  tanggal: string;
  noKunjungan: string;
  unit: UnitKunjungan;
  rincian: BillingRincian[];
  totalBiaya: number;
  dibayar: number;
  status: StatusTagihan;
  penjamin: string;
}

export type KategoriItem = "Tindakan" | "Obat" | "Laboratorium" | "Radiologi" | "Akomodasi" | "Lain-lain";
export type MetodeBayar  = "Tunai" | "Transfer" | "QRIS" | "BPJS" | "Asuransi";

export interface ItemTagihan {
  id: string;
  kategori: KategoriItem;
  nama: string;
  qty: number;
  satuan: string;
  harga: number;
  tanggal: string;
}

export interface DepositRecord {
  id: string;
  tanggal: string;
  waktu: string;
  jumlah: number;
  metode: MetodeBayar;
  keterangan?: string;
  kasir: string;
}

export interface KasirData {
  noTagihan: string;
  noKunjungan: string;
  tanggal: string;
  items: ItemTagihan[];
  deposits: DepositRecord[];
  penjamin: string;
  statusPembayaran: StatusTagihan;
}

export interface PatientMaster {
  id: string;
  noRM: string;
  nik: string;
  name: string;
  age: number;
  gender: "L" | "P";
  golonganDarah: GolonganDarah;
  tempatLahir: string;
  tanggalLahir: string;
  statusPerkawinan: StatusPerkawinan;
  agama: string;
  pekerjaan: string;
  pendidikan: string;
  suku: string;
  kewarganegaraan: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  noHp: string;
  email?: string;
  idSatusehat?: string;
  alergi?: string[];
  penjamin: PenjaminData;
  kontakDarurat: KontakDarurat;
  riwayatKunjungan: KunjunganRecord[];
  billing: BillingRecord[];
  kasir?: KasirData;
  terdaftar: string;
}

// ── Patient Master mock data ──────────────────────────────

export const patientMasterData: Record<string, PatientMaster> = {
  "RM-2025-005": {
    id: "RM-2025-005",
    noRM: "RM-2025-005",
    nik: "7172050312710003",
    name: "Joko Prasetyo",
    age: 55,
    gender: "L",
    golonganDarah: "B",
    tempatLahir: "Kotamobagu",
    tanggalLahir: "12 Maret 1971",
    statusPerkawinan: "Menikah",
    agama: "Islam",
    pekerjaan: "Wiraswasta",
    pendidikan: "SMA/Sederajat",
    suku: "Jawa",
    kewarganegaraan: "WNI",
    alamat: "Jl. Merdeka No. 45, Kel. Motoboi Kecil",
    kelurahan: "Motoboi Kecil",
    kecamatan: "Kotamobagu Barat",
    kota: "Kotamobagu",
    provinsi: "Sulawesi Utara",
    kodePos: "95711",
    noHp: "081234567890",
    email: "joko.prasetyo@email.com",
    idSatusehat: "P02029S00001234",
    alergi: ["Penisilin", "Aspirin"],
    terdaftar: "15 Januari 2020",
    penjamin: {
      tipe: "BPJS_Non_PBI",
      nama: "BPJS Kesehatan Non-PBI",
      nomor: "0001234567890",
      kelas: "2",
      berlakuSampai: "31 Desember 2026",
      noSEP: "0000000001100001",
    },
    kontakDarurat: {
      nama: "Sartini",
      hubungan: "Istri",
      noHp: "081298765432",
      alamat: "Jl. Merdeka No. 45, Kel. Motoboi Kecil, Kec. Kotamobagu Barat",
    },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00231", noKunjungan: "IGD/2026/04/0023",  tanggal: "14 Apr 2026", unit: "IGD",           dokter: "dr. Hendra Wijaya, Sp.EM",  keluhan: "Nyeri dada hebat, sesak napas, keringat dingin",  diagnosa: "NSTEMI + Syok Kardiogenik",    penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100231", kodeICD: "I21.4, R57.0", caraMasuk: "Datang Sendiri", klinisPath: "/ehis-care/igd/igd-1", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Aktif",   orderedServices: [{ unit: "Laboratorium", selesai: false }, { unit: "Farmasi", selesai: false }], detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k1", jadwalKontrol: { tanggal: "2 Jun 2026", jam: "08:30", dokter: "dr. Dewi Kusuma, Sp.JP", unit: "Rawat Jalan", poli: "Poli Jantung", keterangan: "Kontrol post NSTEMI, evaluasi fungsi jantung & EKG", status: "Dijadwalkan" } },
      { id: "k2", noPendaftaran: "REG-2026-00082", noKunjungan: "RJ/2026/02/1203",   tanggal: "20 Feb 2026", unit: "Rawat Jalan",   dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Kontrol hipertensi dan dislipidemia",            diagnosa: "Hipertensi, Dislipidemia",      penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100082", kodeICD: "I10, E78.5",        caraMasuk: "Datang Sendiri", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", orderedServices: [{ unit: "Farmasi", selesai: true }], detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k2", jadwalKontrol: { tanggal: "28 Mar 2026", jam: "09:00", dokter: "dr. Anisa Putri, Sp.PD", unit: "Rawat Jalan", poli: "Poli Penyakit Dalam", keterangan: "Kontrol hipertensi + cek profil lipid 3 bulan", status: "Selesai" } },
      { id: "k3", noPendaftaran: "REG-2025-00891", noKunjungan: "RI/2025/11/0089",   tanggal: "05 Nov 2025", unit: "Rawat Inap",    dokter: "dr. Dewi Kusuma, Sp.JP",    keluhan: "Nyeri dada, sesak napas",                        diagnosa: "Unstable Angina Pectoris",      penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100891", kodeICD: "I20.0",             caraMasuk: "Rujukan Poli",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Ada",        pengantarPasien: "Ada"       }, status: "Selesai", orderedServices: [{ unit: "Laboratorium", selesai: true }, { unit: "Farmasi", selesai: true }, { unit: "Radiologi", selesai: true }], detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k3", jadwalKontrol: { tanggal: "20 Feb 2026", jam: "10:00", dokter: "dr. Dewi Kusuma, Sp.JP", unit: "Rawat Jalan", poli: "Poli Jantung", keterangan: "Follow-up post rawat inap UAP", status: "Selesai" } },
      { id: "k4", noPendaftaran: "REG-2025-00234", noKunjungan: "RJ/2025/09/0876",   tanggal: "18 Sep 2025", unit: "Rawat Jalan",   dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Kontrol rutin PJK",                              diagnosa: "PJK, Hipertensi, Dislipidemia", penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100234", kodeICD: "I25.1, I10, E78.5", caraMasuk: "Datang Sendiri", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k4" },
      { id: "k5", noPendaftaran: "REG-2025-00235", noKunjungan: "LAB/2025/09/0441",  tanggal: "18 Sep 2025", unit: "Laboratorium",  dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Pemeriksaan lab rutin",                          diagnosa: "Profil lipid terkontrol",       penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890",                              kodeICD: "E78.5",             caraMasuk: "Order Dokter",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k5" },
      { id: "k6", noPendaftaran: "REG-2025-00290", noKunjungan: "RAD/2025/11/0201",  tanggal: "06 Nov 2025", unit: "Radiologi",     dokter: "dr. Dewi Kusuma, Sp.JP",    keluhan: "Foto thorax pre-op",                             diagnosa: "Cardiomegaly ringan",           penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100290", kodeICD: "I51.7",             caraMasuk: "Order Dokter",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-registration/pasien/RM-2025-005/kunjungan/k6" },
    ],
    billing: [
      {
        id: "b1", noTagihan: "INV/2026/04/0023", tanggal: "14 Apr 2026", noKunjungan: "IGD/2026/04/0023", unit: "IGD",
        rincian: [
          { nama: "Tindakan IGD",                    qty: 1, harga: 150000 },
          { nama: "EKG 12 Lead",                     qty: 1, harga: 75000  },
          { nama: "Pemeriksaan Darah Lengkap",        qty: 1, harga: 120000 },
          { nama: "Troponin I Kuantitatif",           qty: 1, harga: 250000 },
          { nama: "Obat-obatan IGD",                 qty: 1, harga: 180000 },
        ],
        totalBiaya: 775000, dibayar: 0, status: "Proses Klaim", penjamin: "BPJS Kesehatan",
      },
      {
        id: "b2", noTagihan: "INV/2026/02/1203", tanggal: "20 Feb 2026", noKunjungan: "RJ/2026/02/1203", unit: "Rawat Jalan",
        rincian: [
          { nama: "Konsultasi Rawat Jalan Spesialis", qty: 1, harga: 50000 },
          { nama: "Resep Obat Rutin (30 hari)",       qty: 1, harga: 95000 },
        ],
        totalBiaya: 145000, dibayar: 145000, status: "Ditanggung", penjamin: "BPJS Kesehatan",
      },
      {
        id: "b3", noTagihan: "INV/2025/11/0089", tanggal: "05 Nov 2025", noKunjungan: "RI/2025/11/0089", unit: "Rawat Inap",
        rincian: [
          { nama: "Rawat Inap Kelas II (3 hari)",    qty: 3, harga: 300000 },
          { nama: "Tindakan Medis Kardiologi",        qty: 1, harga: 450000 },
          { nama: "Laboratorium",                    qty: 1, harga: 320000 },
          { nama: "Obat-obatan",                     qty: 1, harga: 280000 },
        ],
        totalBiaya: 1950000, dibayar: 1950000, status: "Ditanggung", penjamin: "BPJS Kesehatan",
      },
    ],
    kasir: {
      noTagihan: "INV/2026/04/0023",
      noKunjungan: "IGD/2026/04/0023",
      tanggal: "14 Apr 2026",
      penjamin: "BPJS Kesehatan Non-PBI",
      statusPembayaran: "Proses Klaim",
      items: [
        { id: "i01", kategori: "Tindakan",     nama: "Tindakan IGD Rawat",           qty: 1, satuan: "Kali",  harga: 150000, tanggal: "14 Apr 2026" },
        { id: "i02", kategori: "Tindakan",     nama: "EKG 12 Lead",                  qty: 1, satuan: "Kali",  harga: 75000,  tanggal: "14 Apr 2026" },
        { id: "i03", kategori: "Tindakan",     nama: "Pemasangan IV Line",            qty: 2, satuan: "Kali",  harga: 45000,  tanggal: "14 Apr 2026" },
        { id: "i04", kategori: "Tindakan",     nama: "Pemberian O2 via NRM",          qty: 1, satuan: "Kali",  harga: 50000,  tanggal: "14 Apr 2026" },
        { id: "i05", kategori: "Laboratorium", nama: "Darah Lengkap",                qty: 1, satuan: "Panel", harga: 120000, tanggal: "14 Apr 2026" },
        { id: "i06", kategori: "Laboratorium", nama: "Troponin I Kuantitatif",        qty: 1, satuan: "Tes",   harga: 250000, tanggal: "14 Apr 2026" },
        { id: "i07", kategori: "Laboratorium", nama: "BMP / Kimia Darah",             qty: 1, satuan: "Panel", harga: 185000, tanggal: "14 Apr 2026" },
        { id: "i08", kategori: "Obat",         nama: "Aspirin 300mg tab",             qty: 1, satuan: "Tab",   harga: 2500,   tanggal: "14 Apr 2026" },
        { id: "i09", kategori: "Obat",         nama: "Clopidogrel 75mg tab",          qty: 4, satuan: "Tab",   harga: 8500,   tanggal: "14 Apr 2026" },
        { id: "i10", kategori: "Obat",         nama: "Morfin 10mg/mL inj",            qty: 1, satuan: "Amp",   harga: 45000,  tanggal: "14 Apr 2026" },
        { id: "i11", kategori: "Obat",         nama: "NaCl 0.9% 500mL",              qty: 2, satuan: "Flak",  harga: 25000,  tanggal: "14 Apr 2026" },
        { id: "i12", kategori: "Obat",         nama: "Infus set",                    qty: 2, satuan: "Set",   harga: 15000,  tanggal: "14 Apr 2026" },
        { id: "i13", kategori: "Akomodasi",    nama: "Jasa Pelayanan IGD",           qty: 1, satuan: "Hari",  harga: 100000, tanggal: "14 Apr 2026" },
        { id: "i14", kategori: "Akomodasi",    nama: "Penggunaan Ruang Resusitasi",  qty: 1, satuan: "Hari",  harga: 150000, tanggal: "14 Apr 2026" },
      ],
      deposits: [
        { id: "dp1", tanggal: "14 Apr 2026", waktu: "11:05", jumlah: 200000, metode: "Tunai",    keterangan: "Deposit awal keluarga pasien", kasir: "Kasir 1 - Rina Marlina" },
        { id: "dp2", tanggal: "14 Apr 2026", waktu: "14:30", jumlah: 300000, metode: "Transfer", keterangan: "Transfer BCA a/n Sartini",     kasir: "Kasir 2 - Doni Kurnia"  },
      ],
    },
  },
  "RM-2025-001": {
    id: "RM-2025-001", noRM: "RM-2025-001", nik: "7172040103800001",
    name: "Budi Santoso", age: 45, gender: "L", golonganDarah: "O",
    tempatLahir: "Kotamobagu", tanggalLahir: "1 Januari 1980",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Pegawai Swasta",
    pendidikan: "S1", suku: "Jawa", kewarganegaraan: "WNI",
    alamat: "Jl. Diponegoro No. 21", kelurahan: "Gogagoman",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "081234001001", terdaftar: "10 Maret 2021",
    penjamin: { tipe: "Umum", nama: "Umum / Mandiri" },
    kontakDarurat: { nama: "Sri Santoso", hubungan: "Istri", noHp: "081234001002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00180", noKunjungan: "RJ/2026/04/0180",
        tanggal: "10 Apr 2026", unit: "Rawat Jalan", dokter: "dr. Anisa Putri, Sp.PD",
        keluhan: "Kontrol hipertensi rutin", diagnosa: "Hipertensi Stage 1", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-001/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-002": {
    id: "RM-2025-002", noRM: "RM-2025-002", nik: "7172046204940002",
    name: "Siti Rahayu", age: 32, gender: "P", golonganDarah: "AB",
    tempatLahir: "Manado", tanggalLahir: "22 April 1994",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Guru",
    pendidikan: "S1", suku: "Bugis", kewarganegaraan: "WNI",
    alamat: "Jl. Sam Ratulangi No. 88", kelurahan: "Kotobangon",
    kecamatan: "Kotamobagu Timur", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "082234002001", terdaftar: "5 Juni 2022",
    penjamin: { tipe: "BPJS_Non_PBI", nama: "BPJS Kesehatan Non-PBI", nomor: "0002345678901", kelas: "1", berlakuSampai: "31 Des 2026" },
    kontakDarurat: { nama: "Rudi Hartono", hubungan: "Suami", noHp: "082234002002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00210", noKunjungan: "IGD/2026/04/0021",
        tanggal: "12 Apr 2026", unit: "IGD", dokter: "dr. Hendra Wijaya, Sp.EM",
        keluhan: "Patah tulang lengan kanan akibat KLL", diagnosa: "Fraktur Radius Distal Dx", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-002/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-003": {
    id: "RM-2025-003", noRM: "RM-2025-003", nik: "7172041206570003",
    name: "Ahmad Fauzi", age: 67, gender: "L", golonganDarah: "O",
    tempatLahir: "Gorontalo", tanggalLahir: "12 Juni 1957",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Pensiunan PNS",
    pendidikan: "S1", suku: "Gorontalo", kewarganegaraan: "WNI",
    alamat: "Jl. Merdeka No. 10", kelurahan: "Mogolaing",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "081334003001", terdaftar: "18 Agustus 2019",
    penjamin: { tipe: "BPJS_PBI", nama: "BPJS Kesehatan PBI", nomor: "0003456789012", kelas: "3", berlakuSampai: "31 Des 2026" },
    kontakDarurat: { nama: "Fatimah Fauzi", hubungan: "Istri", noHp: "081334003002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00090", noKunjungan: "RI/2026/03/0090",
        tanggal: "1 Mar 2026", unit: "Rawat Inap", dokter: "dr. Dewi Kusuma, Sp.JP",
        keluhan: "Sesak napas, nyeri dada, bengkak kaki", diagnosa: "CHF Grade III + AF", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-003/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-004": {
    id: "RM-2025-004", noRM: "RM-2025-004", nik: "7172044507980004",
    name: "Rina Marlina", age: 28, gender: "P", golonganDarah: "A",
    tempatLahir: "Kotamobagu", tanggalLahir: "5 Juli 1998",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Bidan",
    pendidikan: "D3", suku: "Minahasa", kewarganegaraan: "WNI",
    alamat: "Jl. Kartini No. 33", kelurahan: "Kotamobagu",
    kecamatan: "Kotamobagu Selatan", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "085634004001", terdaftar: "20 Februari 2023",
    penjamin: { tipe: "Asuransi", nama: "Prudential Health", noPolis: "PRU-2024-004001" },
    kontakDarurat: { nama: "Dede Marlina", hubungan: "Suami", noHp: "085634004002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00140", noKunjungan: "RJ/2026/03/0140",
        tanggal: "15 Mar 2026", unit: "Rawat Jalan", dokter: "dr. Faisal Rahman, Sp.OG",
        keluhan: "ANC trimester 3, kontrol kehamilan", diagnosa: "G2P1A0 36 minggu", status: "Aktif",
        detailPath: "/ehis-registration/pasien/RM-2025-004/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-006": {
    id: "RM-2025-006", noRM: "RM-2025-006", nik: "7172044108850006",
    name: "Dewi Anggraini", age: 41, gender: "P", golonganDarah: "B",
    tempatLahir: "Surabaya", tanggalLahir: "1 Agustus 1985",
    statusPerkawinan: "Menikah", agama: "Kristen", pekerjaan: "Wiraswasta",
    pendidikan: "S1", suku: "Jawa", kewarganegaraan: "WNI",
    alamat: "Jl. Pattimura No. 17", kelurahan: "Matali",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "087834006001", terdaftar: "14 April 2020",
    penjamin: { tipe: "Umum", nama: "Umum / Mandiri" },
    kontakDarurat: { nama: "Budi Anggraini", hubungan: "Suami", noHp: "087834006002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00072", noKunjungan: "RJ/2026/02/0072",
        tanggal: "25 Feb 2026", unit: "Rawat Jalan", dokter: "dr. Anisa Putri, Sp.PD",
        keluhan: "Kontrol DM dan tiroid", diagnosa: "DM Tipe 2, Hipotiroid", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-006/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-007": {
    id: "RM-2025-007", noRM: "RM-2025-007", nik: "7172041007520007",
    name: "Hasan Basri", age: 72, gender: "L", golonganDarah: "A",
    tempatLahir: "Makassar", tanggalLahir: "10 Juli 1952",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Pensiunan TNI",
    pendidikan: "SMA/Sederajat", suku: "Bugis", kewarganegaraan: "WNI",
    alamat: "Jl. Jend. Sudirman No. 5", kelurahan: "Gogagoman",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "081234007001", terdaftar: "2 Maret 2018",
    penjamin: { tipe: "BPJS_Non_PBI", nama: "BPJS Kesehatan Non-PBI", nomor: "0007890123456", kelas: "1", berlakuSampai: "31 Des 2026" },
    kontakDarurat: { nama: "Salmah Basri", hubungan: "Istri", noHp: "081234007002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00030", noKunjungan: "RI/2026/01/0030",
        tanggal: "20 Jan 2026", unit: "Rawat Inap", dokter: "dr. Dewi Kusuma, Sp.JP",
        keluhan: "Gangguan irama jantung, palpitasi, pusing", diagnosa: "Atrial Flutter + HHD", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-007/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-009": {
    id: "RM-2025-009", noRM: "RM-2025-009", nik: "7172040609770009",
    name: "Bambang Nugroho", age: 47, gender: "L", golonganDarah: "O",
    tempatLahir: "Yogyakarta", tanggalLahir: "6 September 1977",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "PNS",
    pendidikan: "S2", suku: "Jawa", kewarganegaraan: "WNI",
    alamat: "Jl. Ahmad Yani No. 44", kelurahan: "Kotobangon",
    kecamatan: "Kotamobagu Timur", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "082234009001", terdaftar: "7 Juli 2021",
    penjamin: { tipe: "BPJS_Non_PBI", nama: "BPJS Kesehatan Non-PBI", nomor: "0009012345678", kelas: "2", berlakuSampai: "31 Des 2026" },
    kontakDarurat: { nama: "Wulandari Nugroho", hubungan: "Istri", noHp: "082234009002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00162", noKunjungan: "RJ/2026/04/0162",
        tanggal: "5 Apr 2026", unit: "Rawat Jalan", dokter: "dr. Rizal Akbar, Sp.OT",
        keluhan: "Nyeri lutut kiri pasca trauma", diagnosa: "Tear Meniskus Medial Sinistra", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-009/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-018": {
    id: "RM-2025-018", noRM: "RM-2025-018", nik: "7172041506640018",
    name: "Darmawan Santoso", age: 62, gender: "L", golonganDarah: "B",
    tempatLahir: "Bandung", tanggalLahir: "15 Juni 1964",
    statusPerkawinan: "Menikah", agama: "Islam", pekerjaan: "Pengusaha",
    pendidikan: "S1", suku: "Sunda", kewarganegaraan: "WNI",
    alamat: "Jl. Hasanuddin No. 8", kelurahan: "Mogolaing",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "081334018001", terdaftar: "9 November 2020",
    penjamin: { tipe: "BPJS_PBI", nama: "BPJS Kesehatan PBI", nomor: "0018901234567", kelas: "3", berlakuSampai: "31 Des 2026" },
    kontakDarurat: { nama: "Lina Santoso", hubungan: "Istri", noHp: "081334018002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00115", noKunjungan: "RI/2026/03/0115",
        tanggal: "8 Mar 2026", unit: "Rawat Inap", dokter: "dr. Anisa Putri, Sp.PD",
        keluhan: "Sesak napas, batuk produktif, demam 3 hari", diagnosa: "Pneumonia Komunitas + PPOK", status: "Aktif",
        detailPath: "/ehis-registration/pasien/RM-2025-018/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-021": {
    id: "RM-2025-021", noRM: "RM-2025-021", nik: "7172044012020021",
    name: "Mega Lestari", age: 24, gender: "P", golonganDarah: "A",
    tempatLahir: "Kotamobagu", tanggalLahir: "10 Desember 2002",
    statusPerkawinan: "Belum Menikah", agama: "Islam", pekerjaan: "Mahasiswi",
    pendidikan: "S1", suku: "Minahasa", kewarganegaraan: "WNI",
    alamat: "Jl. Pangeran Antasari No. 3", kelurahan: "Matali",
    kecamatan: "Kotamobagu Barat", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "085634021001", terdaftar: "3 Desember 2024",
    penjamin: { tipe: "Jamkesda", nama: "Jamkesda Kotamobagu", nomor: "JKSD-2024-00021" },
    kontakDarurat: { nama: "Sari Lestari", hubungan: "Ibu", noHp: "085634021002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00062", noKunjungan: "RJ/2026/02/0062",
        tanggal: "20 Feb 2026", unit: "Rawat Jalan", dokter: "dr. Hendra Wijaya, Sp.EM",
        keluhan: "Demam tinggi 39°C, nyeri kepala, mual", diagnosa: "Demam Dengue Grade II", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-021/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-033": {
    id: "RM-2025-033", noRM: "RM-2025-033", nik: "7172044402070033",
    name: "Nurul Hidayah", age: 19, gender: "P", golonganDarah: "O",
    tempatLahir: "Kotamobagu", tanggalLahir: "4 Februari 2007",
    statusPerkawinan: "Belum Menikah", agama: "Islam", pekerjaan: "Pelajar",
    pendidikan: "SMA/Sederajat", suku: "Jawa", kewarganegaraan: "WNI",
    alamat: "Jl. Imam Bonjol No. 15", kelurahan: "Kotobangon",
    kecamatan: "Kotamobagu Timur", kota: "Kotamobagu", provinsi: "Sulawesi Utara", kodePos: "95711",
    noHp: "087834033001", terdaftar: "22 Oktober 2025",
    penjamin: { tipe: "Asuransi", nama: "Allianz Health", noPolis: "ALZ-2025-033001" },
    kontakDarurat: { nama: "Wahyu Hidayah", hubungan: "Ayah", noHp: "087834033002" },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00040", noKunjungan: "RJ/2026/01/0040",
        tanggal: "28 Jan 2026", unit: "Rawat Jalan", dokter: "dr. Anisa Putri, Sp.PD",
        keluhan: "Diare dan muntah, lemas, dehidrasi ringan", diagnosa: "Gastroenteritis Akut", status: "Selesai",
        detailPath: "/ehis-registration/pasien/RM-2025-033/kunjungan/k1" },
    ],
    billing: [],
  },
  "RM-2025-012": {
    id: "RM-2025-012",
    noRM: "RM-2025-012",
    nik: "7172056207880012",
    name: "Kartini Wulandari",
    age: 38,
    gender: "P",
    golonganDarah: "A",
    tempatLahir: "Manado",
    tanggalLahir: "22 Juli 1988",
    statusPerkawinan: "Menikah",
    agama: "Kristen",
    pekerjaan: "Ibu Rumah Tangga",
    pendidikan: "D3",
    suku: "Minahasa",
    kewarganegaraan: "WNI",
    alamat: "Jl. Veteran No. 12",
    kelurahan: "Matali",
    kecamatan: "Kotamobagu Barat",
    kota: "Kotamobagu",
    provinsi: "Sulawesi Utara",
    kodePos: "95711",
    noHp: "085678901234",
    idSatusehat: "P02029S00001235",
    alergi: ["Sulfonamida"],
    terdaftar: "3 Maret 2022",
    penjamin: {
      tipe: "Umum",
      nama: "Umum / Mandiri",
    },
    kontakDarurat: {
      nama: "Andi Wulandari",
      hubungan: "Suami",
      noHp: "081290123456",
      alamat: "Jl. Veteran No. 12, Kel. Matali",
    },
    riwayatKunjungan: [
      { id: "k1", noPendaftaran: "REG-2026-00241", noKunjungan: "IGD/2026/04/0024", tanggal: "14 Apr 2026", unit: "IGD",         dokter: "dr. Hendra Wijaya, Sp.EM", keluhan: "Penurunan kesadaran, GCS 10",  diagnosa: "Hipoglikemia berat", penjamin: "Umum/Mandiri", noPenjamin: "UM-2026-00241", kodeICD: "E16.0", caraMasuk: "Datang Sendiri", klinisPath: "/ehis-care/igd/igd-2", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada", pengantarPasien: "Tidak Ada" }, status: "Aktif",  orderedServices: [{ unit: "Laboratorium", selesai: false }, { unit: "Farmasi", selesai: false }], detailPath: "/ehis-registration/pasien/RM-2025-012/kunjungan/k1", jadwalKontrol: { tanggal: "21 Mei 2026", jam: "09:00", dokter: "dr. Anisa Putri, Sp.PD", unit: "Rawat Jalan", poli: "Poli Penyakit Dalam", keterangan: "Kontrol post hipoglikemia, evaluasi regimen insulin", status: "Dijadwalkan" } },
      { id: "k2", noPendaftaran: "REG-2026-00047", noKunjungan: "RJ/2026/01/0521",  tanggal: "10 Jan 2026", unit: "Rawat Jalan", dokter: "dr. Anisa Putri, Sp.PD",   keluhan: "Kontrol DM tipe 2",           diagnosa: "DM Tipe 2",          penjamin: "Umum/Mandiri", noPenjamin: "UM-2026-00047", kodeICD: "E11.9", caraMasuk: "Datang Sendiri",                                      dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada", pengantarPasien: "Tidak Ada" }, status: "Selesai", orderedServices: [{ unit: "Laboratorium", selesai: true }, { unit: "Farmasi", selesai: true }], detailPath: "/ehis-registration/pasien/RM-2025-012/kunjungan/k2", jadwalKontrol: { tanggal: "10 Feb 2026", jam: "09:30", dokter: "dr. Anisa Putri, Sp.PD", unit: "Rawat Jalan", poli: "Poli Penyakit Dalam", keterangan: "Kontrol DM + cek HbA1c", status: "Selesai" } },
    ],
    billing: [
      {
        id: "b1", noTagihan: "INV/2026/04/0024", tanggal: "14 Apr 2026", noKunjungan: "IGD/2026/04/0024", unit: "IGD",
        rincian: [
          { nama: "Tindakan IGD",                    qty: 1, harga: 150000 },
          { nama: "Pemeriksaan GDS",                 qty: 3, harga: 25000  },
          { nama: "Dextrose 40% IV",                 qty: 2, harga: 35000  },
          { nama: "Infus D10% + set infus",          qty: 1, harga: 85000  },
        ],
        totalBiaya: 380000, dibayar: 0, status: "Belum Lunas", penjamin: "Umum / Mandiri",
      },
    ],
    kasir: {
      noTagihan: "INV/2026/04/0024",
      noKunjungan: "IGD/2026/04/0024",
      tanggal: "14 Apr 2026",
      penjamin: "Umum / Mandiri",
      statusPembayaran: "Belum Lunas",
      items: [
        { id: "i01", kategori: "Tindakan",     nama: "Tindakan IGD Rawat",    qty: 1, satuan: "Kali",  harga: 150000, tanggal: "14 Apr 2026" },
        { id: "i02", kategori: "Laboratorium", nama: "Pemeriksaan GDS",       qty: 3, satuan: "Tes",   harga: 25000,  tanggal: "14 Apr 2026" },
        { id: "i03", kategori: "Obat",         nama: "Dextrose 40% inj",      qty: 2, satuan: "Flak",  harga: 35000,  tanggal: "14 Apr 2026" },
        { id: "i04", kategori: "Obat",         nama: "Infus D10% 500mL",      qty: 1, satuan: "Flak",  harga: 55000,  tanggal: "14 Apr 2026" },
        { id: "i05", kategori: "Obat",         nama: "Infus set",             qty: 1, satuan: "Set",   harga: 15000,  tanggal: "14 Apr 2026" },
        { id: "i06", kategori: "Akomodasi",    nama: "Jasa Pelayanan IGD",    qty: 1, satuan: "Hari",  harga: 100000, tanggal: "14 Apr 2026" },
      ],
      deposits: [],
    },
  },
};

// ── Rawat Inap types & mock data ──────────────────────────

export type RIStatus   = "Aktif" | "Observasi" | "Kritis" | "Pulang Hari Ini" | "Konsultasi";
export type RIPenjamin = "BPJS_PBI" | "BPJS_Non_PBI" | "Umum" | "Asuransi" | "Jamkesda";
export type RIKelas    = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";

export interface RawatInapPatient {
  id:        string;
  noRM:      string;
  name:      string;
  age:       number;
  gender:    "L" | "P";
  ruangan:   string;
  kelas:     RIKelas;
  noBed:     string;
  dpjp:      string;
  spesialis: string;
  diagnosis: string;
  kodeIcd:   string;
  admitDate: string;
  hariKe:    number;
  status:    RIStatus;
  penjamin:  RIPenjamin;
  noBpjs?:   string;
  catatan?:  string;
}

export interface RIBed {
  id:             string;
  nomor:          string;
  status:         "Terisi" | "Tersedia" | "Maintenance" | "Dipesan";
  pasienNama?:    string;
  pasienRM?:      string;
  hariKe?:        number;
  penjamin?:      RIPenjamin;
  isKritis?:      boolean;
  rencanaKeluar?: boolean;
}

export interface RIRuangan {
  id:    string;
  nama:  string;
  kelas: RIKelas;
  beds:  RIBed[];
}

export interface RawatInapStats {
  totalAktif:    number;
  masukHariIni:  number;
  rencanaKeluar: number;
  bor:           number;
  alos:          number;
  bedsTotal:     number;
  bedsAvailable: number;
  kritis:        number;
}

export const rawatInapStats: RawatInapStats = {
  totalAktif: 74, masukHariIni: 8, rencanaKeluar: 5,
  bor: 78, alos: 4.2, bedsTotal: 95, bedsAvailable: 21, kritis: 2,
};

export const rawatInapPatients: RawatInapPatient[] = [
  {
    id: "ri-1", noRM: "RM-2025-003", name: "Ahmad Fauzi", age: 67, gender: "L",
    ruangan: "Mawar A", kelas: "Kelas_2", noBed: "2A-1",
    dpjp: "dr. Dewi Kusuma, Sp.JP", spesialis: "Sp.JP",
    diagnosis: "Gagal Jantung Kongestif", kodeIcd: "I50.0",
    admitDate: "2025-05-03", hariKe: 5, status: "Aktif", penjamin: "BPJS_Non_PBI",
  },
  {
    id: "ri-2", noRM: "RM-2025-002", name: "Siti Rahayu", age: 32, gender: "P",
    ruangan: "Melati A", kelas: "Kelas_1", noBed: "1A-2",
    dpjp: "dr. Rizal Akbar, Sp.OT", spesialis: "Sp.OT",
    diagnosis: "Fraktur Os Radius Dekstra", kodeIcd: "S52.1",
    admitDate: "2025-05-06", hariKe: 2, status: "Aktif", penjamin: "BPJS_Non_PBI",
  },
  {
    id: "ri-3", noRM: "RM-2025-007", name: "Hasan Basri", age: 72, gender: "L",
    ruangan: "Ruang ICU", kelas: "ICU", noBed: "ICU-1",
    dpjp: "dr. Hendra Wijaya, Sp.EM", spesialis: "Sp.EM",
    diagnosis: "Syok Sepsis", kodeIcd: "A41.9",
    admitDate: "2025-05-05", hariKe: 3, status: "Kritis", penjamin: "BPJS_PBI",
    catatan: "Pasang ventilator, monitoring ketat",
  },
  {
    id: "ri-4", noRM: "RM-2025-004", name: "Rina Marlina", age: 28, gender: "P",
    ruangan: "Mawar B", kelas: "Kelas_2", noBed: "2B-1",
    dpjp: "dr. Faisal Rahman, Sp.OG", spesialis: "Sp.OG",
    diagnosis: "Partus Spontan Post SC", kodeIcd: "O82",
    admitDate: "2025-05-07", hariKe: 1, status: "Pulang Hari Ini", penjamin: "BPJS_Non_PBI",
  },
  {
    id: "ri-5", noRM: "RM-2025-020", name: "Bambang Sutrisno", age: 58, gender: "L",
    ruangan: "Ruang Anggrek", kelas: "VIP", noBed: "VIP-2",
    dpjp: "dr. Anisa Putri, Sp.PD", spesialis: "Sp.PD",
    diagnosis: "DM Tipe 2 dengan Ulkus Diabetik", kodeIcd: "E11.7",
    admitDate: "2025-05-01", hariKe: 7, status: "Aktif", penjamin: "Umum",
  },
  {
    id: "ri-6", noRM: "RM-2025-022", name: "Kartika Sari", age: 45, gender: "P",
    ruangan: "Ruang HCU", kelas: "HCU", noBed: "HCU-2",
    dpjp: "dr. Dewi Kusuma, Sp.JP", spesialis: "Sp.JP",
    diagnosis: "Aritmia Jantung", kodeIcd: "I49.9",
    admitDate: "2025-05-06", hariKe: 2, status: "Observasi", penjamin: "Asuransi",
  },
  {
    id: "ri-7", noRM: "RM-2025-038", name: "Doni Pratama", age: 34, gender: "L",
    ruangan: "Kenanga A", kelas: "Kelas_3", noBed: "3A-5",
    dpjp: "dr. Budianto, Sp.B", spesialis: "Sp.B",
    diagnosis: "Apendisitis Akut Post Op", kodeIcd: "K35.8",
    admitDate: "2025-05-07", hariKe: 1, status: "Aktif", penjamin: "BPJS_PBI",
  },
  {
    id: "ri-8", noRM: "RM-2025-028", name: "Nur Aini", age: 55, gender: "P",
    ruangan: "Melati B", kelas: "Kelas_1", noBed: "1B-3",
    dpjp: "dr. Anisa Putri, Sp.PD", spesialis: "Sp.PD",
    diagnosis: "Hipertensi Urgensi", kodeIcd: "I10",
    admitDate: "2025-05-05", hariKe: 3, status: "Aktif", penjamin: "BPJS_Non_PBI",
  },
  {
    id: "ri-9", noRM: "RM-2025-019", name: "Agus Setiawan", age: 48, gender: "L",
    ruangan: "Kenanga B", kelas: "Kelas_3", noBed: "3B-2",
    dpjp: "dr. Rizal Akbar, Sp.OT", spesialis: "Sp.OT",
    diagnosis: "Fraktur Os Femur Sinistra", kodeIcd: "S72.0",
    admitDate: "2025-05-04", hariKe: 4, status: "Aktif", penjamin: "BPJS_PBI",
  },
  {
    id: "ri-10", noRM: "RM-2025-024", name: "Indah Pertiwi", age: 23, gender: "P",
    ruangan: "Ruang Isolasi", kelas: "Isolasi", noBed: "ISO-1",
    dpjp: "dr. Hendra Wijaya, Sp.EM", spesialis: "Sp.EM",
    diagnosis: "Tuberkulosis Paru", kodeIcd: "A15.0",
    admitDate: "2025-05-02", hariKe: 6, status: "Aktif", penjamin: "BPJS_PBI",
  },
  {
    id: "ri-11", noRM: "RM-2025-043", name: "Slamet Riyadi", age: 63, gender: "L",
    ruangan: "Ruang ICU", kelas: "ICU", noBed: "ICU-3",
    dpjp: "dr. Hendra Wijaya, Sp.EM", spesialis: "Sp.EM",
    diagnosis: "Stroke Iskemik", kodeIcd: "I63.9",
    admitDate: "2025-05-03", hariKe: 5, status: "Kritis", penjamin: "BPJS_Non_PBI",
    catatan: "Monitoring GCS, fisioterapi rutin",
  },
  {
    id: "ri-12", noRM: "RM-2025-037", name: "Wulandari", age: 37, gender: "P",
    ruangan: "Mawar A", kelas: "Kelas_2", noBed: "2A-6",
    dpjp: "dr. Faisal Rahman, Sp.OG", spesialis: "Sp.OG",
    diagnosis: "Preeklampsia Berat", kodeIcd: "O14.1",
    admitDate: "2025-05-06", hariKe: 2, status: "Observasi", penjamin: "BPJS_PBI",
  },
  {
    id: "ri-13", noRM: "RM-2025-031", name: "Rachmat Hidayat", age: 52, gender: "L",
    ruangan: "Ruang Anggrek", kelas: "VIP", noBed: "VIP-4",
    dpjp: "dr. Dewi Kusuma, Sp.JP", spesialis: "Sp.JP",
    diagnosis: "STEMI Anterior", kodeIcd: "I21.0",
    admitDate: "2025-05-02", hariKe: 6, status: "Pulang Hari Ini", penjamin: "Asuransi",
  },
  {
    id: "ri-14", noRM: "RM-2025-039", name: "Fitri Andriani", age: 29, gender: "P",
    ruangan: "Kenanga A", kelas: "Kelas_3", noBed: "3A-8",
    dpjp: "dr. Budianto, Sp.B", spesialis: "Sp.B",
    diagnosis: "Post Herniotomi", kodeIcd: "K40.9",
    admitDate: "2025-05-06", hariKe: 2, status: "Aktif", penjamin: "BPJS_PBI",
  },
  {
    id: "ri-15", noRM: "RM-2025-045", name: "Sumarno", age: 70, gender: "L",
    ruangan: "Melati B", kelas: "Kelas_1", noBed: "1B-5",
    dpjp: "dr. Anisa Putri, Sp.PD", spesialis: "Sp.PD",
    diagnosis: "PPOK Eksaserbasi Akut", kodeIcd: "J44.1",
    admitDate: "2025-05-04", hariKe: 4, status: "Konsultasi", penjamin: "Jamkesda",
  },
];

export const rawatInapRuangan: RIRuangan[] = [
  {
    id: "ri-icu", nama: "Ruang ICU", kelas: "ICU",
    beds: [
      { id: "icu-1", nomor: "ICU-1", status: "Terisi",  pasienNama: "Hasan Basri",   pasienRM: "RM-2025-007", hariKe: 3, penjamin: "BPJS_PBI",     isKritis: true },
      { id: "icu-2", nomor: "ICU-2", status: "Tersedia" },
      { id: "icu-3", nomor: "ICU-3", status: "Terisi",  pasienNama: "Slamet Riyadi", pasienRM: "RM-2025-043", hariKe: 5, penjamin: "BPJS_Non_PBI", isKritis: true },
      { id: "icu-4", nomor: "ICU-4", status: "Tersedia" },
      { id: "icu-5", nomor: "ICU-5", status: "Tersedia" },
      { id: "icu-6", nomor: "ICU-6", status: "Tersedia" },
      { id: "icu-7", nomor: "ICU-7", status: "Maintenance" },
      { id: "icu-8", nomor: "ICU-8", status: "Tersedia" },
    ],
  },
  {
    id: "ri-hcu", nama: "Ruang HCU", kelas: "HCU",
    beds: [
      { id: "hcu-1", nomor: "HCU-1", status: "Tersedia" },
      { id: "hcu-2", nomor: "HCU-2", status: "Terisi",  pasienNama: "Kartika Sari", pasienRM: "RM-2025-022", hariKe: 2, penjamin: "Asuransi" },
      { id: "hcu-3", nomor: "HCU-3", status: "Tersedia" },
      { id: "hcu-4", nomor: "HCU-4", status: "Tersedia" },
      { id: "hcu-5", nomor: "HCU-5", status: "Tersedia" },
      { id: "hcu-6", nomor: "HCU-6", status: "Dipesan" },
    ],
  },
  {
    id: "ri-iso", nama: "Ruang Isolasi", kelas: "Isolasi",
    beds: [
      { id: "iso-1", nomor: "ISO-1", status: "Terisi",  pasienNama: "Indah Pertiwi", pasienRM: "RM-2025-024", hariKe: 6, penjamin: "BPJS_PBI" },
      { id: "iso-2", nomor: "ISO-2", status: "Tersedia" },
      { id: "iso-3", nomor: "ISO-3", status: "Tersedia" },
      { id: "iso-4", nomor: "ISO-4", status: "Maintenance" },
    ],
  },
  {
    id: "ri-vip", nama: "Ruang Anggrek", kelas: "VIP",
    beds: [
      { id: "vip-1", nomor: "VIP-1", status: "Tersedia" },
      { id: "vip-2", nomor: "VIP-2", status: "Terisi",  pasienNama: "Bambang Sutrisno", pasienRM: "RM-2025-020", hariKe: 7, penjamin: "Umum" },
      { id: "vip-3", nomor: "VIP-3", status: "Tersedia" },
      { id: "vip-4", nomor: "VIP-4", status: "Terisi",  pasienNama: "Rachmat Hidayat",  pasienRM: "RM-2025-031", hariKe: 6, penjamin: "Asuransi", rencanaKeluar: true },
      { id: "vip-5", nomor: "VIP-5", status: "Maintenance" },
    ],
  },
  {
    id: "ri-k1", nama: "Melati A & B", kelas: "Kelas_1",
    beds: [
      { id: "ma1", nomor: "1A-1", status: "Tersedia" },
      { id: "ma2", nomor: "1A-2", status: "Terisi",  pasienNama: "Siti Rahayu", pasienRM: "RM-2025-002", hariKe: 2, penjamin: "BPJS_Non_PBI" },
      { id: "ma3", nomor: "1A-3", status: "Tersedia" },
      { id: "ma4", nomor: "1A-4", status: "Dipesan" },
      { id: "ma5", nomor: "1A-5", status: "Tersedia" },
      { id: "ma6", nomor: "1A-6", status: "Tersedia" },
      { id: "mb1", nomor: "1B-1", status: "Tersedia" },
      { id: "mb2", nomor: "1B-2", status: "Tersedia" },
      { id: "mb3", nomor: "1B-3", status: "Terisi",  pasienNama: "Nur Aini",  pasienRM: "RM-2025-028", hariKe: 3, penjamin: "BPJS_Non_PBI" },
      { id: "mb4", nomor: "1B-4", status: "Tersedia" },
      { id: "mb5", nomor: "1B-5", status: "Terisi",  pasienNama: "Sumarno",   pasienRM: "RM-2025-045", hariKe: 4, penjamin: "Jamkesda" },
      { id: "mb6", nomor: "1B-6", status: "Tersedia" },
    ],
  },
  {
    id: "ri-k2", nama: "Mawar A & B", kelas: "Kelas_2",
    beds: [
      { id: "wa1", nomor: "2A-1", status: "Terisi",  pasienNama: "Ahmad Fauzi",  pasienRM: "RM-2025-003", hariKe: 5, penjamin: "BPJS_Non_PBI" },
      { id: "wa2", nomor: "2A-2", status: "Tersedia" },
      { id: "wa3", nomor: "2A-3", status: "Tersedia" },
      { id: "wa4", nomor: "2A-4", status: "Tersedia" },
      { id: "wa5", nomor: "2A-5", status: "Tersedia" },
      { id: "wa6", nomor: "2A-6", status: "Terisi",  pasienNama: "Wulandari",   pasienRM: "RM-2025-037", hariKe: 2, penjamin: "BPJS_PBI" },
      { id: "wa7", nomor: "2A-7", status: "Tersedia" },
      { id: "wa8", nomor: "2A-8", status: "Tersedia" },
      { id: "wb1", nomor: "2B-1", status: "Terisi",  pasienNama: "Rina Marlina", pasienRM: "RM-2025-004", hariKe: 1, penjamin: "BPJS_Non_PBI", rencanaKeluar: true },
      { id: "wb2", nomor: "2B-2", status: "Tersedia" },
      { id: "wb3", nomor: "2B-3", status: "Tersedia" },
      { id: "wb4", nomor: "2B-4", status: "Tersedia" },
      { id: "wb5", nomor: "2B-5", status: "Maintenance" },
      { id: "wb6", nomor: "2B-6", status: "Tersedia" },
      { id: "wb7", nomor: "2B-7", status: "Tersedia" },
      { id: "wb8", nomor: "2B-8", status: "Tersedia" },
    ],
  },
  {
    id: "ri-k3", nama: "Kenanga A & B", kelas: "Kelas_3",
    beds: [
      { id: "ka1",  nomor: "3A-1",  status: "Terisi",  pasienNama: "Pasien A",       pasienRM: "RM-2025-050", hariKe: 3, penjamin: "BPJS_PBI" },
      { id: "ka2",  nomor: "3A-2",  status: "Tersedia" },
      { id: "ka3",  nomor: "3A-3",  status: "Terisi",  pasienNama: "Pasien B",       pasienRM: "RM-2025-051", hariKe: 1, penjamin: "BPJS_PBI" },
      { id: "ka4",  nomor: "3A-4",  status: "Tersedia" },
      { id: "ka5",  nomor: "3A-5",  status: "Terisi",  pasienNama: "Doni Pratama",   pasienRM: "RM-2025-038", hariKe: 1, penjamin: "BPJS_PBI" },
      { id: "ka6",  nomor: "3A-6",  status: "Tersedia" },
      { id: "ka7",  nomor: "3A-7",  status: "Tersedia" },
      { id: "ka8",  nomor: "3A-8",  status: "Terisi",  pasienNama: "Fitri Andriani", pasienRM: "RM-2025-039", hariKe: 2, penjamin: "BPJS_PBI" },
      { id: "ka9",  nomor: "3A-9",  status: "Tersedia" },
      { id: "ka10", nomor: "3A-10", status: "Tersedia" },
      { id: "kb1",  nomor: "3B-1",  status: "Tersedia" },
      { id: "kb2",  nomor: "3B-2",  status: "Terisi",  pasienNama: "Agus Setiawan", pasienRM: "RM-2025-019", hariKe: 4, penjamin: "BPJS_PBI" },
      { id: "kb3",  nomor: "3B-3",  status: "Tersedia" },
      { id: "kb4",  nomor: "3B-4",  status: "Tersedia" },
      { id: "kb5",  nomor: "3B-5",  status: "Terisi",  pasienNama: "Pasien C",      pasienRM: "RM-2025-052", hariKe: 2, penjamin: "BPJS_PBI" },
      { id: "kb6",  nomor: "3B-6",  status: "Tersedia" },
      { id: "kb7",  nomor: "3B-7",  status: "Tersedia" },
      { id: "kb8",  nomor: "3B-8",  status: "Tersedia" },
      { id: "kb9",  nomor: "3B-9",  status: "Maintenance" },
      { id: "kb10", nomor: "3B-10", status: "Tersedia" },
    ],
  },
];

// ── Rawat Inap Patient Detail types ──────────────────

export type RIShift = "Pagi" | "Siang" | "Malam";

export interface RITTVRecord {
  id:               string;
  tanggal:          string;           // "2025-05-08"
  jam:              string;           // "08:00"
  shift:            RIShift;
  perawat:          string;
  vitalSigns:       IGDVitalSigns;
  statusKesadaran:  StatusKesadaran;
}

export interface RawatInapPatientDetail {
  id:               string;
  noRM:             string;
  noKunjungan:      string;
  name:             string;
  age:              number;
  gender:           "L" | "P";
  ruangan:          string;
  kelas:            RIKelas;
  noBed:            string;
  dpjp:             string;
  spesialis:        string;
  diagnosis:        string;
  kodeIcd:          string;
  admitDate:        string;           // "2025-05-03" ISO
  tglMasuk:         string;           // "3 Mei 2025" display
  hariKe:           number;
  status:           RIStatus;
  penjamin:         RIPenjamin;
  noBpjs?:          string;
  namaKeluarga:     string;
  hubunganKeluarga: string;
  noHp:             string;
  alamat:           string;
  vitalSigns:       IGDVitalSigns;    // current / latest
  statusKesadaran:  StatusKesadaran;
  ttvHistory:       RITTVRecord[];
  cppt:             CPPTEntry[];
  diagnosa:         IGDDiagnosa[];
  riwayatAlergi?:        string;
  obatSaatIni?:          string;
  catatan?:              string;
  asuhanKeperawatan?:    AsuhanKeperawatanEntry[];
  pemeriksaanFisik?:     PemeriksaanFisikEntry[];
  intakeOutput?:         IntakeOutputData;
}

// ── Rawat Inap Patient Detail mock data ──────────────

export const rawatInapPatientDetails: Record<string, RawatInapPatientDetail> = {
  "ri-1": {
    id: "ri-1", noRM: "RM-2025-003", noKunjungan: "RI/2025/05/001",
    name: "Ahmad Fauzi", age: 67, gender: "L",
    ruangan: "Mawar A", kelas: "Kelas_2", noBed: "2A-1",
    dpjp: "dr. Dewi Kusuma, Sp.JP", spesialis: "Sp.JP",
    diagnosis: "Gagal Jantung Kongestif", kodeIcd: "I50.0",
    admitDate: "2025-05-03", tglMasuk: "3 Mei 2025", hariKe: 5,
    status: "Aktif", penjamin: "BPJS_Non_PBI",
    namaKeluarga: "Budi Fauzi", hubunganKeluarga: "Anak",
    noHp: "0812-3456-7890", alamat: "Jl. Merpati No. 15, Bandung",
    riwayatAlergi: "Aspirin (sesak napas)",
    obatSaatIni: "Bisoprolol 5mg, Candesartan 8mg, Furosemid 40mg",
    vitalSigns: {
      tdSistolik: 125, tdDiastolik: 76, nadi: 78, respirasi: 17,
      suhu: 36.5, spo2: 98, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6,
      skalaNyeri: 1, beratBadan: 68, tinggiBadan: 165,
    },
    statusKesadaran: "Compos_Mentis",
    ttvHistory: [
      { id: "ri1-ttv-1", tanggal: "2025-05-06", jam: "06:30", shift: "Pagi",  perawat: "Siti Rahayu, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 138, tdDiastolik: 85, nadi: 88, respirasi: 21, suhu: 37.0, spo2: 95, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 3 } },
      { id: "ri1-ttv-2", tanggal: "2025-05-06", jam: "14:00", shift: "Siang", perawat: "Dini Amalia, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 135, tdDiastolik: 83, nadi: 86, respirasi: 20, suhu: 36.8, spo2: 96, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 2 } },
      { id: "ri1-ttv-3", tanggal: "2025-05-06", jam: "20:00", shift: "Malam", perawat: "Rika Novita, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 132, tdDiastolik: 82, nadi: 85, respirasi: 19, suhu: 36.6, spo2: 96, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 2 } },
      { id: "ri1-ttv-4", tanggal: "2025-05-07", jam: "06:30", shift: "Pagi",  perawat: "Siti Rahayu, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 130, tdDiastolik: 80, nadi: 84, respirasi: 19, suhu: 36.7, spo2: 96, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 2 } },
      { id: "ri1-ttv-5", tanggal: "2025-05-07", jam: "14:00", shift: "Siang", perawat: "Dini Amalia, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 128, tdDiastolik: 78, nadi: 82, respirasi: 18, suhu: 36.5, spo2: 97, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 1 } },
      { id: "ri1-ttv-6", tanggal: "2025-05-07", jam: "20:00", shift: "Malam", perawat: "Rika Novita, S.Kep",
        statusKesadaran: "Compos_Mentis",
        vitalSigns: { tdSistolik: 125, tdDiastolik: 76, nadi: 80, respirasi: 17, suhu: 36.4, spo2: 97, gcsEye: 4, gcsVerbal: 5, gcsMotor: 6, skalaNyeri: 1 } },
    ],
    cppt: [
      { id: "ri1-cppt-1", tanggal: "2025-05-03", waktu: "08:30", profesi: "Dokter", penulis: "dr. Dewi Kusuma, Sp.JP",
        subjektif:  "Sesak napas memberat sejak 3 hari, kaki bengkak bilateral, sulit berbaring datar.",
        objektif:   "TD 150/95 mmHg, Nadi 98x/mnt, SpO₂ 92% room air. Ronkhi basah bilateral, edema pretibial +2.",
        asesmen:    "Gagal Jantung Kongestif Akut – dekompensasi. Edema paru dan edema perifer.",
        planning:   "Furosemid 40mg IV bolus, O₂ 4L/mnt nasal kanul, diet rendah garam, restriksi cairan 1L/24jam.",
        instruksi:  "Monitor balance cairan tiap 6 jam, timbang BB harian, cek elektrolit besok pagi.",
        verified: true, verifiedBy: "dr. Dewi Kusuma, Sp.JP", verifiedAt: "3 Mei 2025, 17:00" },
      { id: "ri1-cppt-2", tanggal: "2025-05-03", waktu: "15:00", profesi: "Perawat", penulis: "Siti Rahayu, S.Kep",
        subjektif:  "Pasien masih sesak, merasa lebih nyaman dengan posisi semifowler.",
        objektif:   "SpO₂ 93–94%, diuresis 850mL dalam 6 jam post furosemid, edema sedikit berkurang.",
        asesmen:    "Respon diuretik baik, sesak berkurang bertahap.",
        instruksi:  "Pertahankan posisi semifowler, monitor SpO₂ tiap 2 jam.",
        verified: true, verifiedBy: "dr. Dewi Kusuma, Sp.JP", verifiedAt: "3 Mei 2025, 18:00" },
      { id: "ri1-cppt-3", tanggal: "2025-05-06", waktu: "09:00", profesi: "Dokter", penulis: "dr. Dewi Kusuma, Sp.JP",
        subjektif:  "Sesak berkurang signifikan, dapat berbaring 1 bantal, kaki masih sedikit bengkak.",
        objektif:   "TD 138/85, Nadi 88, SpO₂ 95%. BB turun 2.5 kg dari awal masuk. Ronkhi minimal.",
        asesmen:    "GJK akut membaik dengan terapi. Target diuresis tercapai.",
        planning:   "Transisi furosemid oral 40mg/hari, tambah spironolakton 25mg, evaluasi ekokardiografi.",
        instruksi:  "Lanjutkan monitoring, target BB stabil, edukasi pasien diet jantung.",
        verified: true, verifiedBy: "dr. Dewi Kusuma, Sp.JP", verifiedAt: "6 Mei 2025, 11:30" },
      { id: "ri1-cppt-4", tanggal: "2025-05-07", waktu: "08:45", profesi: "Dokter", penulis: "dr. Dewi Kusuma, Sp.JP",
        subjektif:  "Sesak minimal, toleransi aktivitas meningkat, bisa berjalan ke kamar mandi.",
        objektif:   "TD 128/78, Nadi 80, SpO₂ 97–98%. Ronkhi tidak terdengar, edema minimal.",
        asesmen:    "GJK terkompensasi baik. Kondisi stabil, layak rencana pulang 1–2 hari.",
        planning:   "Persiapkan discharge planning: obat pulang (bisoprolol, furosemid, spiro, ACEi), edukasi, kontrol poli jantung.",
        instruksi:  "Persiapkan administrasi pulang, edukasi keluarga tanda bahaya GJK.",
        verified: false, flagged: true },
    ],
    diagnosa: [
      { id: "ri1-d1", kodeIcd10: "I50.0", namaDiagnosis: "Gagal Jantung Kongestif",    tipe: "Utama",    status: "Pasti",   alasan: "Echo: EF 30%, edema bilateral, ronki basah basal" },
      { id: "ri1-d2", kodeIcd10: "I10",   namaDiagnosis: "Hipertensi Esensial",         tipe: "Komorbid", status: "Pasti",   alasan: "Riwayat 12 tahun, rutin amlodipine 10mg" },
      { id: "ri1-d3", kodeIcd10: "E11.9", namaDiagnosis: "DM Tipe 2 tanpa komplikasi", tipe: "Komorbid", status: "Pasti",   alasan: "HbA1c 7.8%, GDS terkontrol selama rawat inap" },
    ],
    asuhanKeperawatan: [
      {
        id: "ri1-ak-1", kodeSdki: "D.0022", aktif: true,
        diagnosa: "Hipervolemia b.d kelebihan asupan cairan d.d edema bilateral, sesak napas, ronkhi basah bilateral",
        penyebab: "Kelebihan asupan cairan, gangguan mekanisme regulasi (gagal jantung EF 30%)",
        dataMayor: { subjektif: "Pasien mengeluh sesak napas dan kedua kaki bengkak", objektif: "TD 150/95, edema pretibial +2, ronkhi basah bilateral, SpO2 92% room air" },
        dataMinor: { subjektif: "Sulit tidur karena tidak bisa berbaring datar", objektif: "JVP meningkat, BJ S3 gallop terdengar" },
        faktorResiko: "",
        tujuanDurasi: "5", tujuanUnit: "Hari", selama: "pasien dirawat",
        kriteriaHasil: [
          "Edema ekstremitas berkurang / tidak ada",
          "Berat badan menurun menuju target",
          "Tekanan darah dalam batas normal",
          "Ronkhi tidak terdengar",
        ],
        intervensi: {
          observasi:  ["Periksa tanda dan gejala hipervolemia tiap shift (edema, dispnea, JVP)", "Monitor intake dan output cairan tiap shift", "Monitor berat badan harian pukul 06.00", "Monitor kecepatan infus secara ketat"],
          terapeutik: ["Timbang berat badan setiap pagi", "Batasi asupan cairan 1L/24 jam sesuai program DPJP", "Tinggikan ekstremitas yang edema 20–30 derajat", "Pertahankan posisi semi-Fowler"],
          edukasi:    ["Anjurkan melaporkan jika haluaran urine <30 mL/jam", "Ajarkan cara mencatat balance cairan sederhana"],
          kolaborasi: ["Kolaborasi pemberian Furosemid IV sesuai program", "Kolaborasi pemeriksaan elektrolit harian"],
        },
        tanggalInput: "2025-05-03", perawat: "Siti Rahayu, S.Kep",
        verified: true, verifiedBy: "dr. Dewi Kusuma, Sp.JP", verifiedAt: "3 Mei 2025, 18:00",
        statusLuaran: "Teratasi_Sebagian",
        evaluasi: [
          { id: "ri1-eval-1-1", tanggal: "2025-05-06", jam: "06:30", shift: "Pagi",  perawat: "Siti Rahayu, S.Kep",
            subjektif: "Pasien merasa sesak berkurang, masih ada bengkak di kedua kaki",
            objektif:  "SpO2 95%, edema +1, BB turun 1.5 kg dari hari masuk, UO 1.2L/24 jam",
            statusLuaran: "Teratasi_Sebagian" },
          { id: "ri1-eval-1-2", tanggal: "2025-05-07", jam: "06:30", shift: "Pagi",  perawat: "Siti Rahayu, S.Kep",
            subjektif: "Sesak minimal, kaki masih sedikit bengkak",
            objektif:  "SpO2 97%, edema minimal, BB turun 2.5 kg total, TD 130/80",
            statusLuaran: "Teratasi_Sebagian" },
        ],
      },
      {
        id: "ri1-ak-2", kodeSdki: "D.0056", aktif: true,
        diagnosa: "Intoleransi Aktivitas b.d ketidakseimbangan suplai-kebutuhan oksigen d.d dispnea saat aktivitas ringan",
        penyebab: "Ketidakseimbangan antara suplai dan kebutuhan oksigen (GJK, EF 30%)",
        dataMayor: { subjektif: "Pasien mengeluh mudah lelah dan sesak saat bergerak sedikit", objektif: "Dispnea saat aktivitas ringan, SpO2 turun ke 91% saat berjalan ke kamar mandi" },
        dataMinor: { subjektif: "Malu meminta bantuan ke kamar mandi", objektif: "HR meningkat >20 bpm dari baseline saat aktivitas" },
        faktorResiko: "",
        tujuanDurasi: "5", tujuanUnit: "Hari", selama: "pasien dirawat",
        kriteriaHasil: [
          "Dispnea saat aktivitas berkurang",
          "Dapat berjalan ke kamar mandi secara mandiri",
          "HR <100x/mnt saat aktivitas ringan",
        ],
        intervensi: {
          observasi:  ["Monitor HR dan SpO2 sebelum, saat, dan setelah aktivitas tiap shift", "Identifikasi toleransi aktivitas setiap hari"],
          terapeutik: ["Fasilitasi mobilisasi bertahap (duduk → berdiri → berjalan)", "Sediakan kursi di dekat bed", "Berikan oksigen tambahan saat aktivitas jika SpO2 <94%"],
          edukasi:    ["Ajarkan teknik hemat energi saat beraktivitas", "Anjurkan istirahat di antara aktivitas"],
          kolaborasi: ["Kolaborasi dengan fisioterapis untuk program latihan bertahap", "Kolaborasi target SpO2 minimal saat aktivitas dengan DPJP"],
        },
        tanggalInput: "2025-05-03", perawat: "Siti Rahayu, S.Kep",
        verified: true, verifiedBy: "dr. Dewi Kusuma, Sp.JP", verifiedAt: "3 Mei 2025, 18:30",
        statusLuaran: "Teratasi_Sebagian",
        evaluasi: [
          { id: "ri1-eval-2-1", tanggal: "2025-05-07", jam: "14:00", shift: "Siang", perawat: "Dini Amalia, S.Kep",
            subjektif: "Pasien sudah bisa berjalan ke kamar mandi dengan bantuan minimal",
            objektif:  "SpO2 97% istirahat, 94% saat berjalan, HR max 92x/mnt saat aktivitas",
            statusLuaran: "Teratasi_Sebagian" },
        ],
      },
      {
        id: "ri1-ak-3", kodeSdki: "D.0142", aktif: true,
        diagnosa: "Risiko Infeksi f.r tindakan invasif (akses infus perifer, riwayat DM)",
        penyebab: "",
        dataMayor: { subjektif: "", objektif: "" },
        dataMinor: { subjektif: "", objektif: "" },
        faktorResiko: "Pemasangan infus perifer hari ke-5, riwayat DM (imunosupresi relatif), usia lanjut",
        tujuanDurasi: "5", tujuanUnit: "Hari", selama: "pasien dirawat",
        kriteriaHasil: [
          "Tidak ada tanda infeksi pada tempat insersi infus",
          "Suhu tubuh dalam batas normal (36–37.5°C)",
          "Leukosit dalam rentang normal",
        ],
        intervensi: {
          observasi:  ["Monitor tanda infeksi pada insersi infus tiap shift", "Monitor suhu tiap shift", "Monitor hasil laboratorium leukosit"],
          terapeutik: ["Pertahankan teknik aseptik saat perawatan akses IV", "Ganti balutan infus tiap 72 jam atau jika kotor", "Cuci tangan sebelum dan sesudah prosedur"],
          edukasi:    ["Jelaskan tanda infeksi yang perlu dilaporkan (kemerahan, bengkak, nyeri, demam)", "Ajarkan teknik cuci tangan yang benar"],
          kolaborasi: ["Kolaborasi ganti akses IV jika ada tanda infeksi lokal", "Kolaborasi cek laboratorium jika suhu >38.5°C"],
        },
        tanggalInput: "2025-05-03", perawat: "Siti Rahayu, S.Kep",
        verified: false, verifiedBy: "", verifiedAt: "",
        statusLuaran: "Dipantau",
        evaluasi: [],
      },
    ],
    pemeriksaanFisik: [
      {
        id: "pf-ri1-1", tanggal: "2025-05-03", jam: "09:30",
        dokter: "dr. Budi Santoso, Sp.JP", perawat: "Siti Rahayu, S.Kep",
        ku: "Berat", kesadaran: "Composmentis", gizi: "Lebih",
        orientasi: { waktu: true, tempat: true, orang: true },
        sistem: {
          kepala:      "Normocephali, tidak ada nyeri tekan.",
          mata:        "Konjungtiva tidak anemis, sklera tidak ikterik, pupil isokor ∅3mm, refleks cahaya +/+.",
          tht:         "Mukosa lembab, faring tidak hiperemis. Hidung dan telinga dalam batas normal.",
          leher:       "JVP meningkat (+3 cmH2O). Tidak ada pembesaran KGB. Tidak ada pembesaran tiroid.",
          toraks_paru: "Fremitus menurun basal bilateral. Redup basal bilateral. Suara napas vesikuler, ronkhi basah basal +/+, wheezing -/-.",
          jantung:     "Iktus kordis teraba di ICS VI 2cm lateral MCL kiri (kardiomegali). BJ S1 S2 melemah, reguler. S3 gallop (+). Tidak ada murmur.",
          abdomen:     "Datar, supel. BU (+) normal. Hepatomegali 2 jari BAC, nyeri tekan (+). Asites minimal. Lien tidak teraba.",
          urogenital:  "Tidak ada nyeri ketuk kostovertebra. BAK menurun, output ~200cc/8jam.",
          ekstremitas: "Akral hangat. Edema pitting +2 bilateral pretibial. CRT 3 detik. Kekuatan motorik 5/5/5/5.",
          neurologi:   "Kaku kuduk (-). Refleks fisiologis +/+ normal. Refleks patologis (-). Kekuatan motorik baik.",
          kulit:       "Turgor kulit sedikit menurun. Tidak ikterik. Tidak sianosis. Tidak ada lesi.",
        },
        temuanAbnormal: ["edema", "ronkhi", "hepatomegali", "jvp_meningkat"],
        catatanUmum: "Pasien GJK NYHA III, datang dengan sesak napas memberat dan edema bilateral. EF 30% per echo terakhir.",
        bodyMarkings: [
          { region: "dada_kiri",  label: "Dada Kiri",   catatan: "Ronkhi basah, redup basal" },
          { region: "dada_kanan", label: "Dada Kanan",  catatan: "Ronkhi basah, redup basal" },
          { region: "kaki_kiri",  label: "Kaki Kiri",   catatan: "Edema pitting +2" },
          { region: "kaki_kanan", label: "Kaki Kanan",  catatan: "Edema pitting +2" },
        ],
      },
      {
        id: "pf-ri1-2", tanggal: "2025-05-06", jam: "08:00",
        dokter: "dr. Budi Santoso, Sp.JP", perawat: "Ahmad Ridwan, S.Kep",
        ku: "Sedang", kesadaran: "Composmentis", gizi: "Lebih",
        orientasi: { waktu: true, tempat: true, orang: true },
        sistem: {
          kepala:      "Normocephali, tidak ada nyeri tekan.",
          mata:        "Konjungtiva tidak anemis, sklera tidak ikterik, pupil isokor ∅3mm.",
          tht:         "Mukosa lembab, faring tidak hiperemis.",
          leher:       "JVP masih sedikit meningkat (+1 cmH2O). KGB tidak membesar.",
          toraks_paru: "Simetris. Ronkhi basal bilateral berkurang (+/-). Wheezing (-).",
          jantung:     "BJ S1 S2 melemah, reguler. S3 gallop masih terdengar samar.",
          abdomen:     "Datar, supel. BU (+) normal. Hepatomegali masih ada, nyeri tekan berkurang. Asites minimal berkurang.",
          urogenital:  "Output urine membaik ~400cc/8jam sejak furosemid IV digenapkan.",
          ekstremitas: "Akral hangat. Edema pretibial bilateral berkurang (+1). CRT 2.5 detik.",
          neurologi:   "Baik, sesuai status generalis. Refleks fisiologis +/+ normal.",
          kulit:       "Turgor baik. Tidak ikterik, tidak sianosis. Tidak ada lesi baru.",
        },
        temuanAbnormal: ["edema", "ronkhi", "hepatomegali"],
        catatanUmum: "Perbaikan klinis: sesak berkurang, diuresis membaik. Program furosemid IV lanjut. Target balance -500cc/hari.",
        bodyMarkings: [
          { region: "kaki_kiri",  label: "Kaki Kiri",   catatan: "Edema +1 (membaik)" },
          { region: "kaki_kanan", label: "Kaki Kanan",  catatan: "Edema +1 (membaik)" },
        ],
      },
    ],
    intakeOutput: {
      targetDPJP: {
        restriksiIntake: 1000,
        targetBalance:   -500,
        catatan: "Restriksi cairan 1L/24jam. Target balance -500cc/hari. Timbang BB setiap pagi.",
        updatedBy: "dr. Dewi Kusuma, Sp.JP",
        updatedAt: "2025-05-03T08:00",
      },
      entries: [
        // ── D1 (2025-05-03) ─────────────────────────────
        { id: "io-ri1-01", tanggal: "2025-05-03", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500, catatan: "Maintenance 20 tpm" },
        { id: "io-ri1-02", tanggal: "2025-05-03", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",    volume: 20,  catatan: "Furosemid 40mg bolus IV" },
        { id: "io-ri1-03", tanggal: "2025-05-03", waktu: "09:00", shift: "Pagi",  tipe: "intake", kategori: "Oral", subKategori: "Minum",            volume: 200 },
        { id: "io-ri1-04", tanggal: "2025-05-03", waktu: "10:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 300, catatan: "Post-furosemid" },
        { id: "io-ri1-05", tanggal: "2025-05-03", waktu: "13:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 350 },
        { id: "io-ri1-06", tanggal: "2025-05-03", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 500 },
        { id: "io-ri1-07", tanggal: "2025-05-03", waktu: "15:30", shift: "Siang", tipe: "intake", kategori: "Oral", subKategori: "Makan Cair",       volume: 150 },
        { id: "io-ri1-08", tanggal: "2025-05-03", waktu: "16:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 280 },
        { id: "io-ri1-09", tanggal: "2025-05-03", waktu: "20:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 250 },
        { id: "io-ri1-10", tanggal: "2025-05-03", waktu: "21:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 500 },
        { id: "io-ri1-11", tanggal: "2025-05-03", waktu: "23:00", shift: "Malam", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 300 },
        // ── D2 (2025-05-04) ─────────────────────────────
        { id: "io-ri1-12", tanggal: "2025-05-04", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 250, catatan: "Restriksi dimulai" },
        { id: "io-ri1-13", tanggal: "2025-05-04", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",    volume: 20,  catatan: "Furosemid 40mg IV" },
        { id: "io-ri1-14", tanggal: "2025-05-04", waktu: "09:00", shift: "Pagi",  tipe: "intake", kategori: "Oral", subKategori: "Minum",            volume: 200 },
        { id: "io-ri1-15", tanggal: "2025-05-04", waktu: "08:30", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 400, catatan: "Diuresis baik post-furosemid" },
        { id: "io-ri1-16", tanggal: "2025-05-04", waktu: "13:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 300 },
        { id: "io-ri1-17", tanggal: "2025-05-04", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 250 },
        { id: "io-ri1-18", tanggal: "2025-05-04", waktu: "15:00", shift: "Siang", tipe: "intake", kategori: "Oral", subKategori: "Minum",            volume: 100 },
        { id: "io-ri1-19", tanggal: "2025-05-04", waktu: "17:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 350 },
        { id: "io-ri1-20", tanggal: "2025-05-04", waktu: "20:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 250 },
        { id: "io-ri1-21", tanggal: "2025-05-04", waktu: "22:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 250 },
        { id: "io-ri1-22", tanggal: "2025-05-04", waktu: "23:30", shift: "Malam", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 200 },
        // ── D3 (2025-05-05) ─────────────────────────────
        { id: "io-ri1-23", tanggal: "2025-05-05", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",        volume: 250 },
        { id: "io-ri1-24", tanggal: "2025-05-05", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",    volume: 20,  catatan: "Furosemid 40mg IV" },
        { id: "io-ri1-25", tanggal: "2025-05-05", waktu: "09:00", shift: "Pagi",  tipe: "intake", kategori: "Oral", subKategori: "Minum",            volume: 200 },
        { id: "io-ri1-26", tanggal: "2025-05-05", waktu: "09:30", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 350 },
        { id: "io-ri1-27", tanggal: "2025-05-05", waktu: "13:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",    volume: 300 },
      ],
    },
  },

  "ri-3": {
    id: "ri-3", noRM: "RM-2025-007", noKunjungan: "RI/2025/05/003",
    name: "Hasan Basri", age: 72, gender: "L",
    ruangan: "Ruang ICU", kelas: "ICU", noBed: "ICU-1",
    dpjp: "dr. Hendra Wijaya, Sp.EM", spesialis: "Sp.EM",
    diagnosis: "Syok Sepsis", kodeIcd: "A41.9",
    admitDate: "2025-05-05", tglMasuk: "5 Mei 2025", hariKe: 3,
    status: "Kritis", penjamin: "BPJS_PBI",
    namaKeluarga: "Ahmad Basri", hubunganKeluarga: "Anak",
    noHp: "0813-4567-8901", alamat: "Jl. Mekar No. 8, Bandung",
    catatan: "Pasang ventilator, monitoring ketat, akses CVC dan arterial line.",
    vitalSigns: {
      tdSistolik: 96, tdDiastolik: 62, nadi: 110, respirasi: 24,
      suhu: 38.5, spo2: 93, gcsEye: 3, gcsVerbal: 4, gcsMotor: 5, skalaNyeri: 6,
      beratBadan: 60, tinggiBadan: 170,
    },
    statusKesadaran: "Somnolen",
    ttvHistory: [
      { id: "ri3-ttv-1", tanggal: "2025-05-06", jam: "06:00", shift: "Pagi",  perawat: "Ahmad Ridwan, S.Kep",
        statusKesadaran: "Koma",
        vitalSigns: { tdSistolik: 76, tdDiastolik: 48, nadi: 128, respirasi: 30, suhu: 39.2, spo2: 87, gcsEye: 1, gcsVerbal: 2, gcsMotor: 4, skalaNyeri: 8 } },
      { id: "ri3-ttv-2", tanggal: "2025-05-06", jam: "14:00", shift: "Siang", perawat: "Nisa Permata, S.Kep",
        statusKesadaran: "Koma",
        vitalSigns: { tdSistolik: 82, tdDiastolik: 52, nadi: 124, respirasi: 28, suhu: 39.0, spo2: 88, gcsEye: 2, gcsVerbal: 2, gcsMotor: 4, skalaNyeri: 7 } },
      { id: "ri3-ttv-3", tanggal: "2025-05-06", jam: "20:00", shift: "Malam", perawat: "Doni Saputra, S.Kep",
        statusKesadaran: "Sopor",
        vitalSigns: { tdSistolik: 85, tdDiastolik: 55, nadi: 122, respirasi: 27, suhu: 38.9, spo2: 89, gcsEye: 2, gcsVerbal: 3, gcsMotor: 4, skalaNyeri: 7 } },
      { id: "ri3-ttv-4", tanggal: "2025-05-07", jam: "06:00", shift: "Pagi",  perawat: "Ahmad Ridwan, S.Kep",
        statusKesadaran: "Sopor",
        vitalSigns: { tdSistolik: 88, tdDiastolik: 56, nadi: 118, respirasi: 26, suhu: 38.8, spo2: 90, gcsEye: 2, gcsVerbal: 3, gcsMotor: 5, skalaNyeri: 7 } },
      { id: "ri3-ttv-5", tanggal: "2025-05-07", jam: "14:00", shift: "Siang", perawat: "Nisa Permata, S.Kep",
        statusKesadaran: "Somnolen",
        vitalSigns: { tdSistolik: 92, tdDiastolik: 60, nadi: 112, respirasi: 24, suhu: 38.5, spo2: 91, gcsEye: 2, gcsVerbal: 3, gcsMotor: 5, skalaNyeri: 6 } },
    ],
    cppt: [
      { id: "ri3-cppt-1", tanggal: "2025-05-05", waktu: "15:30", profesi: "Dokter", penulis: "dr. Hendra Wijaya, Sp.EM",
        subjektif:  "Pasien tidak kooperatif, penurunan kesadaran, demam tinggi.",
        objektif:   "TD 70/45 (syok), Nadi 132, RR 32, Suhu 39.5°C, SpO₂ 85% NRM, GCS 7 (E1V2M4). Kultur darah diambil.",
        asesmen:    "Syok Sepsis (qSOFA 3). Sumber infeksi paru – foto thorax: infiltrat bilateral.",
        planning:   "Resusitasi cairan NS 30mL/kgBB dalam 3 jam, norepinephrine 0.1mcg/kgBB/mnt, intubasi + ventilasi mekanik, meropenem 1g/8jam IV. Transfer ICU.",
        instruksi:  "Pasang CVC, arterial line, foley catheter, monitor ketat tiap 1 jam. Target MAP >65 mmHg.",
        verified: true, verifiedBy: "dr. Hendra Wijaya, Sp.EM", verifiedAt: "5 Mei 2025, 20:00" },
      { id: "ri3-cppt-2", tanggal: "2025-05-06", waktu: "08:15", profesi: "Dokter", penulis: "dr. Hendra Wijaya, Sp.EM",
        subjektif:  "Pasien tersedasi, on ventilator, masih febris.",
        objektif:   "TD 82/52, MAP 62, NE 0.3mcg/kgBB/mnt. PEEP 8, FiO₂ 60%, PaO₂/FiO₂ 120 (ARDS sedang). Kultur: Klebsiella pneumoniae.",
        asesmen:    "Syok Sepsis berat + ARDS sedang. Hospital-acquired pneumonia gram negatif.",
        planning:   "Eskalasi antibiotik – tambah colistin IV, titrasi norepinephrine target MAP >65, prone positioning 16 jam. Konsul nefrologi (oliguria).",
        instruksi:  "Prone positioning mulai 14.00. Balance cairan target -500mL/hari. Monitor laktat tiap 6 jam.",
        verified: true, verifiedBy: "dr. Hendra Wijaya, Sp.EM", verifiedAt: "6 Mei 2025, 14:30" },
      { id: "ri3-cppt-3", tanggal: "2025-05-07", waktu: "09:00", profesi: "Dokter", penulis: "dr. Hendra Wijaya, Sp.EM",
        subjektif:  "Masih tersedasi, NE masih running, demam sedikit menurun.",
        objektif:   "TD 96/62, MAP 73. NE turun ke 0.25mcg/kgBB/mnt. PaO₂/FiO₂ 145 (membaik). Suhu 38.5°C. Kreatinin 3.2 – AKI persisten.",
        asesmen:    "Sepsis syok terkontrol sebagian. Vasopressor titrasi turun, hemodinamik membaik. AKI masih persisten.",
        planning:   "Lanjutkan antibiotik. Evaluasi weaning vasopressor. CRRT jika kreatinin terus naik.",
        instruksi:  "Sedation holiday besok pukul 08.00, cek GCS pasca henti sedasi. Fisioterapi pasif hari ini.",
        verified: false, flagged: true },
    ],
    diagnosa: [
      { id: "ri3-d1", kodeIcd10: "A41.9", namaDiagnosis: "Sepsis, organisme tidak ditentukan",    tipe: "Utama",      status: "Pasti",     alasan: "qSOFA ≥2, laktat 4.1, kultur darah pending", analisa: "Sumber dugaan fokus paru (pneumonia), terapi empiris meropenem + vancomycin" },
      { id: "ri3-d2", kodeIcd10: "J18.9", namaDiagnosis: "Pneumonia, organisme tidak ditentukan", tipe: "Sekunder",   status: "Pasti",     alasan: "Ro toraks: infiltrat bilateral, SpO2 82% sebelum masuk" },
      { id: "ri3-d3", kodeIcd10: "N17.9", namaDiagnosis: "Cedera Ginjal Akut, tidak ditentukan",  tipe: "Komplikasi", status: "Dicurigai", alasan: "Kreatinin naik 1.2 → 3.8 mg/dL dalam 48 jam, UO <0.5 cc/kg/jam" },
    ],
    asuhanKeperawatan: [
      {
        id: "ri3-ak-1", kodeSdki: "D.0003", aktif: true,
        diagnosa: "Gangguan Pertukaran Gas b.d ketidakseimbangan ventilasi-perfusi d.d ARDS sedang, PaO2/FiO2 ratio 120",
        penyebab: "Pneumonia bilateral + sepsis menyebabkan ARDS sedang (P/F ratio 120)",
        dataMayor: { subjektif: "Tidak dapat dikaji — pasien tersedasi", objektif: "FiO2 60%, PEEP 8 cmH2O, P/F ratio 120, SpO2 88% on ventilator" },
        dataMinor: { subjektif: "", objektif: "Sianosis perifer, gelisah saat sedation holiday" },
        faktorResiko: "",
        tujuanDurasi: "7", tujuanUnit: "Hari", selama: "dalam perawatan ICU",
        kriteriaHasil: [
          "P/F ratio meningkat (target >200 dari baseline 120)",
          "SpO2 ≥ 94% on ventilator",
          "FiO2 dapat diturunkan bertahap",
          "Tidak ada sianosis perifer",
        ],
        intervensi: {
          observasi:  ["Monitor SpO2 dan AGD tiap 6 jam", "Monitor parameter ventilator (PEEP, FiO2, Tidal Volume, RR) tiap shift", "Monitor perubahan status neurologis saat sedation holiday"],
          terapeutik: ["Pertahankan posisi prone 16 jam sesuai program DPJP", "Suction endotrakeal jika diperlukan (<15 detik)", "Pertahankan kepatenan ETT — cek cuff pressure tiap shift", "Hindari desinkronisasi pasien-ventilator"],
          edukasi:    ["Edukasi keluarga tentang kondisi dan tatalaksana ARDS", "Ajarkan keluarga pentingnya mobilisasi pasif"],
          kolaborasi: ["Kolaborasi titrasi FiO2 dan PEEP bersama DPJP", "Kolaborasi pemeriksaan AGD tiap 6–12 jam sesuai indikasi"],
        },
        tanggalInput: "2025-05-05", perawat: "Ahmad Ridwan, S.Kep",
        verified: true, verifiedBy: "dr. Hendra Wijaya, Sp.EM", verifiedAt: "5 Mei 2025, 22:00",
        statusLuaran: "Belum_Teratasi",
        evaluasi: [
          { id: "ri3-eval-1-1", tanggal: "2025-05-06", jam: "06:00", shift: "Pagi",  perawat: "Ahmad Ridwan, S.Kep",
            subjektif: "Tidak dapat dikaji — pasien tersedasi",
            objektif:  "P/F ratio 120, SpO2 88% on vent FiO2 60% PEEP 8. Prone positioning dilaksanakan",
            statusLuaran: "Belum_Teratasi" },
          { id: "ri3-eval-1-2", tanggal: "2025-05-07", jam: "06:00", shift: "Pagi",  perawat: "Ahmad Ridwan, S.Kep",
            subjektif: "Tidak dapat dikaji — masih tersedasi",
            objektif:  "P/F ratio 145, SpO2 91% on vent FiO2 55% PEEP 8. Sedikit membaik",
            statusLuaran: "Belum_Teratasi" },
        ],
      },
      {
        id: "ri3-ak-2", kodeSdki: "D.0142", aktif: true,
        diagnosa: "Risiko Infeksi f.r tindakan invasif multipel (CVC, ETT, foley catheter, arterial line) dan imunosupresi akibat sepsis",
        penyebab: "",
        dataMayor: { subjektif: "", objektif: "" },
        dataMinor: { subjektif: "", objektif: "" },
        faktorResiko: "Pemasangan CVC, ETT, foley catheter, arterial line; imunosupresi akibat sepsis berat; antibiotik broad-spectrum",
        tujuanDurasi: "7", tujuanUnit: "Hari", selama: "dalam perawatan ICU",
        kriteriaHasil: [
          "Tidak terjadi VAP (Ventilator-Associated Pneumonia)",
          "Tidak terjadi CLABSI (infeksi bloodstream akibat CVC)",
          "Tidak terjadi CAUTI (infeksi saluran kemih akibat kateter)",
        ],
        intervensi: {
          observasi:  ["Monitor tanda infeksi pada semua tempat insersi tiap shift", "Monitor suhu core setiap jam", "Monitor hasil kultur (darah, sputum, urine, CVC tip)"],
          terapeutik: [
            "VAP Bundle: HOB 30–45°, oral hygiene klorheksidin 0.12% 4x/hari, cuff pressure tiap 8 jam",
            "CLABSI Bundle: dressing CVC tiap 7 hari / jika kotor, hindari manipulasi kateter yang tidak perlu",
            "CAUTI Bundle: perawatan kateter harian, urobag selalu di bawah kandung kemih, pertimbangkan early removal",
          ],
          edukasi:    ["Edukasi pengunjung: cuci tangan sebelum masuk ICU, batasi jumlah pengunjung"],
          kolaborasi: ["Kolaborasi kultur ulang jika ada perubahan klinis", "Kolaborasi de-eskalasi antibiotik sesuai hasil kultur Klebsiella"],
        },
        tanggalInput: "2025-05-05", perawat: "Ahmad Ridwan, S.Kep",
        verified: true, verifiedBy: "dr. Hendra Wijaya, Sp.EM", verifiedAt: "5 Mei 2025, 22:00",
        statusLuaran: "Dipantau",
        evaluasi: [
          { id: "ri3-eval-2-1", tanggal: "2025-05-07", jam: "06:00", shift: "Pagi",  perawat: "Ahmad Ridwan, S.Kep",
            subjektif: "Tidak dapat dikaji",
            objektif:  "CVC site bersih tidak ada tanda infeksi, ETT terpasang baik, UO 0.4 mL/kgBB/jam. Kultur darah: Klebsiella sensitif meropenem",
            statusLuaran: "Dipantau" },
        ],
      },
      {
        id: "ri3-ak-3", kodeSdki: "D.0054", aktif: true,
        diagnosa: "Gangguan Mobilitas Fisik b.d penurunan kesadaran dan kelemahan umum akibat sepsis berat",
        penyebab: "Penurunan kekuatan otot, penurunan kesadaran (GCS 7), sedasi terapeutik",
        dataMayor: { subjektif: "Tidak dapat dikaji", objektif: "GCS 7 (E1V2M4), tidak dapat menggerakkan ekstremitas secara volunter, sedasi propofol" },
        dataMinor: { subjektif: "", objektif: "Tonus otot lemah, risiko decubitus (Braden score 10)" },
        faktorResiko: "",
        tujuanDurasi: "7", tujuanUnit: "Hari", selama: "dalam perawatan ICU",
        kriteriaHasil: [
          "Tidak terjadi decubitus selama perawatan ICU",
          "Kontraktur sendi tidak terjadi",
          "ROM pasif dapat dilakukan penuh",
        ],
        intervensi: {
          observasi:  ["Identifikasi kondisi umum sebelum melakukan mobilisasi", "Monitor kulit atas tekanan tiap 2 jam"],
          terapeutik: ["Alih posisi tiap 2 jam (kanan → terlentang → kiri)", "Lakukan ROM pasif pada semua ekstremitas 2x sehari", "Gunakan matras anti-decubitus", "Pertahankan posisi anatomis dengan bantal penyangga"],
          edukasi:    ["Ajarkan keluarga cara melakukan ROM pasif sederhana"],
          kolaborasi: ["Kolaborasi dengan fisioterapis untuk ROM pasif dan mobilisasi bertahap", "Kolaborasi sedation holiday harian untuk evaluasi neurologis"],
        },
        tanggalInput: "2025-05-06", perawat: "Nisa Permata, S.Kep",
        verified: false, verifiedBy: "", verifiedAt: "",
        statusLuaran: "Dipantau",
        evaluasi: [],
      },
    ],
    pemeriksaanFisik: [
      {
        id: "pf-ri3-1", tanggal: "2025-05-05", jam: "16:00",
        dokter: "dr. Hendra Wijaya, Sp.EM", perawat: "Ahmad Ridwan, S.Kep",
        ku: "Berat", kesadaran: "Somnolen", gizi: "Kurang",
        orientasi: { waktu: false, tempat: false, orang: false },
        sistem: {
          kepala:      "Normocephali. Pucat (+). Tidak ada trauma kepala.",
          mata:        "Konjungtiva anemis +/+. Sklera tidak ikterik. Pupil isokor ∅3mm. Refleks cahaya +/+ lambat.",
          tht:         "Mukosa kering. ETT terpasang, posisi baik. Tidak ada fokus infeksi.",
          leher:       "Tidak ada pembesaran KGB. JVP tidak dapat dinilai (posisi supine). CVC subklavia kanan terpasang, dressing bersih.",
          toraks_paru: "Asimetris: kanan tertinggal. Fremitus kanan menurun. Perkusi redup kanan bawah. Suara napas kanan melemah. Ronkhi (+/-). Suara ventilator terdengar bilateral.",
          jantung:     "BJ S1 S2 reguler, takikardia (HR 132x/mnt). Tidak ada murmur. Vasopresor NE 0.2 mcg/kgBB/mnt via CVC.",
          abdomen:     "Distensi minimal. BU menurun. NGT terpasang, posisi lambung. Tidak ada defence musculaire.",
          urogenital:  "Kateter urin terpasang. Output 20cc/jam (oliguria berat). Urine gelap.",
          ekstremitas: "Akral dingin. CRT >3 detik. Sianosis perifer (+). Infus perifer kiri + CVC subklavia kanan. Edema minimal.",
          neurologi:   "GCS E3V2M4=9. Kaku kuduk (-). Refleks fisiologis menurun bilateral. Sedasi propofol via syringe pump.",
          kulit:       "Turgor menurun. Pucat. Sianosis perifer (+). Lesi purpurik tersebar di ekstremitas (suspek DIC). Tidak ada dekubitus.",
        },
        temuanAbnormal: ["pucat", "ronkhi", "akral_dingin", "sianosis", "edema"],
        catatanUmum: "Pasien ARDS + Syok Sepsis. On ventilasi mekanik, NE 0.2 mcg/kgBB/mnt. GCS 9. Oliguria berat. CVC + arterial line terpasang.",
        bodyMarkings: [
          { region: "dada_kanan", label: "Dada Kanan",  catatan: "Redup, suara napas melemah (efusi/atelektasis)" },
          { region: "kaki_kiri",  label: "Kaki Kiri",   catatan: "Lesi purpurik, akral dingin, CRT >3 detik" },
          { region: "kaki_kanan", label: "Kaki Kanan",  catatan: "Lesi purpurik, akral dingin, CRT >3 detik" },
        ],
      },
    ],
    intakeOutput: {
      targetDPJP: {
        targetBalance: -500,
        catatan: "Target balance cairan -500cc/hari. Hindari overload cairan. Dopamin/NE titrasi ketat.",
        updatedBy: "dr. Hendra Wijaya, Sp.EM",
        updatedAt: "2025-05-06T07:00",
      },
      entries: [
        // ── D1 (2025-05-05) — ICU admission, resusitasi ─
        { id: "io-ri3-01", tanggal: "2025-05-05", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 1500, catatan: "Resusitasi 30mL/kgBB dalam 3 jam" },
        { id: "io-ri3-02", tanggal: "2025-05-05", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100,  catatan: "Meropenem 1g/100mL" },
        { id: "io-ri3-03", tanggal: "2025-05-05", waktu: "10:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500,  catatan: "Maintenance" },
        { id: "io-ri3-04", tanggal: "2025-05-05", waktu: "10:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 60,   catatan: "Oliguria berat — 20cc/jam × 3jam" },
        { id: "io-ri3-05", tanggal: "2025-05-05", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "Norepinephrine",  volume: 50,   catatan: "NE 0.1mcg/kgBB/mnt, CVC" },
        { id: "io-ri3-06", tanggal: "2025-05-05", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-07", tanggal: "2025-05-05", waktu: "16:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100,  catatan: "Meropenem 1g q8h" },
        { id: "io-ri3-08", tanggal: "2025-05-05", waktu: "21:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 140,  catatan: "20cc/jam × 7 jam" },
        { id: "io-ri3-09", tanggal: "2025-05-05", waktu: "21:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-10", tanggal: "2025-05-05", waktu: "24:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100,  catatan: "Meropenem 1g (dosis ke-3)" },
        { id: "io-ri3-11", tanggal: "2025-05-05", waktu: "06:00", shift: "Malam", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 200,  catatan: "10 jam malam × 20cc" },
        // ── D2 (2025-05-06) — Stabilisasi ──────────────
        { id: "io-ri3-12", tanggal: "2025-05-06", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-13", tanggal: "2025-05-06", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Norepinephrine",  volume: 50,   catatan: "NE 0.15mcg/kgBB/mnt" },
        { id: "io-ri3-14", tanggal: "2025-05-06", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100,  catatan: "Meropenem 1g" },
        { id: "io-ri3-15", tanggal: "2025-05-06", waktu: "14:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 150,  catatan: "~21cc/jam, sedikit membaik" },
        { id: "io-ri3-16", tanggal: "2025-05-06", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-17", tanggal: "2025-05-06", waktu: "14:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "Norepinephrine",  volume: 50 },
        { id: "io-ri3-18", tanggal: "2025-05-06", waktu: "16:00", shift: "Siang", tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100 },
        { id: "io-ri3-19", tanggal: "2025-05-06", waktu: "21:00", shift: "Siang", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 150 },
        { id: "io-ri3-20", tanggal: "2025-05-06", waktu: "21:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-21", tanggal: "2025-05-06", waktu: "24:00", shift: "Malam", tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100 },
        { id: "io-ri3-22", tanggal: "2025-05-06", waktu: "06:00", shift: "Malam", tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 200 },
        // ── D3 (2025-05-07) — Pagi ──────────────────────
        { id: "io-ri3-23", tanggal: "2025-05-07", waktu: "07:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "NaCl 0.9%",       volume: 500 },
        { id: "io-ri3-24", tanggal: "2025-05-07", waktu: "08:00", shift: "Pagi",  tipe: "intake", kategori: "IV",   subKategori: "Antibiotik IV",   volume: 100,  catatan: "Meropenem 1g" },
        { id: "io-ri3-25", tanggal: "2025-05-07", waktu: "14:00", shift: "Pagi",  tipe: "output", kategori: "Urine",subKategori: "Kateter Foley",   volume: 175,  catatan: "~25cc/jam, membaik" },
      ],
    },
  },
};
