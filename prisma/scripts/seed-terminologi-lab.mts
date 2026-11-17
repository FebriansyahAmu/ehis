// Seed master.TerminologiLab + master.TerminologiLabJawaban dari Lampiran LOINC Laboratorium RESMI SatuSehat
// (satusehat.kemkes.go.id/platform/docs/id/terminology/loinc/laboratory/ → 5 file Google Drive .xlsx).
// File diunduh lokal ke docs/terminologi/loinc-lab/ (di-.gitignore; konten LOINC © Regenstrief — lihat sheet
// "Copyright" di file). Dipakai untuk picker LOINC Katalog Lab + gerbang L16 (Permintaan vs Hasil).
//
//   Statistik saja (tanpa tulis DB):  node --env-file=.env prisma/scripts/seed-terminologi-lab.mts --profile
//   Seed (TRUNCATE + load, 1 tx):     node --env-file=.env prisma/scripts/seed-terminologi-lab.mts
//   Folder lain:                      TERMINOLOGI_LAB_DIR=path node --env-file=.env prisma/scripts/seed-terminologi-lab.mts
//
// Unduh ulang (bila Kemenkes rilis versi baru — pembaruan ±6 bulan):
//   curl -sSL -o <nama>.xlsx "https://drive.google.com/uc?export=download&id=<id>"   (id: lihat SOURCES)
//
// Kualitas data (profiling 2026-11-17):
//   - Sel kode harus dibaca sebagai TEKS TERFORMAT (raw:false) — nilai mentah sel numerik kehilangan tanda "-".
//   - Variasi penulisan dinormalkan: Permintaan/Hasil ("Pemeriksaan & Hasil" → "Permintaan & Hasil"),
//     tipe hasil ("Nom" → Nominal, "Naratif" → Narrative, "Ordinal Kuantitatif" → OrdQn, …),
//     sistem kode "https://terminology.kemkes.go.id…" → "http://…" (aturan log versi v1.1).
//   - Kode LOINC divalidasi format + check digit Mod-10; gagal → dibuang & dihitung.
//   - PK1 (v1.1) & PK2 (v1.2) tumpang tindih sebagian tapi masing-masing punya kategori unik → dimuat keduanya
//     dengan kolom `sumber` (satu kode boleh muncul di banyak baris).
//   - Sheet pendukung (daftar bakteri/parasit/jamur, syndromic panel, SITB, Nugent) belum dimuat.

import pg from "pg";
import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

XLSX.set_fs(fs);

const DIR = process.env.TERMINOLOGI_LAB_DIR ?? "docs/terminologi/loinc-lab";
const PROFILE = process.argv.includes("--profile");

const SOURCES = [
  { sumber: "PK1", file: "patologi-klinik-1.xlsx", driveId: "1blz7jNG1deaEpKfVoqaAIU9DmuoE2P1I" },
  { sumber: "PK2", file: "patologi-klinik-2.xlsx", driveId: "1hF8rbaF_DB806b6fmXEzIB61gMonemHh" },
  { sumber: "PA", file: "patologi-anatomi.xlsx", driveId: "1IIxBl0lwJfAXoQI822uv5sR80Rl_-ALD" },
  { sumber: "MK", file: "mikrobiologi-klinik.xlsx", driveId: "1YaZSI6urkVSODq9BxTipzmQUHUaRSFfW" },
  { sumber: "PAR", file: "parasitologi-klinik.xlsx", driveId: "19Z1dsQZ-1a84ARHWJFy3fnd5bgxGN9Sh" },
] as const;

const LOINC = "http://loinc.org";
const KEMKES_EXAM = "http://terminology.kemkes.go.id/CodeSystem/examination";
const KEMKES_TERM = "http://terminology.kemkes.go.id";

// ── Normalisasi ─────────────────────────────────────────────────────────────
type Cell = string | number | boolean | null | undefined;
const norm = (v: Cell): string | null => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s && s !== "-" ? s : null;
};
const PH: Record<string, string> = {
  permintaan: "Permintaan",
  hasil: "Hasil",
  "permintaan & hasil": "Permintaan & Hasil",
  "pemeriksaan & hasil": "Permintaan & Hasil",
};
const TIPE: Record<string, string> = {
  nominal: "Nominal", nom: "Nominal",
  ordinal: "Ordinal", ord: "Ordinal",
  quantitative: "Quantitative", qn: "Quantitative",
  ordqn: "OrdQn", "ordinal kuantitatif": "OrdQn",
  narrative: "Narrative", naratif: "Narrative", nar: "Narrative",
  "semi-quantitative": "SemiQuantitative", semiquantitative: "SemiQuantitative", "semi quantitative": "SemiQuantitative", semiqn: "SemiQuantitative",
  qualitative: "Qualitative",
};
const normSystem = (v: Cell): string | null => {
  const s = norm(v);
  return s ? s.replace(/^https:\/\/terminology\.kemkes\.go\.id/, "http://terminology.kemkes.go.id").replace(/\/+$/, "") : null;
};
/** LOINC: `nnnnn-n` + check digit Mod-10. */
function loincOk(code: string): boolean {
  const m = /^(\d{1,7})-(\d)$/.exec(code);
  if (!m) return false;
  let sum = 0;
  m[1].split("").reverse().forEach((ch, i) => {
    const d = Number(ch);
    if (i % 2 === 0) { const x = d * 2; sum += x > 9 ? x - 9 : x; } else sum += d;
  });
  return (10 - (sum % 10)) % 10 === Number(m[2]);
}

// ── Pembacaan sheet ─────────────────────────────────────────────────────────
function sheetRows(wb: XLSX.WorkBook, name: string): Cell[][] {
  return XLSX.utils.sheet_to_json<Cell[]>(wb.Sheets[name], { header: 1, blankrows: false, defval: "", raw: false });
}
const findCol = (h: string[], re: RegExp, from = 0) => h.findIndex((c, i) => i >= from && re.test(c));

interface TermRow {
  sumber: string; sumberVersi: string | null; baris: number; kategori: string | null; namaPemeriksaan: string;
  permintaanHasil: string | null; spesimen: string | null; tipeHasil: string | null; satuan: string | null;
  metode: string | null; code: string; codeSystem: string; display: string | null; component: string | null;
  property: string | null; timing: string | null; loincSystem: string | null; scale: string | null;
  loincMethod: string | null; ucum: string | null;
}
interface AnsRow { sumber: string; kodePemeriksaan: string; code: string; display: string; codeSystem: string; urutan: number | null; keterangan: string | null }

const stat = {
  terms: 0, answers: 0, noCode: 0, badLoinc: 0, noSystem: 0, unknownPh: 0, unknownTipe: 0, fixedSystem: 0,
  samples: [] as string[], perSumber: [] as string[],
};
const sample = (s: string) => { if (stat.samples.length < 8) stat.samples.push(s); };

function versionOf(wb: XLSX.WorkBook): string | null {
  const sn = wb.SheetNames.find((s) => /version/i.test(s));
  if (!sn) return null;
  const vs = sheetRows(wb, sn).map((r) => norm(r[0])).filter((v): v is string => !!v && /^v\d/i.test(v));
  return vs.at(-1) ?? null;
}

function readTerms(wb: XLSX.WorkBook, sumber: string, versi: string | null): TermRow[] {
  const sn = wb.SheetNames.find((s) => /terminology/i.test(s));
  if (!sn) throw new Error(`${sumber}: sheet terminologi tidak ditemukan (${wb.SheetNames.join(", ")})`);
  const rows = sheetRows(wb, sn);
  const h = rows[0].map((c) => String(c ?? "").replace(/\s+/g, " ").trim().toLowerCase());
  const namaIdx = findCol(h, /^nama pemeriksaan/);
  const c = {
    kategori: findCol(h, /^kategori/), nama: namaIdx, ph: findCol(h, /permintaan\s*\/\s*hasil/),
    spesimen: findCol(h, /^spesimen$/), tipe: findCol(h, /tipe hasil/), satuan: findCol(h, /^satuan/),
    metode: findCol(h, /^metode/), code: findCol(h, /^(code|kode loinc|kode)$/),
    display: (() => { const d = findCol(h, /^(display|loinc long common name)$/); return d >= 0 ? d : findCol(h, /^nama pemeriksaan/, namaIdx + 1); })(),
    component: findCol(h, /^component$/), property: findCol(h, /^property$/), timing: findCol(h, /^timing$/),
    system: findCol(h, /^system$/), scale: findCol(h, /^scale$/), method: findCol(h, /^method$/),
    ucum: findCol(h, /(unit of measure|ucum)/), codeSystem: findCol(h, /^code system$/),
  };
  if (c.code < 0 || c.nama < 0) throw new Error(`${sumber}: kolom kode/nama tidak ditemukan`);
  const at = (r: Cell[], i: number) => (i >= 0 ? norm(r[i]) : null);
  const out: TermRow[] = [];
  rows.slice(1).forEach((r, i) => {
    const code = at(r, c.code);
    const nama = at(r, c.nama);
    if (!code || !nama) { stat.noCode++; return; }
    let sys = normSystem(r[c.codeSystem]) ?? (/^\d{1,7}-\d$/.test(code) ? LOINC : null);
    if (!sys) { stat.noSystem++; sample(`${sumber}#${i + 1} tanpa sistem: ${code}`); return; }
    // Kode Kemenkes yang di sumber salah berlabel loinc.org: X…/PR…/PA… = kode pemeriksaan nasional,
    // TK… = terminologi Kemenkes umum (pola playbook, mis. TK000056).
    if (sys === LOINC && /^(X|PR|PA)\d{6}$/.test(code)) { sys = KEMKES_EXAM; stat.fixedSystem++; }
    else if (sys === LOINC && /^TK\d{6}$/.test(code)) { sys = KEMKES_TERM; stat.fixedSystem++; }
    if (sys === LOINC && !loincOk(code)) { stat.badLoinc++; sample(`${sumber}#${i + 1} LOINC invalid: ${code}`); return; }
    const phRaw = at(r, c.ph);
    const ph = phRaw ? PH[phRaw.toLowerCase()] ?? null : null;
    if (phRaw && !ph) { stat.unknownPh++; sample(`${sumber}#${i + 1} Permintaan/Hasil? "${phRaw}"`); }
    const tipeRaw = at(r, c.tipe);
    const tipe = tipeRaw ? TIPE[tipeRaw.toLowerCase()] ?? null : null;
    if (tipeRaw && !tipe) { stat.unknownTipe++; sample(`${sumber}#${i + 1} tipe? "${tipeRaw}"`); }
    out.push({
      sumber, sumberVersi: versi, baris: i + 1, kategori: at(r, c.kategori), namaPemeriksaan: nama,
      permintaanHasil: ph, spesimen: at(r, c.spesimen), tipeHasil: tipe, satuan: at(r, c.satuan), metode: at(r, c.metode),
      code, codeSystem: sys,
      display: at(r, c.display), component: at(r, c.component), property: at(r, c.property), timing: at(r, c.timing),
      loincSystem: at(r, c.system), scale: at(r, c.scale), loincMethod: at(r, c.method), ucum: at(r, c.ucum),
    });
  });
  return out;
}

function readAnswers(wb: XLSX.WorkBook, sumber: string): AnsRow[] {
  const out: AnsRow[] = [];
  for (const sn of wb.SheetNames.filter((s) => /answer/i.test(s))) {
    const rows = sheetRows(wb, sn);
    const hi = rows.slice(0, 3).findIndex((r) => r.some((x) => /code system/i.test(String(x ?? ""))));
    if (hi < 0) continue;
    const h = rows[hi].map((x) => String(x ?? "").replace(/\s+/g, " ").trim().toLowerCase());
    const q = findCol(h, /^(loinc ?code|loincnumber|kode loinc)$/);
    const a = findCol(h, /^(code|answerstringid)$/);
    const d = findCol(h, /^(answer list|displaytext)$/);
    const s = findCol(h, /^code system$/);
    const seq = findCol(h, /^sequencenumber$/);
    const ket = findCol(h, /^keterangan$/);
    if (q < 0 || a < 0 || d < 0) { sample(`${sumber}/${sn}: kolom answer tak dikenali`); continue; }
    let currentQ: string | null = null;
    for (const r of rows.slice(hi + 1)) {
      currentQ = norm(r[q]) ?? currentQ; // isi-ke-bawah: baris jawaban lanjutan tanpa kode pemeriksaan
      const code = norm(r[a]);
      const display = norm(r[d]);
      if (!currentQ || !code || !display) continue;
      const sys = normSystem(r[s]) ?? (/^LA\d+-\d$/.test(code) ? LOINC : null);
      if (!sys) continue;
      out.push({ sumber, kodePemeriksaan: currentQ, code, display, codeSystem: sys, urutan: seq >= 0 ? Number(norm(r[seq])) || null : null, keterangan: ket >= 0 ? norm(r[ket]) : null });
    }
  }
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const t0 = Date.now();
  const terms: TermRow[] = [];
  const answers: AnsRow[] = [];
  for (const src of SOURCES) {
    const file = path.join(DIR, src.file);
    if (!fs.existsSync(file)) throw new Error(`File tidak ditemukan: ${file} (unduh: drive.google.com/uc?export=download&id=${src.driveId})`);
    const wb = XLSX.readFile(file, { dense: true });
    const versi = versionOf(wb);
    const t = readTerms(wb, src.sumber, versi);
    const a = readAnswers(wb, src.sumber);
    terms.push(...t);
    answers.push(...a);
    stat.perSumber.push(`${src.sumber}${versi ? ` ${versi}` : ""}: ${t.length} baris · ${new Set(t.map((x) => x.code)).size} kode · ${a.length} jawaban`);
  }
  stat.terms = terms.length;
  stat.answers = answers.length;

  const report = () => {
    console.log(stat.perSumber.map((s) => `  ${s}`).join("\n"));
    console.log(`total baris        : ${stat.terms} · kode unik: ${new Set(terms.map((x) => x.code)).size} · LOINC: ${terms.filter((x) => x.codeSystem === LOINC).length}`);
    console.log(`jawaban (sebelum dedupe): ${stat.answers}`);
    console.log(`dilewati           : tanpa kode/nama=${stat.noCode} · tanpa sistem=${stat.noSystem} · LOINC invalid=${stat.badLoinc}`);
    console.log(`tak dikenali (null): Permintaan/Hasil=${stat.unknownPh} · tipe hasil=${stat.unknownTipe}`);
    console.log(`sistem dikoreksi   : ${stat.fixedSystem} (kode Kemenkes X/PR/PA/TK… yang berlabel loinc.org)`);
    if (stat.samples.length) console.log(`contoh             : ${stat.samples.join(" ; ")}`);
  };

  if (PROFILE) { report(); console.log(`(profile, tanpa tulis DB) ${((Date.now() - t0) / 1000).toFixed(1)} dtk`); return; }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set (jalankan dengan: node --env-file=.env …).");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE "master"."terminologi_lab", "master"."terminologi_lab_jawaban" RESTART IDENTITY`);
    const col = <T, K extends keyof T>(rows: T[], k: K) => rows.map((r) => r[k]);
    for (let i = 0; i < terms.length; i += 2000) {
      const b = terms.slice(i, i + 2000);
      await client.query(
        `INSERT INTO "master"."terminologi_lab"
           (sumber, sumber_versi, baris, kategori, nama_pemeriksaan, permintaan_hasil, spesimen, tipe_hasil, satuan, metode,
            code, code_system, display, component, property, timing, loinc_system, scale, loinc_method, ucum)
         SELECT * FROM unnest($1::text[], $2::text[], $3::int[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[],
                              $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::text[], $15::text[],
                              $16::text[], $17::text[], $18::text[], $19::text[], $20::text[])`,
        [col(b, "sumber"), col(b, "sumberVersi"), col(b, "baris"), col(b, "kategori"), col(b, "namaPemeriksaan"),
         col(b, "permintaanHasil"), col(b, "spesimen"), col(b, "tipeHasil"), col(b, "satuan"), col(b, "metode"),
         col(b, "code"), col(b, "codeSystem"), col(b, "display"), col(b, "component"), col(b, "property"),
         col(b, "timing"), col(b, "loincSystem"), col(b, "scale"), col(b, "loincMethod"), col(b, "ucum")],
      );
    }
    let ansLoaded = 0;
    for (let i = 0; i < answers.length; i += 2000) {
      const b = answers.slice(i, i + 2000);
      const r = await client.query(
        `INSERT INTO "master"."terminologi_lab_jawaban" (sumber, kode_pemeriksaan, code, display, code_system, urutan, keterangan)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[], $7::text[])
         ON CONFLICT (sumber, kode_pemeriksaan, code) DO NOTHING`,
        [col(b, "sumber"), col(b, "kodePemeriksaan"), col(b, "code"), col(b, "display"), col(b, "codeSystem"), col(b, "urutan"), col(b, "keterangan")],
      );
      ansLoaded += r.rowCount ?? 0;
    }
    await client.query("COMMIT");
    report();
    console.log(`jawaban dimuat     : ${ansLoaded} (duplikat dibuang: ${stat.answers - ansLoaded})`);
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
