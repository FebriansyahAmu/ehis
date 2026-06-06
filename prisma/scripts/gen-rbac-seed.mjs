// Generator SQL seed RBAC (auth.permissions + auth.role_permissions) dari snapshot rbacShared.
// Output = migration.sql idempoten (ON CONFLICT DO NOTHING). Sumber kebenaran runtime tetap
// Mapping Hub (yang menulis role_permissions); ini hanya seed default awal.
// Jalankan: node prisma/scripts/gen-rbac-seed.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ── Snapshot PERMISSION_TREE (selaras src/components/master/mapping/rbac/rbacShared.ts) ──
const PERMISSION_TREE = [
  { key: "clinical", leaves: [
    { key: "clinical.igd", label: "IGD", actions: ["read","create","update","delete"] },
    { key: "clinical.ri", label: "Rawat Inap", actions: ["read","create","update","delete"] },
    { key: "clinical.rj", label: "Rawat Jalan", actions: ["read","create","update","delete"] },
    { key: "clinical.cppt", label: "CPPT (SOAP)", actions: ["read","create","update"] },
    { key: "clinical.diagnosa", label: "Diagnosa (ICD-10)", actions: ["read","create","update","delete"] },
    { key: "clinical.tindakan", label: "Tindakan / Order", actions: ["read","create","update","delete"] },
    { key: "clinical.resep", label: "Resep & Obat", actions: ["read","create","update","delete"] },
  ]},
  { key: "ancillary", leaves: [
    { key: "ancillary.lab.worklist", label: "Lab — Worklist", actions: ["read","update"] },
    { key: "ancillary.lab.validate", label: "Lab — Validasi Hasil", actions: ["read","update"] },
    { key: "ancillary.lab.critical", label: "Lab — Critical Value", actions: ["read","create"] },
    { key: "ancillary.rad.worklist", label: "Rad — Worklist", actions: ["read","update"] },
    { key: "ancillary.rad.expertise", label: "Rad — Ekspertise Laporan", actions: ["read","create","update"] },
    { key: "ancillary.farmasi.telaah", label: "Farmasi — Telaah Resep", actions: ["read","update"] },
    { key: "ancillary.farmasi.serah", label: "Farmasi — Dispensing & Serah", actions: ["read","update"] },
  ]},
  { key: "registration", leaves: [
    { key: "registration.pasien", label: "Master Pasien", actions: ["read","create","update","delete"] },
    { key: "registration.kunjungan", label: "Pendaftaran Kunjungan", actions: ["read","create","update","delete"] },
    { key: "billing.invoice", label: "Billing — Invoice", actions: ["read","create","update","delete","export"] },
    { key: "billing.kasir", label: "Billing — Kasir / Bayar", actions: ["read","create"] },
    { key: "billing.klaim", label: "Billing — Klaim BPJS", actions: ["read","create","update","export"] },
  ]},
  { key: "master", leaves: [
    { key: "master.ruangan", label: "Unit & Ruangan", actions: ["read","create","update","delete"] },
    { key: "master.dokter", label: "Dokter & Nakes", actions: ["read","create","update","delete"] },
    { key: "master.pengguna", label: "Pengguna Sistem", actions: ["read","create","update","delete"] },
    { key: "master.mapping", label: "Mapping Hub", actions: ["read","update"] },
    { key: "master.katalog", label: "Katalog (Obat/Lab/ICD)", actions: ["read","create","update","delete"] },
    { key: "master.tarif", label: "Tarif & Paket", actions: ["read","create","update","delete"] },
  ]},
  { key: "report", leaves: [
    { key: "report.clinical", label: "Laporan Klinis", actions: ["read","export"] },
    { key: "report.financial", label: "Laporan Keuangan", actions: ["read","export"] },
    { key: "report.audit", label: "Audit Trail", actions: ["read","export"] },
  ]},
];

const allFull = () => {
  const m = {};
  for (const mod of PERMISSION_TREE) for (const l of mod.leaves) m[l.key] = [...l.actions];
  return m;
};

const ROLE_DEFAULT_GRANTS = {
  Admin: allFull(),
  Dokter: {
    "clinical.igd": ["read","create","update"], "clinical.ri": ["read","create","update"], "clinical.rj": ["read","create","update"],
    "clinical.cppt": ["read","create","update"], "clinical.diagnosa": ["read","create","update"], "clinical.tindakan": ["read","create","update"],
    "clinical.resep": ["read","create","update"], "ancillary.lab.worklist": ["read"], "ancillary.rad.worklist": ["read"],
    "ancillary.farmasi.telaah": ["read"], "report.clinical": ["read","export"],
  },
  Perawat: {
    "clinical.igd": ["read","update"], "clinical.ri": ["read","update"], "clinical.cppt": ["read","create"],
    "clinical.tindakan": ["read","update"], "clinical.resep": ["read"], "ancillary.lab.worklist": ["read"],
    "ancillary.rad.worklist": ["read"], "ancillary.farmasi.serah": ["read"],
  },
  Apoteker: {
    "clinical.resep": ["read"], "ancillary.farmasi.telaah": ["read","update"], "ancillary.farmasi.serah": ["read","update"],
    "master.katalog": ["read","update"], "report.clinical": ["read"],
  },
  Radiografer: { "ancillary.rad.worklist": ["read","update"], "clinical.ri": ["read"], "clinical.rj": ["read"] },
  SpPK: {
    "ancillary.lab.worklist": ["read","update"], "ancillary.lab.validate": ["read","update"], "ancillary.lab.critical": ["read","create"],
    "clinical.ri": ["read"], "clinical.rj": ["read"], "report.clinical": ["read","export"],
  },
  SpRad: {
    "ancillary.rad.worklist": ["read","update"], "ancillary.rad.expertise": ["read","create","update"],
    "clinical.ri": ["read"], "clinical.rj": ["read"], "report.clinical": ["read","export"],
  },
  Kasir: {
    "billing.invoice": ["read","create","update"], "billing.kasir": ["read","create"], "billing.klaim": ["read","update"],
    "registration.pasien": ["read"], "registration.kunjungan": ["read"], "report.financial": ["read","export"],
  },
  Registrasi: { "registration.pasien": ["read","create","update"], "registration.kunjungan": ["read","create","update"], "clinical.rj": ["read"] },
};

const ACTION_LABEL = { read: "Lihat", create: "Tambah", update: "Ubah", delete: "Hapus", export: "Ekspor" };
const sq = (s) => s.replace(/'/g, "''");

// ── Build permission rows ──
const labelByLeaf = {};
const modulByLeaf = {};
const permRows = [];
for (const mod of PERMISSION_TREE) {
  for (const l of mod.leaves) {
    labelByLeaf[l.key] = l.label;
    modulByLeaf[l.key] = mod.key;
    for (const a of l.actions) {
      permRows.push({ resource: l.key, action: a, kode: `${l.key}:${a}`, nama: `${l.label} — ${ACTION_LABEL[a]}`, modul: mod.key });
    }
  }
}

let sql = `-- Seed RBAC: auth.permissions (atomik resource×action) + auth.role_permissions (grant default).
-- Idempoten (ON CONFLICT DO NOTHING). Di-generate dari prisma/scripts/gen-rbac-seed.mjs.
-- Sumber kebenaran runtime = Mapping Hub (menulis role_permissions); ini seed awal saja.

-- ── Permissions (${permRows.length} baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
`;
sql += permRows
  .map((r) => `  (gen_random_uuid(), '${sq(r.resource)}', '${r.action}', '${sq(r.kode)}', '${sq(r.nama)}', '${sq(r.modul)}')`)
  .join(",\n");
sql += `\nON CONFLICT ("kode") DO NOTHING;\n\n`;

// ── Role → permission grants ──
sql += `-- ── Role grants ──\n`;
for (const [roleKey, grants] of Object.entries(ROLE_DEFAULT_GRANTS)) {
  const kodes = [];
  for (const [leaf, actions] of Object.entries(grants)) for (const a of actions) kodes.push(`${leaf}:${a}`);
  if (!kodes.length) continue;
  const arr = kodes.map((k) => `'${sq(k)}'`).join(", ");
  sql += `INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (${arr})
  WHERE r."key" = '${sq(roleKey)}'
ON CONFLICT DO NOTHING;\n`;
}

// ── Fix unitScoped: Kasir & Registrasi = global (BACKEND-AUTH §2.3 / Keputusan #4) ──
sql += `\n-- Koreksi: Kasir & Registrasi = role GLOBAL (bypass unit-scope), selaras Keputusan #4.
UPDATE "auth"."roles" SET "unit_scoped" = false, "updated_at" = now() WHERE "key" IN ('Kasir','Registrasi');\n`;

const out = "prisma/migrations/20260607120000_seed_rbac/migration.sql";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql);
console.log(`Wrote ${out} — ${permRows.length} permissions, ${Object.keys(ROLE_DEFAULT_GRANTS).length} roles.`);
