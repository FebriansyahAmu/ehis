-- Master Katalog Laboratorium (schema "master"). Additive — hanya objek baru.
-- Model Tes → Parameter (analit); rentang rujukan numerik per-parameter = JSONB.

-- CreateTable
CREATE TABLE "master"."lab_test" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "spesimen" TEXT,
    "metode" TEXT,
    "waktu_tunggu" TEXT,
    "keterangan" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "lab_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."lab_parameter" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL DEFAULT '',
    "tipe_hasil" TEXT NOT NULL DEFAULT 'Numerik',
    "nilai_normal_text" TEXT,
    "rujukan" JSONB NOT NULL DEFAULT '[]',
    "critical_low" DOUBLE PRECISION,
    "critical_high" DOUBLE PRECISION,
    "delta_absolute" DOUBLE PRECISION,
    "delta_percent" DOUBLE PRECISION,
    "metode" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lab_parameter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_test_kategori_active_idx" ON "master"."lab_test"("kategori", "active");

-- CreateIndex
CREATE INDEX "lab_test_kode_idx" ON "master"."lab_test"("kode");

-- CreateIndex
CREATE INDEX "lab_parameter_test_id_idx" ON "master"."lab_parameter"("test_id");

-- AddForeignKey
ALTER TABLE "master"."lab_parameter" ADD CONSTRAINT "lab_parameter_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "master"."lab_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
