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
}

export interface CPPTEntry {
  id: string;
  waktu: string;
  profesi: CPPTProfesi;
  penulis: string;
  subjektif?: string;
  objektif?: string;
  asesmen?: string;
  planning?: string;
  instruksi?: string;
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
      { id: "d1", kodeIcd10: "I21.4", namaDiagnosis: "Non-ST elevation myocardial infarction", tipe: "Utama" },
      { id: "d2", kodeIcd10: "R57.0", namaDiagnosis: "Cardiogenic shock", tipe: "Sekunder" },
      { id: "d3", kodeIcd10: "I10",   namaDiagnosis: "Essential (primary) hypertension", tipe: "Komorbid" },
      { id: "d4", kodeIcd10: "E78.5", namaDiagnosis: "Hyperlipidaemia, unspecified", tipe: "Komorbid" },
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
      { id: "d1", kodeIcd10: "E16.0", namaDiagnosis: "Drug-induced hypoglycaemia without coma", tipe: "Utama" },
      { id: "d2", kodeIcd10: "E11.9", namaDiagnosis: "Type 2 diabetes mellitus without complications", tipe: "Komorbid" },
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
  dokumen?: {
    generalConsent?: "Ditandatangani" | "Belum Ditandatangani" | "Digital";
    rujukan?: "Ada" | "Tidak Ada";
    pengantarPasien?: "Ada" | "Tidak Ada";
  };
  status: "Selesai" | "Aktif" | "Dibatalkan";
  detailPath?: string;
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
      { id: "k1", noPendaftaran: "REG-2026-00231", noKunjungan: "IGD/2026/04/0023",  tanggal: "14 Apr 2026", unit: "IGD",           dokter: "dr. Hendra Wijaya, Sp.EM",  keluhan: "Nyeri dada hebat, sesak napas, keringat dingin",  diagnosa: "NSTEMI + Syok Kardiogenik",    penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100231", kodeICD: "I21.4, R57.0", caraMasuk: "Datang Sendiri", klinisPath: "/ehis-care/igd/igd-1", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Aktif",   detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k1" },
      { id: "k2", noPendaftaran: "REG-2026-00082", noKunjungan: "RJ/2026/02/1203",   tanggal: "20 Feb 2026", unit: "Rawat Jalan",   dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Kontrol hipertensi dan dislipidemia",            diagnosa: "Hipertensi, Dislipidemia",      penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100082", kodeICD: "I10, E78.5",        caraMasuk: "Datang Sendiri", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k2" },
      { id: "k3", noPendaftaran: "REG-2025-00891", noKunjungan: "RI/2025/11/0089",   tanggal: "05 Nov 2025", unit: "Rawat Inap",    dokter: "dr. Dewi Kusuma, Sp.JP",    keluhan: "Nyeri dada, sesak napas",                        diagnosa: "Unstable Angina Pectoris",      penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100891", kodeICD: "I20.0",             caraMasuk: "Rujukan Poli",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Ada",        pengantarPasien: "Ada"       }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k3" },
      { id: "k4", noPendaftaran: "REG-2025-00234", noKunjungan: "RJ/2025/09/0876",   tanggal: "18 Sep 2025", unit: "Rawat Jalan",   dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Kontrol rutin PJK",                              diagnosa: "PJK, Hipertensi, Dislipidemia", penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100234", kodeICD: "I25.1, I10, E78.5", caraMasuk: "Datang Sendiri", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k4" },
      { id: "k5", noPendaftaran: "REG-2025-00235", noKunjungan: "LAB/2025/09/0441",  tanggal: "18 Sep 2025", unit: "Laboratorium",  dokter: "dr. Anisa Putri, Sp.PD",    keluhan: "Pemeriksaan lab rutin",                          diagnosa: "Profil lipid terkontrol",       penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890",                              kodeICD: "E78.5",             caraMasuk: "Order Dokter",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k5" },
      { id: "k6", noPendaftaran: "REG-2025-00290", noKunjungan: "RAD/2025/11/0201",  tanggal: "06 Nov 2025", unit: "Radiologi",     dokter: "dr. Dewi Kusuma, Sp.JP",    keluhan: "Foto thorax pre-op",                             diagnosa: "Cardiomegaly ringan",           penjamin: "BPJS Non-PBI", noPenjamin: "0001234567890", noSEP: "0000000001100290", kodeICD: "I51.7",             caraMasuk: "Order Dokter",   dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada",  pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-005/kunjungan/k6" },
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
      { id: "k1", noPendaftaran: "REG-2026-00241", noKunjungan: "IGD/2026/04/0024", tanggal: "14 Apr 2026", unit: "IGD",         dokter: "dr. Hendra Wijaya, Sp.EM", keluhan: "Penurunan kesadaran, GCS 10",  diagnosa: "Hipoglikemia berat", penjamin: "Umum/Mandiri", noPenjamin: "UM-2026-00241", kodeICD: "E16.0", caraMasuk: "Datang Sendiri", klinisPath: "/ehis-care/igd/igd-2", dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada", pengantarPasien: "Tidak Ada" }, status: "Aktif",  detailPath: "/ehis-care/pasien/RM-2025-012/kunjungan/k1" },
      { id: "k2", noPendaftaran: "REG-2026-00047", noKunjungan: "RJ/2026/01/0521",  tanggal: "10 Jan 2026", unit: "Rawat Jalan", dokter: "dr. Anisa Putri, Sp.PD",   keluhan: "Kontrol DM tipe 2",           diagnosa: "DM Tipe 2",          penjamin: "Umum/Mandiri", noPenjamin: "UM-2026-00047", kodeICD: "E11.9", caraMasuk: "Datang Sendiri",                                      dokumen: { generalConsent: "Ditandatangani", rujukan: "Tidak Ada", pengantarPasien: "Tidak Ada" }, status: "Selesai", detailPath: "/ehis-care/pasien/RM-2025-012/kunjungan/k2" },
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
