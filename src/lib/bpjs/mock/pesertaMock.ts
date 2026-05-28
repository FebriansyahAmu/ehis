/**
 * Peserta BPJS Mock (BP0.3).
 *
 * 12 peserta lintas tipe — populate Kepesertaan tab + reference data
 * untuk SEP / Rujukan / Rencana Kontrol mock.
 *
 * Shape aligned 1:1 dengan spec [contracts/Peserta-Contracts.md].
 *
 * Distribusi (per spec BP0.3):
 * - 4 PBI APBN (kelas 3 · jenis "12")
 * - 3 Non-PBI Mandiri kelas 1 (jenis "14")
 * - 2 Non-PBI Mandiri kelas 2 (jenis "14")
 * - 1 Non-PBI Pekerja PNS kelas 1 (jenis "11")
 * - 1 expired (status Non-Aktif untuk test 203)
 * - 1 Pegawai Swasta dengan COB asuransi tambahan (jenis "13")
 *
 * Cross-link: 12 noKartu pertama aligned dengan CLAIM_BOARD_MOCK BPJS
 * entries 1-12 — `getPesertaByKartu` lookup konsisten lintas modul.
 */

import type { PesertaRecord, PesertaUmur } from "../bpjsShared";

const TGL_PELAYANAN_REF = "2026-05-29";
const TGL_NOW_REF = "2026-05-29";

const EMPTY_INFO = {
  dinsos: null,
  noSKTM: null,
  prolanisPRB: null,
} as const;

const EMPTY_COB = {
  nmAsuransi: null,
  noAsuransi: null,
  tglTAT: null,
  tglTMT: null,
} as const;

const RS_FKTP_DEFAULT = { kdProvider: "0001P001", nmProvider: "PKM Mawar" };
const KLINIK_FKTP = { kdProvider: "0001P010", nmProvider: "Klinik Sehat Pratama" };
const PNS_FKTP = { kdProvider: "0001P003", nmProvider: "PKM Anggrek" };

/** Hitung umur deskriptif "X tahun, Y bulan, Z hari" antara dua ISO date. */
function calcUmur(tglLahir: string, ref: string): string {
  const lahir = new Date(tglLahir);
  const r = new Date(ref);
  let years = r.getFullYear() - lahir.getFullYear();
  let months = r.getMonth() - lahir.getMonth();
  let days = r.getDate() - lahir.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(r.getFullYear(), r.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} tahun ,${months} bulan ,${days} hari`;
}

function umurFor(tglLahir: string): PesertaUmur {
  return {
    umurSaatPelayanan: calcUmur(tglLahir, TGL_PELAYANAN_REF),
    umurSekarang: calcUmur(tglLahir, TGL_NOW_REF),
  };
}

/** 12 peserta seed — match spec contract shape. */
export const PESERTA_MOCK: ReadonlyArray<PesertaRecord> = [
  // ── 4 PBI APBN (kelas 3, jenis "12") ───────────────
  {
    noKartu: "0001234567891",
    nik: "3171010103700001",
    nama: "Joko Prasetyo",
    tglLahir: "1970-03-15",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "3", keterangan: "KELAS III" },
    jenisPeserta: { kode: "12", keterangan: "PBI APBN" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-001", noTelepon: "081234567001" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2016-02-12",
    tglTAT: "2099-12-31",
    tglTMT: "2014-01-01",
    umur: umurFor("1970-03-15"),
    informasi: EMPTY_INFO,
  },
  {
    noKartu: "0001234567892",
    nik: "3171010192030002",
    nama: "Siti Rahayu",
    tglLahir: "1992-03-21",
    sex: "P",
    pisa: "1",
    hakKelas: { kode: "3", keterangan: "KELAS III" },
    jenisPeserta: { kode: "12", keterangan: "PBI APBN" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-002", noTelepon: "081234567002" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2017-05-08",
    tglTAT: "2099-12-31",
    tglTMT: "2014-01-01",
    umur: umurFor("1992-03-21"),
    informasi: EMPTY_INFO,
  },
  {
    noKartu: "0001234567893",
    nik: "3171010178090003",
    nama: "Wahyu Hidayat",
    tglLahir: "1978-09-04",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "3", keterangan: "KELAS III" },
    jenisPeserta: { kode: "12", keterangan: "PBI APBN" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-003", noTelepon: "081234567003" },
    cob: EMPTY_COB,
    provUmum: KLINIK_FKTP,
    tglCetakKartu: "2015-11-20",
    tglTAT: "2099-12-31",
    tglTMT: "2014-01-01",
    umur: umurFor("1978-09-04"),
    informasi: { dinsos: null, noSKTM: null, prolanisPRB: "DM" },
  },
  {
    noKartu: "0001234567894",
    nik: "3171010165070004",
    nama: "Endang Pertiwi",
    tglLahir: "1965-07-12",
    sex: "P",
    pisa: "1",
    hakKelas: { kode: "3", keterangan: "KELAS III" },
    jenisPeserta: { kode: "12", keterangan: "PBI APBN" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-004", noTelepon: "081234567004" },
    cob: EMPTY_COB,
    provUmum: { kdProvider: "0001P002", nmProvider: "PKM Melati" },
    tglCetakKartu: "2016-08-03",
    tglTAT: "2099-12-31",
    tglTMT: "2014-01-01",
    umur: umurFor("1965-07-12"),
    informasi: { dinsos: null, noSKTM: null, prolanisPRB: "HT" },
  },

  // ── 3 Non-PBI Mandiri kelas 1 (jenis "14") ─────────
  {
    noKartu: "0001234567895",
    nik: "3171010180050005",
    nama: "Bambang Setiawan",
    tglLahir: "1980-05-22",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "1", keterangan: "KELAS I" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-005", noTelepon: "081234567005" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2018-01-15",
    tglTAT: "2099-12-31",
    tglTMT: "2016-04-01",
    umur: umurFor("1980-05-22"),
    informasi: EMPTY_INFO,
  },
  {
    noKartu: "0001234567896",
    nik: "3174010175040006",
    nama: "Rini Kusumawati",
    tglLahir: "1975-04-08",
    sex: "P",
    pisa: "1",
    hakKelas: { kode: "1", keterangan: "KELAS I" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-006", noTelepon: "081234567006" },
    cob: EMPTY_COB,
    provUmum: KLINIK_FKTP,
    tglCetakKartu: "2017-09-22",
    tglTAT: "2099-12-31",
    tglTMT: "2015-07-15",
    umur: umurFor("1975-04-08"),
    informasi: EMPTY_INFO,
  },
  {
    noKartu: "0001234567897",
    nik: "3175010188110007",
    nama: "Andi Wijaya",
    tglLahir: "1988-11-19",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "1", keterangan: "KELAS I" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-007", noTelepon: "081234567007" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2019-06-10",
    tglTAT: "2099-12-31",
    tglTMT: "2017-01-01",
    umur: umurFor("1988-11-19"),
    informasi: EMPTY_INFO,
  },

  // ── 2 Non-PBI Mandiri kelas 2 (jenis "14") ─────────
  {
    noKartu: "0001234567898",
    nik: "3173010190020008",
    nama: "Dewi Lestari",
    tglLahir: "1990-02-14",
    sex: "P",
    pisa: "1",
    hakKelas: { kode: "2", keterangan: "KELAS II" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-008", noTelepon: "081234567008" },
    cob: EMPTY_COB,
    provUmum: KLINIK_FKTP,
    tglCetakKartu: "2018-12-04",
    tglTAT: "2099-12-31",
    tglTMT: "2016-09-01",
    umur: umurFor("1990-02-14"),
    informasi: EMPTY_INFO,
  },
  {
    noKartu: "0001234567899",
    nik: "3172010185060009",
    nama: "Hendra Pratama",
    tglLahir: "1985-06-30",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "2", keterangan: "KELAS II" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-009", noTelepon: "081234567009" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2017-03-19",
    tglTAT: "2099-12-31",
    tglTMT: "2015-11-15",
    umur: umurFor("1985-06-30"),
    informasi: EMPTY_INFO,
  },

  // ── 1 Pekerja PNS kelas 1 (jenis "11") ─────────────
  {
    noKartu: "0001234567810",
    nik: "3171010172120010",
    nama: "Drs. Sumarno",
    tglLahir: "1972-12-05",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "1", keterangan: "KELAS I" },
    jenisPeserta: { kode: "11", keterangan: "PEKERJA PENERIMA UPAH PNS" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-010", noTelepon: "081234567010" },
    cob: EMPTY_COB,
    provUmum: PNS_FKTP,
    tglCetakKartu: "2014-04-01",
    tglTAT: "2099-12-31",
    tglTMT: "2014-01-01",
    umur: umurFor("1972-12-05"),
    informasi: EMPTY_INFO,
  },

  // ── 1 Expired (status Non-Aktif untuk test 203) ────
  {
    noKartu: "0001234567811",
    nik: "3171010168040011",
    nama: "Ahmad Yusuf",
    tglLahir: "1968-04-17",
    sex: "L",
    pisa: "1",
    hakKelas: { kode: "2", keterangan: "KELAS II" },
    jenisPeserta: { kode: "14", keterangan: "PBPU MANDIRI" },
    statusPeserta: { kode: "1", keterangan: "NON AKTIF" },
    mr: { noMR: "RM-2025-011", noTelepon: "081234567011" },
    cob: EMPTY_COB,
    provUmum: RS_FKTP_DEFAULT,
    tglCetakKartu: "2016-07-08",
    tglTAT: "2025-12-31",
    tglTMT: "2015-02-01",
    umur: umurFor("1968-04-17"),
    informasi: EMPTY_INFO,
  },

  // ── 1 Pegawai Swasta kelas 1 dengan COB (jenis "13") ─
  {
    noKartu: "0001234567812",
    nik: "3174010182090012",
    nama: "Sri Mulyani",
    tglLahir: "1982-09-25",
    sex: "P",
    pisa: "1",
    hakKelas: { kode: "1", keterangan: "KELAS I" },
    jenisPeserta: { kode: "13", keterangan: "PEGAWAI SWASTA" },
    statusPeserta: { kode: "0", keterangan: "AKTIF" },
    mr: { noMR: "RM-2025-012", noTelepon: "081234567012" },
    cob: {
      nmAsuransi: "AXA Mandiri Health",
      noAsuransi: "AXA-2024-008812",
      tglTMT: "2024-01-01",
      tglTAT: "2026-12-31",
    },
    provUmum: KLINIK_FKTP,
    tglCetakKartu: "2020-08-12",
    tglTAT: "2099-12-31",
    tglTMT: "2010-03-01",
    umur: umurFor("1982-09-25"),
    informasi: EMPTY_INFO,
  },
];

// ── Lookup Helpers ─────────────────────────────────────

/** Lookup peserta by 13-digit noKartu. Returns undefined jika tidak ditemukan. */
export function findPesertaByKartu(noKartu: string): PesertaRecord | undefined {
  return PESERTA_MOCK.find((p) => p.noKartu === noKartu);
}

/** Lookup peserta by 16-digit NIK. */
export function findPesertaByNik(nik: string): PesertaRecord | undefined {
  return PESERTA_MOCK.find((p) => p.nik === nik);
}
