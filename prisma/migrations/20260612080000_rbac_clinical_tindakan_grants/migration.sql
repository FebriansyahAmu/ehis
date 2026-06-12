-- Grant CRUD `clinical.tindakan` utk Dokter & Perawat (pencatatan tindakan di encounter aktif).
-- Sebelumnya: Dokter [read,create,update] · Perawat [read,update]. Recording tindakan (tab Tindakan
-- IGD/RI/RJ) butuh create + delete (soft-delete entered-in-error) oleh klinisi pelaksana.
-- Sekarang: Admin/Dokter/Perawat = full [read,create,update,delete]. Permission row clinical.tindakan
-- sudah ada dari seed awal; INSERT ON CONFLICT DO NOTHING = backstop idempoten.
-- ABAC careUnit tetap men-scope per-kunjungan (route() choke-point, resource clinical.*).

-- ── Permissions (backstop; harusnya sudah ada) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.tindakan', 'read',   'clinical.tindakan:read',   'Tindakan / Order — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'create', 'clinical.tindakan:create', 'Tindakan / Order — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'update', 'clinical.tindakan:update', 'Tindakan / Order — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'delete', 'clinical.tindakan:delete', 'Tindakan / Order — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = full CRUD) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.tindakan:read','clinical.tindakan:create','clinical.tindakan:update','clinical.tindakan:delete')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
