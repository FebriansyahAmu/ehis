-- AlterTable
ALTER TABLE "master"."tarif_kamar" ADD COLUMN "no_sk" TEXT,
                                   ADD COLUMN "tgl_sk" DATE;

-- AlterTable
ALTER TABLE "master"."tarif_administrasi" ADD COLUMN "no_sk" TEXT,
                                          ADD COLUMN "tgl_sk" DATE;
