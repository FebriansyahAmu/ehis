/**
 * Monitoring Mock (BP0.3 + Spec aligned 2026-05-29).
 *
 * Wire-format mock per [Monitoring-Contracts.md] — 4 envelope:
 * - `KUNJUNGAN_MONITORING_MOCK` → spec endpoint 1
 * - `KLAIM_MONITORING_MOCK` → spec endpoint 2
 * - `HISTORI_MONITORING_MOCK` → spec endpoint 3
 * - `JASA_RAHARJA_MONITORING_MOCK` → spec endpoint 4
 *
 * Derive dari `SEP_MOCK` (skip Deleted/Draft). Tambah biaya synthetic
 * deterministic per noSEP hash untuk reproducibility.
 *
 * Catatan: rich domain types (`KunjunganBPJSRecord`/`HistoriPelayananRecord`)
 * tetap di-export untuk derived analytics (dashboard/KPI) — TIDAK dipakai
 * adapter monitoring (return wire-format).
 */

import type {
  HistoriPelayananMonitoringItem,
  HistoriPelayananRecord,
  JasaRaharjaMonitoringItem,
  KlaimMonitoringItem,
  KunjunganBPJSRecord,
  KunjunganMonitoringItem,
} from "../bpjsShared";
import { SEP_MOCK } from "./sepMock";
import { PESERTA_MOCK } from "./pesertaMock";

const BIAYA_BASELINE = {
  RI: 8_500_000,
  RJ: 450_000,
} as const;

/** Random-but-deterministic biaya offset (based on noSEP hash). */
function biayaOffset(noSEP: string): number {
  let h = 0;
  for (let i = 0; i < noSEP.length; i++) h = (h * 31 + noSEP.charCodeAt(i)) >>> 0;
  return h % 4_000_000;
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
  HDL: "Hemodialisa",
};

const PPK_NAMA = "RS SAKTI MEDIKA";

/** Active SEP set untuk monitoring (skip Draft/Deleted). */
const ACTIVE_SEPS = SEP_MOCK.filter(
  (sep) => sep.statusInternal !== "Deleted" && sep.statusInternal !== "Draft",
);

// ── Spec 1: Kunjungan Wire-Format Mock ─────────────────

export const KUNJUNGAN_MONITORING_MOCK: ReadonlyArray<KunjunganMonitoringItem> =
  ACTIVE_SEPS.map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    return {
      diagnosa: sep.diagAwal,
      jnsPelayanan: sep.jnsPelayanan === "1" ? "R.Inap" : "R.Jalan",
      kelasRawat: sep.klsRawat.klsRawatHak,
      nama: peserta?.nama ?? "Tidak Diketahui",
      noKartu: sep.noKartu,
      noSep: sep.noSEP,
      noRujukan: sep.rujukan.noRujukan ?? "",
      // Spec: RI poli = null, RJ poli = kode poli
      poli: sep.jnsPelayanan === "1" ? null : sep.poli.tujuan,
      tglPlgSep: sep.tglPulang ?? sep.tglTerbit,
      tglSep: sep.tglTerbit,
    };
  });

// ── Spec 2: Klaim Wire-Format Mock ─────────────────────

/** Map status internal SEP → status klaim monitoring spec. */
function statusKlaimDariSEP(
  statusInternal: string,
): "Proses Verifikasi" | "Pending Verifikasi" | "Klaim" {
  if (statusInternal === "Closed") return "Klaim";
  if (statusInternal === "Updated") return "Proses Verifikasi";
  return "Pending Verifikasi";
}

/** Stub INA-CBG kode per poli (mock — backend will use real grouper). */
const INACBG_BY_POLI: Record<string, { kode: string; nama: string }> = {
  INT: { kode: "I-4-13-I", nama: "INFEKSI BAKTERI/ PARASIT KECUALI VIRUS BERAT" },
  BED: { kode: "K-1-21-II", nama: "PROSEDUR ENDOSKOPI SISTEM PENCERNAAN" },
  OBG: { kode: "O-6-13-II", nama: "PROSEDUR SECTIO CAESARIA" },
  MAT: { kode: "U-1-30-I", nama: "PROSEDUR LENSA INTRAOKULER" },
  PAR: { kode: "J-4-13-I", nama: "INFEKSI/INFLAMASI PERNAFASAN KECUALI BRONKIEKTASIS" },
  JAN: { kode: "F-4-13-II", nama: "GAGAL JANTUNG" },
  ORT: { kode: "M-1-08-II", nama: "PROSEDUR PADA TULANG PANJANG, OTOT, TENDON" },
  ANA: { kode: "P-8-17-I", nama: "PERAWATAN NEONATAL DENGAN MASALAH" },
  THT: { kode: "U-3-19-I", nama: "INFEKSI/INFLAMASI THT" },
  HDL: { kode: "N-3-15-0", nama: "DIALYSIS" },
};

export const KLAIM_MONITORING_MOCK: ReadonlyArray<KlaimMonitoringItem> =
  ACTIVE_SEPS.map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const baseline = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = baseline + biayaOffset(sep.noSEP);
    const isVerif = sep.statusInternal === "Closed";
    const setuju = isVerif ? Math.floor(tagih * 0.95) : 0;
    const status = statusKlaimDariSEP(sep.statusInternal);
    const inacbg =
      INACBG_BY_POLI[sep.poli.tujuan] ?? { kode: "X-9-99-0", nama: "TIDAK TERMAPPING" };
    return {
      Inacbg: inacbg,
      biaya: {
        byPengajuan: String(tagih),
        bySetujui: String(setuju),
        byTarifGruper: String(Math.floor(tagih * 0.92)),
        byTarifRS: String(Math.floor(tagih * 1.05)),
        byTopup: "0",
      },
      kelasRawat: sep.klsRawat.klsRawatHak,
      noFPK: status === "Klaim" ? `FPK/${sep.noSEP.slice(-8)}` : "",
      noSEP: sep.noSEP,
      peserta: {
        nama: peserta?.nama ?? "Tidak Diketahui",
        noKartu: sep.noKartu,
        noMR: peserta?.mr.noMR ?? "",
      },
      poli: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? sep.poli.tujuan,
      status,
      tglPulang: sep.tglPulang ?? sep.tglTerbit,
      tglSep: sep.tglTerbit,
    };
  });

// ── Spec 3: Histori Pelayanan Wire-Format Mock ─────────

export const HISTORI_MONITORING_MOCK: ReadonlyArray<HistoriPelayananMonitoringItem> =
  ACTIVE_SEPS.map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const diagnosaDisplay = `${sep.diagAwal} - ${sep.diagAwalNama ?? sep.diagAwal}`;
    const kelasDisplay =
      sep.jnsPelayanan === "1" ? `Kelas ${sep.klsRawat.klsRawatHak}` : null;
    return {
      diagnosa: diagnosaDisplay,
      jnsPelayanan: sep.jnsPelayanan,
      kelasRawat: kelasDisplay,
      namaPeserta: peserta?.nama ?? "Tidak Diketahui",
      noKartu: sep.noKartu,
      noSep: sep.noSEP,
      noRujukan: sep.rujukan.noRujukan ?? "",
      poli: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? "",
      ppkPelayanan: PPK_NAMA,
      tglPlgSep: sep.tglPulang ?? sep.tglTerbit,
      tglSep: sep.tglTerbit,
    };
  });

// ── Spec 4: Jasa Raharja Wire-Format Mock ──────────────

/** SEP yang punya jaminan kecelakaan (Suplesi/laka). */
const LAKA_SEPS = SEP_MOCK.filter(
  (sep) =>
    sep.statusInternal === "Suplesi" ||
    (sep.jaminan?.lakaLantas && sep.jaminan.lakaLantas !== "0"),
);

export const JASA_RAHARJA_MONITORING_MOCK: ReadonlyArray<JasaRaharjaMonitoringItem> =
  LAKA_SEPS.map((sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const baseline = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = baseline + biayaOffset(sep.noSEP);
    const dijamin = Math.floor(tagih * 0.6);
    return {
      sep: {
        noSEP: sep.noSEP,
        tglSEP: sep.tglTerbit,
        tglPlgSEP: sep.tglPulang ?? sep.tglTerbit,
        noMr: peserta?.mr.noMR ?? "",
        jnsPelayanan: sep.jnsPelayanan,
        poli: sep.poli.tujuan,
        diagnosa: sep.diagAwal,
        peserta: {
          noKartu: sep.noKartu,
          nama: peserta?.nama ?? "Tidak Diketahui",
          noMR: peserta?.mr.noMR ?? "",
        },
      },
      jasaRaharja: {
        tglKejadian: sep.jaminan?.penjamin?.tglKejadian ?? sep.tglTerbit,
        noRegister: `JR-${sep.noSEP.slice(-8)}`,
        ketStatusDijamin: "Dijamin",
        ketStatusDikirim: "Sukses",
        biayaDijamin: String(dijamin),
        plafon: "20000000",
        jmlDibayar: String(dijamin),
        resultsJasaRaharja: "Sukses",
      },
    };
  });

// ── Backward-compat: Rich Domain Types (derived) ───────

/**
 * Legacy rich `KunjunganBPJSRecord[]` derived dari wire-format mock untuk
 * dashboard/analytics consumer. Adapter monitoring tidak return type ini.
 */
export const KUNJUNGAN_BPJS_MOCK: ReadonlyArray<KunjunganBPJSRecord> = ACTIVE_SEPS.map(
  (sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const baseline = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = BigInt(baseline + biayaOffset(sep.noSEP));
    const setuju = sep.statusInternal === "Closed" ? (tagih * 95n) / 100n : undefined;
    return {
      noSEP: sep.noSEP,
      noKartu: sep.noKartu,
      namaPeserta: peserta?.nama ?? "Tidak Diketahui",
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      kelasRawat: sep.klsRawat.klsRawatHak,
      poli: {
        kode: sep.poli.tujuan,
        nama: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? sep.poli.tujuan,
      },
      diagnosaAwal: { kode: sep.diagAwal, nama: sep.diagAwalNama ?? sep.diagAwal },
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
  },
);

export const HISTORI_PELAYANAN_MOCK: ReadonlyArray<HistoriPelayananRecord> =
  ACTIVE_SEPS.map((sep) => {
    const baseline = sep.jenisRawat === "RI" ? BIAYA_BASELINE.RI : BIAYA_BASELINE.RJ;
    const tagih = BigInt(baseline + biayaOffset(sep.noSEP));
    const setuju = (tagih * 92n) / 100n;
    return {
      noSEP: sep.noSEP,
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      poli: {
        kode: sep.poli.tujuan,
        nama: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? sep.poli.tujuan,
      },
      diagnosa: { kode: sep.diagAwal, nama: sep.diagAwalNama ?? sep.diagAwal },
      dpjp: sep.dpjpLayan ?? "-",
      biayaTagih: tagih,
      biayaSetuju: setuju,
      statusVerifikasi:
        sep.statusInternal === "Closed" || sep.statusInternal === "Updated"
          ? "Disetujui"
          : "Pending Verifikasi",
    };
  });

/** Legacy: derived dari suplesi SEP, untuk backward consumer. */
export const JASA_RAHARJA_MOCK: ReadonlyArray<KunjunganBPJSRecord> = LAKA_SEPS.map(
  (sep) => {
    const peserta = PESERTA_MOCK.find((p) => p.noKartu === sep.noKartu);
    const tagih = BigInt(BIAYA_BASELINE.RI + biayaOffset(sep.noSEP));
    return {
      noSEP: sep.noSEP,
      noKartu: sep.noKartu,
      namaPeserta: peserta?.nama ?? "Tidak Diketahui",
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jnsPelayanan,
      kelasRawat: sep.klsRawat.klsRawatHak,
      poli: {
        kode: sep.poli.tujuan,
        nama: POLI_NAMA_BY_KODE[sep.poli.tujuan] ?? sep.poli.tujuan,
      },
      diagnosaAwal: { kode: sep.diagAwal, nama: sep.diagAwalNama ?? sep.diagAwal },
      dpjpLayan: sep.dpjpLayan,
      biayaTagih: tagih,
      biayaSetuju: (tagih * 90n) / 100n,
      statusKlaim: "Verifikasi",
    };
  },
);

// ── Lookup Helpers ─────────────────────────────────────

export function listKunjunganByPeriode(
  tglSep: string,
  jnsPelayanan: "R.Inap" | "R.Jalan",
): KunjunganMonitoringItem[] {
  return KUNJUNGAN_MONITORING_MOCK.filter(
    (k) => k.tglSep === tglSep && k.jnsPelayanan === jnsPelayanan,
  );
}

export function listHistoriByPeserta(
  noKartu: string,
  tglMulai: string,
  tglAkhir: string,
): HistoriPelayananMonitoringItem[] {
  return HISTORI_MONITORING_MOCK.filter(
    (h) =>
      h.noKartu === noKartu &&
      h.tglSep >= tglMulai &&
      h.tglSep <= tglAkhir,
  );
}
