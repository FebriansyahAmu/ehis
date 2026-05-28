/**
 * V-Claim Adapter — Rujukan (BP0.4).
 *
 * 11 method covering kedua flow Rujukan + Referensi:
 *
 * **Rujukan Masuk** (dari FKTP/FKRTL ke RS kita — lookup):
 * - `getRujukan` (FKTP atau FKRTL)
 * - `listRujukanByPeserta`
 *
 * **Rujukan Keluar** (RS kita rujuk ke RS lain — CRUD per
 * [contracts/Rujukan-Contracts.md] endpoint 1-6):
 * - `insertRujukan` POST `/Rujukan/2.0/insert`
 * - `updateRujukan` PUT `/Rujukan/2.0/update`
 * - `listSpesialistikRujukanPerPPK` GET (endpoint 3)
 * - `listRujukanKeluar` GET periode (endpoint 4)
 * - `detailRujukanKeluar` GET noRujukan (endpoint 5)
 * - `jumlahSepPerRujukan` GET jnsRujukan + noRujukan (endpoint 6)
 *
 * **Referensi**:
 * - `listRujukanKhusus` (per diagnosa)
 * - `listSpesialistik` (cached referensi master)
 * - `listSarana` (cached referensi faskes)
 *
 * URL paths di-resolve via `VCLAIM_ENDPOINTS.rujukan` config —
 * lihat [bpjsEndpoints.ts] untuk override path.
 */

import {
  Err,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type DeleteRujukanKhususPayload,
  type InsertRujukanKhususPayload,
  type InsertRujukanPayload,
  type JumlahSEPRujukanResponse,
  type Result,
  type RujukanKeluarDetail,
  type RujukanKeluarListItem,
  type RujukanKhususListItem,
  type RujukanRecord,
  type RujukanRSDetail,
  type SpesialistikRujukanPPKItem,
  type UpdateRujukanPayload,
} from "./bpjsShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import {
  RUJUKAN_KELUAR_MOCK,
  RUJUKAN_KHUSUS_MOCK,
  RUJUKAN_MOCK,
  RUJUKAN_RS_DETAIL_MOCK,
  findRujukanByNo,
  findRujukanKeluarByNo,
  findRujukanRSDetailByKartu,
  findRujukanRSDetailByNo,
  findRujukansByDiagnosa,
  findRujukansByKartu,
} from "./mock/rujukanMock";

// ── Rujukan Masuk: getRujukan ──────────────────────────

export function getRujukan(
  noRujukan: string,
  jenisFaskes: "FKTP" | "FKRTL",
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RujukanRecord>, BPJSError>> {
  const endpoint =
    jenisFaskes === "FKTP"
      ? VCLAIM_ENDPOINTS.rujukan.masuk.fktp(noRujukan)
      : VCLAIM_ENDPOINTS.rujukan.masuk.fkrtl(noRujukan);
  return wrapWithAudit<RujukanRecord>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);
    const r = findRujukanByNo(noRujukan);
    if (!r || r.asalRujukan !== jenisFaskes) {
      return errEnvelope("201", endpoint, "Rujukan tidak ditemukan");
    }
    return okEnvelope(r);
  })();
}

// ── Rujukan Masuk: listRujukanByPeserta ────────────────

export function listRujukanByPeserta(
  noKartu: string,
  jenisFaskes: "FKTP" | "FKRTL",
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RujukanRecord[]>, BPJSError>> {
  const endpoint =
    jenisFaskes === "FKTP"
      ? VCLAIM_ENDPOINTS.rujukan.masuk.listFKTPByKartu(noKartu)
      : VCLAIM_ENDPOINTS.rujukan.masuk.listFKRTLByKartu(noKartu);
  return wrapWithAudit<RujukanRecord[]>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);
    if (!/^\d{13}$/.test(noKartu)) {
      return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
    }
    const list = findRujukansByKartu(noKartu, jenisFaskes);
    return okEnvelope(list);
  })();
}

// ── 1. Rujukan Keluar: insertRujukan ───────────────────

export function insertRujukan(
  payload: InsertRujukanPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noRujukan: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.insert;
  return wrapWithAudit<{ noRujukan: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      if (!/^\w{8}$/.test(payload.ppkDirujuk)) {
        return errEnvelope("204", endpoint, "ppkDirujuk harus 8 digit kode");
      }
      if (!payload.diagRujukan || payload.diagRujukan.length < 3) {
        return errEnvelope("204", endpoint, "diagRujukan wajib (kode ICD-10)");
      }
      // Conditional rule: poliRujukan kosong jika tipeRujukan="2", wajib jika "0"/"1"
      if (payload.tipeRujukan === "2") {
        if (payload.poliRujukan && payload.poliRujukan.length > 0) {
          return errEnvelope(
            "204",
            endpoint,
            "poliRujukan harus kosong jika tipeRujukan=2 (Balik PRB)",
          );
        }
      } else {
        if (!payload.poliRujukan || payload.poliRujukan.length === 0) {
          return errEnvelope(
            "204",
            endpoint,
            "poliRujukan wajib jika tipeRujukan=0/1",
          );
        }
      }
      const noRujukan = `RUJ-${payload.tglRujukan.replace(/-/g, "").slice(0, 8)}-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`;
      return okEnvelope({ noRujukan }, "Rujukan berhasil di-insert");
    },
  )();
}

// ── 2. Rujukan Keluar: updateRujukan ───────────────────

export function updateRujukan(
  payload: UpdateRujukanPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noRujukan: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.update;
  return wrapWithAudit<{ noRujukan: string }>(
    { endpoint, method: "PUT" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      const exists = findRujukanKeluarByNo(payload.noRujukan);
      if (!exists) return errEnvelope("201", endpoint, "Rujukan tidak ditemukan");
      // Conditional rule: same as Insert
      if (payload.tipeRujukan === "2" && payload.poliRujukan.length > 0) {
        return errEnvelope(
          "204",
          endpoint,
          "poliRujukan harus kosong jika tipeRujukan=2",
        );
      }
      if (payload.tipeRujukan !== "2" && payload.poliRujukan.length === 0) {
        return errEnvelope(
          "204",
          endpoint,
          "poliRujukan wajib jika tipeRujukan=0/1",
        );
      }
      return okEnvelope({ noRujukan: payload.noRujukan }, "Rujukan berhasil di-update");
    },
  )();
}

// ── 3. List Spesialistik Rujukan per PPK ───────────────

const SPESIALISTIK_PER_PPK_REF: SpesialistikRujukanPPKItem[] = [
  { kodeSpesialis: "005", namaSpesialis: "Gastroenterologi-Hepatologi", kapasitas: "10", jumlahRujukan: "3", persentase: "30,00" },
  { kodeSpesialis: "006", namaSpesialis: "Geriatri", kapasitas: "8", jumlahRujukan: "2", persentase: "25,00" },
  { kodeSpesialis: "007", namaSpesialis: "Ginjal-Hipertensi", kapasitas: "15", jumlahRujukan: "8", persentase: "53,33" },
  { kodeSpesialis: "008", namaSpesialis: "Hematologi - Onkologi Medik", kapasitas: "12", jumlahRujukan: "5", persentase: "41,67" },
  { kodeSpesialis: "010", namaSpesialis: "Endokrin-Metabolik-Diabetes", kapasitas: "20", jumlahRujukan: "12", persentase: "60,00" },
  { kodeSpesialis: "017", namaSpesialis: "Bedah Onkologi", kapasitas: "6", jumlahRujukan: "1", persentase: "16,67" },
  { kodeSpesialis: "018", namaSpesialis: "Bedah Digestif", kapasitas: "8", jumlahRujukan: "3", persentase: "37,50" },
  { kodeSpesialis: "020", namaSpesialis: "fetomaternal", kapasitas: "5", jumlahRujukan: "0", persentase: "0,00" },
  { kodeSpesialis: "021", namaSpesialis: "onkologi ginekologi", kapasitas: "5", jumlahRujukan: "2", persentase: "40,00" },
];

export function listSpesialistikRujukanPerPPK(
  ppkRujukan: string,
  tglRujukan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: SpesialistikRujukanPPKItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.listSpesialistikPerPPK(
    ppkRujukan,
    tglRujukan,
  );
  return wrapWithAudit<{ list: SpesialistikRujukanPPKItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\w{8}$/.test(ppkRujukan)) {
        return errEnvelope("204", endpoint, "ppkRujukan harus 8 digit kode");
      }
      return okEnvelope({ list: SPESIALISTIK_PER_PPK_REF });
    },
  )();
}

// ── 4. List Rujukan Keluar periode ─────────────────────

export function listRujukanKeluar(
  tglMulai: string,
  tglAkhir: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: RujukanKeluarListItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.listKeluar(tglMulai, tglAkhir);
  return wrapWithAudit<{ list: RujukanKeluarListItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = RUJUKAN_KELUAR_MOCK.filter(
        (r) => r.tglRujukan >= tglMulai && r.tglRujukan <= tglAkhir,
      ).map<RujukanKeluarListItem>((r) => ({
        noRujukan: r.noRujukan,
        tglRujukan: r.tglRujukan,
        jnsPelayanan: r.jnsPelayanan,
        noSep: r.noSep,
        noKartu: r.noKartu,
        nama: r.nama,
        ppkDirujuk: r.ppkDirujuk,
        namaPpkDirujuk: r.namaPpkDirujuk,
      }));
      return okEnvelope({ list });
    },
  )();
}

// ── 5. Detail Rujukan Keluar by noRujukan ──────────────

export function detailRujukanKeluar(
  noRujukan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ rujukan: RujukanKeluarDetail }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.detailKeluar(noRujukan);
  return wrapWithAudit<{ rujukan: RujukanKeluarDetail }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const r = findRujukanKeluarByNo(noRujukan);
      if (!r) return errEnvelope("201", endpoint, "Rujukan tidak ditemukan");
      return okEnvelope({ rujukan: r });
    },
  )();
}

// ── 6. Jumlah SEP per Rujukan ──────────────────────────

export function jumlahSepPerRujukan(
  jnsRujukan: "1" | "2",
  noRujukan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<JumlahSEPRujukanResponse>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.keluar.jumlahSepPerRujukan(
    jnsRujukan,
    noRujukan,
  );
  return wrapWithAudit<JumlahSEPRujukanResponse>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      // Mock: derive jumlah SEP based on hash (deterministic 0-5)
      let h = 0;
      for (let i = 0; i < noRujukan.length; i++) {
        h = (h * 31 + noRujukan.charCodeAt(i)) >>> 0;
      }
      return okEnvelope({
        noRujukan,
        jnsRujukan,
        jumlahSep: h % 6,
      });
    },
  )();
}

// ── listRujukanKhususPerDiagnosa (referensi per diagnosa) ──

/**
 * Referensi rujukan khusus per kode diagnosa — bukan endpoint inti
 * Rujukan Khusus (lihat `listRujukanKhusus` untuk spec #9).
 *
 * Sebelumnya `listRujukanKhusus` — di-rename untuk disambiguate dari
 * spec endpoint 9.
 */
export function listRujukanKhususPerDiagnosa(
  kdDiag: string,
  tglPelayanan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RujukanRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.referensi.khususPerDiagnosa(
    kdDiag,
    tglPelayanan,
  );
  return wrapWithAudit<RujukanRecord[]>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);
    const list = findRujukansByDiagnosa(kdDiag);
    return okEnvelope(list);
  })();
}

// ── 7. Insert Rujukan Khusus ───────────────────────────

export function insertRujukanKhusus(
  payload: InsertRujukanKhususPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noRujukan: string; idRujukan: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.khusus.insert;
  return wrapWithAudit<{ noRujukan: string; idRujukan: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      if (!payload.noRujukan || payload.noRujukan.length === 0) {
        return errEnvelope("204", endpoint, "noRujukan wajib diisi");
      }
      // Wajib minimal 1 diagnosa
      if (payload.diagnosa.length === 0) {
        return errEnvelope("204", endpoint, "Minimal 1 diagnosa wajib diisi");
      }
      // Validasi format "primer/sekunder;kode"
      for (const d of payload.diagnosa) {
        if (!/^(primer|sekunder);\w+/.test(d.kode)) {
          return errEnvelope(
            "204",
            endpoint,
            `Format diagnosa.kode salah: harus "primer;{kode}" atau "sekunder;{kode}"`,
          );
        }
      }
      const idRujukan = Math.floor(10000 + Math.random() * 90000).toString();
      return okEnvelope(
        { noRujukan: payload.noRujukan, idRujukan },
        "Rujukan khusus berhasil di-insert",
      );
    },
  )();
}

// ── 8. Delete Rujukan Khusus ───────────────────────────

export function deleteRujukanKhusus(
  payload: DeleteRujukanKhususPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ idRujukan: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.khusus.delete;
  return wrapWithAudit<{ idRujukan: string }>(
    { endpoint, method: "DELETE" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      const exists = RUJUKAN_KHUSUS_MOCK.find(
        (r) => r.idrujukan === payload.idRujukan,
      );
      if (!exists)
        return errEnvelope("201", endpoint, "Rujukan khusus tidak ditemukan");
      return okEnvelope(
        { idRujukan: payload.idRujukan },
        "Rujukan khusus berhasil dihapus",
      );
    },
  )();
}

// ── 9. List Rujukan Khusus per bulan + tahun ───────────

export function listRujukanKhusus(
  bulan: number,
  tahun: number,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ rujukan: RujukanKhususListItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.khusus.listPerBulanTahun(bulan, tahun);
  return wrapWithAudit<{ rujukan: RujukanKhususListItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (bulan < 1 || bulan > 12) {
        return errEnvelope("204", endpoint, "Bulan harus 1-12");
      }
      const pad = (n: number) => n.toString().padStart(2, "0");
      const period = `${tahun}-${pad(bulan)}`;
      const list = RUJUKAN_KHUSUS_MOCK.filter(
        (r) => r.tglrujukan_awal.startsWith(period),
      );
      return okEnvelope({ rujukan: list });
    },
  )();
}

// ── 10. Pencarian Rujukan dari RS by NoRujukan (rich) ──

export function cariRujukanRSByNoRujukan(
  noRujukan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ rujukan: RujukanRSDetail }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.masukDetail.byNoRujukan(noRujukan);
  return wrapWithAudit<{ rujukan: RujukanRSDetail }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const r = findRujukanRSDetailByNo(noRujukan);
      if (!r) return errEnvelope("201", endpoint, "Rujukan tidak ditemukan");
      return okEnvelope({ rujukan: r });
    },
  )();
}

// ── 11. Pencarian Rujukan dari RS by NoKartu (single rich) ──

export function cariRujukanRSByKartu(
  noKartu: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ rujukan: RujukanRSDetail }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.masukDetail.byKartuSingle(noKartu);
  return wrapWithAudit<{ rujukan: RujukanRSDetail }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      const list = findRujukanRSDetailByKartu(noKartu);
      if (list.length === 0)
        return errEnvelope("201", endpoint, "Rujukan tidak ditemukan");
      // Return latest (sort desc by tglKunjungan)
      const latest = list.sort((a, b) =>
        a.tglKunjungan > b.tglKunjungan ? -1 : 1,
      )[0];
      return okEnvelope({ rujukan: latest });
    },
  )();
}

// ── 12. Pencarian Rujukan dari RS by NoKartu (list rich) ───

export function listRujukanRSByKartu(
  noKartu: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ rujukan: RujukanRSDetail[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.masukDetail.listByKartu(noKartu);
  return wrapWithAudit<{ rujukan: RujukanRSDetail[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      const list = findRujukanRSDetailByKartu(noKartu);
      return okEnvelope({ rujukan: list });
    },
  )();
}

// ── listSpesialistik (referensi master) ────────────────

export interface SpesialistikRefRecord {
  kdSpesialis: string;
  nmSpesialis: string;
}

const SPESIALISTIK_REF: SpesialistikRefRecord[] = [
  { kdSpesialis: "INT", nmSpesialis: "Penyakit Dalam" },
  { kdSpesialis: "BED", nmSpesialis: "Bedah" },
  { kdSpesialis: "OBG", nmSpesialis: "Obstetri & Ginekologi" },
  { kdSpesialis: "ANA", nmSpesialis: "Anak" },
  { kdSpesialis: "MAT", nmSpesialis: "Mata" },
  { kdSpesialis: "THT", nmSpesialis: "THT-KL" },
  { kdSpesialis: "PAR", nmSpesialis: "Paru" },
  { kdSpesialis: "JAN", nmSpesialis: "Jantung" },
  { kdSpesialis: "SAR", nmSpesialis: "Saraf" },
  { kdSpesialis: "ORT", nmSpesialis: "Ortopedi" },
  { kdSpesialis: "KUL", nmSpesialis: "Kulit & Kelamin" },
  { kdSpesialis: "REH", nmSpesialis: "Rehabilitasi Medik" },
];

export function listSpesialistik(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<SpesialistikRefRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.referensi.spesialistik;
  return wrapWithAudit<SpesialistikRefRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(SPESIALISTIK_REF);
    },
  )();
}

// ── listSarana (faskes) ────────────────────────────────

export interface SaranaRefRecord {
  kdFaskes: string;
  nmFaskes: string;
  alamat?: string;
  jenis: "FKTP" | "FKRTL";
}

const SARANA_REF: SaranaRefRecord[] = [
  { kdFaskes: "0001P001", nmFaskes: "PKM Mawar", alamat: "Jl. Mawar No. 1", jenis: "FKTP" },
  { kdFaskes: "0001P002", nmFaskes: "PKM Melati", alamat: "Jl. Melati No. 2", jenis: "FKTP" },
  { kdFaskes: "0001P003", nmFaskes: "PKM Anggrek", alamat: "Jl. Anggrek No. 3", jenis: "FKTP" },
  { kdFaskes: "0001P010", nmFaskes: "Klinik Sehat Pratama", alamat: "Jl. Sehat No. 10", jenis: "FKTP" },
  { kdFaskes: "0001P011", nmFaskes: "Klinik Bakti", alamat: "Jl. Bakti No. 11", jenis: "FKTP" },
  { kdFaskes: "0001R001", nmFaskes: "RS Sakti Husada", alamat: "Jl. Sudirman No. 50", jenis: "FKRTL" },
  { kdFaskes: "0001R010", nmFaskes: "RS Citra Husada", alamat: "Jl. Diponegoro No. 20", jenis: "FKRTL" },
  { kdFaskes: "0001R020", nmFaskes: "RS Bunda Sehat", alamat: "Jl. Hayam Wuruk No. 5", jenis: "FKRTL" },
];

export function listSarana(
  nama: string,
  jenisFaskes: "FKTP" | "FKRTL",
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<SaranaRefRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.rujukan.referensi.faskes(nama, jenisFaskes);
  return wrapWithAudit<SaranaRefRecord[]>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);
    const filtered = SARANA_REF.filter(
      (s) =>
        s.jenis === jenisFaskes &&
        (nama === "" || s.nmFaskes.toLowerCase().includes(nama.toLowerCase())),
    );
    return okEnvelope(filtered);
  })();
}

/** Re-export mock untuk consumer inspection (dev only). */
export { RUJUKAN_KELUAR_MOCK, RUJUKAN_MOCK };
