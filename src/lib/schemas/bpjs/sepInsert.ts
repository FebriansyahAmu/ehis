// Kontrak Insert SEP (V-Claim `Peserta/sep/2.0/insert`) — server-side.
// Wire format BPJS: body = `{ "request": { "t_sep": <InsertSEPPayload> } }`.
//
// Kontrak `InsertSEPPayload` (t_sep, 1:1 spec resmi BPJS V-Claim 2.0) DIPAKAI ULANG dari
// [vClaimSEP.ts] (type-only — di-erase saat compile, tanpa coupling runtime ke client-hub).
// Di sini: builder dari input pendaftaran (SepInput + konteks ter-resolve) → t_sep wire +
// tipe Result konektor. Validasi/penerbitan = [services/bpjs/sepInsertMock.ts] (mock, seam
// untuk `callBpjs` saat V-Claim siap). Aturan kanonik: docs/BPJS-WS-RULES.md.

import type { InsertSEPPayload } from "@/lib/bpjs/vClaimSEP";
import type { SepInput } from "@/lib/schemas/kunjungan";

export type { InsertSEPPayload };

/** Error metaData BPJS (code ≠ "200"). `field` = nama field SepDraft untuk binding UI. */
export interface BpjsMetaError {
  code: string;
  message: string;
  field?: "noTelp" | "diagAwal" | "skdpNoSurat" | "noKartu" | "ppkPelayanan";
}

/** Hasil konektor Insert SEP. `noSep` opsional saat sukses — mock biarkan undefined (Service
 *  generate via sequence DB); konektor NYATA (callBpjs) isi dengan noSep terbitan BPJS. */
export type InsertSepConnectorResult =
  | { ok: true; noSep?: string }
  | { ok: false; error: BpjsMetaError };

/** Blok rujukan t_sep — RJ = rujukan faskes (RujukanInput); RI = rujukan internal RS. */
export interface SepWireRujukan {
  asalRujukan: "1" | "2";
  tglRujukan?: string;
  noRujukan?: string;
  ppkRujukan?: string;
}

/** Konteks ter-resolve Service → builder t_sep (PII & turunan sudah diselesaikan di luar). */
export interface BuildSepWireInput {
  /** SepInput tervalidasi (Zod). */
  sep: SepInput;
  /** No. Kartu peserta PENUH (hasil verifikasi kepesertaan / dekripsi penjamin). */
  noKartu: string;
  /** yyyy-MM-dd. */
  tglSep: string;
  /** Hak kelas efektif ("1"|"2"|"3"). */
  klsRawatHak?: string;
  /** Diagnosa awal efektif (ICD-10) — RI = diagnosa utama IGD. */
  diagAwal: string;
  /** No. telepon efektif (dari data pasien). */
  noTelp: string;
  /** Kode DPJP BPJS efektif (skdp.kodeDPJP) — di-resolve use-case dari mapping Dokter↔BPJS. */
  skdpKodeDpjp?: string;
  /** Blok rujukan (di-resolve use-case dari RujukanInput / default internal RI). */
  rujukan: SepWireRujukan;
}

const z01 = (b: boolean): "0" | "1" => (b ? "1" : "0");
const blank = (s?: string): string | undefined => (s && s.trim() ? s.trim() : undefined);

/**
 * Susun payload t_sep (InsertSEPPayload) dari input pendaftaran. Nested sesuai spec V-Claim:
 * klsRawat / rujukan / poli / cob / katarak / jaminan / skdp.
 *
 * Catatan conditional rule V-Claim: `dpjpLayan` HARUS kosong untuk Rawat Inap (jnsPelayanan="1")
 * — DPJP RANAP ditetapkan saat admisi, bukan di SEP.
 */
export function buildInsertSepPayload(input: BuildSepWireInput): InsertSEPPayload {
  const { sep, noKartu, tglSep, klsRawatHak, diagAwal, noTelp, skdpKodeDpjp, rujukan } = input;
  const isRanap = sep.jnsPelayanan === "RawatInap";
  const skdpKode = blank(skdpKodeDpjp) ?? blank(sep.skdpKodeDpjp) ?? "";

  const naik = sep.naikKelas
    ? {
        klsRawatNaik: blank(sep.klsRawatNaik) as InsertSEPPayload["klsRawat"]["klsRawatNaik"],
        pembiayaan: blank(sep.pembiayaan) as InsertSEPPayload["klsRawat"]["pembiayaan"],
        penanggungJawab: blank(sep.penanggungJawab),
      }
    : {};

  return {
    noKartu,
    tglSep,
    ppkPelayanan: sep.ppkPelayanan,
    jnsPelayanan: isRanap ? "1" : "2",
    klsRawat: {
      klsRawatHak: (klsRawatHak ?? sep.klsRawatHak ?? "3") as InsertSEPPayload["klsRawat"]["klsRawatHak"],
      ...naik,
    },
    noMR: blank(sep.noMr),
    rujukan: {
      asalRujukan: rujukan.asalRujukan,
      tglRujukan: blank(rujukan.tglRujukan),
      noRujukan: blank(rujukan.noRujukan),
      ppkRujukan: blank(rujukan.ppkRujukan),
    },
    catatan: blank(sep.catatan),
    diagAwal,
    poli: {
      tujuan: blank(sep.poliTujuan) ?? "",
      eksekutif: z01(sep.poliEksekutif),
    },
    cob: { cob: z01(sep.cob) },
    katarak: { katarak: z01(sep.katarak) },
    jaminan: {
      lakaLantas: sep.lakaLantas === "BKLL" ? "0" : sep.lakaLantas === "KLL_BKK" ? "1" : sep.lakaLantas === "KLL_KK" ? "2" : "3",
      noLP: blank(sep.noLp),
      penjamin: {
        tglKejadian: blank(sep.tglKejadian),
        keterangan: blank(sep.keteranganLaka),
        suplesi: {
          suplesi: z01(sep.suplesi),
          noSepSuplesi: blank(sep.noSepSuplesi),
        },
      },
    },
    tujuanKunj: isRanap ? undefined : (sep.tujuanKunj === "Prosedur" ? "1" : sep.tujuanKunj === "KonsulDokter" ? "2" : "0"),
    flagProcedure: isRanap ? undefined : ((sep.flagProcedure ?? "") as "" | "0" | "1"),
    kdPenunjang: isRanap ? undefined : (blank(sep.kdPenunjang) as InsertSEPPayload["kdPenunjang"]),
    assesmentPel: isRanap ? undefined : (blank(sep.assesmentPel) as InsertSEPPayload["assesmentPel"]),
    // skdp (Surat Kontrol/SPRI) — RI ditebitkan dari SPRI; RJ kontrol pasca-ranap.
    // kodeDPJP = kode DPJP BPJS ter-resolve (mapping Dokter↔BPJS), bukan id internal.
    skdp: blank(sep.skdpNoSurat)
      ? { noSurat: sep.skdpNoSurat!.trim(), kodeDPJP: skdpKode }
      : undefined,
    // V-Claim: dpjpLayan WAJIB kosong untuk Rawat Inap.
    dpjpLayan: isRanap ? undefined : blank(sep.dpjpLayan),
    noTelp,
    user: blank(sep.user),
  };
}

/** Bungkus wire BPJS final: `{ request: { t_sep: <payload> } }`. */
export function toSepWire(payload: InsertSEPPayload): { request: { t_sep: InsertSEPPayload } } {
  return { request: { t_sep: payload } };
}
