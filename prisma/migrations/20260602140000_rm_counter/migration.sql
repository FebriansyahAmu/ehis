-- No. RM format baru: YYMMNNNN (mis. 26020001) — sequence RESET tiap bulan.
-- Postgres SEQUENCE global tak bisa di-reset per-periode secara aman-race; ganti dengan
-- counter table. Pengambilan nomor = upsert atomik pada baris periode (INSERT … ON
-- CONFLICT … RETURNING) → 1 round-trip, anti-race tanpa SELECT … FOR UPDATE eksplisit.
CREATE TABLE IF NOT EXISTS "pendaftaran"."rm_counter" (
  "periode"  CHAR(4) PRIMARY KEY,   -- "YYMM" zona WIB, mis. "2602" (Feb 2026)
  "last_seq" INTEGER NOT NULL
);

-- Sequence lama dipensiunkan (format RM-YYYY-NNNNN tak dipakai lagi). Aman di-drop:
-- nilai sequence tak direferensikan oleh data manapun setelah ter-generate.
DROP SEQUENCE IF EXISTS "pendaftaran"."no_rm_seq";
