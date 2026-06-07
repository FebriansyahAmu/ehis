-- Delta RBAC: permission master.triase:* (Skala Klinis — Triase IGD) + grant default.
-- Idempoten (ON CONFLICT DO NOTHING). Selaras snapshot rbacShared.ts / gen-rbac-seed.mjs.
-- Admin = full; Dokter & Perawat = read (decision-support "Tabel Kriteria Triase" di TriaseTab).

-- ── Permissions (4 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.triase', 'read',   'master.triase:read',   'Triase IGD (Skala Klinis) — Lihat',  'master'),
  (gen_random_uuid(), 'master.triase', 'create', 'master.triase:create', 'Triase IGD (Skala Klinis) — Tambah', 'master'),
  (gen_random_uuid(), 'master.triase', 'update', 'master.triase:update', 'Triase IGD (Skala Klinis) — Ubah',   'master'),
  (gen_random_uuid(), 'master.triase', 'delete', 'master.triase:delete', 'Triase IGD (Skala Klinis) — Hapus',  'master')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants ──
-- Admin: full (read/create/update/delete)
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.triase:read', 'master.triase:create', 'master.triase:update', 'master.triase:delete')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- Dokter: read (baca protokol di TriaseTab)
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.triase:read')
  WHERE r."key" = 'Dokter'
ON CONFLICT DO NOTHING;

-- Perawat: read (baca protokol di TriaseTab)
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.triase:read')
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;
