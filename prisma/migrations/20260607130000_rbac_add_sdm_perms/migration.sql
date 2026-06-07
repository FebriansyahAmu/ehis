-- Seed RBAC: auth.permissions (atomik resource×action) + auth.role_permissions (grant default).
-- Idempoten (ON CONFLICT DO NOTHING). Di-generate dari prisma/scripts/gen-rbac-seed.mjs.
-- Sumber kebenaran runtime = Mapping Hub (menulis role_permissions); ini seed awal saja.

-- ── Permissions (96 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.igd', 'read', 'clinical.igd:read', 'IGD — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.igd', 'create', 'clinical.igd:create', 'IGD — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.igd', 'update', 'clinical.igd:update', 'IGD — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.igd', 'delete', 'clinical.igd:delete', 'IGD — Hapus', 'clinical'),
  (gen_random_uuid(), 'clinical.ri', 'read', 'clinical.ri:read', 'Rawat Inap — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.ri', 'create', 'clinical.ri:create', 'Rawat Inap — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.ri', 'update', 'clinical.ri:update', 'Rawat Inap — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.ri', 'delete', 'clinical.ri:delete', 'Rawat Inap — Hapus', 'clinical'),
  (gen_random_uuid(), 'clinical.rj', 'read', 'clinical.rj:read', 'Rawat Jalan — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.rj', 'create', 'clinical.rj:create', 'Rawat Jalan — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.rj', 'update', 'clinical.rj:update', 'Rawat Jalan — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.rj', 'delete', 'clinical.rj:delete', 'Rawat Jalan — Hapus', 'clinical'),
  (gen_random_uuid(), 'clinical.cppt', 'read', 'clinical.cppt:read', 'CPPT (SOAP) — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.cppt', 'create', 'clinical.cppt:create', 'CPPT (SOAP) — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.cppt', 'update', 'clinical.cppt:update', 'CPPT (SOAP) — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.diagnosa', 'read', 'clinical.diagnosa:read', 'Diagnosa (ICD-10) — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.diagnosa', 'create', 'clinical.diagnosa:create', 'Diagnosa (ICD-10) — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.diagnosa', 'update', 'clinical.diagnosa:update', 'Diagnosa (ICD-10) — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.diagnosa', 'delete', 'clinical.diagnosa:delete', 'Diagnosa (ICD-10) — Hapus', 'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'read', 'clinical.tindakan:read', 'Tindakan / Order — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'create', 'clinical.tindakan:create', 'Tindakan / Order — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'update', 'clinical.tindakan:update', 'Tindakan / Order — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.tindakan', 'delete', 'clinical.tindakan:delete', 'Tindakan / Order — Hapus', 'clinical'),
  (gen_random_uuid(), 'clinical.resep', 'read', 'clinical.resep:read', 'Resep & Obat — Lihat', 'clinical'),
  (gen_random_uuid(), 'clinical.resep', 'create', 'clinical.resep:create', 'Resep & Obat — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.resep', 'update', 'clinical.resep:update', 'Resep & Obat — Ubah', 'clinical'),
  (gen_random_uuid(), 'clinical.resep', 'delete', 'clinical.resep:delete', 'Resep & Obat — Hapus', 'clinical'),
  (gen_random_uuid(), 'ancillary.lab.worklist', 'read', 'ancillary.lab.worklist:read', 'Lab — Worklist — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.lab.worklist', 'update', 'ancillary.lab.worklist:update', 'Lab — Worklist — Ubah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.lab.validate', 'read', 'ancillary.lab.validate:read', 'Lab — Validasi Hasil — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.lab.validate', 'update', 'ancillary.lab.validate:update', 'Lab — Validasi Hasil — Ubah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.lab.critical', 'read', 'ancillary.lab.critical:read', 'Lab — Critical Value — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.lab.critical', 'create', 'ancillary.lab.critical:create', 'Lab — Critical Value — Tambah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.rad.worklist', 'read', 'ancillary.rad.worklist:read', 'Rad — Worklist — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.rad.worklist', 'update', 'ancillary.rad.worklist:update', 'Rad — Worklist — Ubah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.rad.expertise', 'read', 'ancillary.rad.expertise:read', 'Rad — Ekspertise Laporan — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.rad.expertise', 'create', 'ancillary.rad.expertise:create', 'Rad — Ekspertise Laporan — Tambah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.rad.expertise', 'update', 'ancillary.rad.expertise:update', 'Rad — Ekspertise Laporan — Ubah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.farmasi.telaah', 'read', 'ancillary.farmasi.telaah:read', 'Farmasi — Telaah Resep — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.farmasi.telaah', 'update', 'ancillary.farmasi.telaah:update', 'Farmasi — Telaah Resep — Ubah', 'ancillary'),
  (gen_random_uuid(), 'ancillary.farmasi.serah', 'read', 'ancillary.farmasi.serah:read', 'Farmasi — Dispensing & Serah — Lihat', 'ancillary'),
  (gen_random_uuid(), 'ancillary.farmasi.serah', 'update', 'ancillary.farmasi.serah:update', 'Farmasi — Dispensing & Serah — Ubah', 'ancillary'),
  (gen_random_uuid(), 'registration.pasien', 'read', 'registration.pasien:read', 'Master Pasien — Lihat', 'registration'),
  (gen_random_uuid(), 'registration.pasien', 'create', 'registration.pasien:create', 'Master Pasien — Tambah', 'registration'),
  (gen_random_uuid(), 'registration.pasien', 'update', 'registration.pasien:update', 'Master Pasien — Ubah', 'registration'),
  (gen_random_uuid(), 'registration.pasien', 'delete', 'registration.pasien:delete', 'Master Pasien — Hapus', 'registration'),
  (gen_random_uuid(), 'registration.kunjungan', 'read', 'registration.kunjungan:read', 'Pendaftaran Kunjungan — Lihat', 'registration'),
  (gen_random_uuid(), 'registration.kunjungan', 'create', 'registration.kunjungan:create', 'Pendaftaran Kunjungan — Tambah', 'registration'),
  (gen_random_uuid(), 'registration.kunjungan', 'update', 'registration.kunjungan:update', 'Pendaftaran Kunjungan — Ubah', 'registration'),
  (gen_random_uuid(), 'registration.kunjungan', 'delete', 'registration.kunjungan:delete', 'Pendaftaran Kunjungan — Hapus', 'registration'),
  (gen_random_uuid(), 'billing.invoice', 'read', 'billing.invoice:read', 'Billing — Invoice — Lihat', 'registration'),
  (gen_random_uuid(), 'billing.invoice', 'create', 'billing.invoice:create', 'Billing — Invoice — Tambah', 'registration'),
  (gen_random_uuid(), 'billing.invoice', 'update', 'billing.invoice:update', 'Billing — Invoice — Ubah', 'registration'),
  (gen_random_uuid(), 'billing.invoice', 'delete', 'billing.invoice:delete', 'Billing — Invoice — Hapus', 'registration'),
  (gen_random_uuid(), 'billing.invoice', 'export', 'billing.invoice:export', 'Billing — Invoice — Ekspor', 'registration'),
  (gen_random_uuid(), 'billing.kasir', 'read', 'billing.kasir:read', 'Billing — Kasir / Bayar — Lihat', 'registration'),
  (gen_random_uuid(), 'billing.kasir', 'create', 'billing.kasir:create', 'Billing — Kasir / Bayar — Tambah', 'registration'),
  (gen_random_uuid(), 'billing.klaim', 'read', 'billing.klaim:read', 'Billing — Klaim BPJS — Lihat', 'registration'),
  (gen_random_uuid(), 'billing.klaim', 'create', 'billing.klaim:create', 'Billing — Klaim BPJS — Tambah', 'registration'),
  (gen_random_uuid(), 'billing.klaim', 'update', 'billing.klaim:update', 'Billing — Klaim BPJS — Ubah', 'registration'),
  (gen_random_uuid(), 'billing.klaim', 'export', 'billing.klaim:export', 'Billing — Klaim BPJS — Ekspor', 'registration'),
  (gen_random_uuid(), 'master.ruangan', 'read', 'master.ruangan:read', 'Unit & Ruangan — Lihat', 'master'),
  (gen_random_uuid(), 'master.ruangan', 'create', 'master.ruangan:create', 'Unit & Ruangan — Tambah', 'master'),
  (gen_random_uuid(), 'master.ruangan', 'update', 'master.ruangan:update', 'Unit & Ruangan — Ubah', 'master'),
  (gen_random_uuid(), 'master.ruangan', 'delete', 'master.ruangan:delete', 'Unit & Ruangan — Hapus', 'master'),
  (gen_random_uuid(), 'master.dokter', 'read', 'master.dokter:read', 'Dokter & Nakes — Lihat', 'master'),
  (gen_random_uuid(), 'master.dokter', 'create', 'master.dokter:create', 'Dokter & Nakes — Tambah', 'master'),
  (gen_random_uuid(), 'master.dokter', 'update', 'master.dokter:update', 'Dokter & Nakes — Ubah', 'master'),
  (gen_random_uuid(), 'master.dokter', 'delete', 'master.dokter:delete', 'Dokter & Nakes — Hapus', 'master'),
  (gen_random_uuid(), 'master.pegawai', 'read', 'master.pegawai:read', 'Data Pegawai (SDM) — Lihat', 'master'),
  (gen_random_uuid(), 'master.pegawai', 'create', 'master.pegawai:create', 'Data Pegawai (SDM) — Tambah', 'master'),
  (gen_random_uuid(), 'master.pegawai', 'update', 'master.pegawai:update', 'Data Pegawai (SDM) — Ubah', 'master'),
  (gen_random_uuid(), 'master.pegawai', 'delete', 'master.pegawai:delete', 'Data Pegawai (SDM) — Hapus', 'master'),
  (gen_random_uuid(), 'master.pengguna', 'read', 'master.pengguna:read', 'Pengguna Sistem — Lihat', 'master'),
  (gen_random_uuid(), 'master.pengguna', 'create', 'master.pengguna:create', 'Pengguna Sistem — Tambah', 'master'),
  (gen_random_uuid(), 'master.pengguna', 'update', 'master.pengguna:update', 'Pengguna Sistem — Ubah', 'master'),
  (gen_random_uuid(), 'master.pengguna', 'delete', 'master.pengguna:delete', 'Pengguna Sistem — Hapus', 'master'),
  (gen_random_uuid(), 'master.mapping', 'read', 'master.mapping:read', 'Mapping Hub — Lihat', 'master'),
  (gen_random_uuid(), 'master.mapping', 'update', 'master.mapping:update', 'Mapping Hub — Ubah', 'master'),
  (gen_random_uuid(), 'master.penugasan-ruangan', 'read', 'master.penugasan-ruangan:read', 'Penugasan SDM ⇄ Ruangan — Lihat', 'master'),
  (gen_random_uuid(), 'master.penugasan-ruangan', 'create', 'master.penugasan-ruangan:create', 'Penugasan SDM ⇄ Ruangan — Tambah', 'master'),
  (gen_random_uuid(), 'master.penugasan-ruangan', 'delete', 'master.penugasan-ruangan:delete', 'Penugasan SDM ⇄ Ruangan — Hapus', 'master'),
  (gen_random_uuid(), 'master.katalog', 'read', 'master.katalog:read', 'Katalog (Obat/Lab/ICD) — Lihat', 'master'),
  (gen_random_uuid(), 'master.katalog', 'create', 'master.katalog:create', 'Katalog (Obat/Lab/ICD) — Tambah', 'master'),
  (gen_random_uuid(), 'master.katalog', 'update', 'master.katalog:update', 'Katalog (Obat/Lab/ICD) — Ubah', 'master'),
  (gen_random_uuid(), 'master.katalog', 'delete', 'master.katalog:delete', 'Katalog (Obat/Lab/ICD) — Hapus', 'master'),
  (gen_random_uuid(), 'master.tarif', 'read', 'master.tarif:read', 'Tarif & Paket — Lihat', 'master'),
  (gen_random_uuid(), 'master.tarif', 'create', 'master.tarif:create', 'Tarif & Paket — Tambah', 'master'),
  (gen_random_uuid(), 'master.tarif', 'update', 'master.tarif:update', 'Tarif & Paket — Ubah', 'master'),
  (gen_random_uuid(), 'master.tarif', 'delete', 'master.tarif:delete', 'Tarif & Paket — Hapus', 'master'),
  (gen_random_uuid(), 'report.clinical', 'read', 'report.clinical:read', 'Laporan Klinis — Lihat', 'report'),
  (gen_random_uuid(), 'report.clinical', 'export', 'report.clinical:export', 'Laporan Klinis — Ekspor', 'report'),
  (gen_random_uuid(), 'report.financial', 'read', 'report.financial:read', 'Laporan Keuangan — Lihat', 'report'),
  (gen_random_uuid(), 'report.financial', 'export', 'report.financial:export', 'Laporan Keuangan — Ekspor', 'report'),
  (gen_random_uuid(), 'report.audit', 'read', 'report.audit:read', 'Audit Trail — Lihat', 'report'),
  (gen_random_uuid(), 'report.audit', 'export', 'report.audit:export', 'Audit Trail — Ekspor', 'report')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.igd:read', 'clinical.igd:create', 'clinical.igd:update', 'clinical.igd:delete', 'clinical.ri:read', 'clinical.ri:create', 'clinical.ri:update', 'clinical.ri:delete', 'clinical.rj:read', 'clinical.rj:create', 'clinical.rj:update', 'clinical.rj:delete', 'clinical.cppt:read', 'clinical.cppt:create', 'clinical.cppt:update', 'clinical.diagnosa:read', 'clinical.diagnosa:create', 'clinical.diagnosa:update', 'clinical.diagnosa:delete', 'clinical.tindakan:read', 'clinical.tindakan:create', 'clinical.tindakan:update', 'clinical.tindakan:delete', 'clinical.resep:read', 'clinical.resep:create', 'clinical.resep:update', 'clinical.resep:delete', 'ancillary.lab.worklist:read', 'ancillary.lab.worklist:update', 'ancillary.lab.validate:read', 'ancillary.lab.validate:update', 'ancillary.lab.critical:read', 'ancillary.lab.critical:create', 'ancillary.rad.worklist:read', 'ancillary.rad.worklist:update', 'ancillary.rad.expertise:read', 'ancillary.rad.expertise:create', 'ancillary.rad.expertise:update', 'ancillary.farmasi.telaah:read', 'ancillary.farmasi.telaah:update', 'ancillary.farmasi.serah:read', 'ancillary.farmasi.serah:update', 'registration.pasien:read', 'registration.pasien:create', 'registration.pasien:update', 'registration.pasien:delete', 'registration.kunjungan:read', 'registration.kunjungan:create', 'registration.kunjungan:update', 'registration.kunjungan:delete', 'billing.invoice:read', 'billing.invoice:create', 'billing.invoice:update', 'billing.invoice:delete', 'billing.invoice:export', 'billing.kasir:read', 'billing.kasir:create', 'billing.klaim:read', 'billing.klaim:create', 'billing.klaim:update', 'billing.klaim:export', 'master.ruangan:read', 'master.ruangan:create', 'master.ruangan:update', 'master.ruangan:delete', 'master.dokter:read', 'master.dokter:create', 'master.dokter:update', 'master.dokter:delete', 'master.pegawai:read', 'master.pegawai:create', 'master.pegawai:update', 'master.pegawai:delete', 'master.pengguna:read', 'master.pengguna:create', 'master.pengguna:update', 'master.pengguna:delete', 'master.mapping:read', 'master.mapping:update', 'master.penugasan-ruangan:read', 'master.penugasan-ruangan:create', 'master.penugasan-ruangan:delete', 'master.katalog:read', 'master.katalog:create', 'master.katalog:update', 'master.katalog:delete', 'master.tarif:read', 'master.tarif:create', 'master.tarif:update', 'master.tarif:delete', 'report.clinical:read', 'report.clinical:export', 'report.financial:read', 'report.financial:export', 'report.audit:read', 'report.audit:export')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.igd:read', 'clinical.igd:create', 'clinical.igd:update', 'clinical.ri:read', 'clinical.ri:create', 'clinical.ri:update', 'clinical.rj:read', 'clinical.rj:create', 'clinical.rj:update', 'clinical.cppt:read', 'clinical.cppt:create', 'clinical.cppt:update', 'clinical.diagnosa:read', 'clinical.diagnosa:create', 'clinical.diagnosa:update', 'clinical.tindakan:read', 'clinical.tindakan:create', 'clinical.tindakan:update', 'clinical.resep:read', 'clinical.resep:create', 'clinical.resep:update', 'ancillary.lab.worklist:read', 'ancillary.rad.worklist:read', 'ancillary.farmasi.telaah:read', 'report.clinical:read', 'report.clinical:export')
  WHERE r."key" = 'Dokter'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.igd:read', 'clinical.igd:update', 'clinical.ri:read', 'clinical.ri:update', 'clinical.cppt:read', 'clinical.cppt:create', 'clinical.tindakan:read', 'clinical.tindakan:update', 'clinical.resep:read', 'ancillary.lab.worklist:read', 'ancillary.rad.worklist:read', 'ancillary.farmasi.serah:read')
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.resep:read', 'ancillary.farmasi.telaah:read', 'ancillary.farmasi.telaah:update', 'ancillary.farmasi.serah:read', 'ancillary.farmasi.serah:update', 'master.katalog:read', 'master.katalog:update', 'report.clinical:read')
  WHERE r."key" = 'Apoteker'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('ancillary.rad.worklist:read', 'ancillary.rad.worklist:update', 'clinical.ri:read', 'clinical.rj:read')
  WHERE r."key" = 'Radiografer'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('ancillary.lab.worklist:read', 'ancillary.lab.worklist:update', 'ancillary.lab.validate:read', 'ancillary.lab.validate:update', 'ancillary.lab.critical:read', 'ancillary.lab.critical:create', 'clinical.ri:read', 'clinical.rj:read', 'report.clinical:read', 'report.clinical:export')
  WHERE r."key" = 'SpPK'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('ancillary.rad.worklist:read', 'ancillary.rad.worklist:update', 'ancillary.rad.expertise:read', 'ancillary.rad.expertise:create', 'ancillary.rad.expertise:update', 'clinical.ri:read', 'clinical.rj:read', 'report.clinical:read', 'report.clinical:export')
  WHERE r."key" = 'SpRad'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('billing.invoice:read', 'billing.invoice:create', 'billing.invoice:update', 'billing.kasir:read', 'billing.kasir:create', 'billing.klaim:read', 'billing.klaim:update', 'registration.pasien:read', 'registration.kunjungan:read', 'report.financial:read', 'report.financial:export')
  WHERE r."key" = 'Kasir'
ON CONFLICT DO NOTHING;
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('registration.pasien:read', 'registration.pasien:create', 'registration.pasien:update', 'registration.kunjungan:read', 'registration.kunjungan:create', 'registration.kunjungan:update', 'clinical.rj:read')
  WHERE r."key" = 'Registrasi'
ON CONFLICT DO NOTHING;

-- Koreksi: Kasir & Registrasi = role GLOBAL (bypass unit-scope), selaras Keputusan #4.
UPDATE "auth"."roles" SET "unit_scoped" = false, "updated_at" = now() WHERE "key" IN ('Kasir','Registrasi');
