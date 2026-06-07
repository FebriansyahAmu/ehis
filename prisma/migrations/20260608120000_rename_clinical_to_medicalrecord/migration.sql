-- Rename schema Postgres "clinical" → "medicalrecord" (data-preserving).
-- ALTER SCHEMA memindahkan SELURUH objek (tabel "triase", enum "TriaseLevel") ikut
-- ke namespace baru — tanpa kehilangan data. RBAC permission "clinical.*" TIDAK terkait
-- (itu namespace izin, bukan schema DB) → tak diubah.

ALTER SCHEMA "clinical" RENAME TO "medicalrecord";
