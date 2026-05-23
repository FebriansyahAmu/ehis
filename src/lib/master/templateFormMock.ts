/**
 * Master Template Form — koleksi template form lintas modul.
 *
 * 4 jenis template (discriminator `jenis`):
 *   - SBAR Template (handover, konsultasi, transfer)
 *   - Informed Consent Risiko (risiko library per Tindakan)
 *   - Surat Pulang (5 jenis: Kontrol, Sakit, Dirawat, Rujukan Balik, Kematian)
 *   - CPPT Quick-text (smart phrases auto-expand)
 *
 * Konsumen:
 *   - SBAR    → HandoverTab, KonsultasiTab, SBARTransferPanel IGD→RI
 *   - IC Risiko → InformedConsentTab
 *   - Surat   → PasienPulangTab RI, SuratDokumenTab RJ
 *   - QuickText → CPPT entry (semua modul)
 */

import { FileText, MessageSquare, ClipboardCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TemplateFormJenis = "sbar" | "ic-risiko" | "surat" | "quick-text";

// ── SBAR ──────────────────────────────────────────────────

export type SBARContext = "Handover" | "Konsultasi" | "Transfer";

export interface SBARTemplate {
  id: string;
  jenis: "sbar";
  label: string;
  context: SBARContext;
  deskripsi?: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  status: "Aktif" | "NonAktif";
}

// ── Informed Consent Risiko ──────────────────────────────

export interface ICRisikoTemplate {
  id: string;
  jenis: "ic-risiko";
  label: string;
  tindakan: string;
  kodeIcd9?: string;
  deskripsi?: string;
  /** Risiko spesifik tindakan ini. */
  risikoSpesifik: string[];
  /** Manfaat tindakan. */
  manfaat: string;
  /** Alternatif yang tersedia. */
  alternatif: string;
  /** Konsekuensi jika menolak. */
  konsekuensiTolak: string;
  status: "Aktif" | "NonAktif";
}

// ── Surat Pulang ──────────────────────────────────────────

export type JenisSuratPulang =
  | "Kontrol"
  | "Sakit"
  | "Dirawat"
  | "Rujukan_Balik"
  | "Kematian";

export interface SuratTemplate {
  id: string;
  jenis: "surat";
  label: string;
  jenisSurat: JenisSuratPulang;
  deskripsi?: string;
  /** Body template — pakai placeholder ${nama} ${noRM} ${diagnosis} ${tanggal} */
  body: string;
  status: "Aktif" | "NonAktif";
}

// ── CPPT Quick-text ──────────────────────────────────────

export type QuickTextKategori =
  | "Pemeriksaan_Fisik"
  | "Status_Mental"
  | "Anjuran"
  | "Rencana"
  | "Lainnya";

export interface QuickTextTemplate {
  id: string;
  jenis: "quick-text";
  label: string;
  shortcut: string;
  kategori: QuickTextKategori;
  deskripsi?: string;
  /** Teks yang di-expand saat shortcut diketik. */
  expansion: string;
  status: "Aktif" | "NonAktif";
}

// ── Union type ────────────────────────────────────────────

export type TemplateFormItem =
  | SBARTemplate
  | ICRisikoTemplate
  | SuratTemplate
  | QuickTextTemplate;

// ── Config per jenis ──────────────────────────────────────

export const JENIS_CFG: Record<
  TemplateFormJenis,
  { label: string; short: string; deskripsi: string; icon: LucideIcon; tone: string; bg: string; text: string; ring: string; konsumen: string[] }
> = {
  "sbar": {
    label: "SBAR Template",
    short: "SBAR",
    deskripsi: "Situation-Background-Assessment-Recommendation untuk handover, konsultasi, dan transfer pasien.",
    icon: MessageSquare,
    tone: "violet",
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    konsumen: ["HandoverTab (RI/IGD)", "KonsultasiTab", "SBARTransferPanel IGD→RI"],
  },
  "ic-risiko": {
    label: "Informed Consent Risiko",
    short: "IC Risiko",
    deskripsi: "Library risiko spesifik per tindakan. Auto-populate saat InformedConsentTab pilih tindakan.",
    icon: ClipboardCheck,
    tone: "rose",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    konsumen: ["InformedConsentTab (semua modul)"],
  },
  "surat": {
    label: "Surat Pulang",
    short: "Surat",
    deskripsi: "Template body 5 jenis surat — Kontrol, Sakit, Dirawat, Rujukan Balik, Kematian. Placeholder ${nama}, ${noRM}, dst.",
    icon: FileText,
    tone: "sky",
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    konsumen: ["PasienPulangTab RI", "SuratDokumenTab RJ"],
  },
  "quick-text": {
    label: "CPPT Quick-text",
    short: "Quick-text",
    deskripsi: "Smart phrases (mis. /normal-thorax) yang auto-expand jadi paragraf lengkap di CPPT entry.",
    icon: Zap,
    tone: "amber",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    konsumen: ["CPPTTab (semua modul)"],
  },
};

export const JENIS_LIST: TemplateFormJenis[] = ["sbar", "ic-risiko", "surat", "quick-text"];

// ── SBAR Context config ──────────────────────────────────

export const SBAR_CONTEXT_CFG: Record<SBARContext, { label: string; bg: string; text: string }> = {
  Handover:    { label: "Handover Shift",    bg: "bg-indigo-100",  text: "text-indigo-700" },
  Konsultasi:  { label: "Konsultasi DPJP",   bg: "bg-violet-100",  text: "text-violet-700" },
  Transfer:    { label: "Transfer Pasien",   bg: "bg-sky-100",     text: "text-sky-700" },
};

// ── Surat config ──────────────────────────────────────────

export const SURAT_JENIS_CFG: Record<
  JenisSuratPulang,
  { label: string; bg: string; text: string; dot: string }
> = {
  Kontrol:        { label: "Surat Kontrol",          bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Sakit:          { label: "Keterangan Sakit",       bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
  Dirawat:        { label: "Keterangan Dirawat",     bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500" },
  Rujukan_Balik:  { label: "Rujukan Balik FKTP",     bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  Kematian:       { label: "Keterangan Kematian",    bg: "bg-slate-200",   text: "text-slate-700",   dot: "bg-slate-600" },
};

// ── Quick-text Kategori config ────────────────────────────

export const QUICKTEXT_KAT_CFG: Record<
  QuickTextKategori,
  { label: string; bg: string; text: string }
> = {
  Pemeriksaan_Fisik: { label: "Pemeriksaan Fisik", bg: "bg-teal-100",    text: "text-teal-700" },
  Status_Mental:     { label: "Status Mental",     bg: "bg-violet-100",  text: "text-violet-700" },
  Anjuran:           { label: "Anjuran",           bg: "bg-emerald-100", text: "text-emerald-700" },
  Rencana:           { label: "Rencana",           bg: "bg-sky-100",     text: "text-sky-700" },
  Lainnya:           { label: "Lainnya",           bg: "bg-slate-100",   text: "text-slate-700" },
};

// ── Mock data ─────────────────────────────────────────────

const SBAR_MOCK: SBARTemplate[] = [
  {
    id: "sb-001",
    jenis: "sbar",
    label: "Handover Shift RI Standard",
    context: "Handover",
    deskripsi: "Template baku untuk timbang terima shift di Rawat Inap (P↔S↔M)",
    situation: "Pasien Tn./Ny. ___ usia ___ thn, MRS hari ke-__ dengan diagnosis ___. Saat ini kondisi ___. Keluhan utama saat ini: ___.",
    background: "Riwayat singkat: ___. Terapi sedang diberikan: ___. Hasil pemeriksaan terbaru: ___. Allergi: ___.",
    assessment: "Masalah aktif: 1) ___ 2) ___. Perubahan kondisi shift ini: ___. Risiko terdeteksi: ___.",
    recommendation: "1) Monitor ___ tiap ___ jam. 2) Lapor DPJP bila ___. 3) Persiapan untuk ___ besok pagi.",
    status: "Aktif",
  },
  {
    id: "sb-002",
    jenis: "sbar",
    label: "Konsultasi DPJP via Telepon",
    context: "Konsultasi",
    deskripsi: "Format singkat untuk konsul telepon ke DPJP/konsulen lain — fokus pada masalah klinis yang butuh decision.",
    situation: "Selamat ___, saya ___ dari ruang ___. Mau lapor pasien Tn./Ny. ___ (RM ___), umur ___, dirawat dengan diagnosis ___.",
    background: "Riwayat: ___. Terapi saat ini: ___. Vital signs: TD ___/___ , Nadi ___ , Suhu ___ , RR ___ , SpO2 ___ %.",
    assessment: "Masalah saat ini: ___. Saya curiga ___ karena ___.",
    recommendation: "Apakah perlu ___ (obat / order / transfer / kunjungan DPJP)? Mohon arahannya, terima kasih.",
    status: "Aktif",
  },
  {
    id: "sb-003",
    jenis: "sbar",
    label: "Transfer IGD → Rawat Inap",
    context: "Transfer",
    deskripsi: "SBAR untuk transfer pasien dari IGD ke ruang Rawat Inap (admisi).",
    situation: "Pasien Tn./Ny. ___ usia ___ thn (RM ___) dari IGD, datang jam ___ dengan keluhan utama ___. Triase ___.",
    background: "Pemeriksaan IGD: ___. Hasil lab/rad: ___. Tindakan IGD: ___ (mis. resusitasi cairan ___ ml, antibiotik ___ , pemasangan ___).",
    assessment: "Diagnosis kerja: ___. Kondisi sekarang: ___. Hemodinamik ___. Allergi ___.",
    recommendation: "Order admission: 1) Ruang ___ 2) Diet ___ 3) Cairan ___ 4) Obat ___ 5) Order lab/rad ___ 6) Konsul ___ . DPJP: ___ .",
    status: "Aktif",
  },
];

const IC_RISIKO_MOCK: ICRisikoTemplate[] = [
  {
    id: "ic-001",
    jenis: "ic-risiko",
    label: "Operasi Apendiks (Apendektomi)",
    tindakan: "Apendektomi",
    kodeIcd9: "47.01",
    deskripsi: "Tindakan pembedahan untuk mengangkat apendiks yang meradang.",
    risikoSpesifik: [
      "Perdarahan intra-operasi / pasca-operasi",
      "Infeksi luka operasi / abses intra-abdomen",
      "Cedera organ sekitar (sekum, ileum)",
      "Stump leakage / fistula stercoral",
      "Adhesi pasca operasi → ileus",
      "Komplikasi anestesi (alergi, aspirasi, dll)",
      "Konversi ke laparotomi terbuka (jika laparoskopi)",
    ],
    manfaat: "Mencegah ruptur apendiks dan peritonitis difus yang dapat mengancam jiwa.",
    alternatif: "Terapi konservatif dengan antibiotik (hanya untuk apendisitis tanpa komplikasi tertentu), namun risiko kambuh tinggi.",
    konsekuensiTolak: "Risiko ruptur apendiks, peritonitis, sepsis, dan kematian.",
    status: "Aktif",
  },
  {
    id: "ic-002",
    jenis: "ic-risiko",
    label: "PCI / Kateterisasi Jantung",
    tindakan: "Percutaneous Coronary Intervention (PCI)",
    kodeIcd9: "00.66",
    deskripsi: "Pemasangan stent untuk membuka arteri koroner yang menyempit.",
    risikoSpesifik: [
      "Perdarahan dari lokasi akses (femoral/radial)",
      "Hematoma, pseudoaneurisma arteri",
      "Disseksi/perforasi arteri koroner",
      "Stent thrombosis (akut/subakut)",
      "Reaksi kontras (mild rash hingga anafilaksis)",
      "Contrast-induced nephropathy",
      "Infark miokard peri-prosedural",
      "Aritmia (VT/VF)",
      "Stroke / TIA",
      "Kematian (<1% pada kasus elektif)",
    ],
    manfaat: "Membuka arteri koroner tersumbat, mengurangi gejala angina, mencegah infark/kematian.",
    alternatif: "Terapi optimal medikamentosa (OMT), CABG (bedah bypass), terapi konservatif.",
    konsekuensiTolak: "Risiko infark miokard, gagal jantung progresif, kematian mendadak.",
    status: "Aktif",
  },
  {
    id: "ic-003",
    jenis: "ic-risiko",
    label: "Transfusi Darah / Komponen",
    tindakan: "Transfusi PRC / WB / FFP / TC",
    kodeIcd9: "99.04",
    deskripsi: "Pemberian sel darah merah/whole blood/plasma/trombosit.",
    risikoSpesifik: [
      "Reaksi transfusi akut (demam, alergi ringan)",
      "Reaksi transfusi berat (hemolitik, TRALI, TACO)",
      "Anafilaksis",
      "Penularan infeksi: HIV, Hepatitis B/C, sifilis, malaria (risiko sangat rendah)",
      "Iron overload (transfusi berulang)",
      "Alloimunisasi (terbentuk antibodi)",
      "Volume overload (CHF eksaserbasi)",
    ],
    manfaat: "Mengatasi anemia simptomatik, perdarahan akut, gangguan koagulasi.",
    alternatif: "Suplementasi besi/asam folat, eritropoetin, terapi spesifik penyebab anemia.",
    konsekuensiTolak: "Risiko syok hipovolemik, hipoksia jaringan, gagal organ.",
    status: "Aktif",
  },
  {
    id: "ic-004",
    jenis: "ic-risiko",
    label: "Pemasangan Ventilator Mekanik",
    tindakan: "Mechanical Ventilation",
    kodeIcd9: "96.71",
    deskripsi: "Bantuan napas dengan ventilator mekanik via ETT.",
    risikoSpesifik: [
      "Cedera trakea/laring saat intubasi",
      "VAP (Ventilator-Associated Pneumonia)",
      "Barotrauma (pneumothorax, pneumomediastinum)",
      "Volutrauma & ARDS",
      "Hemodinamik unstable saat induksi",
      "Sedasi berkepanjangan → delirium",
      "Disfungsi diafragma (VIDD)",
      "Sulit weaning",
    ],
    manfaat: "Mempertahankan oksigenasi & ventilasi pada gagal napas berat.",
    alternatif: "Non-invasive ventilation (NIV/BiPAP/CPAP) pada kasus tertentu.",
    konsekuensiTolak: "Risiko gagal napas progresif, henti napas, kematian.",
    status: "Aktif",
  },
];

const SURAT_MOCK: SuratTemplate[] = [
  {
    id: "su-001",
    jenis: "surat",
    label: "Surat Kontrol Standar",
    jenisSurat: "Kontrol",
    deskripsi: "Surat jadwal kontrol pasca rawat",
    body: `Yang bertanda tangan di bawah ini, dokter Penanggung Jawab Pelayanan:

Nama Pasien     : \${nama}
No. Rekam Medis : \${noRM}
Tanggal Lahir   : \${tglLahir}
Diagnosis       : \${diagnosis}

Dengan ini disarankan untuk kontrol kembali pada:

  Tanggal : \${tglKontrol}
  Poli    : \${poliTujuan}
  Dokter  : \${dokterTujuan}

Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.

Hormat kami,
\${dokterDpjp}`,
    status: "Aktif",
  },
  {
    id: "su-002",
    jenis: "surat",
    label: "Surat Keterangan Sakit (Rawat)",
    jenisSurat: "Sakit",
    deskripsi: "Surat keterangan sakit pasca rawat inap untuk keperluan kerja/sekolah",
    body: `Yang bertanda tangan di bawah ini menerangkan bahwa:

Nama        : \${nama}
No. RM      : \${noRM}
Pekerjaan   : \${pekerjaan}

Telah menjalani perawatan di \${namaRS} dari tanggal \${tglMasuk} sampai \${tglPulang} dengan diagnosis \${diagnosis}.

Pasien dianjurkan istirahat dari aktivitas kerja/sekolah selama \${lamaIstirahat} hari, terhitung sejak tanggal \${tglMulaiIstirahat}.

Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.

Hormat kami,
\${dokterDpjp}`,
    status: "Aktif",
  },
  {
    id: "su-003",
    jenis: "surat",
    label: "Surat Keterangan Dirawat (BPJS)",
    jenisSurat: "Dirawat",
    deskripsi: "Keterangan perawatan untuk klaim asuransi/BPJS",
    body: `KETERANGAN PERAWATAN

Yang bertanda tangan di bawah ini menerangkan bahwa:

Nama        : \${nama}
No. RM      : \${noRM}
Penjamin    : \${penjamin} (No. Kartu: \${noKartu})

Telah menjalani rawat inap di \${namaRS}, ruang \${ruangan} kelas \${kelas}, dari tanggal \${tglMasuk} sampai \${tglPulang}.

Diagnosis utama: \${diagnosis} (ICD-10: \${kodeIcd10})
Kondisi pulang: \${kondisiPulang}

Surat ini dibuat untuk keperluan administrasi klaim.

\${dokterDpjp}`,
    status: "Aktif",
  },
  {
    id: "su-004",
    jenis: "surat",
    label: "Rujukan Balik FKTP",
    jenisSurat: "Rujukan_Balik",
    deskripsi: "Surat balik ke FKTP pengirim setelah pasien selesai rawat di RS",
    body: `Kepada Yth.
\${fktpTujuan}
di tempat

Bersama ini kami sampaikan bahwa pasien:
Nama   : \${nama}
RM     : \${noRM}

Yang dirujuk pada tanggal \${tglRujukan} dengan diagnosis \${diagnosisAwal}, telah selesai menjalani perawatan/konsultasi di \${namaRS}.

Diagnosis akhir : \${diagnosis}
Tindakan        : \${tindakan}
Obat pulang     : \${obatPulang}

Selanjutnya kami sarankan pemantauan rutin di FKTP dengan instruksi:
\${instruksiFollowup}

Terima kasih atas kerjasamanya.

\${dokterDpjp}`,
    status: "Aktif",
  },
  {
    id: "su-005",
    jenis: "surat",
    label: "Keterangan Kematian",
    jenisSurat: "Kematian",
    deskripsi: "Surat keterangan kematian dari dokter penanggung jawab",
    body: `SURAT KETERANGAN KEMATIAN

Yang bertanda tangan di bawah ini, dokter di \${namaRS}, menerangkan bahwa:

Nama            : \${nama}
No. RM          : \${noRM}
Jenis Kelamin   : \${jenisKelamin}
Tanggal Lahir   : \${tglLahir}
Alamat          : \${alamat}

Telah meninggal dunia pada:
  Tanggal     : \${tglMeninggal}
  Jam         : \${jamMeninggal}
  Tempat      : \${tempatMeninggal}

Sebab kematian (ICD-10):
  Primer      : \${sebabPrimer} (\${kodeIcd10Primer})
  Antara      : \${sebabAntara}
  Mendasari   : \${sebabMendasari}

Jenis kematian : \${jenisKematian}

Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.

\${dokterDpjp}`,
    status: "Aktif",
  },
];

const QUICK_TEXT_MOCK: QuickTextTemplate[] = [
  {
    id: "qt-001",
    jenis: "quick-text",
    label: "Pemeriksaan Thorax Normal",
    shortcut: "/normal-thorax",
    kategori: "Pemeriksaan_Fisik",
    deskripsi: "Status paru/jantung normal lengkap",
    expansion: "Inspeksi: bentuk dan gerak dinding dada simetris, tidak ada retraksi. Palpasi: fremitus taktil simetris, tidak ada nyeri tekan. Perkusi: sonor di seluruh lapang paru. Auskultasi: vesikuler +/+, ronkhi -/-, wheezing -/-. Jantung: S1-S2 reguler, murmur (-), gallop (-).",
    status: "Aktif",
  },
  {
    id: "qt-002",
    jenis: "quick-text",
    label: "Pemeriksaan Abdomen Normal",
    shortcut: "/normal-abdomen",
    kategori: "Pemeriksaan_Fisik",
    deskripsi: "Status abdomen normal",
    expansion: "Inspeksi: datar, tidak ada distensi, jaringan parut tidak ada. Auskultasi: bising usus normal 8x/menit. Palpasi: supel, tidak ada nyeri tekan, hepar dan lien tidak teraba. Perkusi: timpani di seluruh kuadran. Tidak ada tanda peritonitis.",
    status: "Aktif",
  },
  {
    id: "qt-003",
    jenis: "quick-text",
    label: "Status Neurologis Dasar Normal",
    shortcut: "/normal-neuro",
    kategori: "Pemeriksaan_Fisik",
    deskripsi: "Status neuro singkat",
    expansion: "GCS E4V5M6 = 15. Pupil bulat isokor 3mm/3mm, refleks cahaya +/+. Tidak ada defisit nervus kranialis. Motorik 5/5/5/5. Sensorik intak. Refleks fisiologis normal, patologis (-). Tidak ada kaku kuduk.",
    status: "Aktif",
  },
  {
    id: "qt-004",
    jenis: "quick-text",
    label: "Status Mental Normal",
    shortcut: "/normal-mental",
    kategori: "Status_Mental",
    deskripsi: "Status mental dasar",
    expansion: "Pasien tampak tenang, kooperatif, kontak mata baik. Orientasi waktu/tempat/orang baik. Mood eutim, afek serasi. Tidak ada halusinasi, waham, atau ide bunuh diri. Insight baik.",
    status: "Aktif",
  },
  {
    id: "qt-005",
    jenis: "quick-text",
    label: "Anjuran Diet Jantung",
    shortcut: "/anjuran-jantung",
    kategori: "Anjuran",
    deskripsi: "Anjuran umum pasien jantung",
    expansion: "Diet rendah garam (<2 g Na/hari), restriksi cairan 1.500 ml/hari. Hindari makanan tinggi lemak jenuh. Olahraga ringan bertahap sesuai toleransi. Timbang BB harian, lapor jika naik >2 kg dalam 3 hari. Patuh minum obat. Kontrol rutin sesuai jadwal.",
    status: "Aktif",
  },
  {
    id: "qt-006",
    jenis: "quick-text",
    label: "Anjuran Diet DM",
    shortcut: "/anjuran-dm",
    kategori: "Anjuran",
    deskripsi: "Anjuran umum pasien DM tipe 2",
    expansion: "Diet DM 1.700-2.000 kkal/hari, 3J (jumlah, jenis, jadwal). Hindari gula sederhana dan karbohidrat olahan. Olahraga aerobik minimal 150 mnt/minggu. Cek GDS rutin sesuai instruksi. Perawatan kaki harian. Cek HbA1c tiap 3 bulan.",
    status: "Aktif",
  },
  {
    id: "qt-007",
    jenis: "quick-text",
    label: "Rencana Lanjut Observasi",
    shortcut: "/plan-obs",
    kategori: "Rencana",
    deskripsi: "Plan observasi standar",
    expansion: "1) Observasi TTV per shift. 2) Pertahankan terapi saat ini. 3) Cek lab ulang besok pagi (DR, fungsi ginjal). 4) Konsul __ bila kondisi memburuk. 5) Diskusi keluarga tentang prognosis dan rencana.",
    status: "Aktif",
  },
  {
    id: "qt-008",
    jenis: "quick-text",
    label: "Rencana Pulang H+1",
    shortcut: "/plan-pulang",
    kategori: "Rencana",
    deskripsi: "Plan persiapan pulang",
    expansion: "1) Rencana KRS besok pagi setelah kontrol DPJP. 2) Edukasi pasien & keluarga tentang obat pulang dan tanda bahaya. 3) Pastikan rekonsiliasi obat pulang selesai. 4) Jadwal kontrol poliklinik. 5) Surat-surat administrasi (Resume Medis, Surat Kontrol).",
    status: "Aktif",
  },
];

export const TEMPLATE_FORM_MOCK: TemplateFormItem[] = [
  ...SBAR_MOCK,
  ...IC_RISIKO_MOCK,
  ...SURAT_MOCK,
  ...QUICK_TEXT_MOCK,
];

// ── Helpers ───────────────────────────────────────────────

export function emptyTemplateForJenis(jenis: TemplateFormJenis): TemplateFormItem {
  const id = `tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (jenis) {
    case "sbar":
      return {
        id, jenis: "sbar", label: "", context: "Handover",
        situation: "", background: "", assessment: "", recommendation: "",
        status: "Aktif",
      };
    case "ic-risiko":
      return {
        id, jenis: "ic-risiko", label: "", tindakan: "",
        risikoSpesifik: [], manfaat: "", alternatif: "", konsekuensiTolak: "",
        status: "Aktif",
      };
    case "surat":
      return {
        id, jenis: "surat", label: "", jenisSurat: "Kontrol",
        body: "", status: "Aktif",
      };
    case "quick-text":
      return {
        id, jenis: "quick-text", label: "", shortcut: "/",
        kategori: "Lainnya", expansion: "", status: "Aktif",
      };
  }
}

export function isTemplateFormValid(t: TemplateFormItem): boolean {
  if (t.label.trim() === "") return false;
  switch (t.jenis) {
    case "sbar":
      return t.situation.trim() !== "" && t.recommendation.trim() !== "";
    case "ic-risiko":
      return t.tindakan.trim() !== "" && t.risikoSpesifik.length > 0;
    case "surat":
      return t.body.trim() !== "";
    case "quick-text":
      return t.shortcut.trim() !== "" && t.shortcut.startsWith("/") && t.expansion.trim() !== "";
  }
}

export function filterByJenis(items: TemplateFormItem[], jenis: TemplateFormJenis): TemplateFormItem[] {
  return items.filter((t) => t.jenis === jenis);
}

export function countByJenis(items: TemplateFormItem[], jenis: TemplateFormJenis): number {
  return items.filter((t) => t.jenis === jenis).length;
}
