/**
 * E-Klaim Shared Types — single source of truth untuk modul `/ehis-eklaim`.
 *
 * Pivot 2026-05-26: iDRG primary (resmi 1 Okt 2025 Kemenkes), INA-CBG active
 * secondary (industri SIMRS dual support · transisi phased). Field `eraGrouper`
 * di `ClaimRecord` routing antara `iDRGGrouperAdapter` dan `inaCbgLegacyAdapter`.
 *
 * Konvensi:
 * - Rupiah: `bigint` bulat (tanpa sen subdivision — sesuai akuntansi RS Indonesia).
 * - Date/datetime: ISO 8601 string.
 * - Status code (enum) terpisah dari label (mutable) — `CLAIM_STATUS_LABEL`.
 *
 * Reference: TODO-EKLAIM.md § EK0.1 · Pedoman Pengodean iDRG 2025 Kemenkes
 * · Perpres 59/2024 · PMK 26/2021 · PMK 27/2017 · UU PDP 27/2022.
 */

// ── Money ───────────────────────────────────────────────

/**
 * Nominal rupiah disimpan sebagai bigint bulat (tanpa sen).
 * Hindari `number` (floating-point drift untuk klaim ratusan juta).
 * Helpers konversi: `src/lib/eklaim/money.ts` (EK0.3).
 */
export type Rupiah = bigint;

// ── Result<T, E> ───────────────────────────────────────

/**
 * Discriminated union untuk operasi yang bisa fail.
 * Pakai di adapter response — lebih safe daripada throw.
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Constructor untuk success path. */
export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Constructor untuk failure path. */
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ── Error Taxonomy ─────────────────────────────────────

export type ClaimError =
  | { type: "NetworkError"; message: string; retryable: boolean }
  | { type: "AuthError"; message: string }
  | { type: "ValidationError"; field: string; message: string }
  | {
      type: "EligibilityError";
      reason:
        | "SEP_EXPIRED"
        | "KELAS_NOT_COVERED"
        | "PLAFON_HABIS"
        | "NIK_NOT_FOUND"
        | "FASKES_TIDAK_KOMPETEN";
    }
  | { type: "DuplicateClaimError"; existingClaimId: string }
  | { type: "GrouperError"; message: string; raw?: unknown }
  | { type: "ConcurrencyError"; currentVersion: number; attemptedVersion: number };

// ── Domain Enums ───────────────────────────────────────

export type TipePenjamin = "bpjs" | "asuransi" | "jamkesda";

export type EraGrouper = "iDRG" | "INA_CBG_Legacy";

export type TipePelayanan = "RI" | "RJ" | "SameDay";

export type CaraPulang = "Sembuh" | "PulangAPS" | "Rujuk" | "Meninggal";

export type Gender = "L" | "P";

/**
 * Kelas rawat pasien.
 * - `KRIS`: default post-Okt 2025 (Perpres 59/2024 · Juli 2025 impl).
 * - `VIP/Kelas_1/Kelas_2/Kelas_3`: legacy INA-CBG (pre-Okt 2025).
 * - `ICU/HCU/Isolasi`: intensive care (tetap — beda dimensi kelas).
 */
export type KelasRawat =
  | "KRIS"
  | "VIP"
  | "Kelas_1"
  | "Kelas_2"
  | "Kelas_3"
  | "ICU"
  | "HCU"
  | "Isolasi";

/**
 * Tingkat kompetensi RS (Perpres 59/2024).
 * Menggantikan tipe RS A/B/C/D yang lama. Jadi basis tarif iDRG.
 */
export type TingkatKompetensiRS = "dasar" | "menengah" | "utama" | "komprehensif";

// ── Claim Status (13 state machine) ────────────────────

/**
 * Granular status klaim. Transition rules di `src/lib/eklaim/stateMachine.ts` (EK0.3).
 *
 * `Susulan Required` = BPJS minta berkas tambahan (distinct dari Rejected).
 * `Sengketa` = Approved nominal beda dari expected (sebelum write-off).
 */
export type ClaimStatus =
  | "Draft Coding"
  | "Belum Submit"
  | "Submitted"
  | "Pending Verifikasi"
  | "Susulan Required"
  | "Approved"
  | "Rejected"
  | "Banding Submitted"
  | "Banding Approved"
  | "Banding Rejected"
  | "Sengketa"
  | "Paid"
  | "Write-off";

/** Label terlokalisasi untuk display — terpisah dari code agar rename UX tidak rusak data. */
export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  "Draft Coding": "Draft Koding",
  "Belum Submit": "Belum Submit",
  "Submitted": "Submitted",
  "Pending Verifikasi": "Pending Verifikasi",
  "Susulan Required": "Butuh Berkas Susulan",
  "Approved": "Disetujui",
  "Rejected": "Ditolak",
  "Banding Submitted": "Banding Diajukan",
  "Banding Approved": "Banding Disetujui",
  "Banding Rejected": "Banding Ditolak",
  "Sengketa": "Sengketa",
  "Paid": "Dibayar",
  "Write-off": "Write-off",
};

// ── ICD (Indonesian Modification) ──────────────────────

/**
 * Kode ICD-10 versi Indonesian Modification.
 * Sumber: Pedoman Pengodean iDRG 2025 Kemenkes — BUKAN ICD-10 WHO standar.
 */
export interface KodeICD10IM {
  kode: string;
  deskripsi: string;
  kategori: string;
  hint?: string;
  versiIM: string;
  deprecated?: boolean;
  /** Flag CC/MCC PPI per PMK 27/2017 — diagnosis acquired in hospital. */
  hospitalAcquired?: boolean;
}

/**
 * Kode ICD-9-CM versi Indonesian Modification (prosedur/tindakan).
 * Sumber: Pedoman Pengodean iDRG 2025 Kemenkes.
 */
export interface KodeICD9CMIM {
  kode: string;
  deskripsi: string;
  kategori: string;
  hint?: string;
  versiIM: string;
  deprecated?: boolean;
}

// ── SEP (Surat Eligibilitas Pasien) ────────────────────

/**
 * SEP record dari V-Claim BPJS — rich struct (bukan string flat).
 * Match spek V-Claim API: noKartu 13-digit, jenisRawat per pelayanan.
 */
export interface SEPRecord {
  noSEP: string;
  /** 13-digit BPJS card number. */
  noKartu: string;
  tglTerbit: string;
  masaBerlaku: { from: string; to: string };
  kontrolKe?: number;
  faskesRujukan?: string;
  jenisRawat: "RI" | "RJ";
}

// ── Berkas Klaim ───────────────────────────────────────

export type BerkasKategori =
  | "SEP"
  | "ResumeMedis"
  | "Tindakan"
  | "Lab"
  | "Rad"
  | "Identitas"
  | "Rujukan"
  | "Billing"
  | "Grouper"
  | "Khusus";

export type BerkasStatus = "Belum" | "Siap" | "Tidak Berlaku" | "Reject Verifikator";

/** Versioning append-only — hard requirement UU PDP 27/2022 integrity audit. */
export interface BerkasVersion {
  versionNumber: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  replacedReason?: string;
}

export interface BerkasFile {
  url: string;
  mimeType: string;
  sizeBytes: number;
  /** SHA-256 untuk audit integrity. */
  hash: string;
  versions: ReadonlyArray<BerkasVersion>;
}

/** Sumber berkas — diskriminator antara upload manual vs auto-pull dari modul lain. */
export type BerkasSumber =
  | { type: "upload-manual" }
  | {
      type: "auto-pull";
      sumberType: "discharge" | "lab-order" | "rad-order" | "billing";
      id: string;
    };

export interface BerkasKlaim {
  id: string;
  kategori: BerkasKategori;
  nama: string;
  wajib: boolean;
  status: BerkasStatus;
  file?: BerkasFile;
  sumber: BerkasSumber;
  uploadedBy?: string;
  uploadedAt?: string;
  catatan?: string;
  /** Wajib jika `status === "Reject Verifikator"`. */
  rejectReason?: string;
}

// ── Grouper Results (iDRG + Legacy) ────────────────────

/** Severity iDRG 3-level dengan CC/MCC list eksplisit (ICS v1 standard). */
export interface iDRGSeverity {
  level: 1 | 2 | 3;
  label: "Ringan" | "Sedang" | "Berat";
  ccList: ReadonlyArray<string>;
  mccList: ReadonlyArray<string>;
}

/** Tarif iDRG per tingkat kompetensi RS (Perpres 59/2024). */
export interface TarifPerTingkat {
  dasar: Rupiah;
  menengah: Rupiah;
  utama: Rupiah;
  komprehensif: Rupiah;
}

export interface TopUpCmg {
  eligible: boolean;
  alasan: string;
  nominal: Rupiah;
}

/**
 * PRIMARY grouper result — iDRG (post-Okt 2025).
 * Kode 7-digit numerik · ICS v1 severity · tarif per tingkat kompetensi.
 */
export interface iDRGResult {
  /** Kode 7-digit numerik (e.g. "1234567"). */
  code: string;
  /** Major Diagnostic Category. */
  mdc: string;
  group: string;
  severity: iDRGSeverity;
  /** Tarif terpilih berdasarkan `tingkatKompetensiRS` di ClaimRecord. */
  tarifAktual: Rupiah;
  /** Semua tarif per tingkat — untuk display table di EK3.4. */
  tarifPerTingkat: TarifPerTingkat;
  topUpCmg: ReadonlyArray<TopUpCmg>;
  /** e.g. "iDRG_v1.0_2025". */
  versiGrouper: string;
  /** ISO timestamp response grouper. */
  timestampGroup: string;
  sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes";
}

/**
 * LEGACY grouper result — INA-CBG (active secondary).
 * Kode 4-digit alphanumeric · severity I/II/III · tarif per kelas pasien.
 */
export interface InaCbgLegacyResult {
  /** Kode 4-digit alphanumeric (e.g. "I-1-01-I"). */
  code: string;
  group: string;
  severity: 1 | 2 | 3;
  tarif: {
    kelas3: Rupiah;
    kelas2: Rupiah;
    kelas1: Rupiah;
    vip: Rupiah;
  };
  /** e.g. "INA-CBG_v6.2" atau "INA-CBG_v5.9". */
  versiGrouper: string;
  /** ISO timestamp response grouper. */
  timestampGroup: string;
}

/** Lookup table entry untuk `IDRG_LOOKUP_MOCK` (EK0.2). */
export interface iDRGLookupEntry {
  code: string;
  mdc: string;
  group: string;
  severityLevels: {
    1: { label: "Ringan"; tarifPerTingkat: TarifPerTingkat };
    2: { label: "Sedang"; tarifPerTingkat: TarifPerTingkat };
    3: { label: "Berat"; tarifPerTingkat: TarifPerTingkat };
  };
  icd10IMList: ReadonlyArray<string>;
  icd9CMIMList: ReadonlyArray<string>;
  versiGrouper: string;
}

// ── Timeline (Audit Trail) ─────────────────────────────

/**
 * Audit trail event — discriminated union per type.
 * Per UU PDP 27/2022 + PMK 269/2008 integrity requirement.
 *
 * Append-only di `ClaimRecord.timeline`. Generate via `auditTrail.ts` (EK0.3).
 */
export type ClaimTimelineEntry =
  | { type: "claim-created"; by: string; at: string }
  | {
      type: "coding-changed";
      before: {
        primer: string;
        sekunder: ReadonlyArray<string>;
        prosedur: ReadonlyArray<string>;
      };
      after: {
        primer: string;
        sekunder: ReadonlyArray<string>;
        prosedur: ReadonlyArray<string>;
      };
      by: string;
      at: string;
    }
  | {
      type: "berkas-uploaded";
      berkasId: string;
      kategori: BerkasKategori;
      sumber: BerkasSumber;
      by: string;
      at: string;
    }
  | {
      type: "berkas-rejected";
      berkasId: string;
      alasan: string;
      by: string;
      at: string;
    }
  | {
      type: "grouper-resolved";
      eraGrouper: EraGrouper;
      result: iDRGResult | InaCbgLegacyResult;
      by: string;
      at: string;
    }
  | {
      type: "status-transition";
      from: ClaimStatus;
      to: ClaimStatus;
      alasan?: string;
      by: string;
      at: string;
    }
  | {
      type: "submitted-batch";
      batchId: string;
      vClaimResponse: unknown;
      by: string;
      at: string;
    }
  | { type: "verifikator-comment"; komentar: string; by: string; at: string }
  | {
      type: "banding-submitted";
      bandingId: string;
      tingkat: 1 | 2;
      by: string;
      at: string;
    }
  | {
      type: "payment-received";
      nominal: Rupiah;
      reconciliationId: string;
      by: string;
      at: string;
    };

// ── Banding ────────────────────────────────────────────

export type BandingStatus = "Submitted" | "Review" | "Approved" | "Rejected";

/**
 * Banding 2-tingkat per PMK 26/2021.
 * - Tingkat 1: verifikator BPJS cabang.
 * - Tingkat 2: kantor pusat (escalation jika tingkat 1 rejected).
 */
export interface BandingRecord {
  id: string;
  claimId: string;
  tingkat: 1 | 2;
  alasanRejectionAsli: string;
  alasanBanding: string;
  dokumenPendukung: ReadonlyArray<BerkasKlaim>;
  submittedAt: string;
  submittedBy: string;
  status: BandingStatus;
  reviewerBpjs?: string;
  reviewedAt?: string;
  hasilBanding?: string;
}

// ── Reconciliation ─────────────────────────────────────

export type SelisihStatus = "Write-off" | "Refund" | "Pending";

export interface ReconciliationMatch {
  claimId: string;
  amount: Rupiah;
  autoMatched: boolean;
  /** 0-1 — 1.0 = exact, lower = fuzzy match. */
  matchingConfidence: number;
  /** Free text reason untuk audit trail. */
  matchingReason: string;
  matchedBy?: string;
  matchedAt?: string;
}

export interface ReconciliationRecord {
  id: string;
  noTransfer: string;
  tanggalTransfer: string;
  nominalTransfer: Rupiah;
  bank: string;
  penjaminId: string;
  /** Periode klaim format "YYYY-MM" (e.g. "2026-05"). */
  periodeKlaim: string;
  matchedClaims: ReadonlyArray<ReconciliationMatch>;
  selisih?: Rupiah;
  statusSelisih?: SelisihStatus;
  completedAt?: string;
  completedBy?: string;
}

// ── Concurrency ────────────────────────────────────────

/** Optimistic concurrency control — bump `version` setiap mutate. */
export interface OptimisticLock {
  version: number;
  updatedBy: string;
  updatedAt: string;
}

/** Soft-lock untuk multi-coder edit safety — TTL 15 menit default. */
export interface SoftLock {
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
}

// ── Penjamin ───────────────────────────────────────────

export interface Penjamin {
  tipe: TipePenjamin;
  nama: string;
  sep?: SEPRecord;
  /** Wajib untuk BPJS non-emergency. */
  noRujukan?: string;
}

// ── Claim Record (entity utama) ────────────────────────

/**
 * Source of truth klaim — di-host di modul `/ehis-eklaim`.
 * Modul billing read-only via `claimReadCache.getClaimStatusForInvoice`.
 *
 * Field `eraGrouper` routing: iDRG (primary) vs INA-CBG Legacy (secondary).
 * Tepat satu dari `iDRG?` atau `inaCbgLegacy?` populated sesuai era.
 */
export interface ClaimRecord {
  id: string;
  noKlaim: string;
  invoiceId: string;
  kunjunganId: string;
  pasienId: string;
  penjamin: Penjamin;

  // Era routing
  eraGrouper: EraGrouper;
  tipePelayanan: TipePelayanan;
  caraPulang: CaraPulang;

  // Koding (ICD-10-IM + ICD-9-CM-IM sesuai ICS v1)
  diagnosaPrimer: KodeICD10IM;
  diagnosaSekunder: ReadonlyArray<KodeICD10IM>;
  tindakanProsedur: ReadonlyArray<KodeICD9CMIM>;

  // Kelas & kompetensi RS
  kelas: KelasRawat;
  isKRIS: boolean;
  tingkatKompetensiRS: TingkatKompetensiRS;
  los: number;
  age: number;
  gender: Gender;

  // Grouper result (mutually exclusive via eraGrouper)
  iDRG?: iDRGResult;
  inaCbgLegacy?: InaCbgLegacyResult;

  // Tarif & selisih
  tarifRS: Rupiah;
  /** Computed: tarif grouper - tarifRS (positif = RS untung, negatif = rugi). */
  selisih?: Rupiah;

  // Status
  statusPenjamin: ClaimStatus;

  // Submission
  submittedAt?: string;
  submittedBy?: string;
  batchId?: string;

  // Verifikasi BPJS
  verifierBpjs?: string;
  verifierComment?: string;

  // Pembayaran
  approvedAmount?: Rupiah;
  paidAmount?: Rupiah;
  paidAt?: string;

  // Rejection / banding
  rejectionReason?: string;
  bandingCount?: number;

  // Berkas + audit
  berkas: ReadonlyArray<BerkasKlaim>;
  timeline: ReadonlyArray<ClaimTimelineEntry>;

  // Concurrency
  optimisticLock: OptimisticLock;
  softLock?: SoftLock;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Coder Shift (scaffold — implementation di EK8.4) ──

/** Tracking produktivitas coder per shift. Type-only scaffold di EK0.1. */
export interface CoderShift {
  id: string;
  coderId: string;
  startedAt: string;
  endedAt?: string;
  klaimKodedCount?: number;
  averageMinutesPerClaim?: number;
}
