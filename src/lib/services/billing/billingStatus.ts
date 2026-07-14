// Derivasi status billing bersama (Slice 2). SATU sumber aturan untuk detail (getInvoiceState)
// & worklist (listKunjunganBilling) agar tidak drift. Status = fungsi (ada tagihan? · sudah dibayar?).
//   Draft          → belum ada charge (total ≤ 0)
//   Belum Lunas    → ada tagihan, belum dibayar sama sekali
//   Lunas Sebagian → dibayar > 0 tapi < grand total
//   Lunas          → dibayar ≥ grand total

export type BillingStatus = "Draft" | "Belum Lunas" | "Lunas Sebagian" | "Lunas";

export function deriveBillingStatus(subtotal: number, grandTotal: number, dibayar: number): BillingStatus {
  if (subtotal <= 0) return "Draft";
  if (dibayar <= 0) return "Belum Lunas";
  if (dibayar < grandTotal) return "Lunas Sebagian";
  return "Lunas";
}
