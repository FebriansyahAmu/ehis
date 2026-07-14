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

/** Header kunjungan (typed) untuk daftar ids — pasien + info tarif/akomodasi. */
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
