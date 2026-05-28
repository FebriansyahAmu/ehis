/**
 * V-Claim Adapter — SEP CRUD + Suplesi + Approval + Internal + FingerPrint + RandomQ/A (BP0.4).
 *
 * Aligned 1:1 dengan **Trustmark BPJS V-Claim Contracts** ([contracts/SEP-Contracts.md]).
 * 16 endpoint cover:
 *
 * SEP CRUD (1-3):
 * - `insertSEP` POST /SEP/2.0/insert
 * - `updateSEP` PUT  /SEP/2.0/update
 * - `deleteSEP` DELETE /SEP/2.0/delete
 *
 * Suplesi Jasa Raharja (4-5):
 * - `suplesiCek` GET /SEP/SuplesiCek/{noKartu}/{tglPelayanan}
 * - `dataIndukKecelakaan` GET /SEP/Kll/PesertaSEP/{noKartu}
 *
 * Approval Penjamin (3a, 4):
 * - `pengajuanSEP` POST /SEP/Pengajuan
 * - `listPersetujuanSEP` GET /SEP/Pengajuan/list/bulan/{n}/tahun/{n}
 *
 * Update Tgl Pulang (5-6):
 * - `updateTglPulang` PUT /SEP/updtglplg
 * - `listUpdateTglPulang` GET /SEP/UpdTglPlg/list/bulan/{n}/tahun/{n}/filter/{f}
 *
 * Integrasi (7):
 * - `integrasiSepInacbgs` GET /SEP/InsertInacbg/{noSEP}
 *
 * SEP Internal (8-9):
 * - `dataSepInternal` GET /SEP/internal/{noSEP}
 * - `hapusSepInternal` DELETE /SEP/internal/delete
 *
 * Finger Print (10, 12):
 * - `getFingerPrint` GET /SEP/FingerPrint/Peserta/{noKartu}/TglPelayanan/{tgl}
 * - `listFingerPrint` GET /SEP/FingerPrint/list/tglPelayanan/{tgl}
 *
 * Random Question (13-14):
 * - `randomQuestion` GET /Peserta/RandomQuestion/noKartu/{noKartu}/tglPelayanan/{tgl}
 * - `postRandomAnswer` POST /Peserta/RandomAnswer
 *
 * Mock semua read dari `SEP_MOCK` + `PESERTA_MOCK`. Mutation simulate
 * success returning generated noSEP. Auto-audit via `wrapWithAudit`.
 */

import {
  Err,
  validateSEPConditionalRules,
  type AssesmentPelKode,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type DataIndukKecelakaanItem,
  type DeleteSEPPayload,
  type FingerPrintListItem,
  type FingerPrintResponse,
  type FlagProcedureKode,
  type HapusSEPInternalPayload,
  type JnsPelayananKode,
  type KdPenunjangKode,
  type PengajuanSEPPayload,
  type PersetujuanSEPItem,
  type PostRandomAnswerPayload,
  type RandomQuestionResponse,
  type Result,
  type SEPCob,
  type SEPInacbgsResponse,
  type SEPInternalItem,
  type SEPJaminan,
  type SEPKatarak,
  type SEPKelasRawat,
  type SEPPoli,
  type SEPRecordExt,
  type SEPRujukan,
  type SEPSkdp,
  type SuplesiJaminanItem,
  type TujuanKunjKode,
  type UpdateSEPPayload,
  type UpdateTglPulangListItem,
  type UpdateTglPulangPayload,
} from "./bpjsShared";
import {
  errEnvelope,
  okEnvelope,
  preflightMock,
  wrapWithAudit,
} from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import { SEP_MOCK } from "./mock/sepMock";
import { PESERTA_MOCK } from "./mock/pesertaMock";
import { keyForInsertSEP, keyForUpdateSEP } from "./idempotencyKey";

// ── 1. INSERT SEP ──────────────────────────────────────

/**
 * Insert SEP payload — match 1:1 spec resmi BPJS V-Claim 2.0.
 *
 * Wire format: `{ "request": { "t_sep": <this payload> } }`.
 *
 * Conditional rules wajib (di-enforce di `insertSEP()` via
 * `validateSEPConditionalRules`):
 * 1. `dpjpLayan` kosong/undefined jika `jnsPelayanan = "1"` (RANAP).
 * 2. `flagProcedure` & `kdPenunjang` = `""` jika `tujuanKunj = "0"`.
 * 3. `assesmentPel` wajib jika `tujuanKunj = "2"` atau poli tujuan ≠ poli rujukan.
 * 4. `klsRawatNaik` + `pembiayaan` + `penanggungJawab` atomic triple.
 */
export interface InsertSEPPayload {
  noKartu: string;
  tglSep: string;
  /** Kode faskes pemberi pelayanan (RS kita). */
  ppkPelayanan: string;
  jnsPelayanan: JnsPelayananKode;
  klsRawat: SEPKelasRawat;
  /** Nomor medical record RS. */
  noMR?: string;
  rujukan: SEPRujukan;
  catatan?: string;
  /** Kode ICD-10 diagnosa awal. */
  diagAwal: string;
  poli: SEPPoli;
  cob?: SEPCob;
  katarak?: SEPKatarak;
  jaminan?: SEPJaminan;
  tujuanKunj?: TujuanKunjKode;
  /** Kosong string `""` jika tujuanKunj="0". */
  flagProcedure?: FlagProcedureKode | "";
  /** Kosong string `""` jika tujuanKunj="0". */
  kdPenunjang?: KdPenunjangKode | "";
  /** Wajib jika tujuanKunj="2" atau poli tujuan ≠ poli rujukan. */
  assesmentPel?: AssesmentPelKode;
  /** Surat Kontrol DPJP — wajib jika SEP RJ kontrol. */
  skdp?: SEPSkdp;
  /** DPJP layanan — WAJIB kosong/undefined jika jnsPelayanan="1" (RANAP). */
  dpjpLayan?: string;
  /** No. telepon kontak pasien. */
  noTelp?: string;
  /** User pembuat SEP (audit). */
  user?: string;
}

export function insertSEP(
  payload: InsertSEPPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSEP: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.insert;
  const idempotencyKey = keyForInsertSEP({
    noKartu: payload.noKartu,
    tglPelayanan: payload.tglSep,
    poliKode: payload.poli.tujuan,
    diagnosaAwal: payload.diagAwal,
  });
  return wrapWithAudit<{ noSEP: string }>(
    { endpoint, method: "POST", idempotencyKey },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);

      if (!/^\d{13}$/.test(payload.noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.tglSep)) {
        return errEnvelope("204", endpoint, "tglSep harus format yyyy-mm-dd");
      }
      if (!payload.diagAwal || payload.diagAwal.length < 3) {
        return errEnvelope("204", endpoint, "diagAwal wajib (kode ICD-10)");
      }
      if (!payload.poli.tujuan) {
        return errEnvelope("204", endpoint, "poli.tujuan wajib (kode poli)");
      }

      const ruleErrors = validateSEPConditionalRules({
        jnsPelayanan: payload.jnsPelayanan,
        dpjpLayan: payload.dpjpLayan,
        tujuanKunj: payload.tujuanKunj,
        flagProcedure: payload.flagProcedure,
        kdPenunjang: payload.kdPenunjang,
        assesmentPel: payload.assesmentPel,
        klsRawat: payload.klsRawat,
        poliTujuan: payload.poli.tujuan,
        poliRujukan: undefined,
      });
      if (ruleErrors.length > 0) {
        return errEnvelope("204", endpoint, ruleErrors.join(" · "));
      }

      const exists = SEP_MOCK.find(
        (s) => s.noKartu === payload.noKartu && s.tglTerbit === payload.tglSep,
      );
      if (exists) {
        return errEnvelope(
          "202",
          endpoint,
          "SEP sudah ada untuk peserta & tanggal ini",
        );
      }

      const noSEPNew = `SEP-${payload.tglSep.replace(/-/g, "").slice(0, 8)}-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`;
      return okEnvelope({ noSEP: noSEPNew }, "SEP berhasil di-insert");
    },
  )();
}

// ── 2. UPDATE SEP ──────────────────────────────────────

export function updateSEP(
  payload: UpdateSEPPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSep: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.update;
  const idempotencyKey = keyForUpdateSEP({
    noKartu: payload.noSep.slice(-13), // approximate from noSep
    noSEP: payload.noSep,
    fieldsHash: JSON.stringify(payload),
  });
  return wrapWithAudit<{ noSep: string }>(
    { endpoint, method: "PUT", idempotencyKey },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);

      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      if (!payload.diagAwal || payload.diagAwal.length < 3) {
        return errEnvelope("204", endpoint, "diagAwal wajib (kode ICD-10)");
      }
      if (!payload.poli.tujuan) {
        return errEnvelope("204", endpoint, "poli.tujuan wajib (kode poli)");
      }

      const exists = SEP_MOCK.find((s) => s.noSEP === payload.noSep);
      if (!exists) return errEnvelope("201", endpoint, "SEP tidak ditemukan");

      // Re-enforce atomic kelas naik rule
      const ruleErrors = validateSEPConditionalRules({
        jnsPelayanan: exists.jnsPelayanan,
        dpjpLayan: payload.dpjpLayan,
        klsRawat: payload.klsRawat,
        poliTujuan: payload.poli.tujuan,
      });
      if (ruleErrors.length > 0) {
        return errEnvelope("204", endpoint, ruleErrors.join(" · "));
      }

      return okEnvelope({ noSep: payload.noSep }, "SEP berhasil di-update");
    },
  )();
}

// ── 3. DELETE SEP ──────────────────────────────────────

export function deleteSEP(
  payload: DeleteSEPPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSep: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.delete;
  return wrapWithAudit<{ noSep: string }>(
    { endpoint, method: "DELETE" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      const exists = SEP_MOCK.find((s) => s.noSEP === payload.noSep);
      if (!exists) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
      return okEnvelope({ noSep: payload.noSep }, "SEP berhasil dihapus");
    },
  )();
}

// ── Get SEP detail (alias `checkSEP` legacy) ───────────

export function getSEP(
  noSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<SEPRecordExt>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.getByNo(noSEP);
  return wrapWithAudit<SEPRecordExt>({ endpoint, method: "GET" }, async () => {
    const err = await preflightMock(config);
    if (err) return Err(err);
    const sep = SEP_MOCK.find((s) => s.noSEP === noSEP);
    if (!sep) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
    return okEnvelope(sep);
  })();
}

// ── 4. POTENSI SUPLESI JASA RAHARJA ────────────────────

/**
 * GET potensi suplesi Jasa Raharja by noKartu + tgl pelayanan.
 * Spec: response berisi `jaminan: SuplesiJaminanItem[]`.
 */
export function suplesiCek(
  noKartu: string,
  tglPelayanan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ jaminan: SuplesiJaminanItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.suplesiCek(noKartu, tglPelayanan);
  return wrapWithAudit<{ jaminan: SuplesiJaminanItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      // Mock: derive dari SEP_MOCK suplesi entries
      const list: SuplesiJaminanItem[] = SEP_MOCK.filter(
        (s) => s.noKartu === noKartu && s.statusInternal === "Suplesi" && s.jaminan,
      ).map((s, idx) => ({
        noRegister: `${1234 + idx}`,
        noSep: s.noSEP,
        noSepAwal: s.jaminan?.penjamin?.suplesi?.noSepSuplesi ?? s.noSEP,
        noSuratJaminan: "-",
        tglKejadian: s.jaminan?.penjamin?.tglKejadian ?? s.tglTerbit,
        tglSep: s.tglTerbit,
      }));
      return okEnvelope({ jaminan: list });
    },
  )();
}

// ── 5. DATA INDUK KECELAKAAN ───────────────────────────

/**
 * GET data induk kecelakaan by noKartu.
 * Cross-link untuk audit kasus KLL/KK per peserta.
 */
export function dataIndukKecelakaan(
  noKartu: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: DataIndukKecelakaanItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.dataIndukKecelakaan(noKartu);
  return wrapWithAudit<{ list: DataIndukKecelakaanItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      const list: DataIndukKecelakaanItem[] = SEP_MOCK.filter(
        (s) =>
          s.noKartu === noKartu &&
          s.jaminan &&
          s.jaminan.lakaLantas !== "0",
      ).map<DataIndukKecelakaanItem>((s) => ({
        noSEP: s.noSEP,
        tglKejadian: s.jaminan?.penjamin?.tglKejadian ?? s.tglTerbit,
        ppkPelSEP: s.ppkPelayanan ?? "0001R001",
        kdProp:
          s.jaminan?.penjamin?.suplesi?.lokasiLaka?.kdPropinsi ?? "00",
        kdKab:
          s.jaminan?.penjamin?.suplesi?.lokasiLaka?.kdKabupaten ?? "0000",
        kdKec:
          s.jaminan?.penjamin?.suplesi?.lokasiLaka?.kdKecamatan ?? "000000",
        ketKejadian: s.jaminan?.penjamin?.keterangan ?? "",
        noSEPSuplesi: s.jaminan?.penjamin?.suplesi?.noSepSuplesi ?? null,
      }));
      return okEnvelope({ list });
    },
  )();
}

// ── 3a. APPROVAL PENJAMIN — PENGAJUAN SEP ──────────────

export function pengajuanSEP(
  payload: PengajuanSEPPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noPengajuan: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.pengajuan;
  return wrapWithAudit<{ noPengajuan: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(payload.noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      if (!payload.keterangan || payload.keterangan.trim().length < 10) {
        return errEnvelope("204", endpoint, "Keterangan minimal 10 karakter");
      }
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      const noPengajuan = `APR-${payload.tglSep.replace(/-/g, "").slice(0, 8)}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      return okEnvelope({ noPengajuan }, "Pengajuan SEP berhasil diajukan");
    },
  )();
}

// ── 4. LIST PERSETUJUAN SEP ────────────────────────────

export function listPersetujuanSEP(
  bulan: number,
  tahun: number,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: PersetujuanSEPItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.listPersetujuan(bulan, tahun);
  return wrapWithAudit<{ list: PersetujuanSEPItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (bulan < 1 || bulan > 12) {
        return errEnvelope("204", endpoint, "Bulan harus 1-12");
      }
      // Mock: 2 persetujuan dummy
      const pad = (n: number) => n.toString().padStart(2, "0");
      const list: PersetujuanSEPItem[] = [
        {
          noKartu: "0002039003212",
          nama: "MARTA SENTANA",
          tglsep: `${tahun}-${pad(bulan)}-15`,
          jnspelayanan: "RJ",
          persetujuan: "Pengajuan",
          status: "Tgl.SEP Backdate",
        },
        {
          noKartu: PESERTA_MOCK[0]?.noKartu ?? "0001234567891",
          nama: PESERTA_MOCK[0]?.nama ?? "Joko Prasetyo",
          tglsep: `${tahun}-${pad(bulan)}-22`,
          jnspelayanan: "RI",
          persetujuan: "Disetujui",
          status: "Finger Print",
        },
      ];
      return okEnvelope({ list });
    },
  )();
}

// ── 5. UPDATE TANGGAL PULANG (PUT) ─────────────────────

export function updateTglPulang(
  payload: UpdateTglPulangPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSep: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.updateTglPulang;
  return wrapWithAudit<{ noSep: string }>(
    { endpoint, method: "PUT" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }

      const sep = SEP_MOCK.find((s) => s.noSEP === payload.noSep);
      if (!sep) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
      if (payload.tglPulang < sep.tglTerbit) {
        return errEnvelope("204", endpoint, "tglPulang harus >= tglTerbit SEP");
      }

      // Conditional: statusPulang=4 (Meninggal) → noSuratMeninggal + tglMeninggal wajib
      if (payload.statusPulang === "4") {
        if (!payload.noSuratMeninggal || payload.noSuratMeninggal.trim().length === 0) {
          return errEnvelope(
            "204",
            endpoint,
            "noSuratMeninggal wajib jika statusPulang=4 (Meninggal)",
          );
        }
        if (!payload.tglMeninggal || !/^\d{4}-\d{2}-\d{2}$/.test(payload.tglMeninggal)) {
          return errEnvelope(
            "204",
            endpoint,
            "tglMeninggal wajib + format yyyy-MM-dd jika statusPulang=4",
          );
        }
      } else {
        // Spec: kosong jika selain statusPulang=4 — warning saja, tidak block
        if (payload.noSuratMeninggal || payload.tglMeninggal) {
          // Tolerant — just ignore (spec says "selain itu kosong" but doesn't reject)
        }
      }

      // Conditional: SEP KLL → noLPManual wajib
      if (sep.jaminan && sep.jaminan.lakaLantas !== "0") {
        if (!payload.noLPManual || payload.noLPManual.trim().length === 0) {
          return errEnvelope(
            "204",
            endpoint,
            "noLPManual wajib karena SEP adalah KLL (jaminan.lakaLantas != 0)",
          );
        }
      }

      return okEnvelope(
        { noSep: payload.noSep },
        "Tanggal pulang berhasil di-update",
      );
    },
  )();
}

// ── 6. LIST DATA UPDATE TANGGAL PULANG ─────────────────

export function listUpdateTglPulang(
  bulan: number,
  tahun: number,
  filter: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: UpdateTglPulangListItem[] }>, BPJSError>> {
  const filterPart = filter && filter.trim().length > 0 ? filter : "";
  const endpoint = VCLAIM_ENDPOINTS.sep.listUpdateTglPulang(bulan, tahun, filterPart);
  return wrapWithAudit<{ list: UpdateTglPulangListItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (bulan < 1 || bulan > 12) {
        return errEnvelope("204", endpoint, "Bulan harus 1-12");
      }
      const pad = (n: number) => n.toString().padStart(2, "0");
      const period = `${tahun}-${pad(bulan)}`;
      const list: UpdateTglPulangListItem[] = SEP_MOCK
        .filter(
          (s) =>
            (s.statusInternal === "Updated" || s.statusInternal === "Closed") &&
            s.audit.updatedAt &&
            s.audit.updatedAt.slice(0, 7) === period &&
            (filterPart === "" || s.noSEP.includes(filterPart) || s.noKartu.includes(filterPart)),
        )
        .map<UpdateTglPulangListItem>((s) => {
          const peserta = PESERTA_MOCK.find((p) => p.noKartu === s.noKartu);
          return {
            noSep: s.noSEP,
            jnsPelayanan: s.jnsPelayanan,
            noKartu: s.noKartu,
            nama: peserta?.nama ?? "-",
            tglSep: s.tglTerbit,
            tglPulang: s.tglPulang ?? "",
            status: "",
            tglMeninggal: "",
            noSurat: "",
            keterangan: `SEP ${s.noSEP} updated`,
            user: s.audit.updatedBy ?? s.audit.createdBy,
          };
        });
      return okEnvelope({ list });
    },
  )();
}

// ── 7. INTEGRASI SEP dengan INACBGs ────────────────────

export function integrasiSepInacbgs(
  noSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<SEPInacbgsResponse>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.integrasiInacbg(noSEP);
  return wrapWithAudit<SEPInacbgsResponse>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const sep = SEP_MOCK.find((s) => s.noSEP === noSEP);
      if (!sep) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
      const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
      if (!peserta) return errEnvelope("201", endpoint, "Peserta tidak ditemukan");

      return okEnvelope({
        pesertasep: {
          kelamin: peserta.sex,
          klsRawat: sep.klsRawat.klsRawatHak,
          nama: peserta.nama,
          noKartuBpjs: peserta.noKartu,
          noMr: sep.noMR ?? peserta.mr?.noMR ?? "0",
          noRujukan: sep.rujukan.noRujukan ?? "",
          tglLahir: peserta.tglLahir,
          tglPelayanan: sep.tglTerbit,
          tktPelayanan: "2",
        },
      });
    },
  )();
}

// ── 8. DATA SEP INTERNAL ───────────────────────────────

export function dataSepInternal(
  noSEP: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ count: string; list: SEPInternalItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.internalGet(noSEP);
  return wrapWithAudit<{ count: string; list: SEPInternalItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const sep = SEP_MOCK.find((s) => s.noSEP === noSEP);
      if (!sep) return errEnvelope("201", endpoint, "SEP tidak ditemukan");

      // Mock: 1 internal entry per SEP rawat inap aktif (simulate transfer poli)
      const list: SEPInternalItem[] =
        sep.jnsPelayanan === "1" && sep.statusInternal !== "Deleted"
          ? [
              {
                tujuanrujuk: "SAR",
                nmtujuanrujuk: "SARAF",
                nmpoliasal: "PENYAKIT DALAM",
                tglrujukinternal: sep.tglTerbit,
                nosep: sep.noSEP,
                nosepref: sep.noSEP,
                ppkpelsep: sep.ppkPelayanan ?? "0001R001",
                nokapst: sep.noKartu,
                tglsep: sep.tglTerbit,
                nosurat: `${sep.noSEP}-INT-001`,
                flaginternal: "0",
                kdpoliasal: "INT",
                kdpolituj: "SAR",
                kdpenunjang: "0",
                nmpenunjang: null,
                diagppk: sep.diagAwal,
                kddokter: "DR-099",
                nmdokter: "dr. Nurhayana Lubis, Sp.S",
                flagprosedur: null,
                opsikonsul: "1",
                flagsep: "False",
                fuser: sep.audit.createdBy,
                fdate: sep.tglTerbit,
                nmdiag: sep.diagAwalNama ?? sep.diagAwal,
              },
            ]
          : [];

      return okEnvelope({ count: list.length.toString(), list });
    },
  )();
}

// ── 9. HAPUS SEP INTERNAL ──────────────────────────────

export function hapusSepInternal(
  payload: HapusSEPInternalPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ noSep: string }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.internalDelete;
  return wrapWithAudit<{ noSep: string }>(
    { endpoint, method: "DELETE" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      if (!/^[A-Z]{3}$/.test(payload.kdPoliTuj)) {
        return errEnvelope("204", endpoint, "kdPoliTuj harus 3 digit huruf");
      }
      const exists = SEP_MOCK.find((s) => s.noSEP === payload.noSep);
      if (!exists) return errEnvelope("201", endpoint, "SEP tidak ditemukan");
      return okEnvelope({ noSep: payload.noSep }, "SEP Internal berhasil dihapus");
    },
  )();
}

// ── 10. GET FINGER PRINT ───────────────────────────────

export function getFingerPrint(
  noKartu: string,
  tglPelayanan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<FingerPrintResponse>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.fingerPrint(noKartu, tglPelayanan);
  return wrapWithAudit<FingerPrintResponse>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      // Mock: 70% sudah validasi, 30% belum
      const validated = Math.random() < 0.7;
      const response: FingerPrintResponse = validated
        ? {
            kode: "1",
            status: `Peserta telah melakukan validasi finger print pada tanggal ${tglPelayanan}`,
          }
        : {
            kode: "0",
            status: "Peserta belum melakukan validasi finger print",
          };
      return okEnvelope(response, "Ok");
    },
  )();
}

// ── 12. GET LIST FINGER PRINT ──────────────────────────

export function listFingerPrint(
  tglPelayanan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ list: FingerPrintListItem[] }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.sep.listFingerPrint(tglPelayanan);
  return wrapWithAudit<{ list: FingerPrintListItem[] }>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tglPelayanan)) {
        return errEnvelope("204", endpoint, "tglPelayanan format yyyy-mm-dd");
      }
      const list: FingerPrintListItem[] = SEP_MOCK.filter(
        (s) => s.tglTerbit === tglPelayanan && s.statusInternal !== "Deleted",
      )
        .slice(0, 20)
        .map<FingerPrintListItem>((s) => ({
          noKartu: s.noKartu,
          noSEP: s.noSEP,
        }));
      return okEnvelope({ list }, "Ok");
    },
  )();
}

// ── 13. RANDOM QUESTION (alternatif fingerprint) ───────

export function randomQuestion(
  noKartu: string,
  tglPelayanan: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RandomQuestionResponse>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.peserta.randomQuestion(noKartu, tglPelayanan);
  return wrapWithAudit<RandomQuestionResponse>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      // Mock: 3 faskes acak — peserta pilih yang benar (lookup riwayat FKTP)
      return okEnvelope({
        faskes: [
          { kode: "0177B030", nama: "Klinik Citra Madina" },
          { kode: "21061801", nama: "DAMAU" },
          { kode: "01031201", nama: "PEUKAN BADA" },
        ],
      }, "Ok");
    },
  )();
}

// ── 14. POST RANDOM ANSWER ─────────────────────────────

export function postRandomAnswer(
  payload: PostRandomAnswerPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ verified: boolean }>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.peserta.randomAnswer;
  return wrapWithAudit<{ verified: boolean }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(payload.noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      if (!payload.user || payload.user.trim().length === 0) {
        return errEnvelope("204", endpoint, "user wajib diisi");
      }
      // Mock: 85% verifikasi sukses
      const verified = Math.random() < 0.85;
      if (!verified) {
        return errEnvelope("204", endpoint, "Jawaban tidak sesuai");
      }
      return okEnvelope({ verified: true }, "Verifikasi peserta sukses");
    },
  )();
}
