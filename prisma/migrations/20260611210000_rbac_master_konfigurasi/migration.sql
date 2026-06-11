-- #2: Akses granular per-fitur di modul Master. Tiap item nav digerbang permission
-- masing-masing (navigation.ts) → role hanya melihat menu sesuai kebutuhan
-- (mis. Apoteker: hanya Katalog). Mayoritas item pakai perm yang sudah ada
-- (master.ruangan/dokter/pengguna/katalog/icd/triase/mapping/tarif); halaman
-- konfigurasi sistem (Template/Enum/Workflow/Profil RS/PPK) butuh perm baru ini.

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.konfigurasi', 'read',   'master.konfigurasi:read',   'Konfigurasi Sistem (Template/Enum/Profil) — Lihat', 'master'),
  (gen_random_uuid(), 'master.konfigurasi', 'update', 'master.konfigurasi:update', 'Konfigurasi Sistem (Template/Enum/Profil) — Ubah',  'master')
ON CONFLICT ("kode") DO NOTHING;

-- Konfigurasi sistem = ranah Admin (superuser tetap bypass; baris ini melengkapi matrix).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."resource" = 'master.konfigurasi'
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;
