/**
 * Rencana Kontrol Mock (BP0.3).
 *
 * 10 RK Kontrol (pasca RJ) + 5 SPRI (jadwal masuk RI) lintas status.
 *
 * Cross-link: `noSEPAsal` mirror entry-entry SEP_MOCK (status Closed/Updated
 * agar valid "pasca RJ"). 5 SPRI mirror peserta dengan rencana admisi.
 *
 * Status distribusi:
 * - Issued (active, future tglRencana) — 8 entry
 * - Used (sudah datang) — 4 entry
 * - Expired (lewat tglRencana, tidak datang) — 2 entry
 * - Cancelled (dibatalkan) — 1 entry
 */

import type { RencanaKontrolRecord } from "../bpjsShared";

const DEFAULT_USER = "operator.bpjs@rs-sakti.id";

function build(
  override: Partial<RencanaKontrolRecord> & {
    noSurat: string;
    jenis: RencanaKontrolRecord["jenis"];
    tipeKontrol: RencanaKontrolRecord["tipeKontrol"];
    noSEPAsal: string;
    tglRencana: string;
    poli: { kode: string; nama: string };
    dokter: { kode: string; nama: string };
  },
): RencanaKontrolRecord {
  return {
    keterangan: override.keterangan,
    status: override.status ?? "Issued",
    audit: override.audit ?? {
      createdBy: DEFAULT_USER,
      createdAt: `${override.tglRencana}T08:00:00`,
    },
    ...override,
  };
}

// ── 10 RK Kontrol (jenis=Kontrol, tipeKontrol="1") ─────

const RK_KONTROL: RencanaKontrolRecord[] = [
  build({
    noSurat: "RK/2026/05/0012",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0510-00033",
    tglRencana: "2026-06-10",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    dokter: { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
    keterangan: "Kontrol HT + cek HbA1c",
  }),
  build({
    noSurat: "RK/2026/05/0018",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0415-00995",
    tglRencana: "2026-05-29",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    dokter: { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
    keterangan: "Kontrol TD pasca rawat",
    status: "Used",
  }),
  build({
    noSurat: "RK/2026/05/0023",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0512-00040",
    tglRencana: "2026-06-15",
    poli: { kode: "MAT", nama: "Mata" },
    dokter: { kode: "DR-008", nama: "dr. Dewi Anggraini, Sp.M" },
    keterangan: "Pre-operasi katarak: A-scan + biometri IOL",
  }),
  build({
    noSurat: "RK/2026/05/0031",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0501-01020",
    tglRencana: "2026-05-22",
    poli: { kode: "ORT", nama: "Ortopedi" },
    dokter: { kode: "DR-011", nama: "dr. Hendra Wijaya, Sp.OT" },
    keterangan: "Lepas alat fiksasi eksterna tibia",
    status: "Used",
  }),
  build({
    noSurat: "RK/2026/05/0042",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0420-01001",
    tglRencana: "2026-05-15",
    poli: { kode: "PAR", nama: "Paru" },
    dokter: { kode: "DR-007", nama: "dr. Rini Kusumawati, Sp.P" },
    keterangan: "Evaluasi rontgen thorax pasca bronkitis",
    status: "Expired",
  }),
  build({
    noSurat: "RK/2026/05/0055",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0411-00990",
    tglRencana: "2026-05-23",
    poli: { kode: "JAN", nama: "Jantung" },
    dokter: { kode: "DR-003", nama: "dr. Andi Wijaya, Sp.JP" },
    keterangan: "EKG + Echo follow-up pasca IMA",
    status: "Used",
  }),
  build({
    noSurat: "RK/2026/05/0063",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0428-01015",
    tglRencana: "2026-06-05",
    poli: { kode: "BED", nama: "Bedah" },
    dokter: { kode: "DR-005", nama: "dr. Surya Adi, Sp.B" },
    keterangan: "Kontrol luka post-cholecystectomy",
  }),
  build({
    noSurat: "RK/2026/05/0078",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0510-00033",
    tglRencana: "2026-06-20",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    dokter: { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
    keterangan: "Kontrol DM + edukasi diet",
  }),
  build({
    noSurat: "RK/2026/05/0089",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0506-00025",
    tglRencana: "2026-06-12",
    poli: { kode: "PAR", nama: "Paru" },
    dokter: { kode: "DR-007", nama: "dr. Rini Kusumawati, Sp.P" },
    keterangan: "Spirometri follow-up",
  }),
  build({
    noSurat: "RK/2026/05/0095",
    jenis: "Kontrol",
    tipeKontrol: "1",
    noSEPAsal: "SEP-2026-0510-00033",
    tglRencana: "2026-05-30",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    dokter: { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
    keterangan: "Dibatalkan — pasien rawat inap mendadak",
    status: "Cancelled",
  }),
];

// ── 5 SPRI (jenis=SPRI, tipeKontrol="2") ───────────────

const SPRI_ENTRIES: RencanaKontrolRecord[] = [
  build({
    noSurat: "SPRI/2026/05/0011",
    jenis: "SPRI",
    tipeKontrol: "2",
    noSEPAsal: "SEP-2026-0520-00060",
    tglRencana: "2026-06-02",
    poli: { kode: "INT", nama: "Penyakit Dalam" },
    dokter: { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
    keterangan: "Rencana masuk RI untuk hemodialisa elektif",
  }),
  build({
    noSurat: "SPRI/2026/05/0017",
    jenis: "SPRI",
    tipeKontrol: "2",
    noSEPAsal: "SEP-2026-0515-00045",
    tglRencana: "2026-05-28",
    poli: { kode: "BED", nama: "Bedah" },
    dokter: { kode: "DR-005", nama: "dr. Surya Adi, Sp.B" },
    keterangan: "Rencana apendektomi elektif",
    status: "Used",
  }),
  build({
    noSurat: "SPRI/2026/05/0024",
    jenis: "SPRI",
    tipeKontrol: "2",
    noSEPAsal: "SEP-2026-0512-00040",
    tglRencana: "2026-06-20",
    poli: { kode: "MAT", nama: "Mata" },
    dokter: { kode: "DR-008", nama: "dr. Dewi Anggraini, Sp.M" },
    keterangan: "Operasi katarak ECCE + IOL (SDD)",
  }),
  build({
    noSurat: "SPRI/2026/05/0031",
    jenis: "SPRI",
    tipeKontrol: "2",
    noSEPAsal: "SEP-2026-0521-00055",
    tglRencana: "2026-06-08",
    poli: { kode: "ORT", nama: "Ortopedi" },
    dokter: { kode: "DR-011", nama: "dr. Hendra Wijaya, Sp.OT" },
    keterangan: "Rencana TKR (Total Knee Replacement)",
  }),
  build({
    noSurat: "SPRI/2026/05/0040",
    jenis: "SPRI",
    tipeKontrol: "2",
    noSEPAsal: "SEP-2026-0525-00065",
    tglRencana: "2026-06-05",
    poli: { kode: "JAN", nama: "Jantung" },
    dokter: { kode: "DR-003", nama: "dr. Andi Wijaya, Sp.JP" },
    keterangan: "Rencana cath lab elektif",
  }),
];

export const RENCANA_KONTROL_MOCK: ReadonlyArray<RencanaKontrolRecord> = [
  ...RK_KONTROL,
  ...SPRI_ENTRIES,
];

// ── Lookup Helpers ─────────────────────────────────────

export function findRKByNoSurat(noSurat: string): RencanaKontrolRecord | undefined {
  return RENCANA_KONTROL_MOCK.find((rk) => rk.noSurat === noSurat);
}

export function findRKsBySEP(noSEP: string): RencanaKontrolRecord[] {
  return RENCANA_KONTROL_MOCK.filter((rk) => rk.noSEPAsal === noSEP);
}

export function filterRKByPeriode(
  tglAwal: string,
  tglAkhir: string,
  jenis?: RencanaKontrolRecord["jenis"],
): RencanaKontrolRecord[] {
  return RENCANA_KONTROL_MOCK.filter((rk) => {
    if (rk.tglRencana < tglAwal || rk.tglRencana > tglAkhir) return false;
    if (jenis && rk.jenis !== jenis) return false;
    return true;
  });
}
