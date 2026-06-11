-- Pisah prosedur ICD-9-CM dari resource `clinical.diagnosa` → resource sendiri `clinical.prosedur`.
-- Sebelumnya endpoint diagnosa/prosedur/* di-gate `clinical.diagnosa` (sama dgn ICD-10 diagnosis),
-- sehingga matrix RBAC TAK BISA ekspresikan "Perawat boleh input ICD-9 tanpa hak tulis ICD-10".
-- Sekarang:
--   clinical.diagnosa  = ICD-10 diagnosis        (read/create/update/delete)
--   clinical.prosedur  = ICD-9-CM prosedur       (read/create/delete)  ← BARU
-- GET agregat tab Diagnosa tetap clinical.diagnosa:read (memuat ICD-10 + ICD-9 sekaligus).
-- ABAC careUnit tetap berlaku (resource clinical.* → route() choke-point men-scope kunjungan).
--
-- Idempoten (ON CONFLICT DO NOTHING). Grant:
--   Admin full · Dokter [read,create,delete] · Perawat [read,create,delete]
--   + Perawat clinical.diagnosa:read (agar bisa MEMBUKA tab Diagnosa untuk input prosedur).

-- ── Permissions (3 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.prosedur', 'read',   'clinical.prosedur:read',   'Prosedur (ICD-9-CM) — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.prosedur', 'create', 'clinical.prosedur:create', 'Prosedur (ICD-9-CM) — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.prosedur', 'delete', 'clinical.prosedur:delete', 'Prosedur (ICD-9-CM) — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants ──
-- Admin: full (3 aksi) — jaga invarian "Admin = 100%" di Mapping Hub (runtime tetap bypass).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.prosedur:read','clinical.prosedur:create','clinical.prosedur:delete')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- Dokter: read+create+delete. Sebelumnya dokter cuma bisa CREATE prosedur (via clinical.diagnosa
-- create) tapi TAK bisa hapus (clinical.diagnosa tak punya delete utk dokter) — kini delete eksplisit.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.prosedur:read','clinical.prosedur:create','clinical.prosedur:delete')
  WHERE r."key" = 'Dokter'
ON CONFLICT DO NOTHING;

-- Perawat: read+create+delete ICD-9 (BARU — sebelumnya perawat tak punya clinical.diagnosa sama
-- sekali, jadi tak bisa input prosedur maupun lihat tab).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.prosedur:read','clinical.prosedur:create','clinical.prosedur:delete')
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;

-- Perawat juga butuh clinical.diagnosa:read agar bisa MEMBUKA tab Diagnosa (GET agregat memuat
-- ICD-10 + ICD-9 dalam satu respons). Hanya READ — perawat tetap TAK boleh tulis diagnosis ICD-10.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'clinical.diagnosa:read'
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;
