-- Anamnesis: tambah blok Psikososial & Spiritual (RI — SNARS AP 1.1 / HPK 1.1).
-- Additive & data-preserving: 2 kolom JSONB nullable. IGD biarkan NULL (tak mengoleksi).
ALTER TABLE "medicalrecord"."anamnesis"
  ADD COLUMN "sosial" JSONB,
  ADD COLUMN "spiritual" JSONB;
