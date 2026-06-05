-- Seed "clean state" master/ruangan: kosongkan tabel + sisakan HANYA RS Induk (root).
-- Idempotent: TRUNCATE CASCADE lalu insert root bila belum ada (guard WHERE NOT EXISTS
-- → aman thd partial-unique kode). Dipakai untuk menguji wiring dari keadaan bersih.
TRUNCATE "master"."bed", "master"."location", "master"."organization" RESTART IDENTITY CASCADE;

INSERT INTO "master"."organization"
  (id, kode, nama, org_type, active, telp, email, alamat, kode_pos,
   provinsi_nama, kota_nama, kecamatan_nama, kelurahan_nama, kelurahan_kode,
   is_root, version, created_at, updated_at)
SELECT
  gen_random_uuid(), 'RSHS', 'RS Harapan Sehat', 'prov'::"master"."OrgType", true,
  '021-555-0000', 'info@rsharapansehat.id', 'Jl. Harapan Sehat No. 1', '10340',
  'DKI Jakarta', 'Jakarta Pusat', 'Menteng', 'Kebon Sirih', '3171010001',
  true, 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "master"."organization" WHERE kode = 'RSHS' AND deleted_at IS NULL
);
