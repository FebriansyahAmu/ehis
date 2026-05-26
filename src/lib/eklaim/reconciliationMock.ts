/**
 * Reconciliation Mock (EK0.2).
 *
 * 5 transfer batch lintas penjamin — populate EK7 Reconciliation page.
 * Referensi claim IDs dari `CLAIM_BOARD_MOCK` yang berstatus Paid/Approved.
 *
 * Scenario coverage:
 * 1. Exact match auto (BPJS multi-klaim, clean reconciliation)
 * 2. Asuransi cashless single (Mandiri Inhealth)
 * 3. Asuransi reimbursement (Prudential)
 * 4. Partial paid dengan selisih write-off (BPJS approve < tarif klaim)
 * 5. Unmatched pending (transfer baru masuk, belum di-match manual)
 */

import type { ReconciliationRecord } from "./eklaimShared";

export const RECONCILIATION_MOCK: ReadonlyArray<ReconciliationRecord> = [
  // 1. BPJS — multi-klaim exact match
  {
    id: "RECON-2026-0521-001",
    noTransfer: "TRF-BPJS-2026-0521-00012",
    tanggalTransfer: "2026-05-21T10:30",
    nominalTransfer: 33_500_000n,
    bank: "Mandiri",
    penjaminId: "bpjs-jakarta",
    periodeKlaim: "2026-05",
    matchedClaims: [
      {
        claimId: "CLM-2026-05-001",
        amount: 20_000_000n,
        autoMatched: true,
        matchingConfidence: 1.0,
        matchingReason: "exact nominal · same periode + penjamin",
        matchedAt: "2026-05-21T10:35",
      },
      {
        claimId: "CLM-2026-05-006",
        amount: 13_500_000n,
        autoMatched: true,
        matchingConfidence: 1.0,
        matchingReason: "exact nominal · same periode + penjamin",
        matchedAt: "2026-05-21T10:35",
      },
    ],
    selisih: 0n,
    statusSelisih: undefined,
    completedAt: "2026-05-21T10:40",
    completedBy: "Sistem Auto-Matcher",
  },

  // 2. Asuransi cashless single
  {
    id: "RECON-2026-0518-002",
    noTransfer: "TRF-MNDI-2026-0518-00045",
    tanggalTransfer: "2026-05-18T09:15",
    nominalTransfer: 11_200_000n,
    bank: "BCA",
    penjaminId: "mandiri-inhealth",
    periodeKlaim: "2026-05",
    matchedClaims: [
      {
        claimId: "CLM-2026-05-016",
        amount: 11_200_000n,
        autoMatched: true,
        matchingConfidence: 1.0,
        matchingReason: "exact nominal · single claim transfer",
        matchedAt: "2026-05-18T09:20",
      },
    ],
    selisih: 0n,
    completedAt: "2026-05-18T09:25",
    completedBy: "Sistem Auto-Matcher",
  },

  // 3. Asuransi reimbursement
  {
    id: "RECON-2026-0522-003",
    noTransfer: "TRF-PRU-2026-0522-00103",
    tanggalTransfer: "2026-05-22T14:00",
    nominalTransfer: 8_500_000n,
    bank: "BCA",
    penjaminId: "prudential",
    periodeKlaim: "2026-05",
    matchedClaims: [
      {
        claimId: "CLM-2026-05-019",
        amount: 8_500_000n,
        autoMatched: true,
        matchingConfidence: 1.0,
        matchingReason: "exact nominal · reimbursement single claim",
        matchedAt: "2026-05-22T14:10",
      },
    ],
    selisih: 0n,
    completedAt: "2026-05-22T14:15",
    completedBy: "Sistem Auto-Matcher",
  },

  // 4. BPJS partial paid dengan selisih write-off
  {
    id: "RECON-2026-0525-004",
    noTransfer: "TRF-BPJS-2026-0525-00015",
    tanggalTransfer: "2026-05-25T11:00",
    nominalTransfer: 16_000_000n,
    bank: "Mandiri",
    penjaminId: "bpjs-jakarta",
    periodeKlaim: "2026-05",
    matchedClaims: [
      {
        claimId: "CLM-2026-05-014",
        amount: 16_000_000n,
        autoMatched: false,
        matchingConfidence: 0.85,
        matchingReason: "fuzzy match · partial pay (approved Rp 16.320.000, dibayar Rp 16.000.000, selisih Rp 320.000)",
        matchedBy: "Tutik (Tim Klaim)",
        matchedAt: "2026-05-25T13:20",
      },
    ],
    selisih: 320_000n,
    statusSelisih: "Write-off",
    completedAt: "2026-05-25T13:30",
    completedBy: "Tutik (Tim Klaim)",
  },

  // 5. Unmatched pending (transfer baru masuk)
  {
    id: "RECON-2026-0526-005",
    noTransfer: "TRF-BPJS-2026-0526-00019",
    tanggalTransfer: "2026-05-26T08:00",
    nominalTransfer: 50_000_000n,
    bank: "Mandiri",
    penjaminId: "bpjs-jakarta",
    periodeKlaim: "2026-05",
    matchedClaims: [],
    selisih: undefined,
    statusSelisih: "Pending",
  },
];

/** Lookup helper — return reconciliation by id atau undefined. */
export function findReconciliation(id: string): ReconciliationRecord | undefined {
  return RECONCILIATION_MOCK.find((rec) => rec.id === id);
}

/** Lookup helper — return reconciliations untuk penjamin tertentu. */
export function findReconciliationsByPenjamin(
  penjaminId: string,
): ReadonlyArray<ReconciliationRecord> {
  return RECONCILIATION_MOCK.filter((rec) => rec.penjaminId === penjaminId);
}
