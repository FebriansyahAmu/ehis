-- RBAC modul EHIS BPJS (bridging web service V-Claim + Aplicares) — resource SENDIRI `bpjs.*`.
-- Dulu modul ini menumpang gerbang `billing.klaim` (milik E-Klaim/billing) sehingga hak klaim
-- otomatis membuka bridging BPJS dan sebaliknya. Pola MODUL ≠ DATA (sama dengan master.view /
-- inventory.view): `bpjs.view` = melihat modul; resource per menu = hak data/aksi yang juga dicek
-- API. Contoh: loket registrasi kelak bisa diberi `bpjs.kepesertaan:read` (cek peserta dari form
-- pendaftaran) TANPA melihat modul BPJS.
-- Idempoten (ON CONFLICT DO NOTHING). Terapkan: `prisma db execute` + `migrate resolve --applied`.

-- ── Permissions (resource:action) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'bpjs.view',            'read',   'bpjs.view:read',              'BPJS — Akses Modul — Lihat',                'bpjs'),
  (gen_random_uuid(), 'bpjs.kepesertaan',     'read',   'bpjs.kepesertaan:read',       'BPJS — Cek Kepesertaan — Lihat',            'bpjs'),
  (gen_random_uuid(), 'bpjs.sep',             'read',   'bpjs.sep:read',               'BPJS — SEP — Lihat',                        'bpjs'),
  (gen_random_uuid(), 'bpjs.sep',             'create', 'bpjs.sep:create',             'BPJS — SEP — Terbitkan',                    'bpjs'),
  (gen_random_uuid(), 'bpjs.sep',             'update', 'bpjs.sep:update',             'BPJS — SEP — Ubah',                         'bpjs'),
  (gen_random_uuid(), 'bpjs.sep',             'delete', 'bpjs.sep:delete',             'BPJS — SEP — Hapus',                        'bpjs'),
  (gen_random_uuid(), 'bpjs.rujukan',         'read',   'bpjs.rujukan:read',           'BPJS — Rujukan — Lihat',                    'bpjs'),
  (gen_random_uuid(), 'bpjs.rujukan',         'create', 'bpjs.rujukan:create',         'BPJS — Rujukan — Tambah',                   'bpjs'),
  (gen_random_uuid(), 'bpjs.rujukan',         'update', 'bpjs.rujukan:update',         'BPJS — Rujukan — Ubah',                     'bpjs'),
  (gen_random_uuid(), 'bpjs.rujukan',         'delete', 'bpjs.rujukan:delete',         'BPJS — Rujukan — Hapus',                    'bpjs'),
  (gen_random_uuid(), 'bpjs.monitoring',      'read',   'bpjs.monitoring:read',        'BPJS — Monitoring — Lihat',                 'bpjs'),
  (gen_random_uuid(), 'bpjs.monitoring',      'export', 'bpjs.monitoring:export',      'BPJS — Monitoring — Ekspor',                'bpjs'),
  (gen_random_uuid(), 'bpjs.rencanakontrol',  'read',   'bpjs.rencanakontrol:read',    'BPJS — Rencana Kontrol & SPRI — Lihat',     'bpjs'),
  (gen_random_uuid(), 'bpjs.rencanakontrol',  'create', 'bpjs.rencanakontrol:create',  'BPJS — Rencana Kontrol & SPRI — Terbitkan', 'bpjs'),
  (gen_random_uuid(), 'bpjs.rencanakontrol',  'update', 'bpjs.rencanakontrol:update',  'BPJS — Rencana Kontrol & SPRI — Ubah',      'bpjs'),
  (gen_random_uuid(), 'bpjs.rencanakontrol',  'delete', 'bpjs.rencanakontrol:delete',  'BPJS — Rencana Kontrol & SPRI — Hapus',     'bpjs'),
  (gen_random_uuid(), 'bpjs.aplicares',       'read',   'bpjs.aplicares:read',         'BPJS — Aplicares (Kamar) — Lihat',          'bpjs'),
  (gen_random_uuid(), 'bpjs.aplicares',       'create', 'bpjs.aplicares:create',       'BPJS — Aplicares (Kamar) — Tambah',         'bpjs'),
  (gen_random_uuid(), 'bpjs.aplicares',       'update', 'bpjs.aplicares:update',       'BPJS — Aplicares (Kamar) — Ubah/Kirim',     'bpjs'),
  (gen_random_uuid(), 'bpjs.aplicares',       'delete', 'bpjs.aplicares:delete',       'BPJS — Aplicares (Kamar) — Hapus',          'bpjs'),
  (gen_random_uuid(), 'bpjs.audit',           'read',   'bpjs.audit:read',             'BPJS — Audit Trail — Lihat',                'bpjs'),
  (gen_random_uuid(), 'bpjs.audit',           'export', 'bpjs.audit:export',           'BPJS — Audit Trail — Ekspor',               'bpjs')
ON CONFLICT ("kode") DO NOTHING;

-- ── Admin: semua bpjs.* ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."modul" = 'bpjs'
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

-- ── Paritas akses (tanpa kejutan saat deploy) ──
-- Role yang SEBELUMNYA melihat modul BPJS lewat `billing.klaim:read` tetap melihatnya: akses modul +
-- BACA semua menu. Hak TULIS (terbit/ubah/hapus SEP, SPRI, kamar) TIDAK diturunkan otomatis —
-- berikan sengaja per role lewat Mapping Hub → RBAC (least privilege).
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT DISTINCT rp."role_id", p."id"
  FROM "auth"."role_permissions" rp
  JOIN "auth"."permissions" k ON k."id" = rp."permission_id" AND k."kode" = 'billing.klaim:read'
  JOIN "auth"."permissions" p ON p."modul" = 'bpjs' AND p."action" = 'read'
ON CONFLICT DO NOTHING;
