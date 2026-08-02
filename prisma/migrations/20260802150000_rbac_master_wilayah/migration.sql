-- `master.wilayah:read` — referensi wilayah Kemendagri (dictionary nama/kode wilayah),
-- dikonsumsi lintas modul (registrasi alamat pasien · lokasiLaka KLL · master alamat RS).
-- Data non-sensitif (nama wilayah publik) → grant READ ke SEMUA role (blanket). Tulis wilayah
-- = seed/sync administratif (bukan lewat UI) → tanpa create/update/delete.

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'master.wilayah', 'read', 'master.wilayah:read', 'Referensi Wilayah — Lihat', 'master')
ON CONFLICT ("kode") DO NOTHING;

-- Grant read ke SEMUA role (referensi publik lintas modul).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'master.wilayah:read'
ON CONFLICT DO NOTHING;
