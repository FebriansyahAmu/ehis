-- Pisahkan VISIBILITAS MODUL loket dari permission DATA (idempoten).
-- Masalah: role klinis butuh baca pasien+kunjungan (rekam medis by kunjunganId), tapi
-- memberi `registration.pasien:read` ikut membuka MODUL /ehis-registration karena modul
-- digerbang oleh permission data yang sama.
-- Solusi: gate modul loket pakai permission khusus `registration.loket:read` (bukan data),
-- lalu role klinis cukup dapat DATA pasien/kunjungan tanpa melihat modulnya.

-- 1. Permission gate modul loket (pure visibility, action read).
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'registration.loket', 'read', 'registration.loket:read', 'Loket Registrasi — Akses Modul', 'registration')
ON CONFLICT ("kode") DO NOTHING;

-- 2. Gate modul → loket staff (Registrasi) + Admin.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'registration.loket:read'
  WHERE r."key" IN ('Admin','Registrasi')
ON CONFLICT DO NOTHING;

-- 3. DATA pasien (read) utk role klinis — header rekam medis (BUKAN akses modul registrasi).
--    `registration.kunjungan:read` sudah diberikan di migrasi 20260611170000.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'registration.pasien:read'
  WHERE r."key" IN ('Dokter','Perawat')
ON CONFLICT DO NOTHING;
