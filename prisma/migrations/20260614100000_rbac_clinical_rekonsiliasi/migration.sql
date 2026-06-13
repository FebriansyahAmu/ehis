-- RBAC leaf BARU `clinical.rekonsiliasi` — Rekonsiliasi obat (PMK 72/2016 · SNARS PP 3.1 · SKP 3).
-- DIPISAH dari clinical.resep: penanggung jawab klinis rekonsiliasi = Apoteker (kolaborasi Dokter/
-- Perawat), tapi mereka TIDAK boleh menulis resep → resource sendiri agar hak tak bocor.
-- Append-only per fase (snapshot): endpoint /kunjungan/:id/rekonsiliasi GET+POST → aksi read/create saja
-- (tanpa update/delete; sama semangat clinical.consent yang immutable).
-- Grant: Admin full · Dokter [read,create] · Perawat [read,create] · Apoteker [read,create].
-- NB ABAC: route() choke-point (resource clinical.*) tetap men-scope per-kunjungan via careUnit —
-- Apoteker (unit kerja Farmasi) belum efektif untuk kunjungan IGD/RI sampai ada keputusan akses
-- lintas-unit farmasi (lihat TECH_DEBT). RBAC ini menetapkan KEBIJAKAN; ABAC adalah gerbang terpisah.
-- Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (2 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.rekonsiliasi', 'read',   'clinical.rekonsiliasi:read',   'Rekonsiliasi Obat — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.rekonsiliasi', 'create', 'clinical.rekonsiliasi:create', 'Rekonsiliasi Obat — Tambah', 'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat / Apoteker = read+create) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.rekonsiliasi:read','clinical.rekonsiliasi:create')
  WHERE r."key" IN ('Admin','Dokter','Perawat','Apoteker')
ON CONFLICT DO NOTHING;
