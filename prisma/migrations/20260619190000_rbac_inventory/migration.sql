-- Seed RBAC delta: permission inventory.* (modul Inventory/Logistik) + grant default ke Admin
-- (lengkap) & Apoteker (operasional). Idempoten (ON CONFLICT DO NOTHING). Delta terpisah dari
-- 20260607140000 (gen-rbac-seed) supaya tak meng-clobber checksum migrasi yang sudah applied.

-- ── Permissions (resource:action) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'inventory.view',       'read',   'inventory.view:read',         'Inventory — Akses Modul — Lihat',          'inventory'),
  (gen_random_uuid(), 'inventory.barang',     'read',   'inventory.barang:read',       'Daftar Barang & Stok — Lihat',             'inventory'),
  (gen_random_uuid(), 'inventory.barang',     'update', 'inventory.barang:update',     'Daftar Barang & Stok — Ubah',              'inventory'),
  (gen_random_uuid(), 'inventory.opname',     'read',   'inventory.opname:read',       'Stok Opname — Lihat',                      'inventory'),
  (gen_random_uuid(), 'inventory.opname',     'create', 'inventory.opname:create',     'Stok Opname — Tambah',                     'inventory'),
  (gen_random_uuid(), 'inventory.opname',     'update', 'inventory.opname:update',     'Stok Opname — Ubah',                       'inventory'),
  (gen_random_uuid(), 'inventory.pengiriman', 'read',   'inventory.pengiriman:read',   'Penerimaan & Transfer — Lihat',            'inventory'),
  (gen_random_uuid(), 'inventory.pengiriman', 'create', 'inventory.pengiriman:create', 'Penerimaan & Transfer — Tambah',           'inventory'),
  (gen_random_uuid(), 'inventory.pengiriman', 'update', 'inventory.pengiriman:update', 'Penerimaan & Transfer — Ubah',             'inventory'),
  (gen_random_uuid(), 'inventory.distribusi', 'read',   'inventory.distribusi:read',   'Distribusi Unit — Lihat',                  'inventory'),
  (gen_random_uuid(), 'inventory.distribusi', 'create', 'inventory.distribusi:create', 'Distribusi Unit — Tambah',                 'inventory'),
  (gen_random_uuid(), 'inventory.distribusi', 'update', 'inventory.distribusi:update', 'Distribusi Unit — Ubah',                   'inventory'),
  (gen_random_uuid(), 'inventory.monitoring', 'read',   'inventory.monitoring:read',   'Monitoring Stok — Lihat',                  'inventory'),
  (gen_random_uuid(), 'inventory.monitoring', 'export', 'inventory.monitoring:export', 'Monitoring Stok — Ekspor',                 'inventory'),
  (gen_random_uuid(), 'inventory.rekanan',    'read',   'inventory.rekanan:read',      'Rekanan (Vendor/PBF) — Lihat',             'inventory'),
  (gen_random_uuid(), 'inventory.rekanan',    'create', 'inventory.rekanan:create',    'Rekanan (Vendor/PBF) — Tambah',            'inventory'),
  (gen_random_uuid(), 'inventory.rekanan',    'update', 'inventory.rekanan:update',    'Rekanan (Vendor/PBF) — Ubah',              'inventory'),
  (gen_random_uuid(), 'inventory.rekanan',    'delete', 'inventory.rekanan:delete',    'Rekanan (Vendor/PBF) — Hapus',             'inventory')
ON CONFLICT ("kode") DO NOTHING;

-- ── Grant ke Admin (semua inventory.*) & Apoteker (operasional) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."modul" = 'inventory'
  WHERE r."key" IN ('Admin','Apoteker')
ON CONFLICT DO NOTHING;
