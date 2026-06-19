// Seed Inventory — stok awal (opening) diturunkan dari edge Ketersediaan Farmasi
// (master.formularium_obat + master.formularium_bmhp). Tiap edge (item ⇄ lokasi farmasi) → 1 saldo
// + 1 batch + 1 movement IN (ref OPENING). Qty/min/max/ROP/ED deterministik (hash itemId) supaya
// stabil & bervariasi (sebagian Rendah/Kritis/Habis/Berlebih untuk uji status & monitoring).
//
// Drift-safe & idempoten: hapus movement OPENING lama → upsert saldo/batch. JANGAN sentuh movement
// non-OPENING (transaksi nyata). Jalankan: node --env-file=.env prisma/scripts/seed-inventory.mts
// (tsx tak terpasang — skrip @/-free, pakai pg langsung; lihat reference_seed_run_mechanism.)

import { randomUUID } from "node:crypto";
import { Client } from "pg";

function hashInt(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function plan(itemId, jenis) {
  const h = hashInt(itemId);
  const span = jenis === "Obat" ? 1900 : 5700;
  const base = (jenis === "Obat" ? 100 : 300) + (h % span);
  const min = Math.round(base * 0.15);
  const reorderPoint = Math.round(base * 0.3);
  const max = Math.round(base * 2.5);
  const mod = h % 9;
  let qty = base;
  if (mod === 0) qty = Math.round(reorderPoint * 0.3);      // Kritis
  else if (mod === 1) qty = Math.round(reorderPoint * 0.8); // Rendah
  else if (mod === 2) qty = 0;                              // Habis
  else if (mod === 3) qty = Math.round(max * 0.98);         // Berlebih

  // Kadaluwarsa: Obat 6–17 bln; BMHP 18–41 bln. mod 4 → near-expiry (10–49 hari) untuk monitoring.
  const exp = new Date();
  if (mod === 4) exp.setDate(exp.getDate() + (10 + (h % 40)));
  else exp.setMonth(exp.getMonth() + (jenis === "Obat" ? 6 + (h % 12) : 18 + (h % 24)));
  const expiryDate = exp.toISOString().slice(0, 10);

  const batchNo = `OPN-${itemId.slice(0, 8).toUpperCase()}`;
  return { qty, min, max, reorderPoint, expiryDate, batchNo };
}

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query("BEGIN");

  // ── Rekanan (Vendor) — seed 5 bila tabel kosong (kode VND-001..005 + set counter). ──
  const vCount = Number((await c.query(`SELECT count(*)::int AS n FROM inventory.vendor`)).rows[0].n);
  if (vCount === 0) {
    const vendors = [
      { nama: "PT Kimia Farma Trading & Distribution", jenis: "PBF", izin: "PBF-3273-001", kontak: "Budi Hartono", telp: "022-7234110", email: "order@kftd.co.id", alamat: "Jl. Soekarno-Hatta No. 12, Bandung", lead: 3, status: "Aktif" },
      { nama: "PT Anugerah Pharmindo Lestari (APL)", jenis: "PBF", izin: "PBF-3171-220", kontak: "Sinta Maharani", telp: "021-5849221", email: "cs@apl.co.id", alamat: "Jl. Daan Mogot KM 12, Jakarta Barat", lead: 2, status: "Aktif" },
      { nama: "PT Enseval Putera Megatrading", jenis: "Distributor", izin: "PBF-3275-118", kontak: "Rudi Salim", telp: "021-4615555", email: "sales@enseval.com", alamat: "Jl. Pulo Lentut No. 10, Jakarta Timur", lead: 4, status: "Aktif" },
      { nama: "PT Sinar Roda Utama (Alkes)", jenis: "Distributor", izin: null, kontak: "Maya Putri", telp: "031-7328890", email: "info@sinarroda.co.id", alamat: "Jl. Rungkut Industri No. 5, Surabaya", lead: 5, status: "Aktif" },
      { nama: "PT Otsuka Indonesia", jenis: "Manufaktur", izin: null, kontak: "Hendra Wijaya", telp: "021-8970011", email: "order@otsuka.co.id", alamat: "Lawang, Malang", lead: 7, status: "Non_Aktif" },
    ];
    for (let i = 0; i < vendors.length; i++) {
      const v = vendors[i];
      await c.query(
        `INSERT INTO inventory.vendor (id, kode, nama, jenis, izin_pbf, kontak_nama, telp, email, alamat, lead_time_hari, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4::inventory."VendorJenis", $5, $6, $7, $8, $9, $10, $11::inventory."VendorStatus", now(), now())`,
        [randomUUID(), `VND-${String(i + 1).padStart(3, "0")}`, v.nama, v.jenis, v.izin, v.kontak, v.telp, v.email, v.alamat, v.lead, v.status],
      );
    }
    await c.query(
      `INSERT INTO inventory.inv_counter (kind, periode, last_seq) VALUES ('VND', 'GLOBAL', $1)
       ON CONFLICT (kind, periode) DO UPDATE SET last_seq = GREATEST(inventory.inv_counter.last_seq, EXCLUDED.last_seq)`,
      [vendors.length],
    );
    console.log(`Seeded vendors: ${vendors.length}`);
  }

  // Reset hanya movement bertanda OPENING (idempoten; transaksi nyata aman).
  await c.query(`DELETE FROM inventory.stock_movement WHERE ref_type = 'OPENING'`);

  const obatEdges = (await c.query(
    `SELECT obat_id AS item_id, location_id FROM master.formularium_obat`,
  )).rows.map((r) => ({ ...r, jenis: "Obat" }));
  const bmhpEdges = (await c.query(
    `SELECT bmhp_id AS item_id, location_id FROM master.formularium_bmhp`,
  )).rows.map((r) => ({ ...r, jenis: "BMHP" }));

  let saldo = 0, batch = 0, mv = 0;
  for (const e of [...obatEdges, ...bmhpEdges]) {
    const p = plan(e.item_id, e.jenis);

    // Saldo (rollup) — selalu di-upsert (termasuk qty 0 = Habis → tetap tampil di Daftar Barang).
    await c.query(
      `INSERT INTO inventory.stock_balance
         (id, item_jenis, item_id, location_id, qty_on_hand, qty_reserved, "min", "max", reorder_point, created_at, updated_at)
       VALUES ($1, $2::inventory."ItemJenis", $3, $4, $5, 0, $6, $7, $8, now(), now())
       ON CONFLICT (location_id, item_jenis, item_id)
       DO UPDATE SET qty_on_hand = EXCLUDED.qty_on_hand, "min" = EXCLUDED."min",
                     "max" = EXCLUDED."max", reorder_point = EXCLUDED.reorder_point, updated_at = now()`,
      [randomUUID(), e.jenis, e.item_id, e.location_id, p.qty, p.min, p.max, p.reorderPoint],
    );
    saldo++;

    if (p.qty <= 0) continue; // Habis → tanpa batch/movement

    const batchRes = await c.query(
      `INSERT INTO inventory.stock_batch
         (id, item_jenis, item_id, location_id, batch_no, expiry_date, qty_on_hand, qty_reserved, created_at, updated_at)
       VALUES ($1, $2::inventory."ItemJenis", $3, $4, $5, $6::date, $7, 0, now(), now())
       ON CONFLICT (location_id, item_jenis, item_id, batch_no)
       DO UPDATE SET qty_on_hand = EXCLUDED.qty_on_hand, expiry_date = EXCLUDED.expiry_date, updated_at = now()
       RETURNING id`,
      [randomUUID(), e.jenis, e.item_id, e.location_id, p.batchNo, p.expiryDate, p.qty],
    );
    batch++;

    await c.query(
      `INSERT INTO inventory.stock_movement
         (id, jenis, item_jenis, item_id, to_location_id, batch_id, qty, ref_type, ref_no, petugas, created_at)
       VALUES ($1, 'IN'::inventory."MovementJenis", $2::inventory."ItemJenis", $3, $4, $5, $6, 'OPENING', $7, 'Seed Inventory', now())`,
      [randomUUID(), e.jenis, e.item_id, e.location_id, batchRes.rows[0].id, p.qty, p.batchNo],
    );
    mv++;
  }

  // ── Penerimaan (GoodsReceipt) — seed 2 dokumen (Draft + Diproses, BELUM diposting) bila kosong. ──
  const grCount = Number((await c.query(`SELECT count(*)::int AS n FROM inventory.goods_receipt`)).rows[0].n);
  if (grCount === 0) {
    const gudang = (await c.query(`SELECT id FROM master.location WHERE location_type='Gudang_Farmasi' AND deleted_at IS NULL ORDER BY nama LIMIT 1`)).rows[0]?.id;
    const vendorIds = (await c.query(`SELECT id FROM inventory.vendor ORDER BY kode LIMIT 2`)).rows.map((r) => r.id);
    const obatIds = (await c.query(`SELECT id FROM master.obat WHERE deleted_at IS NULL ORDER BY nama_generik LIMIT 3`)).rows.map((r) => r.id);
    if (gudang && vendorIds.length >= 2 && obatIds.length >= 3) {
      const wib = new Date(Date.now() + 7 * 3600 * 1000);
      const periode = `${String(wib.getUTCFullYear() % 100).padStart(2, "0")}${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
      const ed = new Date(wib); ed.setMonth(ed.getMonth() + 12);
      const edStr = ed.toISOString().slice(0, 10);
      const docs = [
        { no: `GRN-${periode}001`, vendor: vendorIds[0], status: "Draft", sj: "SJ/SEED/001", po: "PO-SEED-001", lines: [{ item: obatIds[0], batch: "GRN-A1", qty: 500, harga: 5000 }, { item: obatIds[1], batch: "GRN-A2", qty: 300, harga: 8000 }] },
        { no: `GRN-${periode}002`, vendor: vendorIds[1], status: "Diproses", sj: "SJ/SEED/002", po: null, lines: [{ item: obatIds[2], batch: "GRN-B1", qty: 1000, harga: 600 }] },
      ];
      for (const d of docs) {
        const rid = randomUUID();
        await c.query(
          `INSERT INTO inventory.goods_receipt (id, no_dokumen, tanggal, vendor_id, no_surat_jalan, no_po, to_location_id, status, petugas, created_at, updated_at)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7::inventory."DocStatus", 'Seed Inventory', now(), now())`,
          [rid, d.no, d.vendor, d.sj, d.po, gudang, d.status],
        );
        for (const l of d.lines) {
          await c.query(
            `INSERT INTO inventory.goods_receipt_item (id, receipt_id, item_jenis, item_id, batch_no, expiry_date, qty, harga_beli)
             VALUES ($1, $2, 'Obat'::inventory."ItemJenis", $3, $4, $5::date, $6, $7)`,
            [randomUUID(), rid, l.item, l.batch, edStr, l.qty, l.harga],
          );
        }
      }
      await c.query(
        `INSERT INTO inventory.inv_counter (kind, periode, last_seq) VALUES ('GRN', $1, 2)
         ON CONFLICT (kind, periode) DO UPDATE SET last_seq = GREATEST(inventory.inv_counter.last_seq, EXCLUDED.last_seq)`,
        [periode],
      );
      console.log(`Seeded receipts: ${docs.length}`);
    }
  }

  // ── Transfer + Distribusi — seed 1 draft masing-masing (gudang → depo) bila kosong. ──
  //  Draft = reservasi konsisten: bump qty_reserved di saldo sumber (dilepas saat posting/batal).
  const trfCount = Number((await c.query(`SELECT count(*)::int AS n FROM inventory.stock_transfer`)).rows[0].n);
  const dstCount = Number((await c.query(`SELECT count(*)::int AS n FROM inventory.distribusi_request`)).rows[0].n);
  if (trfCount === 0 || dstCount === 0) {
    const farmasi = (await c.query(
      `SELECT id, location_type FROM master.location WHERE location_type IN ('Gudang_Farmasi','Farmasi') AND deleted_at IS NULL AND active = true ORDER BY location_type, nama`,
    )).rows;
    const gudang = farmasi.find((f) => f.location_type === "Gudang_Farmasi")?.id;
    const depo = farmasi.find((f) => f.location_type === "Farmasi")?.id;
    // 2 saldo ber-stok cukup di gudang (cukup utk reservasi 20+15=35).
    const src = gudang
      ? (await c.query(`SELECT item_jenis, item_id FROM inventory.stock_balance WHERE location_id = $1 AND qty_on_hand >= 60 ORDER BY qty_on_hand DESC LIMIT 2`, [gudang])).rows
      : [];
    if (gudang && depo && src.length >= 2) {
      const wib = new Date(Date.now() + 7 * 3600 * 1000);
      const periode = `${String(wib.getUTCFullYear() % 100).padStart(2, "0")}${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
      const reserve = (jenis, itemId, qty) =>
        c.query(
          `UPDATE inventory.stock_balance SET qty_reserved = qty_reserved + $1, updated_at = now()
           WHERE location_id = $2 AND item_jenis = $3::inventory."ItemJenis" AND item_id = $4`,
          [qty, gudang, jenis, itemId],
        );

      if (trfCount === 0) {
        const tid = randomUUID();
        await c.query(
          `INSERT INTO inventory.stock_transfer (id, no_dokumen, tanggal, from_location_id, to_location_id, status, petugas, created_at, updated_at)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Draft'::inventory."DocStatus", 'Seed Inventory', now(), now())`,
          [tid, `TRF-${periode}001`, gudang, depo],
        );
        for (const s of src) {
          await c.query(
            `INSERT INTO inventory.stock_transfer_item (id, transfer_id, item_jenis, item_id, batch_no, qty)
             VALUES ($1, $2, $3::inventory."ItemJenis", $4, NULL, 20)`,
            [randomUUID(), tid, s.item_jenis, s.item_id],
          );
          await reserve(s.item_jenis, s.item_id, 20);
        }
        await c.query(
          `INSERT INTO inventory.inv_counter (kind, periode, last_seq) VALUES ('TRF', $1, 1)
           ON CONFLICT (kind, periode) DO UPDATE SET last_seq = GREATEST(inventory.inv_counter.last_seq, EXCLUDED.last_seq)`,
          [periode],
        );
      }

      if (dstCount === 0) {
        const did = randomUUID();
        await c.query(
          `INSERT INTO inventory.distribusi_request (id, no_dokumen, tanggal, from_location_id, to_location_id, status, pemohon, created_at, updated_at)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Draft'::inventory."DocStatus", 'Depo Farmasi RJ', now(), now())`,
          [did, `DST-${periode}001`, gudang, depo],
        );
        for (const s of src) {
          await c.query(
            `INSERT INTO inventory.distribusi_item (id, request_id, item_jenis, item_id, qty_minta, qty_keluar)
             VALUES ($1, $2, $3::inventory."ItemJenis", $4, 15, 0)`,
            [randomUUID(), did, s.item_jenis, s.item_id],
          );
          await reserve(s.item_jenis, s.item_id, 15);
        }
        await c.query(
          `INSERT INTO inventory.inv_counter (kind, periode, last_seq) VALUES ('DST', $1, 1)
           ON CONFLICT (kind, periode) DO UPDATE SET last_seq = GREATEST(inventory.inv_counter.last_seq, EXCLUDED.last_seq)`,
          [periode],
        );
      }
      console.log(`Seeded transfer/distribusi drafts (gudang → depo, reservasi di-set).`);
    }
  }

  // ── Stok Opname — seed 1 sesi Counting (snapshot 6 item di gudang) bila kosong. ──
  const opnCount = Number((await c.query(`SELECT count(*)::int AS n FROM inventory.opname_session`)).rows[0].n);
  if (opnCount === 0) {
    const gudang = (await c.query(`SELECT id FROM master.location WHERE location_type='Gudang_Farmasi' AND deleted_at IS NULL AND active=true ORDER BY nama LIMIT 1`)).rows[0]?.id;
    const snap = gudang
      ? (await c.query(`SELECT item_jenis, item_id, qty_on_hand FROM inventory.stock_balance WHERE location_id = $1 ORDER BY qty_on_hand DESC LIMIT 6`, [gudang])).rows
      : [];
    if (gudang && snap.length > 0) {
      const wib = new Date(Date.now() + 7 * 3600 * 1000);
      const periode = `${String(wib.getUTCFullYear() % 100).padStart(2, "0")}${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
      const oid = randomUUID();
      await c.query(
        `INSERT INTO inventory.opname_session (id, no_dokumen, tanggal, location_id, status, petugas, created_at, updated_at)
         VALUES ($1, $2, CURRENT_DATE, $3, 'Counting'::inventory."OpnameStatus", 'Seed Inventory', now(), now())`,
        [oid, `OPN-${periode}001`, gudang],
      );
      for (const s of snap) {
        await c.query(
          `INSERT INTO inventory.opname_item (id, session_id, item_jenis, item_id, qty_sistem, qty_fisik, alasan)
           VALUES ($1, $2, $3::inventory."ItemJenis", $4, $5, NULL, NULL)`,
          [randomUUID(), oid, s.item_jenis, s.item_id, s.qty_on_hand],
        );
      }
      await c.query(
        `INSERT INTO inventory.inv_counter (kind, periode, last_seq) VALUES ('OPN', $1, 1)
         ON CONFLICT (kind, periode) DO UPDATE SET last_seq = GREATEST(inventory.inv_counter.last_seq, EXCLUDED.last_seq)`,
        [periode],
      );
      console.log(`Seeded opname session (Counting, ${snap.length} item di gudang).`);
    }
  }

  await c.query("COMMIT");
  console.log(`OK. edges=${obatEdges.length + bmhpEdges.length} · saldo=${saldo} · batch=${batch} · movement(IN)=${mv}`);
} catch (e) {
  await c.query("ROLLBACK");
  throw e;
} finally {
  await c.end();
}
