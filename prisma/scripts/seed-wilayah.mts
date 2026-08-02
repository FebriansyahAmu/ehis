// Seed master.Wilayah (Kemendagri) dari repo cahyadsn/wilayah.
//   Sumber: db/wilayah.sql (Kepmendagri No 300.2.2-2430/2025) — tabel wilayah(kode,nama),
//   kode dotted hierarkis ("11" / "11.01" / "11.01.01" / "11.01.01.2001").
//   Derive: level = jumlah titik + 1 · parentKode = buang segmen terakhir · kodeFlat = tanpa titik.
//   parentKode = SOFT-REF (tanpa FK) → insert bebas urutan. Idempoten: TRUNCATE lalu insert ulang.
//   Pakai `pg` langsung (tanpa alias `@/`); `fetch` global Node 24 (tanpa dependency tambahan).
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-wilayah.mts
//   Override sumber:  WILAYAH_SQL_URL=... node --env-file=.env prisma/scripts/seed-wilayah.mts
//   File lokal:       WILAYAH_SQL_FILE=prisma/data/wilayah.sql node --env-file=.env prisma/scripts/seed-wilayah.mts

import pg from "pg";
import { readFile } from "node:fs/promises";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-wilayah.mts).");
  process.exit(1);
}

const SQL_URL =
  process.env.WILAYAH_SQL_URL ??
  "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql";
const SQL_FILE = process.env.WILAYAH_SQL_FILE; // opsional — file lokal (offline)

interface Row {
  kode: string;
  nama: string;
  level: number;
  parentKode: string | null;
  kodeFlat: string;
}

/** Ambil isi wilayah.sql (file lokal bila di-set, else fetch raw GitHub). */
async function loadSql(): Promise<string> {
  if (SQL_FILE) {
    console.log(`• Baca file lokal: ${SQL_FILE}`);
    return readFile(SQL_FILE, "utf8");
  }
  console.log(`• Fetch dataset: ${SQL_URL}`);
  const res = await fetch(SQL_URL);
  if (!res.ok) throw new Error(`Gagal fetch wilayah.sql — HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

/** Parse tuple `('kode','nama')` (nama boleh berisi '' = apostrof ter-escape SQL). */
function parseRows(sql: string): Row[] {
  const re = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;
  const rows: Row[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const kode = m[1].replace(/''/g, "'").trim();
    const nama = m[2].replace(/''/g, "'").trim();
    // Kode wilayah = digit + titik. Saring tuple non-wilayah (jaga-jaga bila ada INSERT lain).
    if (!/^\d{2}(\.\d{2,4})*$/.test(kode)) continue;
    if (seen.has(kode)) continue;
    seen.add(kode);
    const dot = kode.lastIndexOf(".");
    rows.push({
      kode,
      nama,
      level: kode.split(".").length, // 1 titik→2 segmen→level 2, dst.
      parentKode: dot === -1 ? null : kode.slice(0, dot),
      kodeFlat: kode.replace(/\./g, ""),
    });
  }
  return rows;
}

const client = new pg.Client({ connectionString: url });

async function main() {
  const sql = await loadSql();
  const rows = parseRows(sql);
  if (rows.length === 0) throw new Error("Tidak ada baris wilayah ter-parse — cek format sumber.");

  const byLevel = rows.reduce<Record<number, number>>((a, r) => ((a[r.level] = (a[r.level] ?? 0) + 1), a), {});
  console.log(
    `• Ter-parse ${rows.length.toLocaleString("id-ID")} baris — ` +
      `L1 prov=${byLevel[1] ?? 0} · L2 kab/kota=${byLevel[2] ?? 0} · ` +
      `L3 kec=${byLevel[3] ?? 0} · L4 desa/kel=${byLevel[4] ?? 0}`,
  );

  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."wilayah"');

    const BATCH = 2000; // 2000×5 = 10.000 param (< 65535 batas pg)
    let done = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const values: string[] = [];
      const params: (string | number | null)[] = [];
      chunk.forEach((r, j) => {
        const b = j * 5;
        values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5})`);
        params.push(r.kode, r.nama, r.level, r.parentKode, r.kodeFlat);
      });
      await client.query(
        `INSERT INTO "master"."wilayah" ("kode","nama","level","parent_kode","kode_flat")
         VALUES ${values.join(",")}`,
        params,
      );
      done += chunk.length;
      if (i % (BATCH * 10) === 0 || done === rows.length) {
        process.stdout.write(`\r  … tersimpan ${done.toLocaleString("id-ID")}/${rows.length.toLocaleString("id-ID")}`);
      }
    }
    process.stdout.write("\n");

    await client.query("COMMIT");
    console.log(`✅ Seed Wilayah selesai: ${rows.length.toLocaleString("id-ID")} baris ter-insert ke master.wilayah.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("\n❌ Seed Wilayah gagal:", e);
  process.exit(1);
});
