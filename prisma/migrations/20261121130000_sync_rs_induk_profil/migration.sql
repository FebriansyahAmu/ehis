-- Backfill: selaraskan RS Induk (Organization root) dengan Profil RS (master.rs_profil).
-- Profil RS = sumber kebenaran identitas RS; mulai 2026-11-21 rsProfilService.save menyelaraskan
-- otomatis (ruanganDal.syncRootIdentity). Migrasi ini menyusulkan data yang sudah terlanjur beda
-- (root masih data seed). Sub-unit yang alamatnya SAMA PERSIS dengan alamat root lama (salinan
-- warisan) ikut dipindah; sub-unit beralamat sendiri tidak disentuh. Ruangan mewarisi alamat unit
-- saat runtime. Tanpa baris rs_profil (instalasi baru) → tidak ada yang berubah.
-- Semua CTE membaca snapshot yang sama → `old` = nilai root SEBELUM diperbarui.

WITH p AS (
  SELECT
    upper(btrim(rp."kode"))                            AS kode,
    btrim(rp."nama")                                   AS nama,
    nullif(btrim(rp."telp"), '')                       AS telp,
    nullif(btrim(rp."email"), '')                      AS email,
    nullif(btrim(rp."alamat"->>'jalan'), '')           AS jalan,
    nullif(btrim(rp."alamat"->>'kodePos'), '')         AS kode_pos,
    nullif(btrim(rp."alamat"->>'provinsi'), '')        AS provinsi,
    nullif(btrim(rp."alamat"->>'kota'), '')            AS kota,
    nullif(btrim(rp."alamat"->>'kecamatan'), '')       AS kecamatan,
    nullif(btrim(rp."alamat"->>'kelurahan'), '')       AS kelurahan,
    nullif(btrim(rp."alamat"->>'kodeWilayah'), '')     AS kode_wilayah
  FROM "master"."rs_profil" rp
  WHERE rp."id" = 'rs-profil'
),
old AS (
  SELECT r."alamat", r."rt_rw", r."kode_pos", r."provinsi_nama", r."kota_nama", r."kecamatan_nama",
         r."kelurahan_nama", r."kelurahan_kode"
  FROM "master"."organization" r
  WHERE r."is_root" = true AND r."deleted_at" IS NULL
  LIMIT 1
),
units AS (
  UPDATE "master"."organization" u SET
    "alamat" = p.jalan, "kode_pos" = p.kode_pos,
    "provinsi_nama" = p.provinsi, "kota_nama" = p.kota, "kecamatan_nama" = p.kecamatan,
    "kelurahan_nama" = p.kelurahan, "kelurahan_kode" = p.kode_wilayah,
    "provinsi_kode" = NULL, "kota_kode" = NULL, "kecamatan_kode" = NULL,
    "version" = u."version" + 1, "updated_at" = now()
  FROM p, old
  WHERE u."is_root" = false AND u."deleted_at" IS NULL
    AND u."alamat"         IS NOT DISTINCT FROM old."alamat"
    AND u."rt_rw"          IS NOT DISTINCT FROM old."rt_rw"
    AND u."kode_pos"       IS NOT DISTINCT FROM old."kode_pos"
    AND u."provinsi_nama"  IS NOT DISTINCT FROM old."provinsi_nama"
    AND u."kota_nama"      IS NOT DISTINCT FROM old."kota_nama"
    AND u."kecamatan_nama" IS NOT DISTINCT FROM old."kecamatan_nama"
    AND u."kelurahan_nama" IS NOT DISTINCT FROM old."kelurahan_nama"
    AND u."kelurahan_kode" IS NOT DISTINCT FROM old."kelurahan_kode"
  RETURNING u."id"
)
UPDATE "master"."organization" o SET
  "kode" = p.kode, "nama" = p.nama, "telp" = p.telp, "email" = p.email,
  "alamat" = p.jalan, "kode_pos" = p.kode_pos,
  "provinsi_nama" = p.provinsi, "kota_nama" = p.kota, "kecamatan_nama" = p.kecamatan,
  "kelurahan_nama" = p.kelurahan, "kelurahan_kode" = p.kode_wilayah,
  "provinsi_kode" = NULL, "kota_kode" = NULL, "kecamatan_kode" = NULL,
  "version" = o."version" + 1, "updated_at" = now()
FROM p
WHERE o."is_root" = true AND o."deleted_at" IS NULL;
