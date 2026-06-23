// Shared types + helpers — tab Order BMHP (IGD/RI/RJ). Adopsi pendekatan Resep Pasien:
// header pemohon + form tambah item + daftar order + riwayat. Sumber katalog = BMHP ter-assign
// ke depo Farmasi (GET /master/bmhp-tersedia, kode BHP-… saja). Order persist via /kunjungan/:id/bmhp.

import type { BmhpTersediaDTO } from "@/lib/api/master/bmhpTersedia";
import type { StokKlinisRow, StokKlinisStatus } from "@/lib/api/inventory/stock";

export type { StokKlinisStatus };

// Kunjungan terpersist (UUID) → submit ke DB; pasien demo (igd-*/ri-*/rj-*) → sukses lokal.
export const KUNJUNGAN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pasien minimal yang dipenuhi IGD/RI/RJ (lewat adapter di masing-masing tab registry). */
export interface BmhpOrderPatient {
  /** kunjunganId — UUID bila terpersist; non-UUID (demo) → submit lokal. */
  id: string;
  noRM: string;
  name: string;
  /** Pemohon default (DPJP / dokter penanggung jawab). Pemohon nyata = user login. */
  dpjp: string;
  dpjpKontak?: string;
  gender?: "L" | "P";
  age?: number | string;
  /** Label unit (IGD / Rawat Inap / Rawat Jalan) — tampil di header. */
  unitLabel?: string;
  tglKunjungan?: string;
}

// ── Katalog BMHP (hasil pencarian) ────────────────────────
export interface BmhpCatalog {
  id?: string;       // UUID master.Bmhp (absen utk item manual)
  kode: string;      // BHP-<YYMM><NNN>
  nama: string;
  satuan: string;
  kategori: string;
  ukuran?: string;
  merek?: string;
  isSteril?: boolean;
  /** Harga satuan (Rp) snapshot. 0/absen = belum bertarif. */
  harga?: number;
  /** Saldo stok di depo terpilih (overlay advisory). Absen → badge tak ditampilkan. */
  stok?: number;
  stokStatus?: StokKlinisStatus;
}

export function bmhpTersediaToCatalog(b: BmhpTersediaDTO): BmhpCatalog {
  return {
    id: b.id,
    kode: b.kode,
    nama: b.nama,
    satuan: b.satuan,
    kategori: b.kategori,
    ukuran: b.ukuran ?? undefined,
    merek: b.merek ?? undefined,
    isSteril: b.isSteril,
    harga: b.hargaSatuan || undefined,
  };
}

// ── Item form (sebelum dikirim) ───────────────────────────
export interface BmhpDraftItem {
  id: string;
  bmhpId?: string;
  kode: string;
  nama: string;
  satuan: string;
  kategori: string;
  jumlah: number;
  keterangan: string;
  harga?: number;
}

export function genBmhpItemId(): string {
  return `bhp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export function formatRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ── Overlay stok inventory (advisory) ─────────────────────
// Stok TIDAK memfilter/menggagalkan order — hanya info. Penjaga stok ada di dispensing Farmasi.

/** Warna teks badge stok per status. */
export const STOK_TEXT: Record<StokKlinisStatus, string> = {
  Aman:    "text-emerald-600",
  Menipis: "text-amber-600",
  Habis:   "text-rose-500",
};

/** Label badge stok (angka utk Aman/Menipis, "Habis" utk 0). */
export function stokLabel(status: StokKlinisStatus, qty: number): string {
  if (status === "Habis") return "Habis";
  return `${status === "Menipis" ? "Menipis" : "Stok"}: ${qty}`;
}

/** Tempelkan saldo depo ke katalog by `id` (UUID master BMHP). Item tanpa saldo → stokStatus undefined
 *  (badge tak tampil). Map kosong → katalog dikembalikan apa adanya. */
export function applyStokBmhp(catalog: BmhpCatalog[], stok: Map<string, StokKlinisRow>): BmhpCatalog[] {
  if (stok.size === 0) return catalog;
  return catalog.map((b) => {
    const s = b.id ? stok.get(b.id) : undefined;
    return s ? { ...b, stok: s.available, stokStatus: s.status } : { ...b, stok: undefined, stokStatus: undefined };
  });
}

// ── Status order (pemenuhan Farmasi) — selaras resepShared ─
export type BmhpOrderBucket = "belum" | "proses" | "selesai" | "lain";

const STATUS_BUCKET: Record<string, BmhpOrderBucket> = {
  Menunggu: "belum",
  Diterima: "proses",
  Disiapkan: "proses",
  "Siap Diserahkan": "proses",
  Selesai: "selesai",
  Dikembalikan: "lain",
  Dibatalkan: "lain",
};

export function bmhpOrderBucket(status: string): BmhpOrderBucket {
  return STATUS_BUCKET[status] ?? "belum";
}

export interface BmhpStatusCfg {
  label: string;
  badge: string;
  dot: string;
}

const STATUS_CFG: Record<string, BmhpStatusCfg> = {
  Menunggu:          { label: "Belum Diterima",       badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
  Diterima:          { label: "Diterima Farmasi",     badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",          dot: "bg-teal-500"    },
  Disiapkan:         { label: "Disiapkan",            badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",          dot: "bg-cyan-500"    },
  "Siap Diserahkan": { label: "Disiapkan",            badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",          dot: "bg-cyan-500"    },
  Selesai:           { label: "Selesai · Diserahkan", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  Dikembalikan:      { label: "Dikembalikan",         badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-400"    },
  Dibatalkan:        { label: "Dibatalkan",           badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",      dot: "bg-slate-400"   },
};

export function bmhpOrderStatusCfg(status: string): BmhpStatusCfg {
  return STATUS_CFG[status] ?? { label: status || "—", badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
}

const BUCKET_ROW_BG: Record<BmhpOrderBucket, string> = {
  belum:   "bg-amber-50/70 hover:bg-amber-100/70",
  proses:  "bg-emerald-50/70 hover:bg-emerald-100/70",
  selesai: "bg-emerald-50/70 hover:bg-emerald-100/70",
  lain:    "bg-rose-50/70 hover:bg-rose-100/70",
};

export function bmhpOrderRowBg(status: string): string {
  return BUCKET_ROW_BG[bmhpOrderBucket(status)];
}
