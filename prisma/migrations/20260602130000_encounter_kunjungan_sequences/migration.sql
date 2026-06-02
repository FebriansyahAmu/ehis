-- Sequence no. kunjungan: atomik anti-race (FLOWS §"App vs DB"). Service:
-- SELECT nextval → format "{prefix}/{YYYY}/{seq}" (mis. "RJ/2026/00001").
CREATE SEQUENCE IF NOT EXISTS "encounter"."no_kunjungan_seq" AS BIGINT START 1;

-- Sequence no. SEP: BPJS V-Claim belum di-hit → no. SEP digenerate LOKAL (mock).
-- Sequence menjamin keunikan atomik (kolom bpjs.sep.no_sep @unique).
CREATE SEQUENCE IF NOT EXISTS "bpjs"."no_sep_seq" AS BIGINT START 1;
