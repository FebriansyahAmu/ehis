-- RBAC leaf BARU `clinical.consent` — Informed Consent (persetujuan tindakan, PMK 290/2008).
-- IC immutable (add/delete only) → aksi read/create/delete (TANPA update; sama bentuk clinical.prosedur).
-- Endpoint /kunjungan/:id/consent (+/:itemId) di-gate clinical.consent. ABAC careUnit tetap men-scope
-- per-kunjungan (route() choke-point, resource clinical.*).
-- Grant: Admin full · Dokter [read,create,delete] · Perawat [read,create,delete] (perawat menyiapkan
-- formulir + TTD pasien/wali). Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (3 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.consent', 'read',   'clinical.consent:read',   'Informed Consent — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.consent', 'create', 'clinical.consent:create', 'Informed Consent — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.consent', 'delete', 'clinical.consent:delete', 'Informed Consent — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = read+create+delete) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.consent:read','clinical.consent:create','clinical.consent:delete')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
