#!/usr/bin/env node
// Verifikasi RINGAN untuk laptop dev (docs/ENGINEERING-RULES.md §2, tingkat 1):
//   1. cek RAM bebas — batal bila terlalu sedikit (hindari freeze), kecuali --force
//   2. ESLint HANYA file yang berubah di branch ini (vs merge-base main) + cache
//   3. Typecheck TERBATAS: tsc hanya atas graf impor file .ts/.tsx yang berubah (heap dibatasi;
//      graf terlalu besar → dilewati & diserahkan ke CI, bukan dipaksa)
//   4. Vitest HANYA test yang terkait file berubah (`vitest related`, maks 2 worker)
//   5. peringatan file > 800 baris di antara file yang berubah
// Typecheck penuh, lint penuh & audit dependensi berjalan di CI (GitHub Actions), bukan di sini.
//
// Pakai: npm run check:changed [-- --base=main] [-- --force] [-- --no-test] [-- --no-types]

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";

const args = new Set(process.argv.slice(2));
const baseArg = [...args].find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.slice("--base=".length) : "main";
const MIN_FREE_MB = 1024;
const MAX_LINES = 800;
const LINT_EXT = /\.(ts|tsx|mts|mjs|js|jsx)$/;
const SKIP = /^(src\/generated\/|\.next\/|node_modules\/|\.codenpm\/)/;

// stderr git (mis. peringatan CRLF) dibuang agar keluaran tetap ringkas.
const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const lines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

// ── 1. RAM ──────────────────────────────────────────────────
const freeMb = Math.round(os.freemem() / 1024 / 1024);
console.log(`RAM bebas: ${freeMb} MB (minimum ${MIN_FREE_MB} MB)`);
if (freeMb < MIN_FREE_MB && !args.has("--force")) {
  console.error("✖ RAM bebas terlalu sedikit — tutup dev server/tab browser lalu ulangi, atau pakai --force.");
  process.exit(2);
}

// ── File berubah: commit di branch + staged + belum di-stage + untracked ──
let mergeBase;
try {
  mergeBase = git("merge-base", "HEAD", BASE);
} catch {
  console.error(`✖ Tidak menemukan merge-base dengan "${BASE}". Pakai --base=<branch>.`);
  process.exit(2);
}
const changed = [
  ...new Set([
    ...lines(git("diff", "--name-only", "--diff-filter=ACMR", mergeBase)),
    ...lines(git("ls-files", "--others", "--exclude-standard")),
  ]),
].filter((f) => !SKIP.test(f) && existsSync(f));

const lintable = changed.filter((f) => LINT_EXT.test(f));
console.log(`File berubah vs ${BASE}: ${changed.length} (lint: ${lintable.length})`);
if (!lintable.length) {
  console.log("✔ Tidak ada file kode yang berubah.");
  process.exit(0);
}

// Jalankan bin lokal lewat node TANPA shell → path seperti "(main)"/"[id]" aman di Windows.
const run = (bin, binArgs) => spawnSync(process.execPath, [bin, ...binArgs], { stdio: "inherit" }).status ?? 1;
let failed = false;

// ── 2. ESLint file berubah ──────────────────────────────────
console.log("\n▶ ESLint (file berubah, cache)");
if (run("node_modules/eslint/bin/eslint.js", ["--cache", "--cache-location", ".eslintcache", ...lintable]) !== 0) failed = true;

// ── 3. Typecheck terbatas (graf file berubah) ───────────────
const TSC_HEAP_MB = 1024;
const tsFiles = lintable.filter((f) => /\.(ts|tsx|mts)$/.test(f) && !f.endsWith(".d.ts"));
if (!args.has("--no-types") && tsFiles.length) {
  console.log(`\n▶ Typecheck terbatas (${tsFiles.length} file + impornya, heap ≤ ${TSC_HEAP_MB} MB)`);
  const tmp = "tsconfig.check-changed.json";
  writeFileSync(tmp, JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: { incremental: false, plugins: [] },
    include: ["next-env.d.ts", ...tsFiles],
  }));
  try {
    const r = spawnSync(process.execPath, [`--max-old-space-size=${TSC_HEAP_MB}`, "node_modules/typescript/bin/tsc", "-p", tmp, "--noEmit"], { encoding: "utf8" });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    if (/heap out of memory|Allocation failed/i.test(out)) {
      console.warn("⚠ Graf impor terlalu besar untuk batas heap — typecheck diserahkan ke CI.");
    } else if (r.status !== 0) {
      process.stdout.write(out);
      failed = true;
    } else {
      console.log("✔ tanpa error tipe");
    }
  } finally {
    rmSync(tmp, { force: true });
  }
}

// ── 4. Vitest related ───────────────────────────────────────
if (!args.has("--no-test")) {
  const srcFiles = lintable.filter((f) => f.startsWith("src/"));
  if (srcFiles.length) {
    console.log("\n▶ Vitest related (maks 2 worker)");
    // exit code 0 juga bila tak ada test terkait (--passWithNoTests).
    if (run("node_modules/vitest/vitest.mjs", ["related", "--run", "--passWithNoTests", "--maxWorkers=2", ...srcFiles]) !== 0) failed = true;
  }
}

// ── 5. Ukuran file ──────────────────────────────────────────
const big = lintable
  .map((f) => ({ f, n: readFileSync(f, "utf8").split("\n").length }))
  .filter((x) => x.n > MAX_LINES);
if (big.length) {
  console.warn(`\n⚠ File > ${MAX_LINES} baris (jangan bertambah; pecah saat disentuh):`);
  for (const b of big) console.warn(`  ${b.n.toString().padStart(5)}  ${b.f}`);
}

console.log(failed ? "\n✖ check:changed GAGAL" : "\n✔ check:changed lulus — typecheck penuh menyusul di CI");
process.exit(failed ? 1 : 0);
