-- Master Tarif Lab Test (schema "master") — tarif tes lab per (penjamin × jenis ruangan).
-- Paralel TarifTindakan (selaras LayananUnit ⇄ LayananUnitLab). Additive — hanya objek baru.
-- Edge leaf (upsert by triple, tanpa version). harga = INT (rupiah).

-- CreateTable
CREATE TABLE "master"."tarif_lab_test" (
    "id" UUID NOT NULL,
    "lab_test_id" UUID NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "jenis_ruangan" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tarif_lab_test_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarif_lab_test_lab_test_id_penjamin_kode_jenis_ruangan_key" ON "master"."tarif_lab_test"("lab_test_id", "penjamin_kode", "jenis_ruangan");

-- CreateIndex
CREATE INDEX "tarif_lab_test_lab_test_id_idx" ON "master"."tarif_lab_test"("lab_test_id");

-- CreateIndex
CREATE INDEX "tarif_lab_test_penjamin_kode_idx" ON "master"."tarif_lab_test"("penjamin_kode");

-- AddForeignKey
ALTER TABLE "master"."tarif_lab_test" ADD CONSTRAINT "tarif_lab_test_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "master"."lab_test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
