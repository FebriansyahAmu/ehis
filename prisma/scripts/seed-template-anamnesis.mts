// Seed Master Template Anamnesis (master.template_anamnesis) dari templateAnamnesisSeed.ts.
// Pakai `pg` langsung (hindari alias `@/`). context_tags → text[]. Optional mekanisme_cedera /
// catatan_perawat → NULL bila kosong. Idempoten: TRUNCATE lalu insert ulang (data awal otoritatif).
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-template-anamnesis.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { TEMPLATE_ANAMNESIS_SEED } from "../../src/lib/master/templateAnamnesisSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-template-anamnesis.mts).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."template_anamnesis" CASCADE');

    let n = 0;
    for (const t of TEMPLATE_ANAMNESIS_SEED) {
      await client.query(
        `INSERT INTO "master"."template_anamnesis" (
           "id","label","kategori","context_tags","keluhan_utama","rps","onset_durasi",
           "mekanisme_cedera","faktor_pemberat","faktor_pemerut","status_generalis",
           "catatan_perawat","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now()
         )`,
        [
          randomUUID(), t.label, t.kategori, t.contextTags, t.keluhanUtama,
          t.rps ?? "", t.onsetDurasi ?? "", t.mekanismeCedera ?? null,
          t.faktorPemberat ?? "", t.faktorPemerut ?? "", t.statusGeneralis ?? "",
          t.catatanPerawat ?? null, t.status ?? "Aktif",
        ],
      );
      n += 1;
    }

    await client.query("COMMIT");
    console.log(`✅ Seed Template Anamnesis selesai: ${n} template (IGD/RI/RJ).`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed Template Anamnesis gagal:", e);
  process.exit(1);
});
