// Kontrak cek kepesertaan V-Claim (BFF `POST /api/v1/bpjs/peserta/cek`).
// • Input: jenis (kartu/nik) + nomor + tanggal SEP — dikirim di BODY, bukan query string, agar
//   NIK/No. kartu tidak tercatat di URL (log akses, riwayat browser) — OWASP ASVS V8.3.1.
// • Respons BPJS `{ peserta: {...} }` divalidasi Zod; field yang tidak dikenal DIBUANG (minimisasi
//   data) lalu dipetakan ke `PesertaRecord` yang sudah dipakai tampilan.
// • DTO: hasil ditemukan ATAU galat bisnis BPJS (201/203/…; HTTP 200 — BPJS menjawab). Galat
//   sambungan/konfigurasi = AppError (HTTP 502/429) di service, bukan di DTO.

import { z } from "zod";
import type { BPJSCode, PesertaRecord } from "@/lib/bpjs/bpjsShared";

// ── Input ──────────────────────────────────────────────

export type JenisCekPeserta = "kartu" | "nik";

export const PANJANG_NOMOR: Record<JenisCekPeserta, number> = { kartu: 13, nik: 16 };

/** "yyyy-mm-dd" yang benar-benar ada di kalender (tolak 2026-02-31). */
function tanggalSah(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export const CekPesertaInput = z
  .object({
    jenis: z.enum(["kartu", "nik"]),
    nomor: z.string().trim().max(16),
    tgl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus yyyy-mm-dd"),
  })
  .superRefine((v, ctx) => {
    const panjang = PANJANG_NOMOR[v.jenis];
    if (!/^\d+$/.test(v.nomor) || v.nomor.length !== panjang) {
      ctx.addIssue({
        code: "custom",
        path: ["nomor"],
        message: v.jenis === "kartu" ? `Nomor kartu harus ${panjang} digit angka` : `NIK harus ${panjang} digit angka`,
      });
    }
    if (!tanggalSah(v.tgl)) ctx.addIssue({ code: "custom", path: ["tgl"], message: "Tanggal SEP tidak valid" });
  });

export type CekPesertaInput = z.infer<typeof CekPesertaInput>;

/** Path V-Claim (relatif base URL). Nomor sudah tervalidasi digit saja. */
export function pesertaPath(jenis: JenisCekPeserta, nomor: string, tgl: string): string {
  return jenis === "kartu" ? `Peserta/nokartu/${nomor}/tglSEP/${tgl}` : `Peserta/nik/${nomor}/tglSEP/${tgl}`;
}

/** Endpoint untuk audit — placeholder, TANPA nomor (nomor di-hash terpisah, R9/R14). */
export const PESERTA_ENDPOINT_AUDIT: Record<JenisCekPeserta, string> = {
  kartu: "Peserta/nokartu/{noKartu}/tglSEP/{tgl}",
  nik: "Peserta/nik/{nik}/tglSEP/{tgl}",
};

// ── Respons V-Claim ────────────────────────────────────

/** Teks opsional: BPJS kadang mengirim null/angka/"" → string | null. */
const teks = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()));

const kodeKet = z.object({ kode: teks, keterangan: teks }).nullish();

export const PesertaResponseSchema = z.object({
  peserta: z.object({
    noKartu: z.string().min(1),
    nik: teks,
    nama: z.string().min(1),
    tglLahir: z.string().min(1),
    sex: z
      .string()
      .transform((s) => s.trim().toUpperCase())
      .pipe(z.enum(["L", "P"])),
    pisa: teks,
    hakKelas: kodeKet,
    jenisPeserta: kodeKet,
    statusPeserta: kodeKet,
    mr: z.object({ noMR: teks, noTelepon: teks }).nullish(),
    cob: z.object({ nmAsuransi: teks, noAsuransi: teks, tglTAT: teks, tglTMT: teks }).nullish(),
    provUmum: z.object({ kdProvider: teks, nmProvider: teks }).nullish(),
    tglCetakKartu: teks,
    tglTAT: teks,
    tglTMT: teks,
    umur: z.object({ umurSaatPelayanan: teks, umurSekarang: teks }).nullish(),
    informasi: z.object({ dinsos: teks, noSKTM: teks, prolanisPRB: teks }).nullish(),
  }),
});

export type PesertaResponse = z.infer<typeof PesertaResponseSchema>;

/** Respons V-Claim → `PesertaRecord`. Status aktif hanya kode "0"; kode lain = tidak aktif (keterangan asli dipertahankan). */
export function toPesertaRecord({ peserta: p }: PesertaResponse): PesertaRecord {
  return {
    noKartu: p.noKartu,
    nik: p.nik ?? "",
    nama: p.nama,
    tglLahir: p.tglLahir,
    sex: p.sex,
    pisa: p.pisa ?? "",
    hakKelas: { kode: p.hakKelas?.kode ?? "", keterangan: p.hakKelas?.keterangan ?? "" },
    jenisPeserta: { kode: p.jenisPeserta?.kode ?? "", keterangan: p.jenisPeserta?.keterangan ?? "" },
    statusPeserta: {
      kode: p.statusPeserta?.kode === "0" ? "0" : "1",
      keterangan: p.statusPeserta?.keterangan ?? (p.statusPeserta?.kode === "0" ? "AKTIF" : "TIDAK AKTIF"),
    },
    mr: { noMR: p.mr?.noMR ?? null, noTelepon: p.mr?.noTelepon ?? null },
    cob: {
      nmAsuransi: p.cob?.nmAsuransi ?? null,
      noAsuransi: p.cob?.noAsuransi ?? null,
      tglTAT: p.cob?.tglTAT ?? null,
      tglTMT: p.cob?.tglTMT ?? null,
    },
    provUmum: { kdProvider: p.provUmum?.kdProvider ?? "", nmProvider: p.provUmum?.nmProvider ?? "" },
    tglCetakKartu: p.tglCetakKartu,
    tglTAT: p.tglTAT,
    tglTMT: p.tglTMT,
    umur: { umurSaatPelayanan: p.umur?.umurSaatPelayanan ?? "", umurSekarang: p.umur?.umurSekarang ?? "" },
    informasi: {
      dinsos: p.informasi?.dinsos ?? null,
      noSKTM: p.informasi?.noSKTM ?? null,
      prolanisPRB: p.informasi?.prolanisPRB ?? null,
    },
  };
}

// ── DTO BFF ────────────────────────────────────────────

/** "bpjs" = langsung dari V-Claim · "uji" = data contoh (BPJS_MODE=mock tanpa BPJS_BACA_LIVE). */
export type SumberPeserta = "bpjs" | "uji";

export type PesertaCekDTO =
  | { ok: true; sumber: SumberPeserta; peserta: PesertaRecord }
  | { ok: false; sumber: SumberPeserta; galat: { code: BPJSCode; message: string } };
