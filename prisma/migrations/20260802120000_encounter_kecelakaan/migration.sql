-- CreateTable: encounter.kecelakaan — data kecelakaan pasien (Jasa Raharja / BPJS Naker), 1:1 kunjungan.
CREATE TABLE "encounter"."kecelakaan" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'kll',
    "tgl_kejadian" DATE,
    "waktu_kejadian" TEXT,
    "provinsi" TEXT,
    "lokasi" TEXT,
    "kronologi" TEXT,
    "mekanisme_trauma" TEXT,
    "status_lp" TEXT,
    "no_lap_pol" TEXT,
    "satuan_polisi" TEXT,
    "kendaraan" JSONB NOT NULL DEFAULT '[]',
    "penjamin_lanjutan" TEXT,
    "status_koordinasi_jr" TEXT,
    "nama_perusahaan" TEXT,
    "no_kpj" TEXT,
    "jenis_pekerjaan" TEXT,
    "lokasi_kerja" TEXT,
    "status_klaim" TEXT NOT NULL DEFAULT 'belum',
    "nomor_klaim" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "kecelakaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: 1:1 per kunjungan.
CREATE UNIQUE INDEX "kecelakaan_kunjungan_id_key" ON "encounter"."kecelakaan"("kunjungan_id");

-- AddForeignKey
ALTER TABLE "encounter"."kecelakaan" ADD CONSTRAINT "kecelakaan_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
