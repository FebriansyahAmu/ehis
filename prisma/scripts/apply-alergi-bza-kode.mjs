// Apply: +kolom bza_kode di medicalrecord.asesmen_alergi (data-preserving) + hapus seed
// kategori AllergenObat (asesmen_item) & counter ALG-OB di master. Via pg.
// Jalankan: node --env-file=.env prisma/scripts/apply-alergi-bza-kode.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260618130000_alergi_bza_kode/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);

  // Cleanup kategori AllergenObat (dipindah ke Katalog Obat + BZA).
  const delItems = await c.query(`DELETE FROM "master"."asesmen_item" WHERE kategori = 'AllergenObat'`);
  const delCtr = await c.query(`DELETE FROM "master"."asesmen_counter" WHERE scope = 'ALG-OB'`);

  const col = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='medicalrecord' AND table_name='asesmen_alergi' AND column_name='bza_kode'`,
  );
  console.log(`OK bza_kode kolom: ${col.rowCount ? "ada" : "TIDAK ADA"}`);
  console.log(`Cleanup AllergenObat: ${delItems.rowCount} item · ${delCtr.rowCount} counter (ALG-OB) dihapus`);
} finally {
  await c.end();
}
