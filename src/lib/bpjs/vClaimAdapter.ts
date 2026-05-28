/**
 * V-Claim Adapter (BPJS Kesehatan).
 *
 * Bridging ke BPJS V-Claim REST API. Adapter ini PURE TRANSPORT — caller
 * handle orchestration + Result mapping.
 *
 * Spek reference: BPJS V-Claim API spec
 * https://apijkn.bpjs-kesehatan.go.id/vclaim-rest/
 *
 * Methods covered (Phase BP0.1):
 * - `checkSEP(noSEP)` → SEP detail (existing SEP lookup).
 * - `submitClaim(claim, batchId)` → submit klaim ke BPJS.
 * - `getEligibility(noKartu, tanggal, jnsPelayanan)` → peserta eligibility.
 *
 * Phase BP0.4 extension (~33 method) di-split per domain ke file
 * terpisah agar tetap <800L per file:
 * - `vClaimKepesertaan.ts` (2 method)
 * - `vClaimSEP.ts` (11 method)
 * - `vClaimRujukan.ts` (5 method)
 * - `vClaimMonitoring.ts` (4 method)
 * - `vClaimRencanaKontrol.ts` (11 method · aligned RencanaKontrol-Contracts.md V2)
 * - `aplicaresAdapter.ts` (7 method, separate adapter)
 *
 * File ini = entry point: existing 3 method legacy + re-export semua
 * BP0.4 extension. Consumer cukup `import { ... } from "@/lib/bpjs/vClaimAdapter"`.
 *
 * Header pattern (annotated, mock skip aktual sig):
 * - `X-cons-id`: consumer ID (assigned BPJS per RS).
 * - `X-timestamp`: Unix epoch second.
 * - `X-signature`: HMAC-SHA256(`cons-id&timestamp`, consumer-secret) → base64.
 * - `user_key`: API key per RS.
 *
 * Response body: LZ-String compressed JSON di production. Mock skip
 * compression — saat backend ready, tambah decompress di adapter, caller
 * tidak berubah.
 *
 * Referensi: TODO-BPJS.md § BP0 · TODO-EKLAIM.md § EK0.4.
 */

import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import {
  Err,
  Ok,
  type ClaimError,
  type ClaimRecord,
  type ClaimStatus,
  type KelasRawat,
  type Result,
  type Rupiah,
  type SEPRecord,
  type TingkatKompetensiRS,
} from "@/lib/eklaim/eklaimShared";

// ── Raw API Response Shapes ────────────────────────────

/** V-Claim envelope semua response. */
export interface VClaimEnvelope<T> {
  metaData: {
    code: string; // "200" success, "201" data not found, "500" error
    message: string;
  };
  response?: T;
}

export interface VClaimSEPResponse {
  noSEP: string;
  noKartu: string;
  tglSEP: string;
  jnsPelayanan: "1" | "2";
  pasien: { nama: string; tglLahir: string; kelamin: "L" | "P" };
  poli: { kode: string; nama: string };
  faskes: { kode: string; nama: string };
  diagnosa: string;
  catatan?: string;
  rencanaTindakLanjut?: string;
}

export interface VClaimEligibilityResponse {
  peserta: {
    nokartu: string;
    nik: string;
    nama: string;
    pisa: "L" | "P";
    tglLahir: string;
    sex: "L" | "P";
    hakKelas: { kode: string; keterangan: string };
    jenisPeserta: { kode: string; keterangan: string };
    statusPeserta: { kode: string; keterangan: string };
    mr: { noMR: string; noTelepon: string };
  };
  asuransi?: { plafon: string; sisaPlafon: string };
  sisaHariRawat?: number;
}

export interface VClaimSubmitResponse {
  noKlaim: string;
  statusBPJS: "Pending Verifikasi" | "Approved" | "Rejected";
  pesanVerifikator?: string;
  estimasiTarif?: string;
}

// ── Config ─────────────────────────────────────────────

export interface VClaimConfig {
  /** Override consumer credentials (saat backend ready). */
  consId?: string;
  userKey?: string;
  /** 0-1. Default 0.04. */
  failRate?: number;
  /** Latency fixed (ms). Default random 200-600. */
  fixedLatencyMs?: number;
  /** Force result untuk test deterministic. */
  forceResult?: unknown;
}

// ── Public API ─────────────────────────────────────────

/**
 * Cek SEP by `noSEP`. Mock: lookup di CLAIM_BOARD_MOCK.
 *
 * Header pattern (annotated — applied saat real fetch):
 * ```
 * X-cons-id: 12345
 * X-timestamp: 1717142400
 * X-signature: HMAC-SHA256(...)
 * user_key: api-key-rs
 * ```
 */
export async function checkSEP(
  noSEP: string,
  config: VClaimConfig = {},
): Promise<Result<VClaimEnvelope<VClaimSEPResponse>, ClaimError>> {
  await simulateLatency(config.fixedLatencyMs);

  const failRate = config.failRate ?? 0.04;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "V-Claim API timeout (simulated)",
      retryable: true,
    });
  }

  const claim = CLAIM_BOARD_MOCK.find((c) => c.penjamin.sep?.noSEP === noSEP);
  if (!claim || !claim.penjamin.sep) {
    return Ok({
      metaData: { code: "201", message: "Data SEP tidak ditemukan" },
    });
  }

  const sep = claim.penjamin.sep;
  return Ok({
    metaData: { code: "200", message: "Sukses" },
    response: {
      noSEP: sep.noSEP,
      noKartu: sep.noKartu,
      tglSEP: sep.tglTerbit,
      jnsPelayanan: sep.jenisRawat === "RI" ? "1" : "2",
      pasien: {
        nama: claim.pasienId,
        tglLahir: deriveTglLahir(claim.age),
        kelamin: claim.gender,
      },
      poli: { kode: "INT", nama: "Penyakit Dalam" },
      faskes: { kode: "0001R001", nama: "RS Sakti Husada" },
      diagnosa: claim.diagnosaPrimer.deskripsi,
    },
  });
}

/**
 * Cek eligibility peserta — V-Claim `/Peserta/nokartu/{nokartu}/tglSEP/{tglSEP}`.
 *
 * `jnsPelayanan`: 1 = Rawat Inap, 2 = Rawat Jalan.
 */
export async function getEligibility(
  noKartu: string,
  tanggalSEP: string,
  jnsPelayanan: 1 | 2,
  config: VClaimConfig = {},
): Promise<Result<VClaimEnvelope<VClaimEligibilityResponse>, ClaimError>> {
  await simulateLatency(config.fixedLatencyMs);

  if (!/^\d{13}$/.test(noKartu)) {
    return Ok({
      metaData: { code: "201", message: "Nomor kartu harus 13 digit" },
    });
  }

  const failRate = config.failRate ?? 0.04;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "V-Claim API timeout (simulated)",
      retryable: true,
    });
  }

  const claim = CLAIM_BOARD_MOCK.find((c) => c.penjamin.sep?.noKartu === noKartu);
  if (!claim || !claim.penjamin.sep) {
    return Ok({
      metaData: { code: "201", message: "Peserta tidak ditemukan" },
    });
  }

  const sep = claim.penjamin.sep;
  if (tanggalSEP > sep.masaBerlaku.to || tanggalSEP < sep.masaBerlaku.from) {
    return Ok({
      metaData: { code: "201", message: "SEP di luar masa berlaku" },
    });
  }

  return Ok({
    metaData: { code: "200", message: "Sukses" },
    response: {
      peserta: {
        nokartu: noKartu,
        nik: deriveNIK(noKartu),
        nama: claim.pasienId,
        pisa: claim.gender,
        tglLahir: deriveTglLahir(claim.age),
        sex: claim.gender,
        hakKelas: { kode: claim.kelas, keterangan: `Kelas ${claim.kelas}` },
        jenisPeserta: { kode: "01", keterangan: "PBPU" },
        statusPeserta: { kode: "0", keterangan: "AKTIF" },
        mr: { noMR: claim.pasienId, noTelepon: "" },
      },
      sisaHariRawat: jnsPelayanan === 1 ? Math.max(0, 30 - claim.los) : undefined,
    },
  });
}

/**
 * Submit klaim ke BPJS. Mock simulate random verifikator distribution
 * (60% Pending Verifikasi, 25% Approved fast-path, 10% Susulan Required, 5% Rejected).
 */
export async function submitClaim(
  claim: ClaimRecord,
  batchId: string,
  config: VClaimConfig = {},
): Promise<Result<VClaimEnvelope<VClaimSubmitResponse>, ClaimError>> {
  await simulateLatency(config.fixedLatencyMs);

  const failRate = config.failRate ?? 0.04;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "V-Claim submit timeout (simulated)",
      retryable: true,
    });
  }

  // Duplicate detection — already submitted with this batchId
  if (claim.batchId && claim.batchId !== batchId && claim.submittedAt) {
    return Err({
      type: "DuplicateClaimError",
      existingClaimId: claim.id,
    });
  }

  const rand = Math.random();
  const statusBPJS: VClaimSubmitResponse["statusBPJS"] =
    rand < 0.6 ? "Pending Verifikasi" : rand < 0.95 ? "Approved" : "Rejected";

  return Ok({
    metaData: { code: "200", message: "Klaim berhasil disubmit" },
    response: {
      noKlaim: claim.noKlaim,
      statusBPJS,
      pesanVerifikator: statusBPJS === "Rejected" ? "Berkas tidak lengkap" : undefined,
      estimasiTarif: claim.iDRG?.tarifAktual.toString() ?? claim.tarifRS.toString(),
    },
  });
}

// ── Mappers: raw → domain ──────────────────────────────

/** V-Claim SEP response → `SEPRecord` domain. */
export function toSEPRecord(raw: VClaimSEPResponse): SEPRecord {
  return {
    noSEP: raw.noSEP,
    noKartu: raw.noKartu,
    tglTerbit: raw.tglSEP,
    masaBerlaku: { from: raw.tglSEP, to: addDays(raw.tglSEP, 30) },
    faskesRujukan: raw.faskes.nama,
    jenisRawat: raw.jnsPelayanan === "1" ? "RI" : "RJ",
  };
}

/** V-Claim eligibility response → domain shape (parsed kelas + plafon). */
export interface EligibilityDomainResult {
  valid: boolean;
  kelasDijamin: KelasRawat;
  tingkatKompetensiRSDijamin: TingkatKompetensiRS;
  plafon?: Rupiah;
  sisaHariRawat?: number;
  remark?: string;
}

export function toEligibilityDomain(
  raw: VClaimEligibilityResponse,
  fallback: { kelas: KelasRawat; tingkat: TingkatKompetensiRS },
): EligibilityDomainResult {
  const kelas = parseKelasRawat(raw.peserta.hakKelas.kode) ?? fallback.kelas;
  const plafon = raw.asuransi ? BigInt(raw.asuransi.sisaPlafon) : undefined;
  return {
    valid: raw.peserta.statusPeserta.kode === "0",
    kelasDijamin: kelas,
    tingkatKompetensiRSDijamin: fallback.tingkat,
    plafon,
    sisaHariRawat: raw.sisaHariRawat,
    remark: raw.peserta.statusPeserta.keterangan,
  };
}

/** V-Claim submit response → `ClaimStatus` domain. */
export function toClaimStatus(raw: VClaimSubmitResponse): ClaimStatus {
  switch (raw.statusBPJS) {
    case "Approved":
      return "Approved";
    case "Rejected":
      return "Rejected";
    case "Pending Verifikasi":
    default:
      return "Pending Verifikasi";
  }
}

// ── Internal Helpers ───────────────────────────────────

function simulateLatency(fixedMs?: number): Promise<void> {
  const ms = fixedMs ?? 200 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveTglLahir(age: number): string {
  const yearNow = new Date().getFullYear();
  return `${yearNow - age}-01-01`;
}

function deriveNIK(noKartu: string): string {
  return `3171${noKartu.slice(-12)}`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseKelasRawat(kode: string): KelasRawat | undefined {
  const map: Record<string, KelasRawat> = {
    KRIS: "KRIS",
    VIP: "VIP",
    Kelas_1: "Kelas_1",
    Kelas_2: "Kelas_2",
    Kelas_3: "Kelas_3",
    ICU: "ICU",
    HCU: "HCU",
    Isolasi: "Isolasi",
  };
  return map[kode];
}

// ── BP0.4 Re-exports (domain-split) ────────────────────

export * from "./vClaimKepesertaan";
export * from "./vClaimSEP";
export * from "./vClaimRujukan";
export * from "./vClaimMonitoring";
export * from "./vClaimRencanaKontrol";
