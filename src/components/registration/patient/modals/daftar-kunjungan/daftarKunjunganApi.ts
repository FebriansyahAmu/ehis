// Adapter: state wizard "Pendaftaran Kunjungan Baru" → RegisterKunjunganInput (API).
// Memetakan vocab kode UI (V-Claim "0/1/2", source "masuk/kontrol") → enum kanonik
// schema server. Didukung backend: Rawat Jalan + IGD (Rawat Inap belum).

import type { RegisterKunjunganInput, RujukanInput, SepInput } from "@/lib/schemas/kunjungan";
import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import type { KunjunganForm, PenjaminForm, RujukanPick } from "./config";

const SUMBER_MAP = { masuk: "RujukanMasuk", kontrol: "KontrolPascaRanap" } as const;
const JNS_MAP = { "1": "RawatInap", "2": "RawatJalan" } as const;
const TUJUAN_MAP = { "0": "Normal", "1": "Prosedur", "2": "KonsulDokter" } as const;
const LAKA_MAP = { "0": "BKLL", "1": "KLL_BKK", "2": "KLL_KK", "3": "KK" } as const;
// Kelas rawat UI (KELAS_OPTS) → enum kanonik KelasRawat.
const KELAS_MAP: Record<string, "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3"> = {
  "1": "Kelas_1", "2": "Kelas_2", "3": "Kelas_3", vip: "VIP",
};

const flag = (v: string): boolean => v === "1";
const orUndef = (v?: string): string | undefined => (v && v.trim() ? v : undefined);

export interface BuildRegisterArgs {
  patientId: string;
  form: KunjunganForm;
  penjamin: PenjaminForm;
  rujukan: RujukanPick;
  sepDraft: SepDraft;
  /** Terbitkan SEP sekarang. Bila false (ditangguhkan), `sep` tak dikirim — kunjungan tetap terdaftar. */
  issueSep: boolean;
  needsRujukan: boolean;
  /** No. Kartu hasil verifikasi kepesertaan BPJS di step Penjamin. */
  noKartu?: string;
}

export function buildRegisterInput(args: BuildRegisterArgs): RegisterKunjunganInput {
  const { patientId, form, penjamin, rujukan, sepDraft, issueSep, needsRujukan, noKartu } = args;

  const isIgd = form.unit === "IGD";
  const isRi = form.unit === "Rawat Inap";
  const unit = isIgd ? "IGD" : isRi ? "RawatInap" : "RawatJalan";
  const poli = unit === "RawatJalan" ? form.poli : undefined; // poli hanya Rawat Jalan

  const rujukanInput: RujukanInput | undefined = needsRujukan
    ? {
        sumber: SUMBER_MAP[rujukan.source],
        asalRujukan: sepDraft.asalRujukan === "2" ? "Faskes2" : "Faskes1",
        noRujukan: rujukan.noRujukan,
        tglRujukan: orUndef(sepDraft.tglRujukan),
        ppkRujukan: orUndef(sepDraft.ppkRujukan),
        diagnosaKode: orUndef(rujukan.diagnosa?.code),
        diagnosaNama: orUndef(rujukan.diagnosa?.name),
        poliTujuan: poli,
      }
    : undefined;

  const sepInput: SepInput | undefined = issueSep
    ? {
        ppkPelayanan: sepDraft.ppkPelayanan,
        // Hanya No. Kartu hasil verifikasi (penuh). `penjamin.nomor` UI bisa ter-mask →
        // jangan dipakai; biar server fallback ke nomor tersimpan (enc) bila ini kosong.
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
        poliTujuan: poli,
        diagAwal: orUndef(sepDraft.diagAwal) ?? orUndef(rujukan.diagnosa?.code),
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
    patientId,
    unit,
    tanggal: form.tanggal,
    jam: form.jam || undefined,
    poli,
    triaseLevel: isIgd ? (form.triase ?? undefined) : undefined, // triase opsional di loket
    // IGD & RI: DPJP dari master (dokter ter-assign ruangan). RJ: dpjp via SEP.dpjpLayan.
    dpjpId: isIgd || isRi ? orUndef(form.dpjpId) : undefined,
    // Ruangan master: IGD bay/zona, atau RI bangsal. RI juga kirim kelas + bed (reserve).
    ruanganId: isIgd || isRi ? orUndef(form.ruanganId) : undefined,
    kelas: isRi ? KELAS_MAP[form.kelasRawat] : undefined,
    bedId: isRi ? orUndef(form.bedId) : undefined,
    keluhan: orUndef(form.keluhan),
    caraMasuk: orUndef(form.caraMasuk),
    penjaminTipe: penjamin.tipe,
    // No. Kartu terverifikasi dikirim terpisah → penjamin tetap tersimpan walau SEP ditangguhkan.
    noKartu: orUndef(noKartu),
    rujukan: rujukanInput,
    sep: sepInput,
  };
}
