/**
 * Claim Mock Factory (EK0.2 · internal).
 *
 * Helpers + `buildClaim()` factory untuk generate `ClaimRecord` mock dengan
 * sensible defaults. Dipakai oleh `claimsMock.ts` (entries) supaya tiap entry
 * cukup spesifikasi essential params (~25 baris per entry, bukan 50+).
 *
 * Internal — caller di luar mock layer harusnya consume `CLAIM_BOARD_MOCK`
 * langsung, bukan factory ini.
 */

import type {
  ClaimRecord,
  ClaimStatus,
  ClaimTimelineEntry,
  EraGrouper,
  Gender,
  iDRGResult,
  InaCbgLegacyResult,
  KelasRawat,
  KodeICD10IM,
  KodeICD9CMIM,
  Penjamin,
  Rupiah,
  SEPRecord,
  TingkatKompetensiRS,
  TipePelayanan,
  TipePenjamin,
} from "./eklaimShared";
import { findICD10IM, findICD9CMIM } from "./icdIMMock";
import { findIDRG } from "./iDRGLookupMock";
import { findInaCbgLegacy } from "./inaCbgLegacyMock";
import { getBerkasTemplate, instansiBerkasFromTemplate } from "./berkasTemplatesMock";

// ── Lookup Helpers ─────────────────────────────────────

function icd10(kode: string): KodeICD10IM {
  const entry = findICD10IM(kode);
  if (!entry) throw new Error(`ICD-10-IM ${kode} not in ICD10_IM_MOCK`);
  return entry;
}

function icd9(kode: string): KodeICD9CMIM {
  const entry = findICD9CMIM(kode);
  if (!entry) throw new Error(`ICD-9-CM-IM ${kode} not in ICD9_CM_IM_MOCK`);
  return entry;
}

function resolveIDRG(
  code: string,
  severity: 1 | 2 | 3,
  tingkatKompetensiRS: TingkatKompetensiRS,
  timestampGroup: string,
): iDRGResult {
  const entry = findIDRG(code);
  if (!entry) throw new Error(`iDRG ${code} not in IDRG_LOOKUP_MOCK`);
  const sev = entry.severityLevels[severity];
  return {
    code,
    mdc: entry.mdc,
    group: entry.group,
    severity: { level: severity, label: sev.label, ccList: [], mccList: [] },
    tarifAktual: sev.tarifPerTingkat[tingkatKompetensiRS],
    tarifPerTingkat: sev.tarifPerTingkat,
    topUpCmg: [],
    versiGrouper: entry.versiGrouper,
    timestampGroup,
    sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes",
  };
}

function resolveInaCbg(code: string, timestampGroup: string): InaCbgLegacyResult {
  const entry = findInaCbgLegacy(code);
  if (!entry) throw new Error(`INA-CBG ${code} not in INA_CBG_LEGACY_MOCK`);
  return { ...entry, timestampGroup };
}

function makeSEP(opts: {
  noSEP: string;
  noKartu: string;
  tglTerbit: string;
  jenisRawat: "RI" | "RJ";
  faskesRujukan?: string;
}): SEPRecord {
  const tglFrom = opts.tglTerbit;
  const tglTo = `${tglFrom.slice(0, 7)}-${String(Number(tglFrom.slice(8, 10)) + 30).padStart(2, "0")}`;
  return {
    noSEP: opts.noSEP,
    noKartu: opts.noKartu,
    tglTerbit: opts.tglTerbit,
    masaBerlaku: { from: tglFrom, to: tglTo },
    faskesRujukan: opts.faskesRujukan,
    jenisRawat: opts.jenisRawat,
  };
}

/**
 * Generate minimal timeline berdasarkan status klaim.
 * Append-only — events sesuai tahap yang sudah dilewati.
 */
function makeTimeline(opts: {
  createdAt: string;
  createdBy: string;
  status: ClaimStatus;
  submittedAt?: string;
  submittedBy?: string;
  batchId?: string;
  verifierBpjs?: string;
  paidAt?: string;
  paidAmount?: Rupiah;
}): ClaimTimelineEntry[] {
  const entries: ClaimTimelineEntry[] = [
    { type: "claim-created", by: opts.createdBy, at: opts.createdAt },
  ];

  if (opts.status === "Draft Coding") return entries;

  if (opts.submittedAt && opts.submittedBy && opts.batchId) {
    entries.push({
      type: "submitted-batch",
      batchId: opts.batchId,
      vClaimResponse: { ok: true, noKlaim: "auto-generated" },
      by: opts.submittedBy,
      at: opts.submittedAt,
    });
  }

  if (
    opts.status === "Approved" ||
    opts.status === "Paid" ||
    opts.status === "Rejected" ||
    opts.status === "Susulan Required"
  ) {
    const verifAt = opts.submittedAt ?? opts.createdAt;
    entries.push({
      type: "status-transition",
      from: "Pending Verifikasi",
      to: opts.status,
      by: opts.verifierBpjs ?? "Verifikator BPJS",
      at: verifAt,
    });
  }

  if (opts.status === "Paid" && opts.paidAt && opts.paidAmount !== undefined) {
    entries.push({
      type: "payment-received",
      nominal: opts.paidAmount,
      reconciliationId: "RECON-AUTO",
      by: "Sistem Reconciliation",
      at: opts.paidAt,
    });
  }

  return entries;
}

// ── Factory Input + Builder ────────────────────────────

export interface BuildClaimInput {
  no: number;
  pasien: { id: string; nama: string; age: number; gender: Gender };
  unit: TipePelayanan;
  penjaminTipe: TipePenjamin;
  penjaminNama: string;
  noSEP?: string;
  noKartu?: string;
  noRujukan?: string;
  faskesRujukan?: string;
  kelas: KelasRawat;
  isKRIS: boolean;
  tingkatKompetensiRS: TingkatKompetensiRS;
  eraGrouper: EraGrouper;
  iDRGCode?: string;
  iDRGSeverity?: 1 | 2 | 3;
  inaCbgCode?: string;
  diagPrimerICD: string;
  diagSekunderICDs?: string[];
  tindakanICDs?: string[];
  caraPulang: ClaimRecord["caraPulang"];
  los: number;
  status: ClaimStatus;
  tarifRS: Rupiah;
  approvedAmount?: Rupiah;
  paidAmount?: Rupiah;
  rejectionReason?: string;
  bandingCount?: number;
  createdAt: string;
  submittedAt?: string;
  verifierBpjs?: string;
  verifierComment?: string;
  paidAt?: string;
  kunjunganId: string;
  invoiceId: string;
}

export function buildClaim(input: BuildClaimInput): ClaimRecord {
  const id = `CLM-2026-05-${String(input.no).padStart(3, "0")}`;
  const noKlaim = input.submittedAt
    ? `KLM/${input.penjaminTipe.toUpperCase()}/2026/05/${String(input.no).padStart(5, "0")}`
    : `DRAFT-${id}`;

  const sep =
    input.noSEP && input.noKartu
      ? makeSEP({
          noSEP: input.noSEP,
          noKartu: input.noKartu,
          tglTerbit: input.createdAt.slice(0, 10),
          jenisRawat: input.unit === "RJ" || input.unit === "SameDay" ? "RJ" : "RI",
          faskesRujukan: input.faskesRujukan,
        })
      : undefined;

  const penjamin: Penjamin = {
    tipe: input.penjaminTipe,
    nama: input.penjaminNama,
    sep,
    noRujukan: input.noRujukan,
  };

  const timestampGroup = input.submittedAt ?? input.createdAt;
  const iDRG =
    input.eraGrouper === "iDRG" && input.iDRGCode && input.iDRGSeverity
      ? resolveIDRG(input.iDRGCode, input.iDRGSeverity, input.tingkatKompetensiRS, timestampGroup)
      : undefined;
  const inaCbgLegacy =
    input.eraGrouper === "INA_CBG_Legacy" && input.inaCbgCode
      ? resolveInaCbg(input.inaCbgCode, timestampGroup)
      : undefined;

  const tarifGrouper = iDRG?.tarifAktual ?? inaCbgLegacy?.tarif.kelas2 ?? 0n;
  const selisih = tarifGrouper - input.tarifRS;

  const batchId = input.submittedAt
    ? `BATCH-${input.submittedAt.slice(0, 7).replace("-", "")}-${input.penjaminTipe.toUpperCase()}`
    : undefined;

  const template = getBerkasTemplate(input.penjaminTipe, input.unit);
  const berkas = instansiBerkasFromTemplate(template, id).map((b) =>
    input.status !== "Draft Coding" ? { ...b, status: "Siap" as const } : b,
  );

  return {
    id,
    noKlaim,
    invoiceId: input.invoiceId,
    kunjunganId: input.kunjunganId,
    pasienId: input.pasien.id,
    penjamin,
    eraGrouper: input.eraGrouper,
    tipePelayanan: input.unit,
    caraPulang: input.caraPulang,
    diagnosaPrimer: icd10(input.diagPrimerICD),
    diagnosaSekunder: (input.diagSekunderICDs ?? []).map(icd10),
    tindakanProsedur: (input.tindakanICDs ?? []).map(icd9),
    kelas: input.kelas,
    isKRIS: input.isKRIS,
    tingkatKompetensiRS: input.tingkatKompetensiRS,
    los: input.los,
    age: input.pasien.age,
    gender: input.pasien.gender,
    iDRG,
    inaCbgLegacy,
    tarifRS: input.tarifRS,
    selisih,
    statusPenjamin: input.status,
    submittedAt: input.submittedAt,
    submittedBy: input.submittedAt ? "Susi (Tim Klaim)" : undefined,
    batchId,
    verifierBpjs: input.verifierBpjs,
    verifierComment: input.verifierComment,
    approvedAmount: input.approvedAmount,
    paidAmount: input.paidAmount,
    paidAt: input.paidAt,
    rejectionReason: input.rejectionReason,
    bandingCount: input.bandingCount,
    berkas,
    timeline: makeTimeline({
      createdAt: input.createdAt,
      createdBy: "Anita (Coder)",
      status: input.status,
      submittedAt: input.submittedAt,
      submittedBy: input.submittedAt ? "Susi (Tim Klaim)" : undefined,
      batchId,
      verifierBpjs: input.verifierBpjs,
      paidAt: input.paidAt,
      paidAmount: input.paidAmount,
    }),
    optimisticLock: {
      version: 1,
      updatedBy: input.submittedAt ? "Susi (Tim Klaim)" : "Anita (Coder)",
      updatedAt: input.submittedAt ?? input.createdAt,
    },
    createdBy: "Anita (Coder)",
    createdAt: input.createdAt,
    updatedAt: input.submittedAt ?? input.createdAt,
  };
}
