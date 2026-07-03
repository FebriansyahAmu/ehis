-- Rekam Medis — Discharge Planning step 3: Checklist Kesiapan H-1 (tab Discharge Planning RI,
-- SNARS ARK 3). discharge_checklist = snapshot dokumen checklist per kunjungan, append-only
-- "latest wins" (simpan = INSERT baris baru; read ambil created_at terbaru — jejak revisi utuh,
-- pola discharge_asesmen). items = JSONB array {id,label,sublabel,required,confirmed,catatan}
-- SNAPSHOT penuh template FE saat simpan (medico-legal, tahan perubahan template).
-- pencatat = actor login. FK → encounter.kunjungan cascade.
-- Gate clinical.rekammedis + ABAC careUnit (route()). Melengkapi trio /discharge/*.

-- CreateTable
CREATE TABLE "medicalrecord"."discharge_checklist" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "items" JSONB NOT NULL,
    "catatan_khusus" TEXT NOT NULL DEFAULT '',
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discharge_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discharge_checklist_kunjungan_id_created_at_idx" ON "medicalrecord"."discharge_checklist"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."discharge_checklist"
    ADD CONSTRAINT "discharge_checklist_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
