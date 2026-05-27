/**
 * reconciliationShared — types, helpers, tone tokens, KPIs, CSV parser, formatters (EK7).
 *
 * Re-exports BANDING_TONE dari banding/bandingShared supaya tidak ada duplikasi token.
 */

import type { ReconciliationRecord, ClaimRecord } from "@/lib/eklaim/eklaimShared";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import { formatRupiah, formatRupiahShort } from "@/lib/eklaim/money";

export { BANDING_TONE } from "../banding/bandingShared";
export type { ToneKey } from "../banding/bandingShared";
export { formatRupiah, formatRupiahShort };

// ── View Status ───────────────────────────────────────────────

export type ReconViewStatus =
  | "Selesai"           // completedAt set + selisih === 0n
  | "Write-off"         // completedAt set + statusSelisih Write-off
  | "Refund"            // completedAt set + statusSelisih Refund
  | "Perlu Review"      // matchedClaims > 0 but no completedAt
  | "Belum Dicocokkan"; // matchedClaims === 0

export interface ReconStatusCfg {
  label: string;
  tone: import("../banding/bandingShared").ToneKey;
}

export const RECON_STATUS_CFG: Record<ReconViewStatus, ReconStatusCfg> = {
  Selesai:           { label: "Selesai",          tone: "emerald" },
  "Write-off":       { label: "Write-off",         tone: "amber"   },
  Refund:            { label: "Refund",             tone: "sky"     },
  "Perlu Review":    { label: "Perlu Review",       tone: "amber"   },
  "Belum Dicocokkan": { label: "Belum Dicocokkan",  tone: "rose"    },
};

export function getReconViewStatus(rec: ReconciliationRecord): ReconViewStatus {
  if (rec.completedAt) {
    if (rec.statusSelisih === "Write-off") return "Write-off";
    if (rec.statusSelisih === "Refund") return "Refund";
    return "Selesai";
  }
  return rec.matchedClaims.length > 0 ? "Perlu Review" : "Belum Dicocokkan";
}

// ── Confidence Badge Config ───────────────────────────────────

export interface ConfidenceCfg {
  label: string;
  tone: import("../banding/bandingShared").ToneKey;
}

export function getConfidenceCfg(confidence: number): ConfidenceCfg {
  if (confidence >= 1.0) return { label: "Exact",          tone: "emerald" };
  if (confidence >= 0.9) return { label: "Periode+Count",  tone: "sky"     };
  if (confidence >= 0.7) return { label: "Fuzzy ±5%",      tone: "amber"   };
  return                        { label: "Manual",          tone: "slate"   };
}

// ── Penjamin Display ─────────────────────────────────────────

export interface PenjaminDisplay {
  label: string;
  tone: import("../banding/bandingShared").ToneKey;
}

const PENJAMIN_DISPLAY: Record<string, PenjaminDisplay> = {
  "bpjs-jakarta":      { label: "BPJS Kesehatan",  tone: "emerald" },
  "mandiri-inhealth":  { label: "Mandiri Inhealth", tone: "sky"     },
  "prudential":        { label: "Prudential",        tone: "amber"   },
  "allianz":           { label: "Allianz",           tone: "teal"    },
  "axa":               { label: "AXA",               tone: "sky"     },
};

export function getPenjaminDisplay(id: string): PenjaminDisplay {
  return PENJAMIN_DISPLAY[id] ?? { label: id, tone: "slate" as const };
}

// ── Auto-detect Penjamin dari keterangan ─────────────────────

export function detectPenjaminId(keterangan: string): string {
  const s = keterangan.toLowerCase();
  if (s.includes("bpjs"))                            return "bpjs-jakarta";
  if (s.includes("mandiri inhealth") || s.includes("inhealth")) return "mandiri-inhealth";
  if (s.includes("prudential"))                      return "prudential";
  if (s.includes("allianz"))                         return "allianz";
  if (s.includes("axa"))                             return "axa";
  return "unknown";
}

// ── CSV Parsing (client-side mock) ────────────────────────────

export interface CSVTransferRow {
  tanggal: string;
  nominalRaw: string;
  nominal: bigint;
  bank: string;
  keterangan: string;
  penjaminId: string;
  valid: boolean;
  error?: string;
}

/** Parse CSV string → array of transfer rows. Skips header. */
export function parseCSVContent(content: string): CSVTransferRow[] {
  const lines = content.trim().split(/\r?\n/);
  const rows: CSVTransferRow[] = [];
  const startIdx = lines[0]?.toLowerCase().includes("tanggal") ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) {
      rows.push({
        tanggal: "", nominalRaw: "", nominal: 0n, bank: "", keterangan: "",
        penjaminId: "", valid: false, error: "Min 4 kolom: tanggal, nominal, bank, keterangan",
      });
      continue;
    }
    const [tanggal, nominalRaw, bank, ...rest] = cols;
    const keterangan = rest.join(",");
    const nominalNum = parseInt(nominalRaw.replace(/\D/g, ""), 10);
    if (!tanggal || isNaN(nominalNum) || nominalNum <= 0) {
      rows.push({
        tanggal: tanggal ?? "", nominalRaw, nominal: 0n, bank: bank ?? "", keterangan,
        penjaminId: "", valid: false, error: "Tanggal atau nominal tidak valid",
      });
      continue;
    }
    rows.push({
      tanggal: tanggal.includes("T") ? tanggal : `${tanggal}T00:00`,
      nominalRaw,
      nominal: BigInt(nominalNum),
      bank: bank || "—",
      keterangan,
      penjaminId: detectPenjaminId(keterangan),
      valid: true,
    });
  }
  return rows;
}

/** Template CSV yang bisa di-download user */
export const CSV_TEMPLATE_CONTENT =
  "tanggal,nominal,bank,keterangan\n" +
  "2026-05-28,25000000,Mandiri,BPJS KESEHATAN Pembayaran Klaim Periode Mei 2026 Batch B\n" +
  "2026-05-28,11500000,BCA,Mandiri Inhealth Cashless Claim Periode Mei 2026";

// ── Approved Claim Pool (untuk matching engine) ───────────────

/** Kembalikan klaim yang eligible untuk di-match: Approved/Sengketa + punya approvedAmount. */
export function getApprovedClaimPool(): ReadonlyArray<ClaimRecord> {
  return CLAIM_BOARD_MOCK.filter(
    (c) =>
      (c.statusPenjamin === "Approved" || c.statusPenjamin === "Sengketa") &&
      c.approvedAmount !== undefined,
  );
}

/** Cari klaim by ID dari CLAIM_BOARD_MOCK. */
export function findClaimById(claimId: string): ClaimRecord | undefined {
  return CLAIM_BOARD_MOCK.find((c) => c.id === claimId);
}

// ── KPI Computation ───────────────────────────────────────────

export interface ReconKPI {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: import("../banding/bandingShared").ToneKey;
}

export function computeReconKPIs(records: ReconciliationRecord[]): ReconKPI[] {
  const total    = records.length;
  const completed = records.filter((r) => r.completedAt).length;
  const needsReview = records.filter((r) => !r.completedAt && r.matchedClaims.length > 0).length;
  const pending  = records.filter((r) => !r.completedAt && r.matchedClaims.length === 0).length;

  let totalNominal = 0n;
  for (const r of records) totalNominal += r.nominalTransfer;

  return [
    {
      id: "total",
      label: "Total Transfer",
      value: String(total),
      sub: formatRupiahShort(totalNominal),
      tone: "teal",
    },
    {
      id: "selesai",
      label: "Selesai",
      value: String(completed),
      sub: `${total > 0 ? Math.round((completed / total) * 100) : 0}% dari total`,
      tone: "emerald",
    },
    {
      id: "review",
      label: "Perlu Review",
      value: String(needsReview),
      sub: needsReview > 0 ? "Konfirmasi manual" : "Tidak ada",
      tone: needsReview > 0 ? "amber" : "slate",
    },
    {
      id: "pending",
      label: "Belum Dicocokkan",
      value: String(pending),
      sub: pending > 0 ? "Jalankan matching" : "Semua diproses",
      tone: pending > 0 ? "rose" : "slate",
    },
  ];
}

// ── ID Generators ─────────────────────────────────────────────

export function generateReconId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `RECON-${date}-${rand}`;
}

export function generateTransferNo(bank: string, penjaminId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  const prefix =
    penjaminId.startsWith("bpjs")          ? "BPJS" :
    penjaminId === "mandiri-inhealth"       ? "MNDI" :
    bank.toUpperCase().replace(/\s/g, "").slice(0, 4);
  return `TRF-${prefix}-${date}-${rand}`;
}

// ── Date Formatters ───────────────────────────────────────────

export function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

export function fmtDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  } catch { return iso; }
}
