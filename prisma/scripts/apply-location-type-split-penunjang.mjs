// Apply: master.LocationType pecah Penunjang → Laboratorium + Radiologi via pg langsung.
// Fase 1: ADD VALUE (terpisah, auto-commit — syarat PG sebelum value dipakai).
// Fase 2: migrasi baris Location lama Penunjang → Lab/Rad by-name.
// Jalankan: node --env-file=.env prisma/scripts/apply-location-type-split-penunjang.mjs
import { Client } from "pg";

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  // Fase 1 — enum (per-statement, commit masing-masing)
  await c.query(`ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Laboratorium'`);
  await c.query(`ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Radiologi'`);

  // Fase 2 — migrasi data (value sudah commit di fase 1)
  const lab = await c.query(
    `UPDATE "master"."location" SET "location_type" = 'Laboratorium'
     WHERE "location_type" = 'Penunjang' AND "nama" ILIKE '%lab%'`,
  );
  const rad = await c.query(
    `UPDATE "master"."location" SET "location_type" = 'Radiologi'
     WHERE "location_type" = 'Penunjang'
       AND ("nama" ILIKE '%rad%' OR "nama" ILIKE '%rontgen%' OR "nama" ILIKE '%imaging%' OR "nama" ILIKE '%usg%')`,
  );

  const sisa = await c.query(
    `SELECT id, kode, nama FROM "master"."location" WHERE "location_type" = 'Penunjang'`,
  );
  console.log(`OK migrasi → Laboratorium: ${lab.rowCount} baris · Radiologi: ${rad.rowCount} baris`);
  if (sisa.rowCount > 0) {
    console.log(`⚠ Masih ada ${sisa.rowCount} baris Penunjang (nama tak terdeteksi, edit manual):`, sisa.rows);
  } else {
    console.log("OK tidak ada sisa baris Penunjang.");
  }
} finally {
  await c.end();
}
