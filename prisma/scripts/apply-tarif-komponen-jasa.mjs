// Apply: +3 kolom komponen tarif (jasa_sarana/jasa_medis/jasa_paramedis) di 3 tabel tarif via pg.
// Jalankan: node --env-file=.env prisma/scripts/apply-tarif-komponen-jasa.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260618120000_tarif_komponen_jasa/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema='master' AND column_name IN ('jasa_sarana','jasa_medis','jasa_paramedis')
     ORDER BY table_name, column_name`,
  );
  console.log("OK kolom komponen:", cols.rows.map((r) => `${r.table_name}.${r.column_name}`).join(", "));
} finally {
  await c.end();
}
