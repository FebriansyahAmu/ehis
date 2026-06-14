-- RBAC leaf BARU `clinical.penilaian` — tab Penilaian (Assessment klinis IGD).
-- Sub-menu append-only (read/create — koreksi = baris baru). SATU resource untuk seluruh
-- tab Penilaian (Fisik + sub-menu berikutnya). Dokter & Perawat sama-sama menilai → grant
-- keduanya. Endpoint /kunjungan/:id/penilaian-* di-gate clinical.penilaian; ABAC careUnit
-- men-scope per-kunjungan (route() choke-point). Grant: Admin · Dokter · Perawat [r,c].
-- Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (2 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.penilaian', 'read',   'clinical.penilaian:read',   'Penilaian Klinis — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.penilaian', 'create', 'clinical.penilaian:create', 'Penilaian Klinis — Tambah', 'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = read + create) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.penilaian:read','clinical.penilaian:create')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
