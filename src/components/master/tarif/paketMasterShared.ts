// Helper master Paket Layanan (halaman /ehis-master/tarif) — jembatan DTO DB ↔ draft form editable.
// Kode PKT-NNNN AUTO-GEN server → tak diedit di form. items = snapshot {nama, qty} (self-contained).

import type { PaketDTO, CreatePaketInput, UpdatePaketInput } from "@/lib/api/master/paketLayanan";

export type PaketItemDraft = { nama: string; qty: number };

/** Draft editable form. `id`/`kode` absen = paket baru (kode di-generate server saat simpan). */
export interface PaketDraft {
  id?: string;
  kode?: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  items: PaketItemDraft[];
  hargaUmum: number;
  hargaBpjs: number | null;
  diskonPct: number | null;
  badge: string | null;
  status: string;
}

export const PAKET_KATEGORI = ["MCU", "Persalinan", "Bedah", "Dialisis", "Rehabilitasi", "Lainnya"] as const;
export const PAKET_BADGE = ["Populer", "Baru", "Promo"] as const;

export const PAKET_STATUS: { value: string; label: string; bg: string; text: string }[] = [
  { value: "Aktif",     label: "Aktif",     bg: "bg-emerald-50", text: "text-emerald-700" },
  { value: "Draft",     label: "Draft",     bg: "bg-amber-50",   text: "text-amber-700" },
  { value: "Non_Aktif", label: "Non-Aktif", bg: "bg-slate-100",  text: "text-slate-600" },
];

export function statusCfg(status: string) {
  return PAKET_STATUS.find((s) => s.value === status) ?? PAKET_STATUS[0];
}

export function dtoToDraft(d: PaketDTO): PaketDraft {
  return {
    id: d.id, kode: d.kode, nama: d.nama, kategori: d.kategori, deskripsi: d.deskripsi,
    items: d.items.map((i) => ({ nama: i.nama, qty: i.qty })),
    hargaUmum: d.hargaUmum, hargaBpjs: d.hargaBpjs, diskonPct: d.diskonPct, badge: d.badge, status: d.status,
  };
}

export function emptyPaketDraft(): PaketDraft {
  return {
    nama: "", kategori: "Lainnya", deskripsi: "", items: [],
    hargaUmum: 0, hargaBpjs: null, diskonPct: null, badge: null, status: "Draft",
  };
}

// ── Draft → input server (allow-list; buang item kosong; normalisasi enum) ──────
type Kategori = (typeof PAKET_KATEGORI)[number];
type Badge = (typeof PAKET_BADGE)[number];

function kategoriInput(k: string): Kategori {
  return (PAKET_KATEGORI as readonly string[]).includes(k) ? (k as Kategori) : "Lainnya";
}
function statusInput(s: string): "Aktif" | "Non_Aktif" | "Draft" {
  return s === "Aktif" || s === "Non_Aktif" || s === "Draft" ? s : "Draft";
}
function badgeInput(b: string | null): Badge | undefined {
  return b === "Populer" || b === "Baru" || b === "Promo" ? b : undefined;
}
function cleanItems(items: PaketItemDraft[]): PaketItemDraft[] {
  return items.filter((i) => i.nama.trim()).map((i) => ({ nama: i.nama.trim(), qty: Math.max(1, i.qty) }));
}

export function draftToCreateInput(d: PaketDraft): CreatePaketInput {
  return {
    nama: d.nama.trim(),
    kategori: kategoriInput(d.kategori),
    deskripsi: d.deskripsi.trim() || undefined,
    items: cleanItems(d.items),
    hargaUmum: d.hargaUmum,
    hargaBpjs: d.hargaBpjs ?? undefined,
    diskonPct: d.diskonPct ?? undefined,
    badge: badgeInput(d.badge),
    status: statusInput(d.status),
  };
}

export function draftToUpdateInput(d: PaketDraft): UpdatePaketInput {
  return {
    nama: d.nama.trim(),
    kategori: kategoriInput(d.kategori),
    deskripsi: d.deskripsi.trim() || undefined,
    items: cleanItems(d.items),
    hargaUmum: d.hargaUmum,
    hargaBpjs: d.hargaBpjs,          // null = hapus tarif BPJS
    diskonPct: d.diskonPct,
    badge: badgeInput(d.badge) ?? null,
    status: statusInput(d.status),
  };
}
