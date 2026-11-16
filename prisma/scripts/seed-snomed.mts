// Seed master.SnomedDescription + master.SnomedConcept dari dump MySQL SNOMED CT (tabel `snomed_ct`,
// format deskripsi RF2: id · effectiveTime · active · moduleId · conceptId · languageCode · typeId · term ·
// caseSignificanceId). Sumber = file LOKAL dari Kemenkes (DB `kemkes-ihs`) — TIDAK di-commit (lisensi
// SNOMED + ±157 MB, lihat .gitignore). Dipakai sementara sebagai kamus SNOMED lokal untuk picker &
// validasi kode FHIR (docs/fhir-mapping, R12 — SatuSehat tak punya terminology server).
//
//   Statistik saja (tanpa tulis DB):  node --env-file=.env prisma/scripts/seed-snomed.mts --profile
//   Seed (TRUNCATE + load, 1 tx):     node --env-file=.env prisma/scripts/seed-snomed.mts
//   File lain:                        SNOMED_SQL_FILE=path/to/file.sql node --env-file=.env prisma/scripts/seed-snomed.mts
//
// Kualitas data (temuan saat profiling):
//   - Kolom numerik dump kehilangan presisi untuk ID 18 digit (moduleId …207008 → …207000, typeId …13009 →
//     …13000). typeId dipetakan dari nilai asli MAUPUN terbulatkan → FSN / SYN / DEF.
//   - conceptId divalidasi: digit saja, partisi konsep (00/10) + check digit Verhoeff. Gagal → dibuang & dihitung
//     ("salah lebih buruk dari kosong").
//   - Istilah ber-karakter non-ASCII sudah rusak di sumber ("D?®j?á vu") → dilewati & dihitung.
//   - Tiap deskripsi tercatat 2× di sumber → dibuang oleh unique (concept_id, type, term).
//   - Hanya ±25% konsep punya FSN → display konsep lain = sinonim terpendek (display_source = 'SYN').
//   - Hanya deskripsi active=1 yang dimuat. Status aktif KONSEP tidak ada di file ini (hanya deskripsi) →
//     konsep yang sudah di-retire bisa ikut; SatuSehat tetap memvalidasi saat POST.
//
// Streaming: file dibaca per baris (readline) — satu baris INSERT ±1 MB — tanpa memuat seluruh file ke memori.
// Tuple di-parse dengan state machine (escape MySQL backslash). Insert batch via unnest() (1 query/batch).

import pg from "pg";
import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";

const FILE = process.env.SNOMED_SQL_FILE ?? "docs/snomend_ct.sql";
const PROFILE = process.argv.includes("--profile");
const BATCH = 5000;

if (!existsSync(FILE)) {
  console.error(`File tidak ditemukan: ${FILE} (set SNOMED_SQL_FILE).`);
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!PROFILE && !url) {
  console.error("DATABASE_URL belum di-set (jalankan dengan: node --env-file=.env …).");
  process.exit(1);
}

// ── typeId: nilai asli RF2 + nilai yang terbulatkan oleh dump ───────────────
const TYPE: Record<string, "FSN" | "SYN" | "DEF"> = {
  "900000000000003001": "FSN", "900000000000003000": "FSN",
  "900000000000013009": "SYN", "900000000000013000": "SYN",
  "900000000000550004": "DEF", "900000000000550000": "DEF",
};

// ── Verhoeff check digit (dipakai SNOMED CT SCTID) ──────────────────────────
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
function verhoeffOk(num: string): boolean {
  let c = 0;
  for (let i = 0; i < num.length; i++) c = D[c][P[i % 8][num.charCodeAt(num.length - 1 - i) - 48]];
  return c === 0;
}
/** SCTID konsep valid: 6–18 digit, partisi konsep (00 short / 10 long), Verhoeff lolos. */
function isConceptId(id: string): boolean {
  if (!/^[1-9]\d{5,17}$/.test(id)) return false;
  const part = id.slice(-3, -1);
  return (part === "00" || part === "10") && verhoeffOk(id);
}

// ── Parser tuple INSERT MySQL ───────────────────────────────────────────────
const ESC: Record<string, string> = { n: "\n", r: "\r", t: "\t", "0": "\0", Z: "\x1a" };
/** Panggil `onRow(fields)` untuk tiap tuple `(…),(…)` dalam satu baris INSERT. */
function parseValues(line: string, onRow: (f: (string | null)[]) => void): void {
  let i = line.indexOf(" VALUES ");
  if (i < 0) return;
  i += 8;
  const n = line.length;
  while (i < n) {
    while (i < n && line[i] !== "(") i++;
    if (i >= n) return;
    i++;
    const fields: (string | null)[] = [];
    let buf = "";
    let inStr = false;
    let quoted = false;
    for (; i < n; i++) {
      const ch = line[i];
      if (inStr) {
        if (ch === "\\") { const nx = line[++i]; buf += ESC[nx] ?? nx; }
        else if (ch === "'") { if (line[i + 1] === "'") { buf += "'"; i++; } else inStr = false; }
        else buf += ch;
      } else if (ch === "'") { inStr = true; quoted = true; }
      else if (ch === "," || ch === ")") {
        fields.push(!quoted && buf === "NULL" ? null : buf);
        buf = ""; quoted = false;
        if (ch === ")") { i++; break; }
      } else buf += ch;
    }
    onRow(fields);
  }
}

// ── Stream file ─────────────────────────────────────────────────────────────
interface Desc { conceptId: string; term: string; type: string; lang: string; eff: number }

const stat = {
  tuples: 0, inactive: 0, badConcept: 0, unknownType: 0, emptyTerm: 0, loaded: 0,
  maxEff: 0, minEff: Number.MAX_SAFE_INTEGER,
  types: new Map<string, number>(), langs: new Map<string, number>(), modules: new Map<string, number>(),
  tags: new Map<string, number>(), badSamples: [] as string[], nonAscii: 0, nonAsciiSamples: [] as string[],
};
const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

async function* rows(): AsyncGenerator<Desc[]> {
  const rl = createInterface({ input: createReadStream(FILE, { encoding: "utf8" }), crlfDelay: Infinity });
  let batch: Desc[] = [];
  for await (const line of rl) {
    if (!line.startsWith("INSERT INTO `snomed_ct`")) continue;
    const out: Desc[] = [];
    parseValues(line, (f) => {
      stat.tuples++;
      const [, eff, active, moduleId, conceptId, lang, typeId, term] = f;
      inc(stat.modules, moduleId ?? "NULL");
      inc(stat.types, typeId ?? "NULL");
      inc(stat.langs, lang ?? "NULL");
      if (active !== "1") { stat.inactive++; return; }
      const cid = (conceptId ?? "").trim();
      if (!isConceptId(cid)) {
        stat.badConcept++;
        if (stat.badSamples.length < 5) stat.badSamples.push(`${cid}|${term}`);
        return;
      }
      const type = TYPE[(typeId ?? "").trim()];
      if (!type) { stat.unknownType++; return; }
      const t = (term ?? "").trim();
      if (!t) { stat.emptyTerm++; return; }
      if (/[^ -~]/.test(t)) { stat.nonAscii++; if (stat.nonAsciiSamples.length < 4) stat.nonAsciiSamples.push(t); return; }
      const e = Number(eff) || 0;
      if (e > stat.maxEff) stat.maxEff = e;
      if (e && e < stat.minEff) stat.minEff = e;
      if (type === "FSN") { const m = /\(([^()]+)\)\s*$/.exec(t); inc(stat.tags, m ? m[1] : "(tanpa tag)"); }
      out.push({ conceptId: cid, term: t, type, lang: (lang ?? "").trim() || "en", eff: e });
    });
    for (const r of out) {
      batch.push(r);
      if (batch.length >= BATCH) { yield batch; batch = []; }
    }
  }
  if (batch.length) yield batch;
}

const top = (m: Map<string, number>, k = 12) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([x, c]) => `${x}=${c}`).join(" · ");

function report(): void {
  console.log(`tuple dibaca      : ${stat.tuples}`);
  console.log(`dimuat (aktif)    : ${stat.loaded}`);
  console.log(`dilewati          : inaktif=${stat.inactive} · conceptId invalid=${stat.badConcept} · typeId tak dikenal=${stat.unknownType} · term kosong=${stat.emptyTerm}`);
  if (stat.badSamples.length) console.log(`contoh invalid    : ${stat.badSamples.join(" ; ")}`);
  console.log(`term rusak (lewat): ${stat.nonAscii} — encoding sumber hilang (contoh: ${stat.nonAsciiSamples.join(" ; ")})`);
  console.log(`effectiveTime     : ${stat.minEff} – ${stat.maxEff}`);
  console.log(`typeId            : ${top(stat.types, 6)}`);
  console.log(`languageCode      : ${top(stat.langs, 6)}`);
  console.log(`moduleId (top)    : ${top(stat.modules, 5)}`);
  console.log(`semantic tag FSN  : ${top(stat.tags, 15)}`);
}

async function main(): Promise<void> {
  const t0 = Date.now();
  if (PROFILE) {
    for await (const b of rows()) stat.loaded += b.length;
    report();
    console.log(`(profile, tanpa tulis DB) ${((Date.now() - t0) / 1000).toFixed(1)} dtk`);
    return;
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE "master"."snomed_concept", "master"."snomed_description" RESTART IDENTITY`);
    let read = 0;
    for await (const b of rows()) {
      // Sumber memuat tiap deskripsi 2× → unique (concept_id, type, term) + DO NOTHING membuang duplikat.
      const r = await client.query(
        `INSERT INTO "master"."snomed_description" (concept_id, term, type, language_code, effective_time)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[])
         ON CONFLICT (concept_id, type, term) DO NOTHING`,
        [b.map((r) => r.conceptId), b.map((r) => r.term), b.map((r) => r.type), b.map((r) => r.lang), b.map((r) => r.eff)],
      );
      read += b.length;
      stat.loaded += r.rowCount ?? 0;
      if (read % 100000 < BATCH) console.log(`  … ${read} dibaca · ${stat.loaded} unik`);
    }
    // Konsep = semua conceptId ber-deskripsi aktif. display: FSN (tanpa tag) bila ada, else sinonim terpendek.
    const c = await client.query(`
      WITH f AS (
        SELECT DISTINCT ON (concept_id) concept_id, term
          FROM "master"."snomed_description" WHERE type = 'FSN'
         ORDER BY concept_id, (term ~ '\\([^()]+\\)\\s*$') DESC, effective_time DESC, term
      ), s AS (
        SELECT DISTINCT ON (concept_id) concept_id, term
          FROM "master"."snomed_description" WHERE type = 'SYN'
         ORDER BY concept_id, length(term), term
      ), e AS (
        SELECT concept_id, max(effective_time) AS eff FROM "master"."snomed_description" GROUP BY concept_id
      )
      INSERT INTO "master"."snomed_concept" (concept_id, fsn, display, display_source, semantic_tag, effective_time)
      SELECT e.concept_id,
             f.term,
             COALESCE(NULLIF(btrim(regexp_replace(f.term, '\\s*\\([^()]+\\)\\s*$', '')), ''), s.term, f.term),
             CASE WHEN f.term IS NOT NULL THEN 'FSN' ELSE 'SYN' END,
             substring(f.term from '\\(([^()]+)\\)\\s*$'),
             e.eff
        FROM e LEFT JOIN f USING (concept_id) LEFT JOIN s USING (concept_id)
       WHERE COALESCE(f.term, s.term) IS NOT NULL`);
    await client.query("COMMIT");
    report();
    console.log(`duplikat dibuang  : ${read - stat.loaded}`);
    console.log(`konsep            : ${c.rowCount}`);
    console.log(`selesai ${((Date.now() - t0) / 1000).toFixed(1)} dtk`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
