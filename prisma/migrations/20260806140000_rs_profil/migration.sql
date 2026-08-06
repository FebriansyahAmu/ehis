-- Master · Profil RS (singleton). Sumber KOP + logo semua cetakan EHIS.
CREATE TABLE "master"."rs_profil" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nama_inggris" TEXT,
    "kode" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "kepemilikan" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "fax" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "alamat" JSONB NOT NULL,
    "akreditasi" JSONB NOT NULL,
    "shift" JSONB NOT NULL,
    "kop" JSONB NOT NULL,
    "logo_data_url" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    CONSTRAINT "rs_profil_pkey" PRIMARY KEY ("id")
);
