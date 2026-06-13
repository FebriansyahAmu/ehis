-- Counter kode obat (auto `OBT-<YYMM><NNN>`, reset per bulan). Additive.
-- Pola identik pendaftaran.rm_counter (upsert by PK periode, anti-race).

CREATE TABLE "master"."obat_counter" (
    "periode" CHAR(4) NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "obat_counter_pkey" PRIMARY KEY ("periode")
);
