#!/usr/bin/env node
// Tambah primitif shadcn/ui ke src/components/ui (docs/ENGINEERING-RULES.md §4).
//
// Kenapa bukan `npx shadcn add` langsung: registry style "new-york" (CLI 4.x) menulis
// `import { cn } from "cn"` (paket npm pihak ketiga) dan mencoba memasangnya — alias `utils` di
// components.json diabaikan. Skrip ini mengambil isi file via `--dry-run --view` (tanpa menulis /
// memasang apa pun), mengganti import ke `@/lib/ui/utils`, lalu menulis file. Dependensi npm yang
// dibutuhkan komponen (mis. cmdk) dipasang manual: lihat keluaran `--dry-run` CLI.
//
// Pakai: npm run ui:add -- dialog tabs …   (file yang sudah ada TIDAK ditimpa)

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const SHADCN = "shadcn@4.23.0"; // versi CLI dipin agar keluaran stabil
const names = process.argv.slice(2);
if (!names.length) {
  console.error("Pakai: npm run ui:add -- <komponen…>   mis. npm run ui:add -- alert-dialog");
  process.exit(2);
}
for (const n of names) {
  // Nama dikirim ke shell (npx di Windows) → wajib whitelist karakter.
  if (!/^[a-z0-9-]+$/.test(n)) {
    console.error(`✖ nama komponen tidak valid: ${n}`);
    process.exit(2);
  }
}

mkdirSync("src/components/ui", { recursive: true });
let failed = false;

for (const name of names) {
  const rel = `src/components/ui/${name}.tsx`;
  if (existsSync(rel)) {
    console.log(`• ${rel} sudah ada — dilewati`);
    continue;
  }
  const viewPath = process.platform === "win32" ? rel.replaceAll("/", "\\") : rel;
  const r = spawnSync("npx", ["--yes", SHADCN, "add", name, "--dry-run", "--view", viewPath], {
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  const lines = `${r.stdout ?? ""}${r.stderr ?? ""}`.split(/\r?\n/);
  const start = lines.findIndex((l) => /^│ ┌─/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^│ └─/.test(l));
  if (start < 0 || end < 0) {
    console.error(`✖ ${name}: isi file tidak ditemukan pada keluaran CLI (komponen multi-file / nama salah?)`);
    failed = true;
    continue;
  }
  const body = lines
    .slice(start + 1, end)
    .map((l) => l.replace(/^│ │ ?/, ""))
    .join("\n")
    .replace(/from "cn"/g, 'from "@/lib/ui/utils"')
    .replace(/\n+$/, "\n");
  writeFileSync(rel, body);
  console.log(`✔ ${rel} (${body.split("\n").length} baris) — periksa teks bawaan berbahasa Inggris (lokalisasi)`);
}

process.exit(failed ? 1 : 0);
