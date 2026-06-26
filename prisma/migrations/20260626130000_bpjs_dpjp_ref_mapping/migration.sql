-- CreateTable
CREATE TABLE "bpjs"."ref_spesialis" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ref_spesialis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpjs"."ref_dpjp" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode_spesialis" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ref_dpjp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpjs"."dpjp_mapping" (
    "id" UUID NOT NULL,
    "dokter_id" UUID NOT NULL,
    "ref_dpjp_kode" TEXT NOT NULL,
    "mapped_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dpjp_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_spesialis_kode_key" ON "bpjs"."ref_spesialis"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "ref_dpjp_kode_key" ON "bpjs"."ref_dpjp"("kode");

-- CreateIndex
CREATE INDEX "ref_dpjp_kode_spesialis_idx" ON "bpjs"."ref_dpjp"("kode_spesialis");

-- CreateIndex
CREATE INDEX "ref_dpjp_nama_idx" ON "bpjs"."ref_dpjp"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "dpjp_mapping_dokter_id_key" ON "bpjs"."dpjp_mapping"("dokter_id");

-- CreateIndex
CREATE UNIQUE INDEX "dpjp_mapping_ref_dpjp_kode_key" ON "bpjs"."dpjp_mapping"("ref_dpjp_kode");

-- AddForeignKey
ALTER TABLE "bpjs"."dpjp_mapping" ADD CONSTRAINT "dpjp_mapping_ref_dpjp_kode_fkey" FOREIGN KEY ("ref_dpjp_kode") REFERENCES "bpjs"."ref_dpjp"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;
