// Seed Katalog Radiologi (master.rad_catalog) dari src/lib/master/radCatalogSeed.ts. Pakai `pg`
// langsung (hindari resolusi alias `@/`). Kode internal RAD-NNNN di-seed apa adanya; counter
// `rad_catalog_counter` (scope="RAD") di-set ke numerik tertinggi → entri baru via API lanjut.
// Blok tat/persiapan/kontras/drl/reporting → kolom JSONB. Idempoten: TRUNCATE lalu insert ulang.
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-rad-catalog.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { RAD_CATALOG_SEED } from "../../src/lib/master/radCatalogSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-rad-catalog.mts).");
  process.exit(1);
}

/** Numerik dari kode "RAD-NNNN" → 1 (untuk RAD-0001). 0 bila tak cocok. */
function kodeSeq(kode) {
  const m = /^RAD-(\d+)$/.exec(kode ?? "");
  return m ? parseInt(m[1], 10) : 0;
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."rad_catalog", "master"."rad_catalog_counter" CASCADE');

    let n = 0;
    let maxSeq = 0;
    for (const r of RAD_CATALOG_SEED) {
      maxSeq = Math.max(maxSeq, kodeSeq(r.kode));
      await client.query(
        `INSERT INTO "master"."rad_catalog" (
           "id","kode","kode_icd","nama","modalitas","modalitas_subtype","region","kategori",
           "estimasi_waktu_menit","tat_target","persiapan","kontras","drl_referensi",
           "reporting_template","deskripsi","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16, now()
         )`,
        [
          randomUUID(), r.kode, r.kodeIcd ?? null, r.nama, r.modalitas, r.modalitasSubtype ?? null,
          r.region, r.kategori, r.estimasiWaktuMenit,
          JSON.stringify(r.tatTargetMenit),
          JSON.stringify(r.persiapan),
          JSON.stringify(r.kontras),
          r.drlReferensi ? JSON.stringify(r.drlReferensi) : null,
          JSON.stringify(r.reportingTemplate),
          r.deskripsi ?? null, r.status ?? "Aktif",
        ],
      );
      n += 1;
    }

    await client.query(
      `INSERT INTO "master"."rad_catalog_counter" ("scope","last_seq") VALUES ('RAD',$1)`,
      [maxSeq],
    );

    await client.query("COMMIT");
    console.log(`✅ Seed Radiologi selesai: ${n} pemeriksaan · counter[RAD]=${maxSeq} → entri baru mulai RAD-${String(maxSeq + 1).padStart(4, "0")}.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed Radiologi gagal:", e);
  process.exit(1);
});
