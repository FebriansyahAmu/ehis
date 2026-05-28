/**
 * V-Claim Adapter — Rencana Kontrol + SPRI (BP0.4).
 *
 * Aligned 1:1 dengan [contracts/RencanaKontrol-Contracts.md] — 11 endpoint:
 * - Spec 1: insertRKV2 (POST `/RencanaKontrol/v2/insert` + formPRB)
 * - Spec 2: updateRKV2 (PUT `/RencanaKontrol/v2/update` + formPRB)
 * - Spec 3: deleteRK (DELETE)
 * - Spec 4: insertSPRI (POST, noKartu, tanpa formPRB)
 * - Spec 5: updateSPRI (PUT, noSPRI)
 * - Spec 6: getSEPUntukRK (GET SEP shape khusus konteks RK)
 * - Spec 7: getNoSuratKontrol (GET detail RK by noSurat + formPRB embed)
 * - Spec 8: listRKByKartu (GET by bulan+tahun+noKartu+filter)
 * - Spec 9: listRKFiltered (GET by tglAwal-tglAkhir+filter)
 * - Spec 10: getPoliRK (jnsKontrol + nomor + tglRencana)
 * - Spec 11: getDokterRK (jnsKontrol + kdPoli + tglRencana)
 *
 * Mock lookup di `RENCANA_KONTROL_MOCK`. Auto-audit + idempotency key
 * untuk semua mutation via `keyForInsertRK`.
 *
 * Catatan: shape RK V2 spec berbeda dari domain `RencanaKontrolRecord`.
 * Domain record dipakai untuk store internal RS; payload V2 dipakai
 * untuk wire BPJS. Adapter melakukan mapping antar dua representasi.
 */

import {
  Err,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type DokterRKSpecItem,
  type InsertRKV2Payload,
  type InsertSPRIPayload,
  type PoliRKSpecItem,
  type RencanaKontrolRecord,
  type RKDetailRecord,
  type RKListByKartuItem,
  type RKListFilterMode,
  type RKListPeriodeItem,
  type Result,
  type SEPUntukRKRecord,
  type UpdateRKV2Payload,
  type UpdateSPRIPayload,
  emptyPRBFormData,
} from "./bpjsShared";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import {
  RENCANA_KONTROL_MOCK,
  filterRKByPeriode,
  findRKByNoSurat,
} from "./mock/rencanaKontrolMock";
import { findSEPByNo } from "./mock/sepMock";
import { keyForInsertRK } from "./idempotencyKey";

// ── Spec 1: insertRKV2 (dengan formPRB) ────────────────

/**
 * Insert Rencana Kontrol V2 — spec endpoint 1.
 * Wajib `formPRB` (9 penyakit kronik PRB).
 */
export function insertRKV2(
  payload: InsertRKV2Payload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSurat: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.insertV2;
  const idempotencyKey = keyForInsertRK({
    noKartu: payload.noSEP, // SEP-keyed untuk RK Kontrol
    noSEPAsal: payload.noSEP,
    tglRencana: payload.tglRencanaKontrol,
    jenis: "Kontrol",
  });
  return wrapWithAudit<{ noSurat: string }>(
    { endpoint, method: "POST", idempotencyKey },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const today = new Date().toISOString().slice(0, 10);
      if (payload.tglRencanaKontrol < today) {
        return errEnvelope("204", endpoint, "Tgl rencana kontrol harus >= hari ini");
      }
      if (!payload.formPRB?.kdStatusPRB) {
        return errEnvelope("204", endpoint, "formPRB.kdStatusPRB wajib diisi");
      }
      const noSurat = `RK/${payload.tglRencanaKontrol.replace(/-/g, "").slice(0, 8)}/${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      return okEnvelope({ noSurat }, "Rencana kontrol berhasil dibuat");
    },
  )();
}

// ── Spec 2: updateRKV2 (dengan formPRB) ────────────────

export function updateRKV2(
  payload: UpdateRKV2Payload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSuratKontrol: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.updateV2;
  return wrapWithAudit<{ noSuratKontrol: string }>(
    { endpoint, method: "PUT" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findRKByNoSurat(payload.noSuratKontrol);
      if (!exists) return errEnvelope("201", endpoint, "Surat kontrol tidak ditemukan");
      if (exists.status === "Used") {
        return errEnvelope("204", endpoint, "Surat sudah digunakan, tidak bisa di-update");
      }
      if (!payload.formPRB?.kdStatusPRB) {
        return errEnvelope("204", endpoint, "formPRB.kdStatusPRB wajib diisi");
      }
      return okEnvelope(
        { noSuratKontrol: payload.noSuratKontrol },
        "Rencana kontrol berhasil di-update",
      );
    },
  )();
}

// ── Spec 3: deleteRK ───────────────────────────────────

export function deleteRK(
  noSuratKontrol: string,
  user: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSuratKontrol: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.delete;
  return wrapWithAudit<{ noSuratKontrol: string }>(
    { endpoint, method: "DELETE" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (user.trim().length < 1) {
        return errEnvelope("204", endpoint, "User pembuat wajib diisi");
      }
      const exists = findRKByNoSurat(noSuratKontrol);
      if (!exists) return errEnvelope("201", endpoint, "Surat kontrol tidak ditemukan");
      if (exists.status === "Used") {
        return errEnvelope("204", endpoint, "Surat sudah digunakan, tidak bisa dihapus");
      }
      return okEnvelope({ noSuratKontrol }, "Surat kontrol berhasil dihapus");
    },
  )();
}

// ── Spec 4: insertSPRI (tanpa formPRB, pakai noKartu) ──

export function insertSPRI(
  payload: InsertSPRIPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSPRI: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.insertSPRI;
  const idempotencyKey = keyForInsertRK({
    noKartu: payload.noKartu,
    noSEPAsal: "",
    tglRencana: payload.tglRencanaKontrol,
    jenis: "SPRI",
  });
  return wrapWithAudit<{ noSPRI: string }>(
    { endpoint, method: "POST", idempotencyKey },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const today = new Date().toISOString().slice(0, 10);
      if (payload.tglRencanaKontrol < today) {
        return errEnvelope("204", endpoint, "Tgl SPRI harus >= hari ini");
      }
      const noSPRI = `SPRI/${payload.tglRencanaKontrol.replace(/-/g, "").slice(0, 8)}/${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      return okEnvelope({ noSPRI }, "SPRI berhasil dibuat");
    },
  )();
}

// ── Spec 5: updateSPRI ─────────────────────────────────

export function updateSPRI(
  payload: UpdateSPRIPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSPRI: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.updateSPRI;
  return wrapWithAudit<{ noSPRI: string }>(
    { endpoint, method: "PUT" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findRKByNoSurat(payload.noSPRI);
      if (!exists) return errEnvelope("201", endpoint, "SPRI tidak ditemukan");
      if (exists.jenis !== "SPRI") {
        return errEnvelope("204", endpoint, "Nomor surat bukan SPRI");
      }
      if (exists.status === "Used") {
        return errEnvelope("204", endpoint, "SPRI sudah digunakan, tidak bisa di-update");
      }
      return okEnvelope({ noSPRI: payload.noSPRI }, "SPRI berhasil di-update");
    },
  )();
}

// ── Spec 6: getSEPUntukRK (GET SEP shape khusus RK) ────

/**
 * Cari SEP untuk keperluan RK — spec endpoint 6.
 * Response shape berbeda dari `/SEP/{noSEP}` umum (lebih ringkas,
 * field display string poli & diagnosa).
 */
export function getSEPUntukRK(
  noSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<SEPUntukRKRecord>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.cariSEPUntukRK(noSEP);
  return wrapWithAudit<SEPUntukRKRecord>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const sep = findSEPByNo(noSEP);
      if (!sep) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
      const record: SEPUntukRKRecord = {
        noSep: sep.noSEP,
        tglSep: sep.tglTerbit,
        jnsPelayanan: sep.jnsPelayanan === "1" ? "Rawat Inap" : "Rawat Jalan",
        poli: `${sep.poli.tujuan} - ${sep.poli.tujuan}`,
        diagnosa: `${sep.diagAwal} - ${sep.diagAwalNama ?? sep.diagAwal}`,
        peserta: {
          noKartu: sep.noKartu,
          nama: "PESERTA MOCK",
          tglLahir: "1980-01-01",
          kelamin: "L",
          hakKelas: "-",
        },
        provUmum: { kdProvider: "03100202", nmProvider: "FKTP MOCK" },
        provPerujuk: {
          kdProviderPerujuk: sep.rujukan.ppkRujukan ?? "",
          nmProviderPerujuk: sep.rujukan.ppkRujukan ?? "",
          asalRujukan: sep.rujukan.asalRujukan,
          noRujukan: sep.rujukan.noRujukan ?? "",
          tglRujukan: sep.rujukan.tglRujukan ?? "",
        },
      };
      return okEnvelope(record);
    },
  )();
}

// ── Spec 7: getNoSuratKontrol (detail RK + formPRB) ────

export function getNoSuratKontrol(
  noSurat: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RKDetailRecord>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.cariNoSurat(noSurat);
  return wrapWithAudit<RKDetailRecord>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const rk = findRKByNoSurat(noSurat);
      if (!rk) return errEnvelope("201", endpoint, "Surat kontrol tidak ditemukan");
      const isSPRI = rk.jenis === "SPRI";
      const sep = !isSPRI ? findSEPByNo(rk.noSEPAsal) : undefined;
      const detail: RKDetailRecord = {
        noSuratKontrol: rk.noSurat,
        tglRencanaKontrol: rk.tglRencana,
        tglTerbit: rk.audit.createdAt.slice(0, 10),
        jnsKontrol: rk.tipeKontrol,
        poliTujuan: rk.poli.kode,
        namaPoliTujuan: rk.poli.nama,
        kodeDokter: rk.dokter.kode,
        namaDokter: rk.dokter.nama,
        flagKontrol: "False",
        kodeDokterPembuat: rk.dokter.kode,
        namaDokterPembuat: rk.dokter.nama,
        namaJnsKontrol: isSPRI ? "SPRI" : "Kontrol",
        sep: sep
          ? {
              noSep: sep.noSEP,
              tglSep: sep.tglTerbit,
              jnsPelayanan: sep.jnsPelayanan === "1" ? "Rawat Inap" : "Rawat Jalan",
              poli: `${sep.poli.tujuan} - ${sep.poli.tujuan}`,
              diagnosa: `${sep.diagAwal} - ${sep.diagAwalNama ?? sep.diagAwal}`,
              peserta: {
                noKartu: sep.noKartu,
                nama: "PESERTA MOCK",
                tglLahir: "1980-01-01",
                kelamin: "L",
                hakKelas: "-",
              },
              provUmum: { kdProvider: "03100202", nmProvider: "FKTP MOCK" },
              provPerujuk: {
                kdProviderPerujuk: sep.rujukan.ppkRujukan ?? "",
                nmProviderPerujuk: sep.rujukan.ppkRujukan ?? "",
                asalRujukan: sep.rujukan.asalRujukan,
                noRujukan: sep.rujukan.noRujukan ?? "",
                tglRujukan: sep.rujukan.tglRujukan ?? "",
              },
            }
          : null,
        formPRB: {
          kdStatusPRB: null,
          data: emptyPRBFormData(),
        },
      };
      return okEnvelope(detail);
    },
  )();
}

// ── Spec 8: listRKByKartu (bulan + tahun + noKartu) ────

export function listRKByKartu(
  bulan: string,
  tahun: string,
  noKartu: string,
  filter: RKListFilterMode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RKListByKartuItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.listByKartu(bulan, tahun, noKartu, filter);
  return wrapWithAudit<RKListByKartuItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const tglAwal = `${tahun}-${bulan.padStart(2, "0")}-01`;
      const tglAkhir = `${tahun}-${bulan.padStart(2, "0")}-31`;
      const rks = filterRKByPeriode(tglAwal, tglAkhir).filter((rk) => {
        const sep = findSEPByNo(rk.noSEPAsal);
        return sep?.noKartu === noKartu || rk.jenis === "SPRI";
      });
      const items: RKListByKartuItem[] = rks.map((rk) =>
        toListByKartuItem(rk, noKartu),
      );
      return okEnvelope(items);
    },
  )();
}

function toListByKartuItem(
  rk: RencanaKontrolRecord,
  noKartu: string,
): RKListByKartuItem {
  const sep = findSEPByNo(rk.noSEPAsal);
  const isSPRI = rk.jenis === "SPRI";
  return {
    noSuratKontrol: rk.noSurat,
    jnsPelayanan: isSPRI ? "Rawat Inap" : "Rawat Jalan",
    jnsKontrol: rk.tipeKontrol,
    namaJnsKontrol: isSPRI ? "SPRI" : "Kontrol",
    tglRencanaKontrol: rk.tglRencana,
    tglTerbitKontrol: rk.audit.createdAt.slice(0, 10),
    noSepAsalKontrol: isSPRI ? "" : rk.noSEPAsal,
    poliAsal: sep?.poli.tujuan ?? rk.poli.kode,
    namaPoliAsal: sep?.poli.tujuan ?? rk.poli.nama,
    poliTujuan: rk.poli.kode,
    namaPoliTujuan: rk.poli.nama,
    tglSEP: sep?.tglTerbit ?? "",
    kodeDokter: rk.dokter.kode,
    namaDokter: rk.dokter.nama,
    noKartu: sep?.noKartu ?? noKartu,
    nama: "PESERTA MOCK",
    terbitSEP: rk.status === "Used" ? "Sudah" : "Belum",
  };
}

// ── Spec 9: listRKFiltered (periode + filter) ──────────

export function listRKFiltered(
  tglAwal: string,
  tglAkhir: string,
  filter: RKListFilterMode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RKListPeriodeItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.listFiltered(tglAwal, tglAkhir, filter);
  return wrapWithAudit<RKListPeriodeItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const rks = filterRKByPeriode(tglAwal, tglAkhir);
      const items: RKListPeriodeItem[] = rks.map(toListPeriodeItem);
      return okEnvelope(items);
    },
  )();
}

function toListPeriodeItem(rk: RencanaKontrolRecord): RKListPeriodeItem {
  const sep = findSEPByNo(rk.noSEPAsal);
  const isSPRI = rk.jenis === "SPRI";
  return {
    noSuratKontrol: rk.noSurat,
    jnsPelayanan: isSPRI ? "Rawat Inap" : "Rawat Jalan",
    jnsKontrol: rk.tipeKontrol,
    namaJnsKontrol: isSPRI ? "SPRI" : "Kontrol",
    tglRencanaKontrol: rk.tglRencana,
    tglTerbitKontrol: rk.audit.createdAt.slice(0, 10),
    noSepAsalKontrol: isSPRI ? "" : rk.noSEPAsal,
    poliAsal: sep?.poli.tujuan ?? rk.poli.kode,
    namaPoliAsal: sep?.poli.tujuan ?? rk.poli.nama,
    poliTujuan: rk.poli.kode,
    namaPoliTujuan: rk.poli.nama,
    tglSEP: sep?.tglTerbit ?? "",
    kodeDokter: rk.dokter.kode,
    namaDokter: rk.dokter.nama,
    noKartu: sep?.noKartu ?? "",
    nama: "PESERTA MOCK",
  };
}

// ── Spec 10: getPoliRK (jnsKontrol + nomor + tglRencana) ─

/**
 * Referensi poli RK — spec endpoint 10.
 *
 * Parameter:
 * - jnsKontrol: "1"=SPRI, "2"=Rencana Kontrol
 * - nomor: noKartu jika SPRI · noSEP jika Kontrol
 * - tglRencana: format yyyy-MM-dd
 */
const POLI_RK_REF: PoliRKSpecItem[] = [
  { kodePoli: "004", namaPoli: "Alergi-Immunologi Klinik", kapasitas: "30", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "005", namaPoli: "Gastroenterologi-Hepatologi", kapasitas: "12", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "008", namaPoli: "Hematologi - Onkologi Medik", kapasitas: "24", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "013", namaPoli: "Reumatologi", kapasitas: "24", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "015", namaPoli: "Kardiovaskular", kapasitas: "24", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "023", namaPoli: "Obstetri Ginekologi Sosial", kapasitas: "12", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "INT", namaPoli: "Penyakit Dalam", kapasitas: "40", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "BED", namaPoli: "Bedah", kapasitas: "25", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "MAT", namaPoli: "Mata", kapasitas: "20", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
  { kodePoli: "JAN", namaPoli: "Jantung", kapasitas: "20", jmlRencanaKontroldanRujukan: "0", persentase: "0.00" },
];

export function getPoliRK(
  jnsKontrol: "1" | "2",
  nomor: string,
  tglRencana: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<PoliRKSpecItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.poli(jnsKontrol, nomor, tglRencana);
  return wrapWithAudit<PoliRKSpecItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(POLI_RK_REF);
    },
  )();
}

// ── Spec 11: getDokterRK (jnsKontrol + kdPoli + tglRencana) ─

const DOKTER_RK_REF: DokterRKSpecItem[] = [
  { kodeDokter: "DR-001", namaDokter: "dr. Budi Santoso, Sp.PD", jadwalPraktek: "08:00 - 12:00", kapasitas: "15" },
  { kodeDokter: "DR-005", namaDokter: "dr. Surya Adi, Sp.B", jadwalPraktek: "09:00 - 13:00", kapasitas: "10" },
  { kodeDokter: "DR-007", namaDokter: "dr. Rini Kusumawati, Sp.P", jadwalPraktek: "10:00 - 14:00", kapasitas: "12" },
  { kodeDokter: "DR-008", namaDokter: "dr. Dewi Anggraini, Sp.M", jadwalPraktek: "08:00 - 12:00", kapasitas: "8" },
  { kodeDokter: "DR-011", namaDokter: "dr. Hendra Wijaya, Sp.OT", jadwalPraktek: "13:00 - 17:00", kapasitas: "10" },
  { kodeDokter: "DR-003", namaDokter: "dr. Andi Wijaya, Sp.JP", jadwalPraktek: "08:00 - 12:00", kapasitas: "12" },
  { kodeDokter: "DR-014", namaDokter: "dr. Sri Wahyuni, Sp.OG", jadwalPraktek: "09:00 - 13:00", kapasitas: "15" },
];

const POLI_TO_DOKTER: Record<string, string[]> = {
  INT: ["DR-001"],
  BED: ["DR-005"],
  PAR: ["DR-007"],
  MAT: ["DR-008"],
  ORT: ["DR-011"],
  JAN: ["DR-003"],
  OBG: ["DR-014"],
};

export function getDokterRK(
  jnsKontrol: "1" | "2",
  kdPoli: string,
  tglRencana: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<DokterRKSpecItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rk.dokter(jnsKontrol, kdPoli, tglRencana);
  return wrapWithAudit<DokterRKSpecItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const allowed = POLI_TO_DOKTER[kdPoli] ?? [];
      const list = DOKTER_RK_REF.filter((d) => allowed.includes(d.kodeDokter));
      return okEnvelope(list);
    },
  )();
}

/** Re-export full mock untuk consumer inspection. */
export { RENCANA_KONTROL_MOCK };
