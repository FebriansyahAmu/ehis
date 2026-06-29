-- Invarian per-unit Kunjungan ditegakkan di DB (bukan hanya Zod/Service).
-- Spine tunggal encounter.Kunjungan didiskriminasi enum `unit` (IGD/RawatJalan/RawatInap);
-- kolom khas-unit bersifat nullable jarang (sparse). CHECK partial menjamin baris konsisten
-- dengan unit-nya — melengkapi `kunjungan_triase_range_chk` (IGD triase 1..5) yang sudah ada.
--
-- Audit pra-migrasi: 0 pelanggar untuk SEMUA constraint (17 baris: 5 RI / 6 IGD / 6 RJ;
-- 2 titipan). Aman di-VALIDATE langsung. Di skala besar, pakai ADD … NOT VALID lalu
-- VALIDATE CONSTRAINT terpisah agar hindari lock panjang.

-- C1. TITIPAN wajib punya hak kelas (basis tagihan saat kamar ≠ hak kelas).
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_titipan_kelashak_chk"
  CHECK (NOT "titipan" OR "kelas_hak" IS NOT NULL);

-- C2. Pasien Rawat Inap wajib punya kelas KAMAR (placement fisik).
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_ri_kelas_chk"
  CHECK ("unit" <> 'RawatInap' OR "kelas" IS NOT NULL);

-- C3. Hanya Rawat Inap yang boleh membawa kolom kelas/kelas_hak/titipan
--     (cegah IGD/RJ menyimpan data RI nyasar).
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_unit_kelas_scope_chk"
  CHECK ("unit" = 'RawatInap'
         OR ("kelas" IS NULL AND "kelas_hak" IS NULL AND NOT "titipan"));

-- C4. Kunjungan Rawat Jalan wajib menargetkan poli.
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_rj_poli_chk"
  CHECK ("unit" <> 'RawatJalan' OR "poli" IS NOT NULL);
