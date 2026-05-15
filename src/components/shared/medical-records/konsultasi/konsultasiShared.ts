export type UrgencyKonsultasi = "CITO" | "Urgen" | "Rutin";
export type StatusKonsultasi = "Terkirim" | "Diterima" | "Dijawab" | "Selesai" | "Ditolak";

export interface SmfOption {
  id: string;
  nama: string;
  singkatan: string;
}

export interface KonsultasiJawaban {
  konsultan: string;
  asesmen: string;
  rekomendasi: string;
  tindakLanjut: string;
  followUp?: string;
}

export interface KonsultasiItem {
  id: string;
  noRM: string;
  tanggalRequest: string;
  waktuRequest: string;
  urgency: UrgencyKonsultasi;
  smfId: string;
  smfNama: string;
  smfSingkatan: string;
  dokterKonsultan?: string;
  dokterPeminta: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  status: StatusKonsultasi;
  waktuDiterima?: string;
  waktuDijawab?: string;
  waktuSelesai?: string;
  jawaban?: KonsultasiJawaban;
}

// ── SMF List ──────────────────────────────────────────────

export const SMF_LIST: SmfOption[] = [
  { id: "ipd",      nama: "Penyakit Dalam",                  singkatan: "IPD" },
  { id: "bedah",    nama: "Bedah Umum",                      singkatan: "BDH" },
  { id: "kardio",   nama: "Kardiologi",                      singkatan: "KAR" },
  { id: "neuro",    nama: "Neurologi",                       singkatan: "NEU" },
  { id: "paru",     nama: "Paru",                            singkatan: "PAR" },
  { id: "ortho",    nama: "Ortopedi & Traumatologi",         singkatan: "ORT" },
  { id: "obgyn",    nama: "Obstetri & Ginekologi",           singkatan: "OBG" },
  { id: "anak",     nama: "Anak (Pediatri)",                 singkatan: "ANK" },
  { id: "tht",      nama: "THT – Kepala Leher",              singkatan: "THT" },
  { id: "mata",     nama: "Mata (Oftalmologi)",              singkatan: "MAT" },
  { id: "kulit",    nama: "Kulit & Kelamin",                 singkatan: "KUL" },
  { id: "urologi",  nama: "Urologi",                         singkatan: "URO" },
  { id: "bedigif",  nama: "Bedah Digestif",                  singkatan: "BDG" },
  { id: "btkvs",    nama: "Bedah Thorax & Kardiovaskular",   singkatan: "BTV" },
  { id: "bsaraf",   nama: "Bedah Saraf (Neurosurgery)",      singkatan: "BSF" },
  { id: "bplastik", nama: "Bedah Plastik & Rekonstruksi",    singkatan: "BPL" },
  { id: "anestesi", nama: "Anestesiologi & Terapi Intensif", singkatan: "ANE" },
  { id: "rm",       nama: "Rehabilitasi Medik",              singkatan: "RM"  },
  { id: "psikiatri",nama: "Kedokteran Jiwa (Psikiatri)",     singkatan: "PSI" },
  { id: "gizi",     nama: "Gizi Klinik",                     singkatan: "GIZ" },
  { id: "farmasi",  nama: "Farmasi Klinik",                  singkatan: "FAR" },
  { id: "onko",     nama: "Onkologi Medik",                  singkatan: "ONK" },
];

// ── Config ────────────────────────────────────────────────

export const URGENCY_CONFIG: Record<UrgencyKonsultasi, {
  label: string; time: string;
  badge: string; border: string;
  selBorder: string; selBg: string; selText: string;
}> = {
  CITO: {
    label: "CITO",  time: "≤ 30 mnt",
    badge:  "bg-red-100 text-red-700 ring-1 ring-red-200",
    border: "border-l-red-500",
    selBorder: "border-red-400", selBg: "bg-red-50", selText: "text-red-700",
  },
  Urgen: {
    label: "Urgen", time: "≤ 6 jam",
    badge:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    border: "border-l-amber-500",
    selBorder: "border-amber-400", selBg: "bg-amber-50", selText: "text-amber-700",
  },
  Rutin: {
    label: "Rutin", time: "≤ 24 jam",
    badge:  "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    border: "border-l-sky-400",
    selBorder: "border-sky-400", selBg: "bg-sky-50", selText: "text-sky-700",
  },
};

export const STATUS_CONFIG: Record<StatusKonsultasi, {
  label: string; badge: string; dot: string; step: number;
}> = {
  Terkirim: { label: "Terkirim", badge: "bg-slate-100 text-slate-600",    dot: "bg-slate-400",   step: 1 },
  Diterima: { label: "Diterima", badge: "bg-sky-100 text-sky-700",        dot: "bg-sky-500",     step: 2 },
  Dijawab:  { label: "Dijawab",  badge: "bg-amber-100 text-amber-700",    dot: "bg-amber-500",   step: 3 },
  Selesai:  { label: "Selesai",  badge: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500", step: 4 },
  Ditolak:  { label: "Ditolak",  badge: "bg-red-100 text-red-700",        dot: "bg-red-500",     step: 0 },
};

export const STATUS_STEPS: StatusKonsultasi[] = ["Terkirim", "Diterima", "Dijawab", "Selesai"];

export function elapsedSince(dateStr: string, timeStr: string): string {
  const now  = new Date("2026-05-09T10:00:00");
  const then = new Date(`${dateStr}T${timeStr}:00`);
  const min  = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (min < 60)  return `${min} menit`;
  const h = Math.floor(min / 60);
  if (h  < 24)   return `${h} jam ${min % 60} mnt`;
  const d = Math.floor(h / 24);
  return `${d} hari ${h % 24} jam`;
}

// ── Mock data ─────────────────────────────────────────────

export const KONSULTASI_MOCK: Record<string, KonsultasiItem[]> = {
  "RM-2025-003": [
    {
      id: "kons-001",
      noRM: "RM-2025-003",
      tanggalRequest: "2026-05-06",
      waktuRequest: "09:30",
      urgency: "Rutin",
      smfId: "gizi",
      smfNama: "Gizi Klinik",
      smfSingkatan: "GIZ",
      dokterKonsultan: "dr. Anisa Putri, Sp.GK",
      dokterPeminta: "dr. Budi Santoso, Sp.JP",
      situation:
        "Pasien laki-laki 62 th dengan GJK NYHA III, edema tungkai bilateral grade II, sesak napas saat aktivitas ringan. BB 72 kg, restriksi cairan 1.000 ml/hari sudah diberlakukan.",
      background:
        "Rawat sejak 3 Mei 2026 dengan GJK dekompensata. Komorbid: hipertensi tidak terkontrol, DM tipe 2. EF 28% (Echo 5 Mei 2026). Diet saat ini belum terstandarisasi untuk kondisi gagal jantung.",
      assessment:
        "Pasien membutuhkan tata laksana nutrisi yang tepat untuk mendukung pemulihan fungsi jantung, mengelola edema, dan mengoptimalkan status nutrisi dengan mempertimbangkan restriksi cairan dan natrium.",
      recommendation:
        "Mohon rekomendasi diet jantung yang sesuai kondisi klinis: target kalori, restriksi natrium, panduan nutrisi selama perawatan, dan monitoring parameter yang diperlukan.",
      status: "Selesai",
      waktuDiterima: "10:15",
      waktuDijawab: "14:30",
      waktuSelesai: "15:00",
      jawaban: {
        konsultan: "dr. Anisa Putri, Sp.GK",
        asesmen:
          "Pasien GJK NYHA III dengan edema dan restriksi cairan 1.000 ml/hari. Status gizi cukup (IMT 24,8 kg/m²) namun berisiko malnutrisi akibat kondisi kronik dan penurunan nafsu makan.",
        rekomendasi:
          "• Diet Jantung III: 1.700 kkal/hari\n• Restriksi natrium: < 2 g/hari (hindari makanan olahan & asin)\n• Restriksi cairan: 1.000–1.200 ml/hari (termasuk cairan dari makanan)\n• Protein: 1,0 g/kgBB/hari (72 g/hari)\n• Lemak: hindari lemak jenuh dan trans-fat\n• KH: kompleks, hindari gula sederhana (DM)\n• Monitoring BB harian; lapor bila naik > 1 kg/hari",
        tindakLanjut:
          "Evaluasi asupan dan BB setiap 3 hari. Konsultasi ulang bila ada perubahan kondisi klinis atau edema memburuk.",
        followUp: "2026-05-12",
      },
    },
    {
      id: "kons-002",
      noRM: "RM-2025-003",
      tanggalRequest: "2026-05-08",
      waktuRequest: "08:00",
      urgency: "Rutin",
      smfId: "rm",
      smfNama: "Rehabilitasi Medik",
      smfSingkatan: "RM",
      dokterKonsultan: "dr. Hendra Wijaya, Sp.KFR",
      dokterPeminta: "dr. Budi Santoso, Sp.JP",
      situation:
        "Pasien GJK NYHA III dalam fase stabilisasi. Edema tungkai mulai berkurang setelah terapi diuretik. Pasien mulai dapat berjalan pelan di sekitar tempat tidur tanpa sesak.",
      background:
        "Rawat hari ke-6. EF 28%, TD 130/80 mmHg, nadi 78×/mnt, SpO2 96% room air. Pasien pensiunan, sebelumnya sedentary, tidak ada riwayat latihan fisik terstruktur.",
      assessment:
        "Pasien dalam fase pemulihan awal GJK. Perlu program latihan kardiak terstruktur dan aman untuk meningkatkan kapasitas fungsional secara bertahap sesuai kondisi EF rendah.",
      recommendation:
        "Mohon program rehabilitasi kardiak Fase I (in-hospital) yang aman dilakukan di ruangan. Target: peningkatan kapasitas fungsional bertahap, edukasi pasien & keluarga tentang aktivitas fisik pasca GJK.",
      status: "Dijawab",
      waktuDiterima: "09:00",
      waktuDijawab: "13:45",
      jawaban: {
        konsultan: "dr. Hendra Wijaya, Sp.KFR",
        asesmen:
          "Pasien GJK NYHA III fase stabilisasi, EF 28%. Layak memulai Cardiac Rehabilitation Fase I dengan intensitas sangat ringan. Target HR latihan: 50–60% HRmax (~79–95 bpm untuk usia 62 th).",
        rekomendasi:
          "Program Cardiac Rehab Fase I (In-hospital):\n• Hari 1: Latihan napas dalam 3×5 mnt, duduk di tepi bed 3×5 mnt\n• Hari 2: Berdiri + berjalan di tempat 3×10 mnt\n• Monitor: HR, TD, SpO2, gejala sebelum-saat-sesudah latihan\n• Stop latihan jika: HR > 100 bpm, SpO2 < 94%, sesak VAS > 4, nyeri dada\n• Edukasi: pantau BB harian, kenali gejala memburuk",
        tindakLanjut:
          "Visite dan evaluasi respons latihan tiap hari. Dijadwalkan Cardiac Rehab Fase II (outpatient) setelah pulang.",
        followUp: "2026-05-15",
      },
    },
  ],
  "RM-2025-021": [
    {
      id: "kons-rj1-001",
      noRM: "RM-2025-021",
      tanggalRequest: "2026-05-09",
      waktuRequest: "09:15",
      urgency: "Urgen",
      smfId: "kardio",
      smfNama: "Kardiologi",
      smfSingkatan: "KAR",
      dokterKonsultan: "dr. Budi Hartono, Sp.JP(K)",
      dokterPeminta: "dr. Ahmad Fauzi, Sp.JP",
      situation:
        "Pasien laki-laki 58 th, riwayat CAD post stent 1 tahun lalu, datang dengan nyeri dada kiri 2 hari menjalar ke bahu kiri. Skala nyeri 4/10. TD 148/92 mmHg.",
      background:
        "EKG: SR, RBBB lama. Troponin I serial masih pending. Echo terakhir EF 52% (6 bulan lalu). Obat: Amlodipine, Bisoprolol, Atorvastatin.",
      assessment:
        "Kemungkinan Unstable Angina pada pasien CAD multivessel. Perlu evaluasi lebih lanjut untuk menyingkirkan NSTEMI.",
      recommendation:
        "Mohon evaluasi dan rekomendasi tata laksana unstable angina pada pasien CAD post stent. Apakah perlu tindakan intervensi segera atau cukup konservatif?",
      status: "Diterima",
      waktuDiterima: "09:45",
    },
  ],
};
