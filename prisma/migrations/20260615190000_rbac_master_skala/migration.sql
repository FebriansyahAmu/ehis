-- Delta RBAC: permission master.skala:* (Skala Klinis — Risiko/Umum/Penyakit, bentuk skoring) + grant.
-- Idempoten (ON CONFLICT DO NOTHING). Selaras snapshot rbacShared.ts.
-- Admin = full; Dokter & Perawat = read (tab Penilaian tarik instrumen skala dari master).

-- ── Permissions (4 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.skala', 'read',   'master.skala:read',   'Skala Klinis (Risiko/Umum/Penyakit) — Lihat',  'master'),
  (gen_random_uuid(), 'master.skala', 'create', 'master.skala:create', 'Skala Klinis (Risiko/Umum/Penyakit) — Tambah', 'master'),
  (gen_random_uuid(), 'master.skala', 'update', 'master.skala:update', 'Skala Klinis (Risiko/Umum/Penyakit) — Ubah',   'master'),
  (gen_random_uuid(), 'master.skala', 'delete', 'master.skala:delete', 'Skala Klinis (Risiko/Umum/Penyakit) — Hapus',  'master')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants ──
-- Admin: full (read/create/update/delete)
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.skala:read', 'master.skala:create', 'master.skala:update', 'master.skala:delete')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- Dokter & Perawat: read (tab Penilaian konsumsi instrumen skala)
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.skala:read')
  WHERE r."key" IN ('Dokter', 'Perawat')
ON CONFLICT DO NOTHING;
