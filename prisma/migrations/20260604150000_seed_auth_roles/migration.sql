-- Seed 9 role baku (auth.roles) — referensi FK auth.user_roles.role_id saat provisioning
-- akun di wizard "Tambah Pengguna". Idempoten (ON CONFLICT key DO NOTHING) → aman di-rerun.
-- unit_scoped: Admin = global (false); role klinis/operasional = unit-scoped (true, enforcement
-- ABAC ditunda sampai modul auth runtime). Key SELARAS frontend penggunaShared.UserRole.

INSERT INTO "auth"."roles" ("id", "key", "nama", "deskripsi", "unit_scoped", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Admin',       'Administrator',  'Akses penuh sistem',        false, true, now(), now()),
  (gen_random_uuid(), 'Dokter',      'Dokter',         'DPJP / dokter umum',         true,  true, now(), now()),
  (gen_random_uuid(), 'Perawat',     'Perawat',        'Asuhan keperawatan',         true,  true, now(), now()),
  (gen_random_uuid(), 'Apoteker',    'Apoteker',       'Pelayanan farmasi',          true,  true, now(), now()),
  (gen_random_uuid(), 'Radiografer', 'Radiografer',    'Akuisisi gambar radiologi',  true,  true, now(), now()),
  (gen_random_uuid(), 'SpPK',        'Sp. Patologi Klinik', 'Validator hasil lab',   true,  true, now(), now()),
  (gen_random_uuid(), 'SpRad',       'Sp. Radiologi',  'Pembaca expertise radiologi', true, true, now(), now()),
  (gen_random_uuid(), 'Kasir',       'Kasir',          'Billing & pembayaran',       true,  true, now(), now()),
  (gen_random_uuid(), 'Registrasi',  'Registrasi',     'Pendaftaran pasien',         true,  true, now(), now())
ON CONFLICT ("key") DO NOTHING;
