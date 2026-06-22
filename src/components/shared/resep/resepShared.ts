import type { KategoriObat, StatusMAR, DecisionRekonsiliasi, ResepRIItem, MAREntry } from "@/lib/data";
import { ALLERGY_MOCK, type AllergySeverity } from "@/components/shared/asesmen/asesmenShared";
import type { ObatTersediaDTO } from "@/lib/schemas/master/obatTersedia";
import type { StokKlinisRow, StokKlinisStatus } from "@/lib/api/inventory/stock";

// ── Shared patient interface (minimal — RI, IGD, RJ all satisfy) ──

export interface ResepPatient {
  noRM:           string;
  name:           string;
  /** ID kunjungan (UUID bila terpersist) — dipakai menarik alergi nyata dari rekam medis. */
  kunjunganId?:   string;
  dpjp:           string;
  /** No. kontak DPJP penulis resep. "-" / kosong → ditampilkan sebagai "-". */
  dpjpKontak?:    string;
  /** Jenis kelamin — menentukan tampil-tidaknya status kehamilan & menyusui. */
  gender?:        "L" | "P";
  riwayatAlergi?: string;
  resepRI?:       { items: ResepRIItem[]; mar: MAREntry[] };
  perawatJaga?:   string;
}

// ── Obat catalog ─────────────────────────────────────────

export interface ObatCatalog {
  /** UUID master Obat — kunci merge stok inventory per depo (absen utk katalog mock). */
  obatId?:  string;
  kode:     string;
  nama:     string;
  dosis:    string;
  satuan:   string;
  stok:     number;
  kategori: KategoriObat;
  isHAM?:   boolean;
  /** Harga satuan (Rp) dari katalog Obat — snapshot tarif saat order. Absen utk katalog mock. */
  harga?:   number;
  /** Status stok di depo terpilih (overlay advisory). Absen → badge tak ditampilkan. */
  stokStatus?: StokKlinisStatus;
}

export const OBAT_CATALOG: ObatCatalog[] = [
  { kode: "FAR-001", nama: "Aspirin 100mg",         dosis: "100",  satuan: "mg",     stok: 150, kategori: "Reguler"      },
  { kode: "FAR-002", nama: "Aspirin 500mg",          dosis: "500",  satuan: "mg",     stok: 80,  kategori: "Reguler"      },
  { kode: "FAR-003", nama: "Amoxicillin 500mg",      dosis: "500",  satuan: "mg",     stok: 200, kategori: "Reguler"      },
  { kode: "FAR-004", nama: "Clopidogrel 75mg",       dosis: "75",   satuan: "mg",     stok: 60,  kategori: "Reguler"      },
  { kode: "FAR-005", nama: "Atorvastatin 20mg",      dosis: "20",   satuan: "mg",     stok: 120, kategori: "Reguler"      },
  { kode: "FAR-006", nama: "Atorvastatin 40mg",      dosis: "40",   satuan: "mg",     stok: 75,  kategori: "Reguler"      },
  { kode: "FAR-007", nama: "Metformin 500mg",        dosis: "500",  satuan: "mg",     stok: 300, kategori: "Reguler"      },
  { kode: "FAR-008", nama: "Amlodipine 5mg",         dosis: "5",    satuan: "mg",     stok: 90,  kategori: "Reguler"      },
  { kode: "FAR-009", nama: "Omeprazole 20mg",        dosis: "20",   satuan: "mg",     stok: 250, kategori: "Reguler"      },
  { kode: "FAR-010", nama: "Paracetamol 500mg",      dosis: "500",  satuan: "mg",     stok: 500, kategori: "Reguler"      },
  { kode: "FAR-011", nama: "Ibuprofen 400mg",        dosis: "400",  satuan: "mg",     stok: 180, kategori: "Reguler"      },
  { kode: "FAR-012", nama: "Furosemide 40mg",        dosis: "40",   satuan: "mg",     stok: 100, kategori: "Reguler"      },
  { kode: "FAR-013", nama: "NaCl 0.9% 500mL",        dosis: "500",  satuan: "mL",     stok: 80,  kategori: "Reguler"      },
  { kode: "FAR-014", nama: "Dextrose 5% 500mL",      dosis: "500",  satuan: "mL",     stok: 60,  kategori: "Reguler"      },
  { kode: "FAR-015", nama: "Dopamin 200mg/5mL",      dosis: "200",  satuan: "mg/5mL", stok: 25,  kategori: "Reguler",      isHAM: true },
  { kode: "FAR-016", nama: "Morfin 10mg/mL Inj",     dosis: "10",   satuan: "mg/mL",  stok: 20,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-017", nama: "Fentanyl 100mcg Inj",    dosis: "100",  satuan: "mcg",    stok: 15,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-018", nama: "Codein 10mg",             dosis: "10",   satuan: "mg",     stok: 40,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-019", nama: "Midazolam 5mg/5mL",      dosis: "5",    satuan: "mg/5mL", stok: 30,  kategori: "Psikotropika", isHAM: true },
  { kode: "FAR-020", nama: "Diazepam 5mg",            dosis: "5",    satuan: "mg",     stok: 50,  kategori: "Psikotropika", isHAM: true },
  { kode: "FAR-021", nama: "Alprazolam 0.5mg",        dosis: "0.5",  satuan: "mg",     stok: 35,  kategori: "Psikotropika", isHAM: true },
];

// ── Form options ─────────────────────────────────────────

export const SIGNA_OPTIONS = [
  { val: "1×1",    label: "Sekali sehari satu"      },
  { val: "2×1",    label: "Dua kali sehari satu"    },
  { val: "3×1",    label: "Tiga kali sehari satu"   },
  { val: "4×1",    label: "Empat kali sehari satu"  },
  { val: "1×2",    label: "Sekali sehari dua"       },
  { val: "2×2",    label: "Dua kali sehari dua"     },
  { val: "3×2",    label: "Tiga kali sehari dua"    },
  { val: "PRN",    label: "Jika perlu (PRN)"        },
  { val: "Titrasi",label: "Sesuai titrasi"          },
] as const;

export const ATURAN_WAKTU = [
  "AC (Sebelum Makan)",
  "PC (Sesudah Makan)",
  "Bersama Makan",
  "Terlepas dari Makan",
  "Malam Hari",
] as const;

export const RUTE_OPTIONS = [
  "Oral", "Sublingual", "IV Bolus", "IV Drip",
  "IM", "SC", "Inhalasi", "Topikal", "Rektal", "NGT",
] as const;

export const DEPO_OPTIONS = [
  "Depo Rawat Inap",
  "Depo IGD",
  "Apotek Rawat Jalan",
  "Apotek 24 Jam",
] as const;

// ── Badge / style configs ────────────────────────────────

export const KATEGORI_BADGE: Record<KategoriObat, string> = {
  Reguler:     "bg-slate-100 text-slate-600",
  Narkotika:   "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  Psikotropika:"bg-amber-100 text-amber-700 ring-1 ring-amber-200",
};

export const HAM_BADGE = "bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded";

export const MAR_CONFIG: Record<StatusMAR, { label: string; cls: string; dot: string }> = {
  Diberikan:     { label: "✓",  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Ditunda:       { label: "!",  cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",    dot: "bg-amber-400"   },
  Ditolak:       { label: "✗",  cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200",     dot: "bg-rose-400"    },
  TidakTersedia: { label: "N/S",cls: "bg-slate-100 text-slate-500  ring-1 ring-slate-200",    dot: "bg-slate-300"   },
  NA:            { label: "—",  cls: "bg-slate-50  text-slate-300",                           dot: "bg-slate-200"   },
};

export const DECISION_CONFIG: Record<DecisionRekonsiliasi, { cls: string; dot: string }> = {
  Lanjutkan: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Hentikan:  { cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200",     dot: "bg-rose-400"    },
  Ganti:     { cls: "bg-sky-50    text-sky-700    ring-1 ring-sky-200",       dot: "bg-sky-400"     },
  Tunda:     { cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",    dot: "bg-amber-400"   },
};

// ── Helpers ──────────────────────────────────────────────

export function genResepId(): string {
  return `rx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

// ── DB obat ter-formularium (obat-tersedia) → ObatCatalog (sumber pencarian resep) ──
// `obat-tersedia` hanya mengembalikan obat AKTIF yang sudah masuk formularium ≥1 ruangan
// (Mapping Hub → Formularium). Stok tak tersedia di formularium → 0 (badge stok dimatikan).
const GOLONGAN_NARKO = /narkotik/i;
const GOLONGAN_PSIKO = /psikotrop/i;
export function obatTersediaToCatalog(o: ObatTersediaDTO): ObatCatalog {
  const g = `${o.golongan ?? ""} ${o.kategori ?? ""}`;
  const kategori: KategoriObat = GOLONGAN_NARKO.test(g)
    ? "Narkotika"
    : GOLONGAN_PSIKO.test(g)
      ? "Psikotropika"
      : "Reguler";
  return {
    obatId: o.id,
    kode: o.kode,
    nama: o.kekuatan ? `${o.namaGenerik} ${o.kekuatan}` : o.namaGenerik,
    dosis: o.kekuatan || "",
    satuan: o.satuanTerkecil ?? "",
    stok: 0,
    kategori,
    isHAM: o.isHAM,
    harga: o.hargaSatuan ?? undefined,
  };
}

// ── Overlay stok inventory (advisory) ─────────────────────
// Stok TIDAK memfilter/menggagalkan peresepan — hanya info. Penjaga stok ada di dispensing Farmasi.

/** Warna teks badge stok per status. */
export const STOK_TEXT: Record<StokKlinisStatus, string> = {
  Aman:    "text-emerald-600",
  Menipis: "text-amber-600",
  Habis:   "text-rose-500",
};

/** Label badge stok (number utk Aman/Menipis, "Habis" utk 0). */
export function stokLabel(status: StokKlinisStatus, qty: number): string {
  if (status === "Habis") return "Habis";
  return `${status === "Menipis" ? "Menipis" : "Stok"}: ${qty}`;
}

/** Tempelkan stok depo ke katalog by `obatId`. Item tanpa saldo di depo → stokStatus undefined
 *  (badge tak tampil). Map kosong → katalog dikembalikan apa adanya. */
export function applyStokDepo(catalog: ObatCatalog[], stok: Map<string, StokKlinisRow>): ObatCatalog[] {
  if (stok.size === 0) return catalog;
  return catalog.map((o) => {
    const s = o.obatId ? stok.get(o.obatId) : undefined;
    return s ? { ...o, stok: s.qtyOnHand, stokStatus: s.status } : { ...o, stokStatus: undefined };
  });
}

// ── Status order resep (pemenuhan Farmasi) ────────────────
// Workflow Farmasi: Menunggu → Ditelaah → Siap Diserahkan → Selesai (atau Dikembalikan).
// Dikelompokkan jadi 3 bucket klinis: belum diterima · diproses (sudah diterima Farmasi) · selesai.

export type ResepOrderBucket = "belum" | "proses" | "selesai" | "lain";

const STATUS_BUCKET: Record<string, ResepOrderBucket> = {
  Menunggu:          "belum",
  Diterima:          "proses",
  Ditelaah:          "proses",
  "Siap Diserahkan": "proses",
  Selesai:           "selesai",
  Dikembalikan:      "lain",
  Dibatalkan:        "lain",
};

/** Bucket klinis dari status workflow Farmasi (fallback "belum" utk status tak dikenal). */
export function resepOrderBucket(status: string): ResepOrderBucket {
  return STATUS_BUCKET[status] ?? "belum";
}

export interface ResepOrderStatusCfg {
  label: string; // label klinis (sudut pandang DPJP/perawat, bukan petugas farmasi)
  badge: string;
  dot:   string;
}

export const RESEP_ORDER_STATUS: Record<string, ResepOrderStatusCfg> = {
  Menunggu:          { label: "Belum Diterima",       badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        dot: "bg-amber-400"   },
  Diterima:          { label: "Diterima Farmasi",     badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",              dot: "bg-sky-500"     },
  Ditelaah:          { label: "Ditelaah",             badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",              dot: "bg-sky-400"     },
  "Siap Diserahkan": { label: "Disiapkan",            badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",           dot: "bg-cyan-500"    },
  Selesai:           { label: "Selesai · Diserahkan", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  dot: "bg-emerald-500" },
  Dikembalikan:      { label: "Dikembalikan",         badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",           dot: "bg-rose-400"    },
  Dibatalkan:        { label: "Dibatalkan",           badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",       dot: "bg-slate-400"   },
};

export function resepOrderStatusCfg(status: string): ResepOrderStatusCfg {
  return RESEP_ORDER_STATUS[status] ?? { label: status || "—", badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
}

/** Warna latar baris (soft) per bucket: belum=kuning · diterima/selesai=hijau · dibatalkan/dikembalikan=merah. */
const BUCKET_ROW_BG: Record<ResepOrderBucket, string> = {
  belum:   "bg-amber-50/70 hover:bg-amber-100/70",
  proses:  "bg-emerald-50/70 hover:bg-emerald-100/70",
  selesai: "bg-emerald-50/70 hover:bg-emerald-100/70",
  lain:    "bg-rose-50/70 hover:bg-rose-100/70",
};
export function resepOrderRowBg(status: string): string {
  return BUCKET_ROW_BG[resepOrderBucket(status)];
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtTanggalRI(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ── Kondisi klinis pasien (decision support peresepan) ────
// Status fisiologis/organ yang memengaruhi dosis & keamanan obat.

export const GINJAL_OPTIONS = [
  "Tidak Diketahui",
  "Normal (LFG ≥ 90)",
  "Gangguan Ringan (LFG 60–89)",
  "Gangguan Sedang (LFG 30–59)",
  "Gangguan Berat (LFG 15–29)",
  "Gagal Ginjal (LFG < 15)",
  "Hemodialisis Rutin",
] as const;

export const MENYUSUI_OPTIONS = [
  "Tidak Diketahui",
  "Tidak Menyusui",
  "Sedang Menyusui",
] as const;

export const KEHAMILAN_OPTIONS = [
  "Tidak Diketahui",
  "Tidak Hamil",
  "Hamil — Trimester 1",
  "Hamil — Trimester 2",
  "Hamil — Trimester 3",
] as const;

/** Nilai netral (tak ada peringatan / tak diketahui) per dropdown — dipakai sebagai default & cek "berisiko". */
export const KONDISI_NETRAL = {
  ginjal:    "Tidak Diketahui" as string,
  menyusui:  "Tidak Diketahui" as string,
  kehamilan: "Tidak Diketahui" as string,
};

export interface KondisiKlinis {
  ginjal:    string;
  menyusui:  string;
  kehamilan: string;
}

export const KONDISI_KLINIS_DEFAULT: KondisiKlinis = {
  ginjal:    "Tidak Diketahui",
  menyusui:  "Tidak Diketahui",
  kehamilan: "Tidak Diketahui",
};

// ── Deteksi alergi obat dari anamnesis ────────────────────
// Sumber utama = asesmen alergi terstruktur (ALLERGY_MOCK kategori "Obat");
// fallback = teks bebas `riwayatAlergi`. Pencocokan sadar-golongan (mis. Penisilin → Amoxicillin).

const FAMILY_SYNONYMS: Record<string, string[]> = {
  penisilin:  ["penicillin", "amoxicillin", "amoksisilin", "ampicillin", "ampisilin", "cloxacillin", "kloksasilin"],
  penicillin: ["penicillin", "amoxicillin", "amoksisilin", "ampicillin", "ampisilin", "cloxacillin", "kloksasilin"],
  sulfa:      ["sulfa", "sulfametoksazol", "cotrimoxazole", "kotrimoksazol"],
  nsaid:      ["aspirin", "ibuprofen", "ketorolac", "diclofenac", "diklofenak", "asam mefenamat", "piroksikam", "meloxicam", "natrium diklofenak"],
  aspirin:    ["aspirin", "asetosal", "acetylsalicylic"],
};

const NEGATIF_RE = /tidak ada|tidak diketahui|belum diketahui|tidak ada riwayat|disangkal|\(-\)/i;

/** Daftar alergen obat pasien (terstruktur + teks bebas, ter-dedupe). Kosong = tak ada alergi obat tercatat. */
export function getAlergiObat(noRM: string, riwayatAlergiText?: string): string[] {
  const structured = (ALLERGY_MOCK[noRM] ?? [])
    .filter((a) => a.category === "Obat")
    .map((a) => a.allergen.trim());

  const list = [...structured];
  if (riwayatAlergiText && riwayatAlergiText.trim() && !NEGATIF_RE.test(riwayatAlergiText)) {
    list.push(riwayatAlergiText.trim());
  }
  return [...new Set(list.filter(Boolean))];
}

/** Kembalikan alergen yang cocok dengan nama obat, atau null. Sadar-golongan + cocok dua arah. */
export function matchAlergiObat(namaObat: string, allergens: string[]): string | null {
  const drug = namaObat.toLowerCase();
  for (const a of allergens) {
    const cleaned = a.toLowerCase().replace(/\(.*?\)/g, " ").trim(); // buang keterangan dalam kurung
    if (!cleaned) continue;
    const token = cleaned.split(/[\s,/]+/)[0];
    if (token.length >= 4 && drug.includes(token)) return a;
    const fam = FAMILY_SYNONYMS[token];
    if (fam && fam.some((f) => drug.includes(f))) return a;
  }
  return null;
}

// ── Referensi alergi obat lengkap (allergen + efek/reaksi) untuk decision-support resep ──

export interface AlergiObatRef {
  allergen: string;
  reactions: string[]; // efek/reaksi tercatat (mis. Anafilaksis, Urtikaria)
  severity?: AllergySeverity;
  bzaKode?: string;    // kode BZA bila allergen ditaut dari Katalog Obat → pencocokan presisi
}

/** Daftar referensi alergi obat (terstruktur + teks bebas). Membawa efek/reaksi & kode BZA. */
export function getAlergiObatRefs(noRM: string, riwayatAlergiText?: string): AlergiObatRef[] {
  const refs: AlergiObatRef[] = (ALLERGY_MOCK[noRM] ?? [])
    .filter((a) => a.category === "Obat")
    .map((a) => ({ allergen: a.allergen.trim(), reactions: a.reactions, severity: a.severity, bzaKode: a.bzaKode }));

  if (riwayatAlergiText && riwayatAlergiText.trim() && !NEGATIF_RE.test(riwayatAlergiText)) {
    const txt = riwayatAlergiText.trim();
    if (!refs.some((r) => r.allergen.toLowerCase() === txt.toLowerCase())) {
      refs.push({ allergen: txt, reactions: [] });
    }
  }
  return refs;
}

/** Gabungkan referensi alergi (mis. dari DB + teks bebas/mock), dedupe per allergen (case-insensitive). */
export function mergeAlergiRefs(...lists: AlergiObatRef[][]): AlergiObatRef[] {
  const seen = new Set<string>();
  const out: AlergiObatRef[] = [];
  for (const list of lists) {
    for (const r of list) {
      const key = r.allergen.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

/** Cocokkan obat dengan referensi alergi — kembalikan ref yang cocok (untuk tampilkan efek), atau null.
 *  Prioritas: kode BZA (presisi) → nama/golongan. `bzaKodes` = BZA obat yang diresepkan (bila tersedia). */
export function matchAlergiObatRef(
  namaObat: string,
  refs: AlergiObatRef[],
  bzaKodes?: string[],
): AlergiObatRef | null {
  if (bzaKodes && bzaKodes.length) {
    const byBza = refs.find((r) => r.bzaKode && bzaKodes.includes(r.bzaKode));
    if (byBza) return byBza;
  }
  const matched = matchAlergiObat(namaObat, refs.map((r) => r.allergen));
  return matched ? refs.find((r) => r.allergen === matched) ?? null : null;
}
