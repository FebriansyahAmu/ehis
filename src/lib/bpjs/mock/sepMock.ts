/**
 * SEP Mock (BP0.3) — sync dengan spec resmi BPJS V-Claim Insert SEP.
 *
 * 20 SEPRecordExt lintas status (Issued/Closed/Updated/Suplesi/Deleted/Draft).
 *
 * Field structure sesuai spec BPJS V-Claim:
 * - `klsRawat.klsRawatHak`: "1"|"2"|"3" (kode enum, bukan "Kelas X")
 * - `poli`: `{ tujuan, eksekutif }` (bukan `{ kode, nama }`)
 * - `diagAwal`: string kode + `diagAwalNama` untuk display
 * - `rujukan`: `{ asalRujukan, tglRujukan, noRujukan, ppkRujukan }` — asalRujukan di DALAM
 * - `jaminan`: `{ lakaLantas, noLP, penjamin: { tglKejadian, keterangan, suplesi: {...} } }`
 *
 * Cross-link strategy:
 * - 12 SEP pertama noKartu match `PESERTA_MOCK`.
 * - 8 SEP berikutnya variasi suplesi/deleted/draft.
 *
 * Variant breakdown:
 * - 10 Issued (active) · 3 Closed · 2 Updated · 2 Suplesi · 2 Deleted · 1 Draft
 */

import type { SEPRecordExt } from "../bpjsShared";

interface SEPSeedOverride extends Partial<SEPRecordExt> {
  noSEP: string;
  noKartu: string;
  tglTerbit: string;
  poli: { tujuan: string; eksekutif: "0" | "1" };
  diagAwal: string;
  klsRawat: SEPRecordExt["klsRawat"];
  rujukan: SEPRecordExt["rujukan"];
}

const DEFAULT_AUDIT_USER = "operator.bpjs@rs-sakti.id";

/** Builder default — fill mandatory fields, allow per-entry override. */
function buildSEP(seed: SEPSeedOverride): SEPRecordExt {
  const tglTerbit = seed.tglTerbit;
  const masaBerlaku = seed.masaBerlaku ?? { from: tglTerbit, to: addDays(tglTerbit, 30) };
  const jenisRawat = seed.jenisRawat ?? "RI";
  const jnsPelayanan = seed.jnsPelayanan ?? (jenisRawat === "RI" ? "1" : "2");

  return {
    noSEP: seed.noSEP,
    noKartu: seed.noKartu,
    tglTerbit,
    masaBerlaku,
    jenisRawat,
    jnsPelayanan,
    ppkPelayanan: seed.ppkPelayanan ?? "0001R001",
    poli: seed.poli,
    klsRawat: seed.klsRawat,
    diagAwal: seed.diagAwal,
    diagAwalNama: seed.diagAwalNama,
    rujukan: seed.rujukan,
    // Rule 1: jnsPelayanan="1" (RANAP) → dpjpLayan kosong
    dpjpLayan: jnsPelayanan === "1" ? undefined : seed.dpjpLayan,
    statusInternal: seed.statusInternal ?? "Issued",
    audit: seed.audit ?? {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: `${tglTerbit}T08:00:00`,
    },
    kontrolKe: seed.kontrolKe,
    faskesRujukan: seed.faskesRujukan,
    catatan: seed.catatan,
    noMR: seed.noMR,
    noTelp: seed.noTelp,
    rencanaTindakLanjut: seed.rencanaTindakLanjut,
    catatanDiagnosaPertama: seed.catatanDiagnosaPertama,
    kelainanBawaan: seed.kelainanBawaan,
    cob: seed.cob,
    katarak: seed.katarak,
    jaminan: seed.jaminan,
    skdp: seed.skdp,
    tujuanKunj: seed.tujuanKunj,
    flagProcedure: seed.flagProcedure,
    kdPenunjang: seed.kdPenunjang,
    assesmentPel: seed.assesmentPel,
    tglPulang: seed.tglPulang,
  };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── 20 SEP Seed Entries ────────────────────────────────

export const SEP_MOCK: ReadonlyArray<SEPRecordExt> = [
  // ── 10 Issued (active, mapping ke PESERTA_MOCK 0-9) ──
  buildSEP({
    noSEP: "SEP-2026-0501-00012",
    noKartu: "0001234567891",
    tglTerbit: "2026-05-01",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "I21.0",
    diagAwalNama: "Acute Myocardial Infarction",
    rujukan: {
      asalRujukan: "1",
      tglRujukan: "2026-04-30",
      noRujukan: "RUJ/FKTP-Mawar/2026/05/0023",
      ppkRujukan: "0001P001",
    },
    noMR: "RM-2025-001",
    noTelp: "081234567001",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0503-00018",
    noKartu: "0001234567892",
    tglTerbit: "2026-05-03",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "OBG", eksekutif: "0" },
    diagAwal: "O82",
    diagAwalNama: "Single delivery by caesarean section",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-002",
    noTelp: "081234567002",
    tujuanKunj: "1",
    flagProcedure: "0",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0520-00060",
    noKartu: "0001234567893",
    tglTerbit: "2026-05-20",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "E11.9",
    diagAwalNama: "Type 2 diabetes mellitus, uncomplicated",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-003",
    noTelp: "081234567003",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0510-00033",
    noKartu: "0001234567894",
    tglTerbit: "2026-05-10",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "I10",
    diagAwalNama: "Essential (primary) hypertension",
    rujukan: { asalRujukan: "1" },
    jenisRawat: "RJ",
    jnsPelayanan: "2",
    dpjpLayan: "DR-001",
    noMR: "RM-2025-004",
    noTelp: "081234567004",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0515-00045",
    noKartu: "0001234567895",
    tglTerbit: "2026-05-15",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "BED", eksekutif: "0" },
    diagAwal: "K35.8",
    diagAwalNama: "Acute appendicitis, other",
    rujukan: {
      asalRujukan: "1",
      tglRujukan: "2026-05-13",
      noRujukan: "RUJ/FKTP-Sehat/2026/05/0060",
      ppkRujukan: "0001P010",
    },
    noMR: "RM-2025-005",
    noTelp: "081234567005",
    tujuanKunj: "1",
    flagProcedure: "0",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0512-00040",
    noKartu: "0001234567896",
    tglTerbit: "2026-05-12",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "MAT", eksekutif: "0" },
    diagAwal: "H25.9",
    diagAwalNama: "Senile cataract, unspecified",
    rujukan: { asalRujukan: "1" },
    jenisRawat: "RJ",
    jnsPelayanan: "2",
    dpjpLayan: "DR-008",
    katarak: { katarak: "1" },
    noMR: "RM-2025-006",
    noTelp: "081234567006",
    tujuanKunj: "1",
    flagProcedure: "1",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0521-00055",
    noKartu: "0001234567897",
    tglTerbit: "2026-05-21",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "ORT", eksekutif: "0" },
    diagAwal: "M17.0",
    diagAwalNama: "Bilateral primary osteoarthritis of knee",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-007",
    noTelp: "081234567007",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0506-00025",
    noKartu: "0001234567898",
    tglTerbit: "2026-05-06",
    klsRawat: { klsRawatHak: "2" },
    poli: { tujuan: "PAR", eksekutif: "0" },
    diagAwal: "J18.9",
    diagAwalNama: "Pneumonia, unspecified",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-008",
    noTelp: "081234567008",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0518-00050",
    noKartu: "0001234567899",
    tglTerbit: "2026-05-18",
    klsRawat: { klsRawatHak: "2" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "A09",
    diagAwalNama: "Diarrhoea and gastroenteritis",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-009",
    noTelp: "081234567009",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0525-00065",
    noKartu: "0001234567810",
    tglTerbit: "2026-05-25",
    klsRawat: {
      klsRawatHak: "1",
      // Naik kelas Kelas 1 → VIP (kode "2"), pembiayaan Pribadi (kode "1")
      klsRawatNaik: "2",
      pembiayaan: "1",
      penanggungJawab: "Pribadi",
    },
    poli: { tujuan: "JAN", eksekutif: "1" },
    diagAwal: "I50.0",
    diagAwalNama: "Congestive heart failure",
    rujukan: { asalRujukan: "1" },
    noMR: "RM-2025-010",
    noTelp: "081234567010",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),

  // ── 3 Closed (tgl pulang filled) ─────────────────────
  buildSEP({
    noSEP: "SEP-2026-0411-00990",
    noKartu: "0001234567891",
    tglTerbit: "2026-04-11",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "I20.9",
    diagAwalNama: "Angina pectoris, unspecified",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Closed",
    tglPulang: "2026-04-16",
    noMR: "RM-2025-001",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
    audit: {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: "2026-04-11T07:30:00",
      updatedBy: DEFAULT_AUDIT_USER,
      updatedAt: "2026-04-16T15:00:00",
    },
  }),
  buildSEP({
    noSEP: "SEP-2026-0415-00995",
    noKartu: "0001234567894",
    tglTerbit: "2026-04-15",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "I10",
    diagAwalNama: "Essential hypertension",
    rujukan: { asalRujukan: "1" },
    jenisRawat: "RJ",
    jnsPelayanan: "2",
    dpjpLayan: "DR-001",
    statusInternal: "Closed",
    tglPulang: "2026-04-18",
    noMR: "RM-2025-004",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
  buildSEP({
    noSEP: "SEP-2026-0420-01001",
    noKartu: "0001234567898",
    tglTerbit: "2026-04-20",
    klsRawat: { klsRawatHak: "2" },
    poli: { tujuan: "PAR", eksekutif: "0" },
    diagAwal: "J20.9",
    diagAwalNama: "Acute bronchitis, unspecified",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Closed",
    tglPulang: "2026-04-24",
    noMR: "RM-2025-008",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),

  // ── 2 Updated (tgl pulang updated post-discharge) ────
  buildSEP({
    noSEP: "SEP-2026-0428-01015",
    noKartu: "0001234567895",
    tglTerbit: "2026-04-28",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "BED", eksekutif: "0" },
    diagAwal: "K80.2",
    diagAwalNama: "Calculus of gallbladder without cholecystitis",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Updated",
    tglPulang: "2026-05-02",
    noMR: "RM-2025-005",
    tujuanKunj: "1",
    flagProcedure: "0",
    kdPenunjang: "",
    audit: {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: "2026-04-28T09:00:00",
      updatedBy: DEFAULT_AUDIT_USER,
      updatedAt: "2026-05-02T14:30:00",
    },
  }),
  buildSEP({
    noSEP: "SEP-2026-0501-01020",
    noKartu: "0001234567897",
    tglTerbit: "2026-05-01",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "ORT", eksekutif: "0" },
    diagAwal: "S82.1",
    diagAwalNama: "Fracture of upper end of tibia",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Updated",
    tglPulang: "2026-05-08",
    noMR: "RM-2025-007",
    tujuanKunj: "1",
    flagProcedure: "0",
    kdPenunjang: "",
    audit: {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: "2026-05-01T11:00:00",
      updatedBy: DEFAULT_AUDIT_USER,
      updatedAt: "2026-05-08T16:00:00",
    },
  }),

  // ── 2 Suplesi (laka lantas jasa raharja) ─────────────
  buildSEP({
    noSEP: "SEP-2026-0510-01030",
    noKartu: "0001234567899",
    tglTerbit: "2026-05-10",
    klsRawat: { klsRawatHak: "2" },
    poli: { tujuan: "IGD", eksekutif: "0" },
    diagAwal: "S06.0",
    diagAwalNama: "Concussion",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Suplesi",
    noMR: "RM-2025-009",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
    jaminan: {
      lakaLantas: "1",
      noLP: "LP/2026/V/0042/PMJ",
      penjamin: {
        tglKejadian: "2026-05-10",
        keterangan: "Laka lantas — kendaraan roda dua",
        suplesi: {
          suplesi: "1",
          noSepSuplesi: "SEP-2026-0510-01030",
          lokasiLaka: {
            kdPropinsi: "31",
            kdKabupaten: "3174",
            kdKecamatan: "317401",
          },
        },
      },
    },
  }),
  buildSEP({
    noSEP: "SEP-2026-0517-01045",
    noKartu: "0001234567812",
    tglTerbit: "2026-05-17",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "IGD", eksekutif: "0" },
    diagAwal: "S52.5",
    diagAwalNama: "Fracture of lower end of radius",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Suplesi",
    noMR: "RM-2025-012",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
    jaminan: {
      lakaLantas: "3", // KK only
      noLP: "LP/2026/V/0055/PMJ",
      penjamin: {
        tglKejadian: "2026-05-17",
        keterangan: "Laka kerja — terjatuh dari ketinggian",
        suplesi: { suplesi: "0" },
      },
    },
  }),

  // ── 2 Deleted (audit deletedAt) ──────────────────────
  buildSEP({
    noSEP: "SEP-2026-0405-00890",
    noKartu: "0001234567893",
    tglTerbit: "2026-04-05",
    klsRawat: { klsRawatHak: "3" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "R51",
    diagAwalNama: "Headache",
    rujukan: { asalRujukan: "1" },
    jenisRawat: "RJ",
    jnsPelayanan: "2",
    dpjpLayan: "DR-001",
    statusInternal: "Deleted",
    noMR: "RM-2025-003",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
    audit: {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: "2026-04-05T10:00:00",
      deletedBy: DEFAULT_AUDIT_USER,
      deletedAt: "2026-04-05T11:30:00",
    },
  }),
  buildSEP({
    noSEP: "SEP-2026-0410-00920",
    noKartu: "0001234567896",
    tglTerbit: "2026-04-10",
    klsRawat: { klsRawatHak: "1" },
    poli: { tujuan: "MAT", eksekutif: "0" },
    diagAwal: "H10.0",
    diagAwalNama: "Mucopurulent conjunctivitis",
    rujukan: { asalRujukan: "1" },
    jenisRawat: "RJ",
    jnsPelayanan: "2",
    dpjpLayan: "DR-008",
    statusInternal: "Deleted",
    noMR: "RM-2025-006",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
    audit: {
      createdBy: DEFAULT_AUDIT_USER,
      createdAt: "2026-04-10T09:00:00",
      deletedBy: "supervisor.bpjs@rs-sakti.id",
      deletedAt: "2026-04-10T13:45:00",
    },
  }),

  // ── 1 Draft (belum issued ke BPJS) ──────────────────
  buildSEP({
    noSEP: "SEP-DRAFT-2026-0528-001",
    noKartu: "0001234567811",
    tglTerbit: "2026-05-28",
    klsRawat: { klsRawatHak: "2" },
    poli: { tujuan: "INT", eksekutif: "0" },
    diagAwal: "E14.9",
    diagAwalNama: "Unspecified diabetes mellitus",
    rujukan: { asalRujukan: "1" },
    statusInternal: "Draft",
    noMR: "RM-2025-011",
    tujuanKunj: "0",
    flagProcedure: "",
    kdPenunjang: "",
  }),
];

// ── Lookup Helpers ─────────────────────────────────────

export function findSEPByNo(noSEP: string): SEPRecordExt | undefined {
  return SEP_MOCK.find((s) => s.noSEP === noSEP);
}

export function findSEPsByKartu(noKartu: string): SEPRecordExt[] {
  return SEP_MOCK.filter((s) => s.noKartu === noKartu);
}

export function filterSEPByStatus(
  status: SEPRecordExt["statusInternal"],
): SEPRecordExt[] {
  return SEP_MOCK.filter((s) => s.statusInternal === status);
}
