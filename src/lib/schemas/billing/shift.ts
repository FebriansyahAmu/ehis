// Zod input + DTO — Shift kasir (Slice 2e persist). Buka/tutup/board. Totals = proyeksi payment
// (open) / snapshot (closed). Kasir (operator) dipilih dari user role "Kasir"; nama di-resolve server.

import { z } from "zod";

export const CounterEnum = z.enum(["Kasir-1", "Kasir-2", "Kasir-3", "Kasir-IGD"]);

// ── Buka shift (POST /billing/shift) ─────────────────────────────────────────
export const OpenShiftInput = z.object({
  counter: CounterEnum,
  kasirPegawaiId: z.string().uuid(),
  bukaSaldoAwal: z.coerce.number().int().min(0).max(2_000_000_000),
  bukaCatatan: z.string().trim().max(500).optional(),
});
export type OpenShiftInput = z.infer<typeof OpenShiftInput>;

// ── Tutup shift (PATCH /billing/shift/:id/tutup) ─────────────────────────────
export const CloseShiftInput = z.object({
  tutupSaldoAkhir: z.coerce.number().int().min(0).max(2_000_000_000),
  tutupCatatan: z.string().trim().max(500).optional(),
});
export type CloseShiftInput = z.infer<typeof CloseShiftInput>;

// ── Setoran kas (POST /billing/shift/:id/setoran) ────────────────────────────
// Shift harus SUDAH ditutup & belum pernah disetorkan. `penyetor` & nomor STR di-isi server.
export const SetoranInput = z.object({
  tanggalSerah: z.string().datetime({ offset: true }).optional(), // default: sekarang
  nominal: z.coerce.number().int().min(1).max(2_000_000_000),
  penerima: z.string().trim().min(1, "Nama penerima wajib diisi").max(120),
  catatan: z.string().trim().max(500).optional(),
});
export type SetoranInput = z.infer<typeof SetoranInput>;

export const ShiftParam = z.object({ id: z.string().uuid() });

// ── DTO ──────────────────────────────────────────────────────────────────────
export interface ShiftMetodeBreakdownDTO {
  Tunai: number;
  Transfer: number;
  QRIS: number;
  EDC: number;
  Voucher: number;
}

export interface ShiftDTO {
  id: string;
  counter: string;
  kasirNama: string;
  kasirPegawaiId: string | null;
  authorUserId: string | null;
  status: "Open" | "Closed";
  bukaAt: string; // ISO
  bukaSaldoAwal: number;
  bukaCatatan: string | null;
  totalByMetode: ShiftMetodeBreakdownDTO;
  totalTransaksi: number;
  totalRefund: number;
  tutupAt: string | null; // ISO
  tutupSaldoAkhir: number | null;
  selisih: number | null;
  tutupCatatan: string | null;
  supervisor: string | null;
  /** Setoran kas ke bendahara — null bila shift belum disetorkan. */
  setoran: SetoranDTO | null;
}

export interface SetoranDTO {
  noSetor: string;
  tanggalSerah: string; // ISO
  nominal: number;
  penerima: string;
  penyetor: string;
  catatan: string | null;
}

/** Papan shift kasir: active (shift saya) + open (semua counter, live) + recentClosed (snapshot). */
export interface ShiftBoardDTO {
  active: ShiftDTO | null;
  open: ShiftDTO[];
  recentClosed: ShiftDTO[];
}

export interface KasirUserDTO {
  pegawaiId: string;
  nama: string;
}
