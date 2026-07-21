-- Setoran kas: serah-terima uang tunai dari shift kasir tertutup ke bendahara.
-- 1 setoran per shift (shift_id UNIQUE) + nomor dokumen sendiri (STR-<YYMM><NNN>).
CREATE TABLE "billing"."setoran" (
    "id"             UUID         NOT NULL,
    "shift_id"       UUID         NOT NULL,
    "no_setor"       TEXT         NOT NULL,
    "tanggal_serah"  TIMESTAMPTZ(3) NOT NULL,
    "nominal"        INTEGER      NOT NULL,
    "penerima"       TEXT         NOT NULL,
    "catatan"        TEXT,
    "penyetor"       TEXT         NOT NULL,
    "author_user_id" UUID,
    "created_at"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setoran_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "setoran_shift_id_key" ON "billing"."setoran"("shift_id");
CREATE UNIQUE INDEX "setoran_no_setor_key" ON "billing"."setoran"("no_setor");
CREATE INDEX "setoran_tanggal_serah_idx" ON "billing"."setoran"("tanggal_serah");

ALTER TABLE "billing"."setoran"
  ADD CONSTRAINT "setoran_shift_id_fkey" FOREIGN KEY ("shift_id")
  REFERENCES "billing"."shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
