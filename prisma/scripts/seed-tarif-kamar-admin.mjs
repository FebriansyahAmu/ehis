// Seed master.tarif_kamar + master.tarif_administrasi (penjamin UMUM).
// Nilai kamar = AKOMODASI_RATE (billingProjectionService) supaya tak ada regresi saat wiring proyeksi.
// Administrasi = default wajar per unit. Idempoten: ON CONFLICT (pair) DO NOTHING (tak timpa edit manual).
// Jalankan: node --env-file=.env prisma/scripts/seed-tarif-kamar-admin.mjs

import { Client } from "pg";

const PENJAMIN = "UMUM";

// Tarif kamar/hari per kelas (sinkron AKOMODASI_RATE).
const KAMAR = [
  ["VIP", 2_000_000],
  ["Kelas_1", 1_200_000],
  ["Kelas_2", 800_000],
  ["Kelas_3", 450_000],
  ["ICU", 1_500_000],
  ["HCU", 1_000_000],
  ["Isolasi", 800_000],
];

// Biaya administrasi/kunjungan per unit (default wajar RS tipe C).
const ADMIN = [
  ["RawatJalan", 25_000],
  ["IGD", 50_000],
  ["RawatInap", 100_000],
];

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  let kamarN = 0;
  for (const [kelas, harga] of KAMAR) {
    const r = await c.query(
      `INSERT INTO "master"."tarif_kamar" ("id","kelas","penjamin_kode","harga","updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, now())
       ON CONFLICT ("kelas","penjamin_kode") DO NOTHING`,
      [kelas, PENJAMIN, harga],
    );
    kamarN += r.rowCount;
  }

  let adminN = 0;
  for (const [unit, harga] of ADMIN) {
    const r = await c.query(
      `INSERT INTO "master"."tarif_administrasi" ("id","unit","penjamin_kode","harga","updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, now())
       ON CONFLICT ("unit","penjamin_kode") DO NOTHING`,
      [unit, PENJAMIN, harga],
    );
    adminN += r.rowCount;
  }

  const totalKamar = (await c.query(`SELECT COUNT(*)::int AS n FROM "master"."tarif_kamar"`)).rows[0].n;
  const totalAdmin = (await c.query(`SELECT COUNT(*)::int AS n FROM "master"."tarif_administrasi"`)).rows[0].n;
  console.log(`tarif_kamar: +${kamarN} baru (total ${totalKamar}) · tarif_administrasi: +${adminN} baru (total ${totalAdmin})`);
} finally {
  await c.end();
}
