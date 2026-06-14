-- RBAC — perluas `clinical.pemeriksaan` dgn action update + delete (sub Anatomi/Penandaan = daftar
-- hidup: edit catatan + lepas tanda). Resource yang sama melayani seluruh tab Pemeriksaan
-- (Fisik append-only pakai read/create; Anatomi pakai read/create/update/delete).
-- Grant update+delete: Admin · Dokter · Perawat. Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (2 baris tambahan) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.pemeriksaan', 'update', 'clinical.pemeriksaan:update', 'Pemeriksaan Fisik — Ubah',  'clinical'),
  (gen_random_uuid(), 'clinical.pemeriksaan', 'delete', 'clinical.pemeriksaan:delete', 'Pemeriksaan Fisik — Hapus', 'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = update + delete) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.pemeriksaan:update','clinical.pemeriksaan:delete')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
