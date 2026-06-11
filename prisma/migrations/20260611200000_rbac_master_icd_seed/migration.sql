-- R1: `master.icd` adalah resource yang DIPAKAI route (/master/icd GET/import/PATCH/DELETE)
-- tapi TAK PERNAH di-seed → hanya Admin (superuser bypass) yang bisa; pencarian ICD di tab
-- Diagnosa 403 untuk semua role lain. Seed permission + grant `read` ke role klinis (koding
-- diagnosis). Bukan akses modul Master (gate modul = master.view; role klinis tak punya itu).

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.icd', 'read',   'master.icd:read',   'Katalog ICD-10/9 — Lihat',  'master'),
  (gen_random_uuid(), 'master.icd', 'create', 'master.icd:create', 'Katalog ICD-10/9 — Tambah', 'master'),
  (gen_random_uuid(), 'master.icd', 'update', 'master.icd:update', 'Katalog ICD-10/9 — Ubah',   'master'),
  (gen_random_uuid(), 'master.icd', 'delete', 'master.icd:delete', 'Katalog ICD-10/9 — Hapus',  'master')
ON CONFLICT ("kode") DO NOTHING;

-- Admin: full (matrix lengkap; superuser tetap bypass enforcement).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."resource" = 'master.icd'
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- Role klinis: read saja (cari kode ICD saat koding diagnosis) — modul Master tetap tersembunyi.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'master.icd:read'
  WHERE r."key" IN ('Dokter','Perawat')
ON CONFLICT DO NOTHING;
