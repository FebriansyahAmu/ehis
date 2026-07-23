// Adapter: state modal "Ubah Penjamin" (SepDraft + RujukanPick) → ChangePenjaminInput (API).
// Mirror pemetaan SEP/rujukan dari daftarKunjunganApi.buildRegisterInput, tapi TANPA field
// kunjungan (unit/tanggal/dpjp/poli/kelasHak diresolusi server dari kunjungan yang ada).

import type { ChangePenjaminInput, RujukanInput, SepInput } from "@/lib/schemas/kunjungan";
import type { SepDraft } from "./sepTypes";
import type { RujukanPick } from "@/components/registration/patient/modals/daftar-kunjungan/config";

const SUMBER_MAP = { masuk: "RujukanMasuk", kontrol: "KontrolPascaRanap" } as const;
const JNS_MAP = { "1": "RawatInap", "2": "RawatJalan" } as const;
const TUJUAN_MAP = { "0": "Normal", "1": "Prosedur", "2": "KonsulDokter" } as const;
const LAKA_MAP = { "0": "BKLL", "1": "KLL_BKK", "2": "KLL_KK", "3": "KK" } as const;

const flag = (v: string): boolean => v === "1";
const orUndef = (v?: string): string | undefined => (v && v.trim() ? v : undefined);

export interface BuildChangePenjaminArgs {
  penjaminTipe: ChangePenjaminInput["penjaminTipe"];
  /** Terbitkan SEP sekarang (BPJS). false → ganti penjamin saja. */
  issueSep: boolean;
  sepDraft: SepDraft;
  rujukan: RujukanPick | null;
  needsRujukan: boolean;
  /** No. Kartu hasil verifikasi kepesertaan. */
  noKartu: string;
  /** Tetap simpan walau SEP ditolak BPJS (SEP ditangguhkan). */
  forceSep?: boolean;
}

export function buildChangePenjaminInput(args: BuildChangePenjaminArgs): ChangePenjaminInput {
  const { penjaminTipe, issueSep, sepDraft, rujukan, needsRujukan, noKartu, forceSep } = args;

  const rujukanInput: RujukanInput | undefined =
    issueSep && needsRujukan && rujukan
      ? {
          sumber: SUMBER_MAP[rujukan.source],
          asalRujukan: sepDraft.asalRujukan === "2" ? "Faskes2" : "Faskes1",
          noRujukan: rujukan.noRujukan,
          tglRujukan: orUndef(sepDraft.tglRujukan),
          ppkRujukan: orUndef(sepDraft.ppkRujukan),
          diagnosaKode: orUndef(rujukan.diagnosa?.code),
          diagnosaNama: orUndef(rujukan.diagnosa?.name),
          poliTujuan: orUndef(sepDraft.poliTujuan),
        }
      : undefined;

  const sepInput: SepInput | undefined = issueSep
    ? {
        ppkPelayanan: sepDraft.ppkPelayanan,
        noKartu: noKartu || undefined,
        jnsPelayanan: JNS_MAP[sepDraft.jnsPelayanan],
        klsRawatHak: (sepDraft.klsRawatHak as "1" | "2" | "3") || undefined,
        noMr: orUndef(sepDraft.noMR),
        naikKelas: sepDraft.naikKelas,
        klsRawatNaik: orUndef(sepDraft.klsRawatNaik),
        pembiayaan: orUndef(sepDraft.pembiayaan),
        penanggungJawab: orUndef(sepDraft.penanggungJawab),
        tujuanKunj: TUJUAN_MAP[sepDraft.tujuanKunj],
        flagProcedure: (sepDraft.flagProcedure as "0" | "1") || undefined,
        kdPenunjang: orUndef(sepDraft.kdPenunjang),
        assesmentPel: orUndef(sepDraft.assesmentPel),
        poliEksekutif: flag(sepDraft.poliEksekutif),
        dpjpLayan: orUndef(sepDraft.dpjpLayan),
        poliTujuan: orUndef(sepDraft.poliTujuan),
        diagAwal: orUndef(sepDraft.diagAwal) ?? orUndef(rujukan?.diagnosa?.code),
        lakaLantas: LAKA_MAP[sepDraft.lakaLantas],
        noLp: orUndef(sepDraft.noLP),
        tglKejadian: orUndef(sepDraft.tglKejadian),
        keteranganLaka: orUndef(sepDraft.keteranganLaka),
        suplesi: flag(sepDraft.suplesi),
        noSepSuplesi: orUndef(sepDraft.noSepSuplesi),
        cob: flag(sepDraft.cob),
        katarak: flag(sepDraft.katarak),
        skdpNoSurat: orUndef(sepDraft.skdpNoSurat),
        skdpKodeDpjp: orUndef(sepDraft.skdpKodeDPJP),
        noTelp: orUndef(sepDraft.noTelp),
        catatan: orUndef(sepDraft.catatan),
        user: orUndef(sepDraft.user),
      }
    : undefined;

  return {
    penjaminTipe,
    issueSep,
    noKartu: orUndef(noKartu),
    rujukan: rujukanInput,
    sep: sepInput,
    forceSep: forceSep || undefined,
  };
}
