-- Master / Mapping Hub — Formularium Penjamin. Flatten matriks 3D (Obat × Penjamin × Kelas)
-- → baris edge dengan allowed (+ alasan). UPSERT by triple (obat_id, penjamin_kode, kelas).
-- penjamin_kode = string (belum FK; master Penjamin mock). kelas = string longgar (decoupled —
-- KRIS/perubahan kelas aman). Baris = OVERRIDE eksplisit; sel tanpa baris pakai default rule FE.
-- Aditif murni. Acuan: formularium.prisma + obat.prisma.

-- CreateTable
CREATE TABLE "master"."formularium_obat" (
    "id" UUID NOT NULL,
    "obat_id" UUID NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "alasan" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "formularium_obat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formularium_obat_obat_id_penjamin_kode_kelas_key" ON "master"."formularium_obat"("obat_id", "penjamin_kode", "kelas");

-- CreateIndex
CREATE INDEX "formularium_obat_obat_id_idx" ON "master"."formularium_obat"("obat_id");

-- CreateIndex
CREATE INDEX "formularium_obat_penjamin_kode_idx" ON "master"."formularium_obat"("penjamin_kode");

-- AddForeignKey
ALTER TABLE "master"."formularium_obat" ADD CONSTRAINT "formularium_obat_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "master"."obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
