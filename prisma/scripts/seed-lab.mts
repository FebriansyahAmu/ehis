// Seed Katalog Laboratorium (master.lab_test + master.lab_parameter) dari data riset
// src/lib/master/labTestSeed.ts. Pakai `pg` langsung (hindari resolusi alias `@/` di tsx).
// Idempoten: TRUNCATE kedua tabel lalu insert ulang (katalog awal otoritatif).
//
//   Jalankan:  node --env-file=.env --import tsx prisma/scripts/seed-lab.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { LAB_TEST_SEED } from "../../src/lib/master/labTestSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan dengan: node --env-file=.env --import tsx ...).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    // Reset katalog (cascade ke parameter). Tabel lain (tindakan/layanan_unit) tak tersentuh.
    await client.query('TRUNCATE "master"."lab_parameter", "master"."lab_test" CASCADE');

    let nTest = 0;
    let nParam = 0;

    for (const t of LAB_TEST_SEED) {
      const testId = randomUUID();
      await client.query(
        `INSERT INTO "master"."lab_test"
           ("id","kode","nama","kategori","spesimen","metode","waktu_tunggu","keterangan","active","updated_at")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true, now())`,
        [
          testId,
          t.kode ?? "",
          t.nama,
          t.kategori,
          t.spesimen ?? null,
          t.metode ?? null,
          t.waktuTunggu ?? null,
          t.keterangan ?? null,
        ],
      );
      nTest += 1;

      for (const p of t.parameters) {
        const rujukan = (p.rujukan ?? []).map((r) => ({
          gender: r.gender,
          ...(r.usiaMin !== undefined ? { usiaMin: r.usiaMin } : {}),
          ...(r.usiaMax !== undefined ? { usiaMax: r.usiaMax } : {}),
          low: r.low,
          high: r.high,
          ...(r.keterangan ? { keterangan: r.keterangan } : {}),
        }));
        await client.query(
          `INSERT INTO "master"."lab_parameter"
             ("id","test_id","nama","satuan","tipe_hasil","nilai_normal_text","rujukan",
              "critical_low","critical_high","delta_absolute","delta_percent","metode","urutan")
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)`,
          [
            randomUUID(),
            testId,
            p.nama,
            p.satuan ?? "",
            p.tipeHasil,
            p.nilaiNormalText ?? null,
            JSON.stringify(rujukan),
            p.criticalLow ?? null,
            p.criticalHigh ?? null,
            p.deltaAbsolute ?? null,
            p.deltaPercent ?? null,
            p.metode ?? null,
            p.urutan ?? 0,
          ],
        );
        nParam += 1;
      }
    }

    // Jenis spesimen SNOMED (FHIR Specimen.type, S6b) — pola sama dengan migrasi 20261119120000_lab_specimen.
    await client.query(`
      UPDATE "master"."lab_test" SET spesimen_snomed = CASE
        WHEN spesimen ILIKE 'serum%'        THEN '119364003'
        WHEN spesimen ILIKE 'urin%pancar%'  THEN '122880004'
        WHEN spesimen ILIKE 'urin%'         THEN '122575003'
        WHEN spesimen ILIKE 'plasma%'       THEN '119361006'
        WHEN spesimen ILIKE 'darah vena%'   THEN '122555007'
        WHEN spesimen ILIKE 'darah arteri%' THEN '122552005'
        WHEN spesimen ILIKE 'darah kapiler' THEN '122554006'
        WHEN spesimen ILIKE 'darah%'        THEN '119297000'
        WHEN spesimen ILIKE 'feses%'        THEN '119339001'
        WHEN spesimen ILIKE 'sputum%'       THEN '119334006'
      END
      WHERE spesimen IS NOT NULL`);

    await client.query("COMMIT");
    console.log(`✅ Seed lab selesai: ${nTest} tes, ${nParam} parameter.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed lab gagal:", e);
  process.exit(1);
});
