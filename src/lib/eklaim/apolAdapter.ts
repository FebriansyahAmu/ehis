/**
 * APOL Adapter — STUB (Phase later).
 *
 * APOL = Aplikasi Pelayanan Obat Layanan FKTL — sistem BPJS untuk klaim obat
 * kronis di Fasilitas Kesehatan Tingkat Lanjut (RS rujukan). Reconciliation
 * obat kronis APOL terpisah dari klaim CBG biasa karena:
 * - Pasien chronic disease (DM, HT, Jantung, dsb.) ambil obat bulanan.
 * - Tarif obat reimbursable per resep, bukan per episode rawat.
 * - Penyelesaian klaim via APOL submission terpisah.
 *
 * Spek reference: BPJS Petunjuk Teknis APOL (versi terbaru per RS).
 *
 * Status: PHASE LATER. Hanya stub interface — diisi saat EK7 reconciliation
 * butuh integrate dengan APOL flow. Saat ini semua method throw
 * `NOT_IMPLEMENTED` agar caller eksplisit handle (no silent no-op).
 *
 * Referensi: TODO-EKLAIM.md § EK0.4 (apolAdapter parked) · § EK7.
 */

import { Err, type ClaimError, type Result, type Rupiah } from "./eklaimShared";

// ── Interface (stub) ───────────────────────────────────

export interface APOLResepRecord {
  noResep: string;
  noKartu: string;
  tglResep: string;
  diagnosaIcd10: string;
  obatList: ReadonlyArray<{
    kodeObat: string;
    namaObat: string;
    qty: number;
    nominalRp: Rupiah;
  }>;
  totalNominal: Rupiah;
  statusAPOL: "Submitted" | "Approved" | "Rejected";
}

export interface APOLBatchSubmitInput {
  periodeBulan: string; // "YYYY-MM"
  resepList: ReadonlyArray<APOLResepRecord>;
}

// ── Public API (stub) ──────────────────────────────────

/**
 * Submit batch resep obat kronis ke APOL.
 * STUB — return error PHASE_LATER, caller harus eksplisit handle.
 */
export async function submitAPOLBatch(
  _input: APOLBatchSubmitInput,
): Promise<Result<{ batchAPOLId: string; status: "Submitted" }, ClaimError>> {
  return Err({
    type: "ValidationError",
    field: "apol",
    message: "APOL adapter PHASE_LATER — belum diimplementasi (di-pickup saat EK7 reconciliation obat kronis aktif)",
  });
}

/**
 * Pull status batch APOL.
 * STUB — return error PHASE_LATER.
 */
export async function pullAPOLStatus(
  _batchAPOLId: string,
): Promise<Result<{ batchAPOLId: string; resepStatuses: ReadonlyArray<APOLResepRecord> }, ClaimError>> {
  return Err({
    type: "ValidationError",
    field: "apol",
    message: "APOL adapter PHASE_LATER — belum diimplementasi",
  });
}
