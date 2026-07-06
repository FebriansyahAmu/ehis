// Pratinjau payload t_sep (V-Claim Insert SEP) dari draft form SEP — MIRROR builder server
// [schemas/bpjs/sepInsert.ts:buildInsertSepPayload]. Nilai turunan yang di-resolve server (No.
// Kartu penuh, kodeDPJP dari mapping Dokter↔BPJS, No. Rujukan internal RI) memakai isian draft
// apa adanya → murni PRATINJAU, bukan payload final. JSON.stringify membuang field `undefined`.

import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";

const blank = (s: string): string | undefined => (s.trim() ? s.trim() : undefined);

/** Body wire BPJS: `{ request: { t_sep: <payload> } }` (pratinjau dari draft). */
export function buildSepPreview(d: SepDraft): { request: { t_sep: Record<string, unknown> } } {
  const isRanap = d.jnsPelayanan === "1";
  const t_sep: Record<string, unknown> = {
    noKartu: d.noKartu,
    tglSep: d.tglSep,
    ppkPelayanan: d.ppkPelayanan,
    jnsPelayanan: d.jnsPelayanan,
    klsRawat: {
      klsRawatHak: d.klsRawatHak || "3",
      ...(d.naikKelas
        ? { klsRawatNaik: blank(d.klsRawatNaik), pembiayaan: blank(d.pembiayaan), penanggungJawab: blank(d.penanggungJawab) }
        : {}),
    },
    noMR: blank(d.noMR),
    rujukan: {
      asalRujukan: d.asalRujukan,
      tglRujukan: blank(d.tglRujukan),
      noRujukan: blank(d.noRujukan),
      ppkRujukan: blank(d.ppkRujukan),
    },
    catatan: blank(d.catatan),
    diagAwal: d.diagAwal,
    poli: { tujuan: blank(d.poliTujuan) ?? "", eksekutif: d.poliEksekutif },
    cob: { cob: d.cob },
    katarak: { katarak: d.katarak },
    jaminan: {
      lakaLantas: d.lakaLantas,
      noLP: blank(d.noLP),
      penjamin: {
        tglKejadian: blank(d.tglKejadian),
        keterangan: blank(d.keteranganLaka),
        suplesi: { suplesi: d.suplesi, noSepSuplesi: blank(d.noSepSuplesi) },
      },
    },
    // Field khusus Rawat Jalan (V-Claim: kosongkan untuk Rawat Inap).
    tujuanKunj: isRanap ? undefined : d.tujuanKunj,
    flagProcedure: isRanap ? undefined : (d.flagProcedure || ""),
    kdPenunjang: isRanap ? undefined : blank(d.kdPenunjang),
    assesmentPel: isRanap ? undefined : blank(d.assesmentPel),
    // skdp (Surat Kontrol/SPRI). kodeDPJP = kode DPJP BPJS (bukan id internal).
    skdp: blank(d.skdpNoSurat) ? { noSurat: d.skdpNoSurat.trim(), kodeDPJP: d.skdpKodeDPJP } : undefined,
    // dpjpLayan = KODE DPJP saja (V-Claim: kosong untuk Rawat Inap).
    dpjpLayan: isRanap ? undefined : blank(d.dpjpLayan),
    noTelp: d.noTelp,
    user: blank(d.user),
  };
  return { request: { t_sep } };
}
