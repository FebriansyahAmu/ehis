// billingReadDal — read-only agregat proyeksi billing (Slice 1). Sum order per kunjungan lintas 5
// tabel (harga*jumlah utk tindakan/resep/bmhp; harga utk lab/rad), order Dibatalkan/Ditolak
// dikecualikan. Header kunjungan diambil typed via Prisma. Tanpa aturan bisnis (akomodasi & mapping
// di service). Cast SUM ke ::bigint → aman > 2^31 (dikonversi Number di service).

import { db } from "@/lib/db/prisma";

export interface OrderAggRow {
  kid: string;
  subtotal: bigint;
  n: bigint;
}

export interface PaidAggRow {
  kid: string;
  dibayar: bigint;
}

/** Agregat total order per kunjungan (semua kunjungan yang PUNYA order berharga). */
export function aggregateOrderTotals() {
  return db().$queryRaw<OrderAggRow[]>`
    WITH agg AS (
      SELECT kunjungan_id AS kid, COALESCE(SUM(harga * jumlah), 0)::bigint AS v, COUNT(*)::bigint AS n
        FROM medicalrecord.tindakan_medis
        WHERE deleted_at IS NULL
        GROUP BY kunjungan_id
      UNION ALL
      SELECT o.kunjungan_id, COALESCE(SUM(i.harga * i.jumlah), 0)::bigint, COUNT(*)::bigint
        FROM medicalrecord.resep_order o JOIN medicalrecord.resep_item i ON i.resep_order_id = o.id
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('Dibatalkan', 'Ditolak')
        GROUP BY o.kunjungan_id
      UNION ALL
      SELECT o.kunjungan_id, COALESCE(SUM(i.harga), 0)::bigint, COUNT(*)::bigint
        FROM medicalrecord.lab_order o JOIN medicalrecord.lab_order_item i ON i.lab_order_id = o.id
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('Dibatalkan', 'Ditolak')
        GROUP BY o.kunjungan_id
      UNION ALL
      SELECT o.kunjungan_id, COALESCE(SUM(i.harga), 0)::bigint, COUNT(*)::bigint
        FROM medicalrecord.rad_order o JOIN medicalrecord.rad_order_item i ON i.rad_order_id = o.id
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('Dibatalkan', 'Ditolak')
        GROUP BY o.kunjungan_id
      UNION ALL
      SELECT o.kunjungan_id, COALESCE(SUM(i.harga * i.jumlah), 0)::bigint, COUNT(*)::bigint
        FROM medicalrecord.bmhp_order o JOIN medicalrecord.bmhp_item i ON i.bmhp_order_id = o.id
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('Dibatalkan', 'Ditolak')
        GROUP BY o.kunjungan_id
    )
    SELECT kid::text AS kid, SUM(v)::bigint AS subtotal, SUM(n)::bigint AS n
    FROM agg
    GROUP BY kid;
  `;
}

/** Σ reduksi penyesuaian per-baris (item_adjustment) per kunjungan — board kurangi dari total. */
export function aggregateItemAdjustment(kunjunganIds: string[]) {
  if (kunjunganIds.length === 0) return Promise.resolve([] as { kid: string; reduksi: bigint }[]);
  return db().$queryRaw<{ kid: string; reduksi: bigint }[]>`
    SELECT i.kunjungan_id::text AS kid, COALESCE(SUM(a.reduksi), 0)::bigint AS reduksi
      FROM billing.item_adjustment a
      JOIN billing.invoice i ON i.id = a.invoice_id
      WHERE i.kunjungan_id = ANY(${kunjunganIds}::uuid[])
      GROUP BY i.kunjungan_id;
  `;
}

/** Status finalisasi invoice (Draft|Final) per kunjungan. Kunjungan tanpa invoice → absen (Draft). */
export function findInvoiceLifecycles(kunjunganIds: string[]) {
  if (kunjunganIds.length === 0) return Promise.resolve([] as { kunjunganId: string; status: string }[]);
  return db().invoice.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    select: { kunjunganId: true, status: true },
  });
}

/** Total dibayar (Σ payment non-void) per kunjungan, via invoice. Kunjungan tanpa invoice → absen. */
export function aggregatePaid(kunjunganIds: string[]) {
  if (kunjunganIds.length === 0) return Promise.resolve([] as PaidAggRow[]);
  return db().$queryRaw<PaidAggRow[]>`
    SELECT i.kunjungan_id::text AS kid, COALESCE(SUM(p.nominal), 0)::bigint AS dibayar
      FROM billing.invoice i
      JOIN billing.payment p ON p.invoice_id = i.id AND p.voided = false
      WHERE i.kunjungan_id = ANY(${kunjunganIds}::uuid[])
      GROUP BY i.kunjungan_id;
  `;
}

export interface RecentPaymentRow {
  id: string;
  noKwitansi: string;
  metode: string;
  kategori: string;
  nominal: number;
  kasir: string;
  source: string | null;
  bank: string | null;
  noRef: string | null;
  catatan: string | null;
  voided: boolean;
  createdAt: Date;
  kunjunganId: string;
  noInvoice: string;
}

export interface PaymentSummaryRow {
  metode: string;
  masuk: bigint;   // Σ nominal non-refund
  refund: bigint;  // Σ |nominal| refund
  trx: bigint;     // count non-refund
}

/** Agregat pembayaran (non-void) per metode — filter opsional shiftId dan/atau tanggal (YYYY-MM-DD). */
export function aggregatePaymentSummary(opts: { shiftId?: string; date?: string }) {
  const conds: string[] = ["p.voided = false"];
  const params: unknown[] = [];
  if (opts.shiftId) { params.push(opts.shiftId); conds.push(`p.shift_id = $${params.length}`); }
  if (opts.date) { params.push(opts.date); conds.push(`p.created_at::date = $${params.length}::date`); }
  const sql = `
    SELECT p.metode,
      COALESCE(SUM(CASE WHEN p.kategori <> 'Refund' THEN p.nominal ELSE 0 END), 0)::bigint AS masuk,
      COALESCE(SUM(CASE WHEN p.kategori = 'Refund' THEN -p.nominal ELSE 0 END), 0)::bigint AS refund,
      COUNT(*) FILTER (WHERE p.kategori <> 'Refund')::bigint AS trx
    FROM billing.payment p
    WHERE ${conds.join(" AND ")}
    GROUP BY p.metode`;
  return db().$queryRawUnsafe<PaymentSummaryRow[]>(sql, ...params);
}

export interface ShiftMetodeAggRow {
  shiftId: string;
  metode: string;
  masuk: bigint;   // Σ nominal non-refund
  refund: bigint;  // Σ |nominal| refund
  trx: bigint;     // count non-refund
}

/** Agregat pembayaran (non-void) per shift × metode — totals live shift Open. */
export function aggregatePaymentByShifts(shiftIds: string[]) {
  if (shiftIds.length === 0) return Promise.resolve([] as ShiftMetodeAggRow[]);
  return db().$queryRaw<ShiftMetodeAggRow[]>`
    SELECT p.shift_id AS "shiftId", p.metode,
      COALESCE(SUM(CASE WHEN p.kategori <> 'Refund' THEN p.nominal ELSE 0 END), 0)::bigint AS masuk,
      COALESCE(SUM(CASE WHEN p.kategori = 'Refund' THEN -p.nominal ELSE 0 END), 0)::bigint AS refund,
      COUNT(*) FILTER (WHERE p.kategori <> 'Refund')::bigint AS trx
    FROM billing.payment p
    WHERE p.voided = false AND p.shift_id = ANY(${shiftIds}::text[])
    GROUP BY p.shift_id, p.metode;
  `;
}

/** Pembayaran terbaru (non-void), opsional per shift. Join billing.* saja; pasien di-resolve Service. */
export function listRecentPaymentRows(shiftId: string | undefined, limit: number) {
  const cols = `p.id, p.no_kwitansi AS "noKwitansi", p.metode, p.kategori, p.nominal, p.kasir,
      p.source, p.bank, p.no_ref AS "noRef", p.catatan, p.voided,
      p.created_at AS "createdAt", i.kunjungan_id::text AS "kunjunganId", i.no_invoice AS "noInvoice"`;
  const base = `SELECT ${cols}
     FROM billing.payment p JOIN billing.invoice i ON i.id = p.invoice_id
     WHERE p.voided = false`;
  if (shiftId) {
    return db().$queryRawUnsafe<RecentPaymentRow[]>(
      `${base} AND p.shift_id = $1 ORDER BY p.created_at DESC LIMIT $2`,
      shiftId, limit,
    );
  }
  return db().$queryRawUnsafe<RecentPaymentRow[]>(
    `${base} ORDER BY p.created_at DESC LIMIT $1`,
    limit,
  );
}

/** Header kunjungan (typed) untuk daftar ids — pasien + info tarif/akomodasi. */
/**
 * Header kunjungan yang BERPOTENSI bertagihan — semua kunjungan hidup kecuali `Cancelled`.
 *
 * Sengaja TIDAK disaring "punya order": biaya administrasi ditagih per kunjungan (semua unit) dan
 * akomodasi RI dihitung per hari, jadi kunjungan tanpa order pun tetap punya tagihan nyata.
 * Menyaring dari order akan menyembunyikannya — termasuk pasien RI baru masuk yang justru
 * paling perlu ditagih deposit.
 */
export function listBillableHeaders(limit: number) {
  return db().kunjungan.findMany({
    where: { deletedAt: null, status: { not: "Cancelled" } },
    orderBy: { waktuKunjungan: "desc" },
    take: limit,
    select: {
      id: true, noKunjungan: true, unit: true, status: true,
      waktuKunjungan: true, selesaiAt: true, lockedAt: true,
      kelas: true, kelasHak: true, penjaminTipe: true,
      pasien: { select: { noRm: true, nama: true, gender: true, tanggalLahir: true } },
    },
  });
}

/**
 * Header bertagihan untuk SATU pasien (kartu Tagihan di dashboard pasien registrasi). Sama seperti
 * listBillableHeaders tapi difilter patientId — semua kunjungan hidup pasien kecuali Cancelled.
 */
export function listBillableHeadersByPatient(patientId: string) {
  return db().kunjungan.findMany({
    where: { patientId, deletedAt: null, status: { not: "Cancelled" } },
    orderBy: { waktuKunjungan: "desc" },
    select: {
      id: true, noKunjungan: true, unit: true, status: true,
      waktuKunjungan: true, selesaiAt: true, lockedAt: true,
      kelas: true, kelasHak: true, penjaminTipe: true,
      pasien: { select: { noRm: true, nama: true, gender: true, tanggalLahir: true } },
    },
  });
}

export function findKunjunganHeaders(ids: string[]) {
  return db().kunjungan.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: {
      id: true, noKunjungan: true, unit: true, status: true,
      waktuKunjungan: true, selesaiAt: true, lockedAt: true,
      kelas: true, kelasHak: true, penjaminTipe: true,
      pasien: { select: { noRm: true, nama: true, gender: true, tanggalLahir: true } },
    },
  });
}
