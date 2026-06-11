-- R2 — Decouple endpoint rekam medis SHARED dari resource `clinical.igd`.
-- Endpoint asesmen/* + anamnesis + observasi dipakai lintas-unit (IGD/RI/RJ) lewat komponen
-- shared, tapi sebelumnya semua di-gate `clinical.igd` (nama menyesatkan + matrix RBAC tak
-- bisa ekspresikan "boleh rekam RJ tanpa IGD"). Sekarang pakai resource NETRAL
-- `clinical.rekammedis`. Akses per-unit ditegakkan ABAC careUnit (route() choke-point):
--   RBAC clinical.rekammedis = "boleh menyentuh rekam medis" · ABAC careUnit = "unit mana".
-- `clinical.igd` tetap ada (gate modul/nav IGD + triase yang memang IGD-specific).
--
-- Idempoten (ON CONFLICT DO NOTHING). Grant = mirror persis grant clinical.igd lama:
--   Dokter [read,create,update] · Perawat [read,update] · Admin full (superuser tetap bypass).

-- ── Permissions (4 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.rekammedis', 'read',   'clinical.rekammedis:read',   'Rekam Medis (Asesmen/Anamnesis/Observasi) — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.rekammedis', 'create', 'clinical.rekammedis:create', 'Rekam Medis (Asesmen/Anamnesis/Observasi) — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.rekammedis', 'update', 'clinical.rekammedis:update', 'Rekam Medis (Asesmen/Anamnesis/Observasi) — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.rekammedis', 'delete', 'clinical.rekammedis:delete', 'Rekam Medis (Asesmen/Anamnesis/Observasi) — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants ──
-- Admin: full (4 aksi) — jaga invarian "Admin = 100%" di Mapping Hub (runtime tetap bypass).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.rekammedis:read','clinical.rekammedis:create','clinical.rekammedis:update','clinical.rekammedis:delete')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- Dokter: read+create+update (mirror clinical.igd lama).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.rekammedis:read','clinical.rekammedis:create','clinical.rekammedis:update')
  WHERE r."key" = 'Dokter'
ON CONFLICT DO NOTHING;

-- Perawat: read+update (mirror clinical.igd lama).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.rekammedis:read','clinical.rekammedis:update')
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;
