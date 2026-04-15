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
    status: "Dalam Penanganan",
    complaint: "Nyeri dada hebat, sesak napas, keringat dingin",
    arrivalTime: "10:22",
    waitDuration: "2 jam 15 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
    notes: "Riwayat jantung koroner, perlu EKG segera",
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
  },
  {
    id: "igd-3",
    noRM: "RM-2025-002",
    name: "Siti Rahayu",
    age: 32,
    gender: "P",
    triage: "P2",
    status: "Dalam Penanganan",
    complaint: "Patah tulang lengan kanan akibat kecelakaan lalu lintas",
    arrivalTime: "09:15",
    waitDuration: "3 jam 22 mnt",
    doctor: "dr. Rizal Akbar, Sp.OT",
  },
  {
    id: "igd-4",
    noRM: "RM-2025-018",
    name: "Darmawan Santoso",
    age: 62,
    gender: "L",
    triage: "P2",
    status: "Menunggu",
    complaint: "Sesak napas, batuk berdahak sejak 3 hari lalu",
    arrivalTime: "11:48",
    waitDuration: "49 mnt",
    doctor: "dr. Anisa Putri, Sp.PD",
    notes: "Saturasi O2 88%, perlu nebulisasi",
  },
  {
    id: "igd-5",
    noRM: "RM-2025-021",
    name: "Mega Lestari",
    age: 24,
    gender: "P",
    triage: "P2",
    status: "Triage",
    complaint: "Demam tinggi 39.8°C, kejang 1× di rumah",
    arrivalTime: "12:10",
    waitDuration: "27 mnt",
    doctor: "dr. Hendra Wijaya, Sp.EM",
  },
  {
    id: "igd-6",
    noRM: "RM-2025-009",
    name: "Bambang Nugroho",
    age: 47,
    gender: "L",
    triage: "P3",
    status: "Menunggu",
    complaint: "Luka laserasi jari tangan kanan, perlu hecting",
    arrivalTime: "11:30",
    waitDuration: "1 jam 7 mnt",
    doctor: "dr. Rizal Akbar, Sp.OT",
  },
  {
    id: "igd-7",
    noRM: "RM-2025-033",
    name: "Nurul Hidayah",
    age: 19,
    gender: "P",
    triage: "P3",
    status: "Selesai",
    complaint: "Diare dan muntah sejak pagi, dehidrasi ringan",
    arrivalTime: "09:45",
    waitDuration: "Selesai",
    doctor: "dr. Anisa Putri, Sp.PD",
  },
  {
    id: "igd-8",
    noRM: "RM-2025-041",
    name: "Hendra Kurniawan",
    age: 35,
    gender: "L",
    triage: "P3",
    status: "Menunggu",
    complaint: "Nyeri kepala hebat sejak 2 jam lalu, riwayat migrain",
    arrivalTime: "12:00",
    waitDuration: "37 mnt",
    doctor: "dr. Dewi Kusuma, Sp.JP",
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
    triage: "P1", status: "Dalam Penanganan",
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
