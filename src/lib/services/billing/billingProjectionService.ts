// billingProjectionService — proyeksikan tabel order klinis 1 kunjungan → charge billing
// (READ-ONLY, Slice 1). Order = sumber kebenaran; TIDAK menyalin baris. Harga = snapshot saat
// order (Tindakan/Resep/Lab/Rad/BMHP) kecuali Akomodasi (rate per kelas). Order Dibatalkan/Ditolak
// TIDAK dihitung (selaras costByType Daftar Order). Tanpa authz internal — gate di route()
// (billing.invoice:read, cross-unit; scopeKunjungan default false untuk resource non-clinical).

import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as tindakanDal from "@/lib/dal/tindakanMedis/tindakanMedisDal";
import * as resepDal from "@/lib/dal/resep/resepDal";
import * as labDal from "@/lib/dal/lab/labOrderDal";
import * as radDal from "@/lib/dal/rad/radOrderDal";
import * as bmhpDal from "@/lib/dal/bmhpOrder/bmhpOrderDal";
import * as billingReadDal from "@/lib/dal/billing/billingReadDal";
import { deriveBillingStatus } from "./billingStatus";
import { Errors } from "@/lib/errors/appError";
import type {
  BillingProjectionDTO, BillingChargeDTO, BillingSourceModul, BillingCoverage,
  BillingKunjunganRowDTO,
} from "@/lib/schemas/billing/projection";

// Order dengan status terminal-batal → dikecualikan dari akumulasi tagihan.
const CANCELLED = new Set(["Dibatalkan", "Ditolak"]);
const isLive = (status: string) => !CANCELLED.has(status);

// Tarif akomodasi per hari, per kelas (belum ada master rate kamar → konstanta; sinkron dgn
// priceResolver.AKOMODASI_RATE_PER_HARI sisi mock). Basis tagihan = kelasHak (titipan) ?? kelas.
const AKOMODASI_RATE: Record<string, number> = {
  VIP: 2_000_000, Kelas_1: 1_200_000, Kelas_2: 800_000, Kelas_3: 450_000,
  ICU: 1_500_000, HCU: 1_000_000, Isolasi: 800_000,
};

const KELAS_LABEL: Record<string, string> = {
  VIP: "VIP", Kelas_1: "Kelas 1", Kelas_2: "Kelas 2", Kelas_3: "Kelas 3",
  ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
};

const iso = (d: Date | string | null | undefined): string =>
  d == null ? "" : (typeof d === "string" ? d : d.toISOString());

/** Usia (tahun) dari tanggal lahir. Null → 0. */
function ageFrom(tglLahir: Date | null): number {
  if (!tglLahir) return 0;
  const ms = Date.now() - tglLahir.getTime();
  return ms > 0 ? Math.floor(ms / (365.25 * 24 * 3600 * 1000)) : 0;
}

const DAY_MS = 86_400_000;

/** Jumlah hari rawat (RI): hari masuk dihitung, hari pulang tidak (min 1). Basis UTC-day. */
function rawatDays(admitISO: string, endISO: string): number {
  const start = new Date(admitISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(1, Math.round((endDay - startDay) / DAY_MS));
}

/** Total akomodasi (rate kelas × hari rawat) — untuk baris worklist. 0 bila tanpa tier/rate. */
function akomodasiSum(tier: string | null, admitISO: string, endISO: string): number {
  if (!tier) return 0;
  const rate = AKOMODASI_RATE[tier] ?? 0;
  return rate === 0 ? 0 : rate * rawatDays(admitISO, endISO);
}

/** Proyeksi hari rawat (RI) → 1 charge per hari "Kamar …". Hari masuk dihitung, hari pulang tidak. */
function projectAkomodasi(
  kunjunganId: string, tier: string | null, admitISO: string, endISO: string, coverage: BillingCoverage,
): BillingChargeDTO[] {
  if (!tier) return [];
  const rate = AKOMODASI_RATE[tier] ?? 0;
  const days = rawatDays(admitISO, endISO);
  if (days === 0) return [];
  const startDay = Date.UTC(
    new Date(admitISO).getUTCFullYear(), new Date(admitISO).getUTCMonth(), new Date(admitISO).getUTCDate(),
  );
  const label = KELAS_LABEL[tier] ?? tier;

  const out: BillingChargeDTO[] = [];
  for (let i = 0; i < days; i++) {
    const dayISO = new Date(startDay + i * DAY_MS).toISOString().slice(0, 10);
    out.push({
      id: `akomodasi-${kunjunganId}-${dayISO}`,
      tanggalISO: `${dayISO}T07:00`,
      nama: `Kamar ${label} — ${dayISO}`,
      sourceModul: "Akomodasi",
      sourceRef: `akomodasi:${kunjunganId}:${dayISO}`,
      kategori: "Akomodasi",
      qty: 1,
      satuan: "hari",
      hargaSatuan: rate,
      coverage,
      untariffed: rate === 0,
    });
  }
  return out;
}

async function projectByKunjungan(kunjunganId: string): Promise<BillingProjectionDTO> {
  const k = await kunjunganDal.findById(kunjunganId);
  if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");

  const [tindakan, resep, lab, rad, bmhp] = await Promise.all([
    tindakanDal.list(kunjunganId),
    resepDal.listByKunjungan(kunjunganId),
    labDal.listByKunjungan(kunjunganId),
    radDal.listByKunjungan(kunjunganId),
    bmhpDal.listByKunjungan(kunjunganId),
  ]);

  const coverage: BillingCoverage = k.penjaminTipe === "Umum" ? "Pasien" : "Penjamin";
  const unitMod: BillingSourceModul = k.unit === "IGD" ? "IGD" : k.unit === "RawatJalan" ? "RJ" : "RI";

  const items: BillingChargeDTO[] = [];

  // ── Tindakan (harga per-unit × jumlah; tanpa status = selalu live) ──
  for (const t of tindakan) {
    items.push({
      id: `tindakan-${t.id}`,
      tanggalISO: iso(t.dilakukanPada ?? t.createdAt),
      nama: t.nama,
      sourceModul: unitMod,
      sourceRef: `tindakan:${t.id}`,
      kategori: "Tindakan",
      qty: t.jumlah,
      satuan: "kali",
      hargaSatuan: t.harga ?? 0,
      coverage,
      untariffed: t.harga == null,
    });
  }

  // ── Resep (obat) → 1 charge per item baris ──
  for (const o of resep) {
    if (!isLive(o.status)) continue;
    for (const it of o.items) {
      items.push({
        id: `resep-${it.id}`,
        tanggalISO: iso(o.createdAt),
        nama: it.namaObat,
        sourceModul: "Farmasi",
        sourceRef: `resep:${o.id}:${it.id}`,
        kategori: "Obat & BMHP",
        qty: it.jumlah,
        satuan: "pcs",
        hargaSatuan: it.harga ?? 0,
        coverage,
        untariffed: it.harga == null,
      });
    }
  }

  // ── Lab → 1 charge per tes ──
  for (const o of lab) {
    if (!isLive(o.status)) continue;
    for (const it of o.items) {
      items.push({
        id: `lab-${it.id}`,
        tanggalISO: iso(o.createdAt),
        nama: it.namaTes,
        sourceModul: "Lab",
        sourceRef: `lab:${o.id}:${it.kodeTes}`,
        kategori: "Lab",
        qty: 1,
        satuan: "tes",
        hargaSatuan: it.harga ?? 0,
        coverage,
        untariffed: it.harga == null,
      });
    }
  }

  // ── Rad → 1 charge per pemeriksaan ──
  for (const o of rad) {
    if (!isLive(o.status)) continue;
    for (const it of o.items) {
      items.push({
        id: `rad-${it.id}`,
        tanggalISO: iso(o.createdAt),
        nama: it.nama,
        sourceModul: "Rad",
        sourceRef: `rad:${o.id}:${it.kode}`,
        kategori: "Rad",
        qty: 1,
        satuan: "kali",
        hargaSatuan: it.harga ?? 0,
        coverage,
        untariffed: it.harga == null,
      });
    }
  }

  // ── BMHP → 1 charge per item ──
  for (const o of bmhp) {
    if (!isLive(o.status)) continue;
    for (const it of o.items) {
      items.push({
        id: `bmhp-${it.id}`,
        tanggalISO: iso(o.createdAt),
        nama: it.nama,
        sourceModul: "Farmasi",
        sourceRef: `bmhp:${o.id}:${it.id}`,
        kategori: "Obat & BMHP",
        qty: it.jumlah,
        satuan: it.satuan || "pcs",
        hargaSatuan: it.harga ?? 0,
        coverage,
        untariffed: it.harga == null,
      });
    }
  }

  // ── Akomodasi (RI saja) — proyeksi hari rawat × rate kelas (basis kelasHak) ──
  if (k.unit === "RawatInap") {
    const tier = k.kelasHak ?? k.kelas ?? null;
    const endISO = iso(k.selesaiAt) || new Date().toISOString();
    items.push(...projectAkomodasi(kunjunganId, tier, iso(k.waktuKunjungan), endISO, coverage));
  }

  const subtotal = items.reduce((s, it) => s + it.hargaSatuan * it.qty, 0);
  const untariffedCount = items.filter((it) => it.untariffed).length;

  return {
    kunjunganId: k.id,
    noKunjungan: k.noKunjungan,
    unit: k.unit,
    status: k.status,
    locked: k.lockedAt != null,
    selesaiAt: k.selesaiAt ? iso(k.selesaiAt) : null,
    pasien: { id: k.pasien.id, noRM: k.pasien.noRm, nama: k.pasien.nama },
    penjaminTipe: k.penjaminTipe,
    kelas: k.kelas ?? null,
    kelasHak: k.kelasHak ?? null,
    noSep: k.sep?.noSep ?? null,
    items,
    subtotal,
    untariffedCount,
  };
}

/** Worklist "Tagihan Kunjungan" — kunjungan yang punya order + total proyeksi (order + akomodasi). */
async function listKunjunganBilling(limit = 100): Promise<BillingKunjunganRowDTO[]> {
  const agg = await billingReadDal.aggregateOrderTotals();
  if (agg.length === 0) return [];

  const totals = new Map(agg.map((a) => [a.kid, { subtotal: Number(a.subtotal), n: Number(a.n) }]));
  const ids = [...totals.keys()];
  const [headers, paidAgg] = await Promise.all([
    billingReadDal.findKunjunganHeaders(ids),
    billingReadDal.aggregatePaid(ids),
  ]);
  const paidMap = new Map(paidAgg.map((p) => [p.kid, Number(p.dibayar)]));

  const rows: BillingKunjunganRowDTO[] = headers.map((k) => {
    const t = totals.get(k.id) ?? { subtotal: 0, n: 0 };
    const admit = iso(k.waktuKunjungan);
    const endISO = iso(k.selesaiAt) || new Date().toISOString();
    const akom = k.unit === "RawatInap" ? akomodasiSum(k.kelasHak ?? k.kelas ?? null, admit, endISO) : 0;
    const total = t.subtotal + akom;                       // grand total (adjustment=0 s/d Slice 2d)
    const dibayar = paidMap.get(k.id) ?? 0;
    const sisa = Math.max(0, total - dibayar);
    return {
      kunjunganId: k.id,
      noKunjungan: k.noKunjungan,
      unit: k.unit,
      status: k.status,
      locked: k.lockedAt != null,
      waktuKunjungan: admit,
      selesaiAt: k.selesaiAt ? iso(k.selesaiAt) : null,
      pasien: {
        noRM: k.pasien.noRm,
        nama: k.pasien.nama,
        gender: k.pasien.gender === "P" ? "P" : "L",
        age: ageFrom(k.pasien.tanggalLahir),
      },
      penjaminTipe: k.penjaminTipe,
      kelas: k.kelas ?? null,
      total,
      itemCount: t.n,
      dibayar,
      sisa,
      billingStatus: deriveBillingStatus(total, total, dibayar),
    };
  });

  rows.sort((a, b) => b.waktuKunjungan.localeCompare(a.waktuKunjungan));
  return rows.slice(0, limit);
}

export const billingProjectionService = { projectByKunjungan, listKunjunganBilling };
