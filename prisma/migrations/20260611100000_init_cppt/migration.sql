-- Tab CPPT (Catatan Perkembangan Pasien Terintegrasi) per kunjungan.
-- Per-item lintas profesi; append-only secara klinis, mutable terbatas
-- (edit isi · co-sign DPJP · flag tindak lanjut) — tanpa delete (medico-legal).

CREATE TABLE "medicalrecord"."cppt" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "profesi" TEXT NOT NULL,
    "penulis" TEXT NOT NULL,
    "jenis_catatan" TEXT NOT NULL DEFAULT 'SOAP',
    "subjektif" TEXT,
    "objektif" TEXT,
    "asesmen" TEXT,
    "planning" TEXT,
    "instruksi" TEXT,
    "tbak_pemberi" TEXT,
    "tbak_metode" TEXT,
    "tbak_tulis" BOOLEAN,
    "tbak_baca" BOOLEAN,
    "tbak_konfirmasi" BOOLEAN,
    "verified" BOOLEAN,
    "verified_by" TEXT,
    "verified_at" TIMESTAMPTZ(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "waktu_catatan" TIMESTAMPTZ(3) NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "cppt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cppt_kunjungan_id_waktu_catatan_idx"
    ON "medicalrecord"."cppt"("kunjungan_id", "waktu_catatan");

ALTER TABLE "medicalrecord"."cppt" ADD CONSTRAINT "cppt_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
