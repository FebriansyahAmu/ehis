// Register Narkotika & Psikotropika — lapisan KEPATUHAN/LAPORAN (read-only).
// UU 35/2009 · UU 5/1997 · PMK 3/2015 · SIPNAP (Dinkes/BPOM).
//
// BUKAN sumber stok. Single source:
//   • Katalog N/P  → master.Obat (golongan Narkotika_*/Psikotropika_*)  via fetchAllObat
//   • Saldo+mutasi → inventory.StockMovement/StockBalance               via getInvItemDetail
//   • Identitas dispensing (pasien/dokter/resep) → Resep (menyusul saat dispensing→OUT)
// Penerimaan, transfer, & stok opname dilakukan di modul Inventory (bukan di sini).

export type NarPsiKategori = "Narkotika" | "Psikotropika";

/** Golongan legal (master.Obat.golongan) → kategori register, atau null bila bukan N/P. */
export function narPsiKategoriOf(golongan?: string | null): NarPsiKategori | null {
  if (!golongan) return null;
  if (golongan.startsWith("Narkotika")) return "Narkotika";
  if (golongan.startsWith("Psikotropika")) return "Psikotropika";
  return null;
}

// ── Jenis mutasi ledger (inventory.MovementJenis) → label + warna ──────────────
export const MUTASI_CFG: Record<string, { label: string; badge: string; arah: "in" | "out" | "net" }> = {
  IN:       { label: "Masuk",       badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", arah: "in"  },
  OUT:      { label: "Keluar",      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          arah: "out" },
  TRANSFER: { label: "Transfer",    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             arah: "net" },
  ADJUST:   { label: "Penyesuaian", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       arah: "net" },
  OPNAME:   { label: "Opname",      badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",    arah: "net" },
};

export function mutasiCfg(jenis: string) {
  return MUTASI_CFG[jenis] ?? { label: jenis, badge: "bg-slate-100 text-slate-600", arah: "net" as const };
}

// ── Aksen per kategori (TANPA purple — selaras palet golongan master) ──────────
export const KATEGORI_ACCENT: Record<NarPsiKategori, { tab: string; chip: string; icon: string; dot: string }> = {
  Narkotika: {
    tab:  "bg-rose-600 text-white border-rose-600 shadow-sm",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "text-rose-500",
    dot:  "bg-rose-500",
  },
  Psikotropika: {
    tab:  "bg-pink-600 text-white border-pink-600 shadow-sm",
    chip: "border-pink-200 bg-pink-50 text-pink-700",
    icon: "text-pink-500",
    dot:  "bg-pink-500",
  },
};

// ── Date helpers ──────────────────────────────────────────────────────────────

export function getMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-");
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function getAvailableMonths(): string[] {
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}
