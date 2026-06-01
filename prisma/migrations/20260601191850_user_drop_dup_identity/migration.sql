-- DropIndex
DROP INDEX "auth"."users_email_key";

-- AlterTable
ALTER TABLE "auth"."users" DROP COLUMN "email",
DROP COLUMN "foto",
DROP COLUMN "nama_lengkap",
DROP COLUMN "nip",
DROP COLUMN "no_hp";
