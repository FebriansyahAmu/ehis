-- Master / Sumber Daya — Penugasan Ruangan (SDM Assignment). Link N:N Pegawai ⇄ Location.
-- Join table: HARD delete (tak ada soft-delete/version). Unik (pegawai_id, location_id) cegah dobel.
-- Aditif murni. Acuan: docs/BACKEND-MASTER-SUMBER-DAYA.md §C.

-- CreateTable
CREATE TABLE "master"."penugasan_ruangan" (
    "id" UUID NOT NULL,
    "pegawai_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "peran" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "penugasan_ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "penugasan_ruangan_pegawai_id_location_id_key" ON "master"."penugasan_ruangan"("pegawai_id", "location_id");

-- CreateIndex
CREATE INDEX "penugasan_ruangan_location_id_idx" ON "master"."penugasan_ruangan"("location_id");

-- CreateIndex
CREATE INDEX "penugasan_ruangan_pegawai_id_idx" ON "master"."penugasan_ruangan"("pegawai_id");

-- AddForeignKey
ALTER TABLE "master"."penugasan_ruangan" ADD CONSTRAINT "penugasan_ruangan_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "master"."pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."penugasan_ruangan" ADD CONSTRAINT "penugasan_ruangan_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
