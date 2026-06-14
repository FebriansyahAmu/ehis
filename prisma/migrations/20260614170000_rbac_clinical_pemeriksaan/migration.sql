-- RBAC leaf BARU `clinical.pemeriksaan` — Pemeriksaan Fisik (tab Pemeriksaan, SNARS AP 1).
-- Append-only (read/create saja — tanpa update/delete; koreksi = baris baru). Dokter & Perawat
-- sama-sama memeriksa → grant keduanya. Endpoint /kunjungan/:id/pemeriksaan-fisik di-gate
-- clinical.pemeriksaan; ABAC careUnit tetap men-scope per-kunjungan (route() choke-point).
-- Grant: Admin · Dokter · Perawat [r,c]. Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (2 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.pemeriksaan', 'read',   'clinical.pemeriksaan:read',   'Pemeriksaan Fisik — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.pemeriksaan', 'create', 'clinical.pemeriksaan:create', 'Pemeriksaan Fisik — Tambah', 'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = read + create) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.pemeriksaan:read','clinical.pemeriksaan:create')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
