-- Rekam medis — Tindakan Medis (tab Tindakan). Pencatatan tindakan yang DILAKUKAN per kunjungan
-- (jumlah + biaya snapshot) → hilir Billing. Per-item, soft-delete. FK cross-schema ke
-- encounter.kunjungan (Cascade). Aditif murni. Acuan: medicalrecord.DiagnosaProsedur.

-- CreateTable
CREATE TABLE "medicalrecord"."tindakan_medis" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tindakan_id" UUID,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "harga" INTEGER,
    "penjamin_kode" TEXT,
    "jenis_ruangan" TEXT,
    "pelaksana" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "dilakukan_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "tindakan_medis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tindakan_medis_kunjungan_id_deleted_at_idx" ON "medicalrecord"."tindakan_medis"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."tindakan_medis" ADD CONSTRAINT "tindakan_medis_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
