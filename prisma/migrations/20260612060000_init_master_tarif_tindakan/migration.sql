-- Master / Mapping Hub — Tarif Tindakan. Flatten matriks 3D (Tindakan × Penjamin × Jenis Ruangan)
-- → baris edge dengan harga. UPSERT by triple (tindakan_id, penjamin_kode, jenis_ruangan).
-- penjamin_kode = string (belum FK; master Penjamin mock). jenis_ruangan = tier locationType[:kelas]
-- (string longgar, decoupled — KRIS/perubahan kelas aman). harga = rupiah penuh (Int).
-- Aditif murni. Acuan: tarifTindakan.prisma + tindakan.prisma.

-- CreateTable
CREATE TABLE "master"."tarif_tindakan" (
    "id" UUID NOT NULL,
    "tindakan_id" UUID NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "jenis_ruangan" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tarif_tindakan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarif_tindakan_tindakan_id_penjamin_kode_jenis_ruangan_key" ON "master"."tarif_tindakan"("tindakan_id", "penjamin_kode", "jenis_ruangan");

-- CreateIndex
CREATE INDEX "tarif_tindakan_tindakan_id_idx" ON "master"."tarif_tindakan"("tindakan_id");

-- CreateIndex
CREATE INDEX "tarif_tindakan_penjamin_kode_idx" ON "master"."tarif_tindakan"("penjamin_kode");

-- AddForeignKey
ALTER TABLE "master"."tarif_tindakan" ADD CONSTRAINT "tarif_tindakan_tindakan_id_fkey" FOREIGN KEY ("tindakan_id") REFERENCES "master"."tindakan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
