-- RBAC leaf BARU `clinical.keperawatan` — Asuhan Keperawatan (SDKI/SLKI/SIKI), tab Keperawatan.
-- Domain Perawat (penulis utama); Dokter dokumentasi/co-sign. Resource sendiri agar Perawat punya
-- CREATE penuh TANPA membuka clinical.rekammedis shared. CRUD penuh (delete = entered-in-error).
-- Endpoint /kunjungan/:id/asuhan-keperawatan (+/:itemId) di-gate clinical.keperawatan. ABAC careUnit
-- tetap men-scope per-kunjungan (route() choke-point, resource clinical.*).
-- Grant: Admin full · Dokter [r,c,u,d] · Perawat [r,c,u,d]. Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (4 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.keperawatan', 'read',   'clinical.keperawatan:read',   'Asuhan Keperawatan — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.keperawatan', 'create', 'clinical.keperawatan:create', 'Asuhan Keperawatan — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.keperawatan', 'update', 'clinical.keperawatan:update', 'Asuhan Keperawatan — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.keperawatan', 'delete', 'clinical.keperawatan:delete', 'Asuhan Keperawatan — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = full CRUD) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.keperawatan:read','clinical.keperawatan:create','clinical.keperawatan:update','clinical.keperawatan:delete')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
