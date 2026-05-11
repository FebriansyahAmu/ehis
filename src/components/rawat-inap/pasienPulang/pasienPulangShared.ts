export type StatusKepulangan =
  | "Pulang Atas Saran Dokter"
  | "APS"
  | "Dirujuk RS Lain"
  | "Meninggal";

export type JenisSurat =
  | "Surat Kontrol"
  | "Surat Keterangan Sakit"
  | "Surat Keterangan Dirawat"
  | "Surat Rujukan Balik"
  | "Surat Kematian";

// ── Core interfaces ───────────────────────────────────────

export interface ObatPulangItem {
  id:        string;
  namaObat:  string;
  dosis:     string;
  frekuensi: string;
  durasi:    string;
  instruksi: string;
  isHAM:     boolean;
  fromResep: boolean;
}

export interface JadwalKontrol {
  id:      string;
  tanggal: string;
  poli:    string;
  dokter:  string;
  catatan: string;
}

export interface JadwalPemeriksaan {
  id:      string;
  jenis:   "Lab" | "Radiologi";
  nama:    string;
  tanggal: string;
  catatan: string;
}

export interface SuratPulang {
  id:            string;
  jenis:         JenisSurat;
  keterangan:    string;
  diterbitkan:   boolean;
  diterbitkanAt: string;
}

export interface ResumeMedisRI {
  ringkasanAnamnesis:  string;
  hasilPemeriksaan:    string;
  terapiDiberikan:     string;
  kondisiSaatPulang:   string;
  instruksiPulang:     string;
  pembatasanAktivitas: string;
  dietPulang:          string;
  tandaTanganPasien:   boolean;
  dpjpApproved:        boolean;
  dpjpApprovedAt:      string;
}

export interface PasienPulangData {
  status:                StatusKepulangan | "";
  tanggalPulang:         string;
  jamPulang:             string;
  dokterYangMemulangkan: string;
  catatanKondisiAkhir:   string;
  obatPulang:            ObatPulangItem[];
  jadwalKontrol:         JadwalKontrol[];
  jadwalPemeriksaan:     JadwalPemeriksaan[];
  adaRujukanFKTP:        boolean;
  fktpNama:              string;
  fktpTujuan:            string;
  surat:                 SuratPulang[];
  resume:                ResumeMedisRI;
}

// ── Display config ────────────────────────────────────────

export const STATUS_KEPULANGAN_CONFIG: Record<
  StatusKepulangan,
  { badge: string; sel: string; dot: string; desc: string }
> = {
  "Pulang Atas Saran Dokter": {
    badge: "bg-emerald-100 text-emerald-700",
    sel:   "border-emerald-400 bg-emerald-50 text-emerald-800",
    dot:   "bg-emerald-500",
    desc:  "Kondisi membaik, DPJP mengizinkan pulang",
  },
  "APS": {
    badge: "bg-orange-100 text-orange-700",
    sel:   "border-orange-400 bg-orange-50 text-orange-800",
    dot:   "bg-orange-500",
    desc:  "Atas Permintaan Sendiri — sebelum diizinkan dokter",
  },
  "Dirujuk RS Lain": {
    badge: "bg-violet-100 text-violet-700",
    sel:   "border-violet-400 bg-violet-50 text-violet-800",
    dot:   "bg-violet-500",
    desc:  "Memerlukan penanganan di fasilitas lebih tinggi",
  },
  "Meninggal": {
    badge: "bg-red-100 text-red-700",
    sel:   "border-red-400 bg-red-50 text-red-800",
    dot:   "bg-red-500",
    desc:  "Pasien meninggal selama perawatan",
  },
};

export const STATUS_KEPULANGAN_LIST: StatusKepulangan[] = [
  "Pulang Atas Saran Dokter", "APS", "Dirujuk RS Lain", "Meninggal",
];

export const POLI_OPTIONS = [
  "Poliklinik Jantung", "Poliklinik Penyakit Dalam", "Poliklinik Bedah",
  "Poliklinik Neurologi", "Poliklinik Ortopedi", "Poliklinik Paru",
  "Poliklinik Gizi Klinik", "Poliklinik Rehabilitasi Medik",
  "Poliklinik Urologi", "Poliklinik Kulit & Kelamin", "Poliklinik Mata",
  "Poliklinik THT", "Poliklinik Obstetri & Ginekologi",
];

export const SURAT_TEMPLATE: Array<Omit<SuratPulang, "diterbitkan" | "diterbitkanAt">> = [
  { id: "st-1", jenis: "Surat Kontrol",            keterangan: "Surat jadwal kontrol poliklinik — wajib diberikan ke pasien"       },
  { id: "st-2", jenis: "Surat Keterangan Sakit",   keterangan: "Keterangan rawat inap untuk keperluan kerja atau sekolah"           },
  { id: "st-3", jenis: "Surat Keterangan Dirawat", keterangan: "Keterangan perawatan untuk klaim asuransi / BPJS"                   },
  { id: "st-4", jenis: "Surat Rujukan Balik",      keterangan: "Surat ke FKTP pengirim bahwa pasien sudah ditangani"                },
  { id: "st-5", jenis: "Surat Kematian",           keterangan: "Surat keterangan kematian dari dokter penanggung jawab"             },
];

export function makeInitialSurat(): SuratPulang[] {
  return SURAT_TEMPLATE.map(t => ({ ...t, diterbitkan: false, diterbitkanAt: "" }));
}

// ── Completion checker ────────────────────────────────────

export interface CompletionItem {
  id:   string;
  label: string;
  hint:  string;
  done:  boolean;
  tab?:  string;
}

export function checkResumeCompletion(
  data:        PasienPulangData,
  hasDiagnosa: boolean,
): CompletionItem[] {
  return [
    { id: "c1", label: "Status kepulangan",       hint: "Pilih status kepulangan di tab Status",              done: data.status !== "",                                 tab: "status" },
    { id: "c2", label: "Diagnosa akhir ICD-10",   hint: "Isi diagnosa di tab Diagnosa rekam medis",           done: hasDiagnosa },
    { id: "c3", label: "Kondisi saat pulang",      hint: "Isi kondisi objektif pasien saat pulang",            done: data.resume.kondisiSaatPulang.trim().length > 0 },
    { id: "c4", label: "Terapi yang diberikan",    hint: "Ringkasan terapi selama rawat inap",                 done: data.resume.terapiDiberikan.trim().length > 0 },
    { id: "c5", label: "Instruksi pulang",         hint: "Instruksi dan anjuran untuk pasien",                 done: data.resume.instruksiPulang.trim().length > 0 },
    { id: "c6", label: "Minimal 1 obat pulang",   hint: "Tambahkan obat pulang di tab Obat & Jadwal",         done: data.obatPulang.length > 0,                         tab: "obat" },
    { id: "c7", label: "TTD / Persetujuan DPJP",  hint: "DPJP belum menandatangani resume medis",             done: data.resume.dpjpApproved },
  ];
}

// ── Mock data ─────────────────────────────────────────────

export const PASIEN_PULANG_MOCK: Record<string, PasienPulangData> = {
  "RM-2025-003": {
    status:                "Pulang Atas Saran Dokter",
    tanggalPulang:         "2026-05-12",
    jamPulang:             "10:30",
    dokterYangMemulangkan: "dr. Budi Santoso Sp.JP",
    catatanKondisiAkhir:   "Kondisi stabil, edema minimal, SpO₂ 97% room air. Siap dipulangkan dengan obat oral.",
    obatPulang: [
      { id: "op-1", namaObat: "Bisoprolol 5 mg",      dosis: "5 mg",  frekuensi: "1×1 pagi", durasi: "30 hari", isHAM: true,  fromResep: true, instruksi: "JANGAN dihentikan mendadak. Pantau nadi — hubungi dokter jika nadi < 50×/mnt." },
      { id: "op-2", namaObat: "Candesartan 8 mg",     dosis: "8 mg",  frekuensi: "1×1 pagi", durasi: "30 hari", isHAM: false, fromResep: true, instruksi: "Pantau tekanan darah. Minum sebelum makan." },
      { id: "op-3", namaObat: "Furosemide 40 mg tab", dosis: "40 mg", frekuensi: "1×1 pagi", durasi: "30 hari", isHAM: false, fromResep: true, instruksi: "Minum pagi hari. Pantau BAK — lapor jika < 400 ml/hari. Timbang BB tiap pagi." },
      { id: "op-4", namaObat: "Spironolactone 25 mg", dosis: "25 mg", frekuensi: "1×1 pagi", durasi: "30 hari", isHAM: false, fromResep: true, instruksi: "Hindari konsumsi kalium berlebihan (pisang, kelapa muda)." },
    ],
    jadwalKontrol: [
      { id: "jk-1", tanggal: "2026-05-19", poli: "Poliklinik Jantung",     dokter: "dr. Dewi Kusuma, Sp.JP", catatan: "Kontrol 1 minggu pasca pulang. Bawa semua obat yang dikonsumsi." },
      { id: "jk-2", tanggal: "2026-05-26", poli: "Poliklinik Gizi Klinik", dokter: "dr. Anisa Putri, Sp.GK", catatan: "Evaluasi diet jantung & status nutrisi 2 minggu pasca pulang." },
    ],
    jadwalPemeriksaan: [
      { id: "jp-1", jenis: "Lab",       nama: "Elektrolit (Na, K, Mg)",          tanggal: "2026-05-26", catatan: "Monitoring efek diuretik." },
      { id: "jp-2", jenis: "Lab",       nama: "Fungsi Ginjal (Ureum, Kreatinin)", tanggal: "2026-05-26", catatan: "Monitoring ACE inhibitor (Candesartan)." },
      { id: "jp-3", jenis: "Lab",       nama: "BNP / NT-proBNP",                 tanggal: "2026-06-09", catatan: "Evaluasi marker gagal jantung 4 minggu pasca pulang." },
      { id: "jp-4", jenis: "Radiologi", nama: "Foto Thorax PA",                  tanggal: "2026-06-09", catatan: "Evaluasi kardiomegali dan efusi pleura." },
    ],
    adaRujukanFKTP: true,
    fktpNama:       "Puskesmas Kecamatan Menteng",
    fktpTujuan:     "Monitoring rutin TTV, BB harian, kepatuhan minum obat, dan edukasi berkelanjutan.",
    surat: makeInitialSurat(),
    resume: {
      ringkasanAnamnesis:
        "Pasien laki-laki 67 tahun masuk dengan keluhan sesak napas memberat sejak 3 hari dan kaki bengkak bilateral. TD 150/95 mmHg, Nadi 98×/mnt, SpO₂ 92% room air, ronkhi basah bilateral, edema pretibial +2. Ekokardiografi: EF 28%.",
      hasilPemeriksaan:
        "Lab: BNP 1.240 pg/mL, Na 138, K 3.8. Ro Thorax: kardiomegali, efusi pleura bilateral. Echo: EF 28%, dilatasi LV, regurgitasi mitral ringan.",
      terapiDiberikan:
        "Furosemide 40 mg IV → oral, O₂ 4 L/mnt, restriksi cairan 1.000 ml/hari. Candesartan 8 mg, Bisoprolol 5 mg, Spironolactone 25 mg oral. Konsultasi gizi: Diet Jantung III. Rehab Kardiak Fase I.",
      kondisiSaatPulang:
        "Kondisi umum membaik. TD 128/80 mmHg, Nadi 80×/mnt reguler, RR 17×/mnt, SpO₂ 97% room air. Edema tungkai minimal grade I.",
      instruksiPulang:
        "1. Minum obat teratur — jangan dihentikan tanpa konsultasi dokter\n2. Timbang BB setiap pagi, catat hasilnya\n3. Restriksi cairan: maks 1.500 ml/hari di rumah\n4. Diet rendah garam: Na < 2 g/hari\n5. Aktivitas bertahap sesuai program Cardiac Rehab\n6. Kontrol Poliklinik Jantung 19 Mei 2026",
      pembatasanAktivitas:
        "Aktivitas ringan-sedang. Hindari mengangkat beban berat. Lanjutkan Cardiac Rehab Fase II (outpatient).",
      dietPulang:
        "Diet Jantung III 1.700 kkal/hari. Restriksi Na < 2 g/hari. Restriksi cairan 1.500 ml/hari. Karbohidrat kompleks, hindari gula sederhana.",
      tandaTanganPasien: false,
      dpjpApproved:      false,
      dpjpApprovedAt:    "",
    },
  },
};
