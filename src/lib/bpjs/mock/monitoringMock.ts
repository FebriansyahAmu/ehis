/**
 * Monitoring Mock (BP0.3).
 *
 * Pre-aggregated `KunjunganBPJSRecord` + `HistoriPelayananRecord` per
 * tanggal / peserta — populate Monitoring tab (Kunjungan/Klaim/Histori).
 *
 * Derive dari `SEP_MOCK` — setiap SEP active/closed jadi 1 kunjungan
 * + histori entry. Tambah biaya tagih/setuju synthetic (varied) untuk
 * panel breakdown summary.
 */

import type {
  HistoriPelayananRecord,
  KunjunganBPJSRecord,
} from "../bpjsShared";
import { SEP_MOCK } from "./sepMock";
import { PESERTA_MOCK } from "./pesertaMock";

const BIAYA_BASELINE = {
  RI: 8_500_000n,
  RJ: 450_000n,
} as const;

/** Random-but-deterministic biaya offset (based on noSEP hash). */
function biayaOffset(noSEP: string): bigint {
  let h = 0;
  for (let i = 0; i < noSEP.length; i++) h = (h * 31 + noSEP.charCodeAt(i)) >>> 0;
  // 0 - 4_000_000
  return BigInt(h % 4_000_000);
}

/** Lookup nama poli untuk display di monitoring envelope. */
const POLI_NAMA_BY_KODE: Record<string, string> = {
  INT: "Penyakit Dalam",
  BED: "Bedah",
  OBG: "Obstetri & Ginekologi",
  ANA: "Anak",
  MAT: "Mata",
  THT: "THT-KL",
  PAR: "Paru",
  JAN: "Jantung",
  SAR: "Saraf",
  ORT: "Ortopedi",
  KUL: "Kulit & Kelamin",
  REH: "Rehabilitasi Medik",
  IGD: "IGD",
};

/** Convert SEPRecordExt nested fields → CodeLabel untuk monitoring records. */
function poliToCodeLabel(sep: { poli: { tujuan: string } }): { kode: string; nama: string } {
  return {
    kode: sep.poli.tujuan,
    nama: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? sep.poli.tujuan,
  };
}

function diagToCodeLabel(sep: { diagAwal: string; diagAwalNama?: string }): {
  kode: string;
  nama: string;
} {
  return { kode: sep.diagAwal, nama: sep.diagAwalNama ?? sep.diagAwal };
}

// ── Kunjungan BPJS (per SEP active/closed) ─────────────

export const KUNJUNGAN_BPJS_MOCK: ReadonlyArray<KunjunganBPJSRecord> = SEP_MOCK
  .filter((sep) => sep.statusInternal !== "Deleted" && sep.statusInternal !== "Draft")
  .map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const biayaBase = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = biayaBase + biayaOffset(sep.noSEP);
    const setuju = sep.statusInternal === "Closed" ? (tagih * 95n) / 100n : undefined;

    return {
      noSEP: sep.noSEP,
      noKartu: sep.noKartu,
      namaPeserta: peserta?.nama ?? "Tidak Diketahui",
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      kelasRawat: sep.klsRawat.klsRawatHak,
      poli: poliToCodeLabel(sep),
      diagnosaAwal: diagToCodeLabel(sep),
      dpjpLayan: sep.dpjpLayan,
      biayaTagih: tagih,
      biayaSetuju: setuju,
      statusKlaim:
        sep.statusInternal === "Closed"
          ? "Disetujui"
          : sep.statusInternal === "Updated"
            ? "Verifikasi"
            : "Pending",
    };
  });

// ── Histori Pelayanan (per peserta, sort tgl desc) ─────

export const HISTORI_PELAYANAN_MOCK: ReadonlyArray<HistoriPelayananRecord> = SEP_MOCK
  .filter((sep) => sep.statusInternal !== "Deleted" && sep.statusInternal !== "Draft")
  .map((sep) => {
    const biayaBase = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = biayaBase + biayaOffset(sep.noSEP);
    const setuju = (tagih * 92n) / 100n;
    return {
      noSEP: sep.noSEP,
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      poli: poliToCodeLabel(sep),
      diagnosa: diagToCodeLabel(sep),
      dpjp: sep.dpjpLayan ?? "-",
      biayaTagih: tagih,
      biayaSetuju: setuju,
      statusVerifikasi:
        sep.statusInternal === "Closed" || sep.statusInternal === "Updated"
          ? "Disetujui"
          : "Pending Verifikasi",
    };
  });

// ── Klaim Jaminan Jasa Raharja (subset SEP Suplesi) ────

export const JASA_RAHARJA_MOCK: ReadonlyArray<KunjunganBPJSRecord> = SEP_MOCK
  .filter((sep) => sep.statusInternal === "Suplesi")
  .map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const tagih = BIAYA_BASELINE.RI + biayaOffset(sep.noSEP);
    return {
      noSEP: sep.noSEP,
      noKartu: sep.noKartu,
      namaPeserta: peserta?.nama ?? "Tidak Diketahui",
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      kelasRawat: sep.klsRawat.klsRawatHak,
      poli: poliToCodeLabel(sep),
      diagnosaAwal: diagToCodeLabel(sep),
      dpjpLayan: sep.dpjpLayan,
      biayaTagih: tagih,
      biayaSetuju: (tagih * 90n) / 100n,
      statusKlaim: "Verifikasi",
    };
  });

// ── Lookup Helpers ─────────────────────────────────────

export function listKunjunganByPeriode(
  tgl: string,
  jnsPelayanan: KunjunganBPJSRecord["jnsPelayanan"],
): KunjunganBPJSRecord[] {
  return KUNJUNGAN_BPJS_MOCK.filter(
    (k) => k.tglSEP === tgl && k.jnsPelayanan === jnsPelayanan,
  );
}

export function listHistoriByPeserta(
  noKartu: string,
  tglMulai: string,
  tglAkhir: string,
): HistoriPelayananRecord[] {
  return HISTORI_PELAYANAN_MOCK.filter((h) => {
    const sep = SEP_MOCK.find((s) => s.noSEP === h.noSEP);
    if (!sep || sep.noKartu !== noKartu) return false;
    return h.tglSEP >= tglMulai && h.tglSEP <= tglAkhir;
  });
}
