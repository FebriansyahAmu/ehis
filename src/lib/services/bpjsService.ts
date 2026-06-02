// bpjsService — domain artefak BPJS (Rujukan + SEP). Tak import prisma langsung (pakai
// DAL + `tx` dari use-case). Non-determinisme via `clock` inject (FLOWS §14).
//
// ⚠️ MOCK ISSUANCE: BPJS V-Claim belum bisa di-hit. `issueSep` mensimulasikan skenario
// BERHASIL — status `Terbit` + no. SEP digenerate lokal (atomik via sequence). Saat
// V-Claim siap: ganti isi `issueSep` (POST t_sep → terima noSep). SIGNATURE TETAP.

import { systemClock, type Clock } from "@/lib/core/clock";
import * as defaultBpjsDal from "@/lib/dal/bpjsDal";
import type { Tx } from "@/lib/db/prisma";
import type { RujukanInput, SepInput, RujukanDTO, SepDTO } from "@/lib/schemas/kunjungan";
import type { RujukanEntity, SepEntity } from "@/lib/dal/bpjsDal";

type BpjsDal = typeof defaultBpjsDal;

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

  /** Buat rujukan untuk kunjungan (1:1). */
  function createRujukan(kunjunganId: string, input: RujukanInput, tx?: Tx) {
    return dal.createRujukan(
      {
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
      },
      tx,
    );
  }

  /**
   * Terbitkan SEP (MOCK — selalu BERHASIL). Persist status `Terbit` + noSep generated.
   * `noKartu`/`klsRawatHak`/`tglSep` di-resolve use-case dari penjamin+kunjungan.
   */
  async function issueSep(
    args: { kunjunganId: string; rujukanId?: string; noKartu: string; klsRawatHak?: string; tglSep: Date; input: SepInput },
    tx?: Tx,
  ): Promise<SepEntity> {
    const { kunjunganId, rujukanId, noKartu, klsRawatHak, tglSep, input } = args;
    const noSep = await genNoSep(input.ppkPelayanan, tx);
    return dal.createSep(
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
        diagAwal: input.diagAwal,
        lakaLantas: input.lakaLantas,
        noLp: input.noLp,
        tglKejadian: dateOnly(input.tglKejadian),
        keteranganLaka: input.keteranganLaka,
        suplesi: input.suplesi,
        noSepSuplesi: input.noSepSuplesi,
        cob: input.cob,
        katarak: input.katarak,
        skdpNoSurat: input.skdpNoSurat,
        skdpKodeDpjp: input.skdpKodeDpjp,
        noTelp: input.noTelp,
        catatan: input.catatan,
        userPembuat: input.user,
      },
      tx,
    );
  }

  return { createRujukan, issueSep };
}

export const bpjsService = makeBpjsService();
