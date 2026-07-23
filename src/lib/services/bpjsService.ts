// bpjsService — domain artefak BPJS (Rujukan + SEP). Tak import prisma langsung (pakai
// DAL + `tx` dari use-case). Non-determinisme via `clock` inject (FLOWS §14).
//
// ⚠️ MOCK ISSUANCE: BPJS V-Claim belum bisa di-hit. `issueSep` membangun payload t_sep
// (buildInsertSepPayload) lalu memanggil konektor MOCK (insertSepMock) yang mensimulasikan
// respons BPJS — SUKSES (status `Terbit` + no. SEP digenerate lokal via sequence) ATAU
// ERROR metaData ala asli (data tak sesuai). Saat V-Claim siap: ganti isi `insertSepMock`
// dengan `callBpjs(... toSepWire(payload))`. SIGNATURE issueSep TETAP (Result).

import { systemClock, type Clock } from "@/lib/core/clock";
import * as defaultBpjsDal from "@/lib/dal/bpjsDal";
import type { Tx } from "@/lib/db/prisma";
import type { RujukanInput, SepInput, RujukanDTO, SepDTO } from "@/lib/schemas/kunjungan";
import type { RujukanEntity, SepEntity } from "@/lib/dal/bpjsDal";
import { buildInsertSepPayload, type BpjsMetaError, type SepWireRujukan } from "@/lib/schemas/bpjs/sepInsert";
import { insertSepMock } from "@/lib/services/bpjs/sepInsertMock";

type BpjsDal = typeof defaultBpjsDal;

/** Hasil penerbitan SEP — sukses (persisted) atau ditolak BPJS (metaData error, tak persist). */
export type IssueSepResult =
  | { ok: true; sep: SepEntity }
  | { ok: false; error: BpjsMetaError };

const pad = (n: number, len: number) => String(n).padStart(len, "0");
function dateOnly(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// ── DTO mappers (pure; tak butuh clock) ───────────────────────────────────────
const dStr = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

export function toRujukanDTO(r: NonNullable<RujukanEntity>): RujukanDTO {
  return {
    id: r.id,
    sumber: r.sumber,
    asalRujukan: r.asalRujukan,
    noRujukan: r.noRujukan,
    tglRujukan: dStr(r.tglRujukan),
    ppkRujukan: r.ppkRujukan,
    diagnosaKode: r.diagnosaKode,
    diagnosaNama: r.diagnosaNama,
    poliTujuan: r.poliTujuan,
    noSepAsal: r.noSepAsal,
  };
}

export function toSepDTO(s: NonNullable<SepEntity>): SepDTO {
  return {
    id: s.id,
    status: s.status,
    noSep: s.noSep,
    noKartu: s.noKartu,
    tglSep: s.tglSep.toISOString().slice(0, 10),
    ppkPelayanan: s.ppkPelayanan,
    jnsPelayanan: s.jnsPelayanan,
    klsRawatHak: s.klsRawatHak,
    noMr: s.noMr,
    naikKelas: s.naikKelas,
    klsRawatNaik: s.klsRawatNaik,
    tujuanKunj: s.tujuanKunj,
    poliTujuan: s.poliTujuan,
    diagAwal: s.diagAwal,
    poliEksekutif: s.poliEksekutif,
    dpjpLayan: s.dpjpLayan,
    lakaLantas: s.lakaLantas,
    cob: s.cob,
    katarak: s.katarak,
    catatan: s.catatan,
    userPembuat: s.userPembuat,
    createdAt: s.createdAt.toISOString(),
  };
}

export function makeBpjsService(deps: { clock?: Clock; dal?: BpjsDal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultBpjsDal;

  /** No. SEP MOCK — format mirip V-Claim: "{ppk}{YYMMDD}V{seq6}". Atomik/unik via sequence. */
  async function genNoSep(ppkPelayanan: string, tx?: Tx): Promise<string> {
    const seq = await dal.nextNoSepSeq(tx);
    const d = clock.now();
    const yymmdd = `${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1, 2)}${pad(d.getUTCDate(), 2)}`;
    return `${ppkPelayanan}${yymmdd}V${pad(seq, 6)}`;
  }

  function rujukanData(kunjunganId: string, input: RujukanInput) {
    return {
      kunjunganId,
      sumber: input.sumber,
      asalRujukan: input.asalRujukan,
      noRujukan: input.noRujukan,
      tglRujukan: dateOnly(input.tglRujukan),
      ppkRujukan: input.ppkRujukan,
      diagnosaKode: input.diagnosaKode,
      diagnosaNama: input.diagnosaNama,
      poliTujuan: input.poliTujuan,
      noSepAsal: input.noSepAsal,
    };
  }

  /** Buat rujukan untuk kunjungan (1:1). */
  function createRujukan(kunjunganId: string, input: RujukanInput, tx?: Tx) {
    return dal.createRujukan(rujukanData(kunjunganId, input), tx);
  }

  /** Upsert rujukan (Ubah Penjamin — kunjungan bisa sudah punya rujukan). */
  function upsertRujukan(kunjunganId: string, input: RujukanInput, tx?: Tx) {
    return dal.upsertRujukanByKunjungan(rujukanData(kunjunganId, input), tx);
  }

  /**
   * Terbitkan SEP via konektor V-Claim (MOCK). Build payload t_sep → `insertSepMock`:
   *  • ok → persist status `Terbit` + No. SEP (sequence DB) → { ok:true, sep }.
   *  • error → { ok:false, error } (TIDAK persist — use-case putuskan tangguh/rollback).
   * `noKartu`/`klsRawatHak`/`diagAwal`/`noTelp`/`tglSep` di-resolve use-case (PII + turunan).
   */
  async function issueSep(
    args: {
      kunjunganId: string;
      rujukanId?: string;
      noKartu: string;
      klsRawatHak?: string;
      tglSep: Date;
      /** Diagnosa awal efektif (ICD-10) — RI = diagnosa utama IGD. */
      diagAwal: string;
      /** No. telepon efektif (data pasien). */
      noTelp: string;
      /** Kode DPJP BPJS efektif (skdp.kodeDPJP) — di-resolve use-case dari SPRI/Dokter. */
      skdpKodeDpjp?: string;
      /** Blok rujukan t_sep (RJ = faskes; RI = internal RS). */
      rujukan: SepWireRujukan;
      input: SepInput;
    },
    tx?: Tx,
  ): Promise<IssueSepResult> {
    const { kunjunganId, rujukanId, noKartu, klsRawatHak, tglSep, diagAwal, noTelp, skdpKodeDpjp, rujukan, input } = args;
    const tglSepYmd = tglSep.toISOString().slice(0, 10);

    // Build t_sep + panggil konektor BPJS (mock). Konektor nyata kelak return noSep BPJS.
    const payload = buildInsertSepPayload({ sep: input, noKartu, tglSep: tglSepYmd, klsRawatHak, diagAwal, noTelp, skdpKodeDpjp, rujukan });
    const res = insertSepMock(payload);
    if (!res.ok) return { ok: false, error: res.error };

    const noSep = res.noSep ?? (await genNoSep(input.ppkPelayanan, tx));
    const sep = await dal.createSep(
      {
        kunjunganId,
        rujukanId,
        status: "Terbit",
        noSep,
        noKartu,
        tglSep,
        ppkPelayanan: input.ppkPelayanan,
        jnsPelayanan: input.jnsPelayanan,
        klsRawatHak: klsRawatHak ?? input.klsRawatHak,
        noMr: input.noMr,
        naikKelas: input.naikKelas,
        klsRawatNaik: input.klsRawatNaik,
        pembiayaan: input.pembiayaan,
        penanggungJawab: input.penanggungJawab,
        tujuanKunj: input.tujuanKunj,
        flagProcedure: input.flagProcedure,
        kdPenunjang: input.kdPenunjang,
        assesmentPel: input.assesmentPel,
        poliEksekutif: input.poliEksekutif,
        dpjpLayan: input.dpjpLayan,
        poliTujuan: input.poliTujuan,
        diagAwal, // diagnosa efektif (RI = utama IGD)
        lakaLantas: input.lakaLantas,
        noLp: input.noLp,
        tglKejadian: dateOnly(input.tglKejadian),
        keteranganLaka: input.keteranganLaka,
        suplesi: input.suplesi,
        noSepSuplesi: input.noSepSuplesi,
        cob: input.cob,
        katarak: input.katarak,
        skdpNoSurat: input.skdpNoSurat,
        skdpKodeDpjp: skdpKodeDpjp || input.skdpKodeDpjp, // kode DPJP BPJS ter-resolve
        noTelp, // telepon efektif (data pasien)
        catatan: input.catatan,
        userPembuat: input.user,
      },
      tx,
    );
    return { ok: true, sep };
  }

  return { createRujukan, upsertRujukan, issueSep };
}

export const bpjsService = makeBpjsService();
