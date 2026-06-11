-- Pisahkan VISIBILITAS MODUL Master dari permission DATA (idempoten) — pola sama registration.loket.
-- Role klinis butuh BACA master.ruangan + master.dokter (resolve nama ruangan & DPJP di board /
-- rekam medis IGD), tapi memberi read itu ikut membuka MODUL /ehis-master. Gate modul dipindah ke
-- permission khusus `master.view:read`.

-- 1. Permission gate modul Master (pure visibility, action read).
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.view', 'read', 'master.view:read', 'Master — Akses Modul', 'master')
ON CONFLICT ("kode") DO NOTHING;

-- 2. Gate modul → role yang memang mengelola master (Admin + Apoteker/katalog).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'master.view:read'
  WHERE r."key" IN ('Admin','Apoteker')
ON CONFLICT DO NOTHING;

-- 3. DATA referensi (read) utk role klinis — resolve nama ruangan & DPJP (BUKAN akses modul Master).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('master.ruangan:read', 'master.dokter:read')
  WHERE r."key" IN ('Dokter','Perawat')
ON CONFLICT DO NOTHING;
