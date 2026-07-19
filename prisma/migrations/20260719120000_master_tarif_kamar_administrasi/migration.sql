-- CreateTable
CREATE TABLE "master"."tarif_kamar" (
    "id" UUID NOT NULL,
    "kelas" TEXT NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "jasa_sarana" INTEGER,
    "jasa_medis" INTEGER,
    "jasa_paramedis" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tarif_kamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."tarif_administrasi" (
    "id" UUID NOT NULL,
    "unit" TEXT NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "jasa_sarana" INTEGER,
    "jasa_medis" INTEGER,
    "jasa_paramedis" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tarif_administrasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarif_kamar_kelas_penjamin_kode_key" ON "master"."tarif_kamar"("kelas", "penjamin_kode");

-- CreateIndex
CREATE INDEX "tarif_kamar_penjamin_kode_idx" ON "master"."tarif_kamar"("penjamin_kode");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_administrasi_unit_penjamin_kode_key" ON "master"."tarif_administrasi"("unit", "penjamin_kode");

-- CreateIndex
CREATE INDEX "tarif_administrasi_penjamin_kode_idx" ON "master"."tarif_administrasi"("penjamin_kode");
