-- Master / Mapping Hub — Formularium di-redesign: dari (Obat × Penjamin × Kelas → allowed)
-- menjadi grant N:N Obat ⇄ Ruangan (Location) — "obat masuk formularium di unit mana", universal
-- lintas penjamin (bentuk persis LayananUnit). Tabel lama masih kosong (belum dipakai produksi) →
-- DROP lalu CREATE bentuk baru. Aditif terhadap skema lain.

-- DropTable (bentuk lama: penjamin_kode/kelas/allowed/alasan)
DROP TABLE IF EXISTS "master"."formularium_obat";

-- CreateTable (bentuk baru: grant Obat ⇄ Location)
CREATE TABLE "master"."formularium_obat" (
    "id" UUID NOT NULL,
    "obat_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formularium_obat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formularium_obat_obat_id_location_id_key" ON "master"."formularium_obat"("obat_id", "location_id");

-- CreateIndex
CREATE INDEX "formularium_obat_location_id_idx" ON "master"."formularium_obat"("location_id");

-- CreateIndex
CREATE INDEX "formularium_obat_obat_id_idx" ON "master"."formularium_obat"("obat_id");

-- AddForeignKey
ALTER TABLE "master"."formularium_obat" ADD CONSTRAINT "formularium_obat_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "master"."obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."formularium_obat" ADD CONSTRAINT "formularium_obat_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
