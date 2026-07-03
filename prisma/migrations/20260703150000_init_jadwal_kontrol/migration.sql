-- Rekam Medis — Jadwal Kontrol Poliklinik (tab Pasien Pulang RI, sub Obat & Jadwal).
-- jadwal_kontrol = surat kontrol pasca-pulang per kunjungan; nomor auto sistem (counter
-- JK-<YYMM><NNN>, reset per bulan). Pasien BPJS: create memanggil V-Claim RencanaKontrol/insert
-- (konektor mock pola SPRI) → no_referensi = noSuratKontrol response BPJS. kode_dokter
-- di-resolve server dari bpjs.dpjp_mapping (anti-spoof). Hapus = soft-delete
-- (+ RencanaKontrol/Delete bila ber-referensi). FK → encounter.kunjungan cascade.
-- Gate clinical.rekammedis + ABAC careUnit (route()).

-- CreateTable
CREATE TABLE "medicalrecord"."jadwal_kontrol" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nomor" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "poli_nama" TEXT NOT NULL,
    "poli_kontrol" TEXT NOT NULL DEFAULT '',
    "dokter_nama" TEXT NOT NULL DEFAULT '',
    "dokter_id" UUID,
    "kode_dokter" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "no_sep" TEXT NOT NULL DEFAULT '',
    "no_referensi" TEXT,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jadwal_kontrol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."jadwal_kontrol_counter" (
    "scope" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "jadwal_kontrol_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_kontrol_nomor_key" ON "medicalrecord"."jadwal_kontrol"("nomor");
CREATE INDEX "jadwal_kontrol_kunjungan_id_deleted_at_idx" ON "medicalrecord"."jadwal_kontrol"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."jadwal_kontrol"
    ADD CONSTRAINT "jadwal_kontrol_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
