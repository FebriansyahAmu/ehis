/**
 * Rujukan Mock (BP0.3).
 *
 * **Rujukan Masuk** (dari FKTP/FKRTL ke RS kita) — 15 entries lintas tipe.
 * **Rujukan Keluar** (RS kita rujuk ke RS lain) — 6 entries (cross-link SEP_MOCK).
 *
 * Distribusi Masuk:
 * - 10 FKTP (Puskesmas/Klinik Pratama) → rujukan ke RS (FKRTL kita)
 * - 5 FKRTL (RS Tipe C → RS Tipe B kita) — rujukan antar-RS
 *
 * Distribusi Keluar:
 * - 4 rujukan ke RS Tipe A (Hasan Sadikin/Cipto/Sardjito/Kariadi)
 * - 1 rujukan FKTP (rujukan balik PRB)
 * - 1 rujukan parsial (penunjang khusus)
 *
 * Masa berlaku rujukan masuk:
 * - FKTP: 90 hari (PMK 71/2013)
 * - FKRTL: 90 hari spesialistik · 30 hari penunjang
 */

import type {
  RujukanKeluarDetail,
  RujukanKhususListItem,
  RujukanRecord,
  RujukanRSDetail,
} from "../bpjsShared";
import { PESERTA_MOCK } from "./pesertaMock";

const RS_KITA = { kode: "0001R001", nama: "RS Sakti Husada", tipe: "FKRTL" as const };

const PKM_MAWAR = { kode: "0001P001", nama: "PKM Mawar", tipe: "FKTP" as const };
const PKM_MELATI = { kode: "0001P002", nama: "PKM Melati", tipe: "FKTP" as const };
const PKM_ANGGREK = { kode: "0001P003", nama: "PKM Anggrek", tipe: "FKTP" as const };
const KLINIK_SEHAT = { kode: "0001P010", nama: "Klinik Sehat Pratama", tipe: "FKTP" as const };
const KLINIK_BAKTI = { kode: "0001P011", nama: "Klinik Bakti", tipe: "FKTP" as const };

const RS_CITRA = { kode: "0001R010", nama: "RS Citra Husada", tipe: "FKRTL" as const };
const RS_BUNDA = { kode: "0001R020", nama: "RS Bunda Sehat", tipe: "FKRTL" as const };

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── 15 Rujukan Seed ────────────────────────────────────

export const RUJUKAN_MOCK: ReadonlyArray<RujukanRecord> = [
  // ── 10 FKTP → RS ───────────────────────────────────
  {
    noRujukan: "RUJ/FKTP-Mawar/2026/05/0023",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-04-30",
    tglRujukan: "2026-04-30",
    ppkAsal: PKM_MAWAR,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    diagnosa: { kode: "I21.0", nama: "Acute Myocardial Infarction" },
    catatan: "Pasien nyeri dada akut, EKG ST elevasi. Dirujuk untuk PCI.",
    peserta: PESERTA_MOCK[0],
    keluhan: "Nyeri dada hebat sejak 2 jam",
    status: "Used",
    masaBerlaku: { from: "2026-04-30", to: addDays("2026-04-30", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Melati/2026/05/0030",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-02",
    tglRujukan: "2026-05-02",
    ppkAsal: PKM_MELATI,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "OBG", nama: "Obstetri & Ginekologi" },
    diagnosa: { kode: "O82", nama: "Single delivery by caesarean section" },
    peserta: PESERTA_MOCK[1],
    keluhan: "Persalinan dengan riwayat SC sebelumnya",
    status: "Used",
    masaBerlaku: { from: "2026-05-02", to: addDays("2026-05-02", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Anggrek/2026/05/0041",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-18",
    tglRujukan: "2026-05-18",
    ppkAsal: PKM_ANGGREK,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    diagnosa: { kode: "E11.9", nama: "Type 2 diabetes mellitus, uncomplicated" },
    peserta: PESERTA_MOCK[2],
    keluhan: "DM tidak terkontrol, perlu evaluasi insulin",
    status: "Used",
    masaBerlaku: { from: "2026-05-18", to: addDays("2026-05-18", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Mawar/2026/05/0052",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-08",
    tglRujukan: "2026-05-08",
    ppkAsal: PKM_MAWAR,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "2",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    diagnosa: { kode: "I10", nama: "Essential hypertension" },
    peserta: PESERTA_MOCK[3],
    keluhan: "Tekanan darah tinggi tidak terkontrol",
    status: "Used",
    masaBerlaku: { from: "2026-05-08", to: addDays("2026-05-08", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Sehat/2026/05/0060",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-13",
    tglRujukan: "2026-05-13",
    ppkAsal: KLINIK_SEHAT,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "BED", nama: "Bedah" },
    diagnosa: { kode: "K35.8", nama: "Acute appendicitis, other" },
    peserta: PESERTA_MOCK[4],
    keluhan: "Nyeri perut kanan bawah, McBurney positif",
    status: "Used",
    masaBerlaku: { from: "2026-05-13", to: addDays("2026-05-13", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Bakti/2026/05/0072",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-10",
    tglRujukan: "2026-05-10",
    ppkAsal: KLINIK_BAKTI,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "2",
    poli: { kode: "MAT", nama: "Mata" },
    diagnosa: { kode: "H25.9", nama: "Senile cataract, unspecified" },
    peserta: PESERTA_MOCK[5],
    keluhan: "Penglihatan kabur progresif, kandidat operasi katarak",
    status: "Used",
    masaBerlaku: { from: "2026-05-10", to: addDays("2026-05-10", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Melati/2026/05/0085",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-19",
    tglRujukan: "2026-05-19",
    ppkAsal: PKM_MELATI,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "ORT", nama: "Ortopedi" },
    diagnosa: { kode: "M17.0", nama: "Bilateral primary osteoarthritis of knee" },
    peserta: PESERTA_MOCK[6],
    keluhan: "Nyeri lutut bilateral, sulit berjalan",
    status: "Aktif",
    masaBerlaku: { from: "2026-05-19", to: addDays("2026-05-19", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Anggrek/2026/05/0090",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-04",
    tglRujukan: "2026-05-04",
    ppkAsal: PKM_ANGGREK,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "PAR", nama: "Paru" },
    diagnosa: { kode: "J18.9", nama: "Pneumonia, unspecified" },
    peserta: PESERTA_MOCK[7],
    keluhan: "Sesak napas + demam tinggi 3 hari",
    status: "Used",
    masaBerlaku: { from: "2026-05-04", to: addDays("2026-05-04", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Sehat/2026/05/0098",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-16",
    tglRujukan: "2026-05-16",
    ppkAsal: KLINIK_SEHAT,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    diagnosa: { kode: "A09", nama: "Diarrhoea and gastroenteritis" },
    peserta: PESERTA_MOCK[8],
    keluhan: "Diare + dehidrasi sedang, butuh rawat inap",
    status: "Used",
    masaBerlaku: { from: "2026-05-16", to: addDays("2026-05-16", 90) },
  },
  {
    noRujukan: "RUJ/FKTP-Mawar/2026/05/0105",
    asalRujukan: "FKTP",
    tglKunjungan: "2026-05-23",
    tglRujukan: "2026-05-23",
    ppkAsal: PKM_MAWAR,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "JAN", nama: "Jantung" },
    diagnosa: { kode: "I50.0", nama: "Congestive heart failure" },
    peserta: PESERTA_MOCK[9],
    keluhan: "Sesak napas saat aktivitas ringan, edema kaki",
    status: "Aktif",
    masaBerlaku: { from: "2026-05-23", to: addDays("2026-05-23", 90) },
  },

  // ── 5 FKRTL → RS Tipe lebih tinggi ─────────────────
  {
    noRujukan: "RUJ/FKRTL-Citra/2026/05/0011",
    asalRujukan: "FKRTL",
    tglKunjungan: "2026-05-05",
    tglRujukan: "2026-05-05",
    ppkAsal: RS_CITRA,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "JAN", nama: "Jantung" },
    diagnosa: { kode: "I25.10", nama: "Atherosclerotic heart disease" },
    catatan: "Rujukan untuk PCI elektif, fasilitas cathlab RS Citra terbatas",
    peserta: PESERTA_MOCK[0],
    keluhan: "Riwayat IMA, butuh evaluasi cath lab",
    status: "Aktif",
    masaBerlaku: { from: "2026-05-05", to: addDays("2026-05-05", 90) },
  },
  {
    noRujukan: "RUJ/FKRTL-Bunda/2026/05/0024",
    asalRujukan: "FKRTL",
    tglKunjungan: "2026-05-11",
    tglRujukan: "2026-05-11",
    ppkAsal: RS_BUNDA,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "BED", nama: "Bedah" },
    diagnosa: { kode: "C50.9", nama: "Malignant neoplasm of breast" },
    catatan: "Rujukan untuk konsul onkologi + rencana mastektomi",
    peserta: PESERTA_MOCK[5],
    keluhan: "Massa payudara kiri, BIRADS 5",
    status: "Aktif",
    masaBerlaku: { from: "2026-05-11", to: addDays("2026-05-11", 90) },
  },
  {
    noRujukan: "RUJ/FKRTL-Citra/2026/05/0032",
    asalRujukan: "FKRTL",
    tglKunjungan: "2026-05-15",
    tglRujukan: "2026-05-15",
    ppkAsal: RS_CITRA,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "2",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    diagnosa: { kode: "N18.6", nama: "End stage renal disease" },
    catatan: "Rujukan HD reguler, slot di RS Citra penuh",
    peserta: PESERTA_MOCK[2],
    keluhan: "ESRD dengan HD 2x/minggu",
    status: "Used",
    masaBerlaku: { from: "2026-05-15", to: addDays("2026-05-15", 30) },
  },
  {
    noRujukan: "RUJ/FKRTL-Bunda/2026/05/0040",
    asalRujukan: "FKRTL",
    tglKunjungan: "2026-04-25",
    tglRujukan: "2026-04-25",
    ppkAsal: RS_BUNDA,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "1",
    poli: { kode: "SAR", nama: "Saraf" },
    diagnosa: { kode: "I63.9", nama: "Cerebral infarction, unspecified" },
    catatan: "Stroke iskemik 6 jam, kandidat trombolisis",
    peserta: PESERTA_MOCK[10],
    keluhan: "Hemiparesis kanan onset mendadak",
    status: "Expired",
    masaBerlaku: { from: "2026-04-25", to: "2026-04-26" },
  },
  {
    noRujukan: "RUJ/FKRTL-Citra/2026/05/0055",
    asalRujukan: "FKRTL",
    tglKunjungan: "2026-05-22",
    tglRujukan: "2026-05-22",
    ppkAsal: RS_CITRA,
    ppkRujukan: { kode: RS_KITA.kode, nama: RS_KITA.nama },
    jnsPelayanan: "2",
    poli: { kode: "ORT", nama: "Ortopedi" },
    diagnosa: { kode: "S82.1", nama: "Fracture of upper end of tibia" },
    catatan: "Follow-up fiksasi eksterna, alat lepas",
    peserta: PESERTA_MOCK[6],
    keluhan: "Kontrol fraktur tibia post-op",
    status: "Aktif",
    masaBerlaku: { from: "2026-05-22", to: addDays("2026-05-22", 90) },
  },
];

// ── Lookup Helpers ─────────────────────────────────────

export function findRujukanByNo(noRujukan: string): RujukanRecord | undefined {
  return RUJUKAN_MOCK.find((r) => r.noRujukan === noRujukan);
}

export function findRujukansByKartu(
  noKartu: string,
  jenisFaskes?: RujukanRecord["asalRujukan"],
): RujukanRecord[] {
  return RUJUKAN_MOCK.filter(
    (r) =>
      r.peserta.noKartu === noKartu &&
      (jenisFaskes ? r.asalRujukan === jenisFaskes : true),
  );
}

export function findRujukansByDiagnosa(kdDiag: string): RujukanRecord[] {
  return RUJUKAN_MOCK.filter((r) => r.diagnosa.kode === kdDiag);
}

// ── Rujukan Keluar Mock ────────────────────────────────

/**
 * 6 Rujukan Keluar — RS kita rujuk pasien ke RS Tipe A/spesialis tertentu.
 * Cross-link `noSep` ke SEP_MOCK aktif untuk simulate flow real.
 */
export const RUJUKAN_KELUAR_MOCK: ReadonlyArray<RujukanKeluarDetail> = [
  {
    noRujukan: "RUJ-OUT-20260505-00001",
    noSep: "SEP-2026-0501-00012",
    noKartu: "0001234567891",
    nama: "Joko Prasetyo",
    kelasRawat: "3",
    kelamin: "L",
    tglLahir: "1970-03-15",
    tglSep: "2026-05-01",
    tglRujukan: "2026-05-05",
    tglRencanaKunjungan: "2026-05-08",
    ppkDirujuk: "0001A001",
    namaPpkDirujuk: "RSUP Hasan Sadikin Bandung",
    jnsPelayanan: "2",
    catatan: "Rujukan kateterisasi jantung (cath lab) — fasilitas terbatas di RS kita.",
    diagRujukan: "I21.0",
    namaDiagRujukan: "Acute Myocardial Infarction",
    tipeRujukan: "0",
    namaTipeRujukan: "Rujukan Penuh",
    poliRujukan: "JAN",
    namaPoliRujukan: "Jantung",
  },
  {
    noRujukan: "RUJ-OUT-20260510-00002",
    noSep: "SEP-2026-0510-00033",
    noKartu: "0001234567894",
    nama: "Endang Pertiwi",
    kelasRawat: "3",
    kelamin: "P",
    tglLahir: "1965-07-12",
    tglSep: "2026-05-10",
    tglRujukan: "2026-05-10",
    tglRencanaKunjungan: "2026-05-14",
    ppkDirujuk: "0001A002",
    namaPpkDirujuk: "RSUPN Dr. Cipto Mangunkusumo",
    jnsPelayanan: "1",
    catatan: "Rujukan untuk pemeriksaan endokrin diabetes tidak terkontrol.",
    diagRujukan: "E11.9",
    namaDiagRujukan: "Type 2 diabetes mellitus, uncomplicated",
    tipeRujukan: "1",
    namaTipeRujukan: "Rujukan Partial",
    poliRujukan: "INT",
    namaPoliRujukan: "Penyakit Dalam",
  },
  {
    noRujukan: "RUJ-OUT-20260512-00003",
    noSep: "SEP-2026-0512-00040",
    noKartu: "0001234567896",
    nama: "Rini Kusumawati",
    kelasRawat: "1",
    kelamin: "P",
    tglLahir: "1975-04-08",
    tglSep: "2026-05-12",
    tglRujukan: "2026-05-13",
    tglRencanaKunjungan: "2026-05-20",
    ppkDirujuk: "0001A003",
    namaPpkDirujuk: "RSUP Dr. Sardjito Yogyakarta",
    jnsPelayanan: "1",
    catatan: "Rujukan untuk operasi katarak ECCE + IOL phaco bilateral.",
    diagRujukan: "H25.9",
    namaDiagRujukan: "Senile cataract, unspecified",
    tipeRujukan: "0",
    namaTipeRujukan: "Rujukan Penuh",
    poliRujukan: "MAT",
    namaPoliRujukan: "Mata",
  },
  {
    noRujukan: "RUJ-OUT-20260518-00004",
    noSep: "SEP-2026-0518-00050",
    noKartu: "0001234567899",
    nama: "Hendra Pratama",
    kelasRawat: "2",
    kelamin: "L",
    tglLahir: "1985-06-30",
    tglSep: "2026-05-18",
    tglRujukan: "2026-05-19",
    tglRencanaKunjungan: "2026-05-22",
    ppkDirujuk: "0001A004",
    namaPpkDirujuk: "RSUP Dr. Kariadi Semarang",
    jnsPelayanan: "1",
    catatan: "Rujukan colonoscopy + biopsi (gastroenterologi konsultan).",
    diagRujukan: "A09",
    namaDiagRujukan: "Diarrhoea and gastroenteritis",
    tipeRujukan: "1",
    namaTipeRujukan: "Rujukan Partial",
    poliRujukan: "INT",
    namaPoliRujukan: "Penyakit Dalam",
  },
  {
    // Rujukan balik PRB — pasien stabil dikembalikan ke FKTP
    noRujukan: "RUJ-OUT-20260520-00005",
    noSep: "SEP-2026-0520-00060",
    noKartu: "0001234567893",
    nama: "Wahyu Hidayat",
    kelasRawat: "3",
    kelamin: "L",
    tglLahir: "1978-09-04",
    tglSep: "2026-05-20",
    tglRujukan: "2026-05-25",
    tglRencanaKunjungan: "2026-05-26",
    ppkDirujuk: "0001P010",
    namaPpkDirujuk: "Klinik Sehat Pratama",
    jnsPelayanan: "2",
    catatan: "Pasien DM terkontrol — rujukan balik PRB ke FKTP untuk maintenance.",
    diagRujukan: "E11.9",
    namaDiagRujukan: "Type 2 diabetes mellitus, uncomplicated",
    tipeRujukan: "2",
    namaTipeRujukan: "Rujukan Balik PRB",
    poliRujukan: "",
    namaPoliRujukan: "",
  },
  {
    noRujukan: "RUJ-OUT-20260525-00006",
    noSep: "SEP-2026-0525-00065",
    noKartu: "0001234567810",
    nama: "Drs. Sumarno",
    kelasRawat: "1",
    kelamin: "L",
    tglLahir: "1972-12-05",
    tglSep: "2026-05-25",
    tglRujukan: "2026-05-26",
    tglRencanaKunjungan: "2026-05-30",
    ppkDirujuk: "0001A001",
    namaPpkDirujuk: "RSUP Hasan Sadikin Bandung",
    jnsPelayanan: "1",
    catatan: "Rujukan elective coronary angiography + PCI follow-up.",
    diagRujukan: "I50.0",
    namaDiagRujukan: "Congestive heart failure",
    tipeRujukan: "0",
    namaTipeRujukan: "Rujukan Penuh",
    poliRujukan: "JAN",
    namaPoliRujukan: "Jantung",
  },
];

// ── Lookup Helpers (Rujukan Keluar) ────────────────────

export function findRujukanKeluarByNo(
  noRujukan: string,
): RujukanKeluarDetail | undefined {
  return RUJUKAN_KELUAR_MOCK.find((r) => r.noRujukan === noRujukan);
}

export function listRujukanKeluarPeriode(
  tglMulai: string,
  tglAkhir: string,
): RujukanKeluarDetail[] {
  return RUJUKAN_KELUAR_MOCK.filter(
    (r) => r.tglRujukan >= tglMulai && r.tglRujukan <= tglAkhir,
  );
}

// ── Rujukan Khusus Mock (spec endpoint 9) ──────────────

/**
 * 4 Rujukan Khusus seed — kasus kronik (kanker/dialisis/jantung) yang
 * di-flag khusus dengan diagnosa + procedure tambahan.
 *
 * Cross-link `norujukan` ke `RUJUKAN_KELUAR_MOCK`. ID rujukan numerik
 * (sesuai spec — string number).
 */
export const RUJUKAN_KHUSUS_MOCK: ReadonlyArray<RujukanKhususListItem> = [
  {
    idrujukan: "98866",
    norujukan: "RUJ-OUT-20260505-00001",
    nokapst: "0001234567891",
    nmpst: "Joko Prasetyo",
    diagppk: "I21.0",
    tglrujukan_awal: "2026-05-05",
    tglrujukan_berakhir: "2026-08-03",
  },
  {
    idrujukan: "98867",
    norujukan: "RUJ-OUT-20260510-00002",
    nokapst: "0001234567894",
    nmpst: "Endang Pertiwi",
    diagppk: "E11.9",
    tglrujukan_awal: "2026-05-10",
    tglrujukan_berakhir: "2026-08-08",
  },
  {
    idrujukan: "98868",
    norujukan: "RUJ-OUT-20260525-00006",
    nokapst: "0001234567810",
    nmpst: "Drs. Sumarno",
    diagppk: "I50.0",
    tglrujukan_awal: "2026-05-26",
    tglrujukan_berakhir: "2026-08-24",
  },
  {
    idrujukan: "98869",
    norujukan: "RUJ-OUT-20260512-00003",
    nokapst: "0001234567896",
    nmpst: "Rini Kusumawati",
    diagppk: "H25.9",
    tglrujukan_awal: "2026-05-13",
    tglrujukan_berakhir: "2026-08-11",
  },
];

// ── Rujukan dari RS Detail Mock (spec endpoint 10-12) ──

/**
 * 5 Rujukan masuk dari RS lain ke RS kita — rich detail dengan peserta
 * full sesuai spec response.
 *
 * Cross-link `peserta` ke `PESERTA_MOCK` (3 peserta) — 2 peserta multi-rujukan
 * untuk test endpoint 12 (list by kartu).
 */
export const RUJUKAN_RS_DETAIL_MOCK: ReadonlyArray<RujukanRSDetail> = [
  {
    diagnosa: { kode: "I21.9", nama: "Acute myocardial infarction, unspecified" },
    keluhan: "Nyeri dada hebat menjalar ke lengan kiri, durasi 2 jam.",
    noKunjungan: "0001R0010426A000079",
    pelayanan: { kode: "1", nama: "Rawat Inap" },
    peserta: PESERTA_MOCK[0],
    poliRujukan: { kode: "JAN", nama: "Jantung" },
    provPerujuk: { kode: "0001R010", nama: "RS Citra Husada" },
    tglKunjungan: "2026-04-15",
  },
  {
    diagnosa: { kode: "N18.6", nama: "End stage renal disease" },
    keluhan: "Pasien rujukan untuk hemodialisis reguler 2x/minggu.",
    noKunjungan: "0001R0010426A000080",
    pelayanan: { kode: "2", nama: "Rawat Jalan" },
    peserta: PESERTA_MOCK[2],
    poliRujukan: { kode: "INT", nama: "Penyakit Dalam" },
    provPerujuk: { kode: "0001R010", nama: "RS Citra Husada" },
    tglKunjungan: "2026-05-15",
  },
  {
    diagnosa: { kode: "C50.9", nama: "Malignant neoplasm of breast" },
    keluhan: "Massa payudara kiri, BIRADS 5, rujuk untuk konsul onkologi.",
    noKunjungan: "0001R0010426A000081",
    pelayanan: { kode: "1", nama: "Rawat Inap" },
    peserta: PESERTA_MOCK[5],
    poliRujukan: { kode: "BED", nama: "Bedah" },
    provPerujuk: { kode: "0001R020", nama: "RS Bunda Sehat" },
    tglKunjungan: "2026-05-11",
  },
  {
    diagnosa: { kode: "I63.9", nama: "Cerebral infarction, unspecified" },
    keluhan: "Hemiparesis kanan onset mendadak 4 jam SMRS.",
    noKunjungan: "0001R0010426A000082",
    pelayanan: { kode: "1", nama: "Rawat Inap" },
    peserta: PESERTA_MOCK[10],
    poliRujukan: { kode: "SAR", nama: "Saraf" },
    provPerujuk: { kode: "0001R020", nama: "RS Bunda Sehat" },
    tglKunjungan: "2026-04-25",
  },
  {
    // Peserta sama dengan entry pertama — test endpoint 12 (list by kartu)
    diagnosa: { kode: "I25.10", nama: "Atherosclerotic heart disease" },
    keluhan: "Follow-up post-MI, butuh cath lab elektif.",
    noKunjungan: "0001R0010426A000083",
    pelayanan: { kode: "2", nama: "Rawat Jalan" },
    peserta: PESERTA_MOCK[0],
    poliRujukan: { kode: "JAN", nama: "Jantung" },
    provPerujuk: { kode: "0001R010", nama: "RS Citra Husada" },
    tglKunjungan: "2026-05-05",
  },
];

// ── Lookup Helpers (Rujukan Khusus + RS Detail) ────────

export function findRujukanKhususById(
  idRujukan: string,
): RujukanKhususListItem | undefined {
  return RUJUKAN_KHUSUS_MOCK.find((r) => r.idrujukan === idRujukan);
}

export function findRujukanRSDetailByNo(
  noKunjungan: string,
): RujukanRSDetail | undefined {
  return RUJUKAN_RS_DETAIL_MOCK.find((r) => r.noKunjungan === noKunjungan);
}

export function findRujukanRSDetailByKartu(
  noKartu: string,
): RujukanRSDetail[] {
  return RUJUKAN_RS_DETAIL_MOCK.filter((r) => r.peserta.noKartu === noKartu);
}
