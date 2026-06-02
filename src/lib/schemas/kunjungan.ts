// Zod schema + DTO domain Kunjungan/BPJS (FLOWS §5 · BACKEND-ENCOUNTER §4.3).
// FOKUS RAWAT JALAN: unit lain di-tolak superRefine sampai didukung. Vocab = kanonik
// (mirror enum Prisma encounter/bpjs). Mapping entity→DTO ada di Service.

import { z } from "zod";
import { TipePenjamin } from "@/lib/schemas/patient";

// ── Enum (mirror prisma encounter/bpjs) ───────────────────────────────────────
export const KunjunganUnit = z.enum(["IGD", "RawatJalan", "RawatInap"]);
export const KunjunganStatus = z.enum([
  "Registered", "Queued", "InService", "Completed", "Closed", "Billed", "Claimed", "Cancelled",
]);
export const SumberRujukan = z.enum(["RujukanMasuk", "KontrolPascaRanap", "RujukanIGD"]);
export const AsalRujukan = z.enum(["Faskes1", "Faskes2"]);
export const JenisPelayananSep = z.enum(["RawatInap", "RawatJalan"]);
export const TujuanKunjungan = z.enum(["Normal", "Prosedur", "KonsulDokter"]);
export const LakaLantas = z.enum(["BKLL", "KLL_BKK", "KLL_KK", "KK"]);

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const HHMM = z.string().regex(/^\d{2}:\d{2}$/, "Format jam harus HH:MM");

// ── Sub-objek BPJS ────────────────────────────────────────────────────────────
export const RujukanInput = z.object({
  sumber: SumberRujukan.default("RujukanMasuk"),
  asalRujukan: AsalRujukan.default("Faskes1"),
  noRujukan: z.string().trim().min(1).max(40),
  tglRujukan: ISO_DATE.optional(),
  ppkRujukan: z.string().trim().max(20).optional(),
  diagnosaKode: z.string().trim().max(10).optional(), // ICD-10
  diagnosaNama: z.string().trim().max(200).optional(),
  poliTujuan: z.string().trim().max(80).optional(),
  noSepAsal: z.string().trim().max(40).optional(),
});

export const SepInput = z.object({
  ppkPelayanan: z.string().trim().min(1).max(20),
  /** No. Kartu hasil verifikasi kepesertaan di loket (sumber No. Kartu SEP). */
  noKartu: z.string().trim().max(40).optional(),
  jnsPelayanan: JenisPelayananSep.default("RawatJalan"),
  klsRawatHak: z.enum(["1", "2", "3"]).optional(),
  noMr: z.string().trim().max(40).optional(),
  // Naik kelas
  naikKelas: z.boolean().default(false),
  klsRawatNaik: z.string().trim().max(20).optional(),
  pembiayaan: z.string().trim().max(20).optional(),
  penanggungJawab: z.string().trim().max(120).optional(),
  // Tujuan kunjungan & prosedur (RJ)
  tujuanKunj: TujuanKunjungan.default("Normal"),
  flagProcedure: z.enum(["0", "1"]).optional(),
  kdPenunjang: z.string().trim().max(20).optional(),
  assesmentPel: z.string().trim().max(20).optional(),
  poliEksekutif: z.boolean().default(false),
  dpjpLayan: z.string().trim().max(40).optional(),
  poliTujuan: z.string().trim().max(80).optional(),
  diagAwal: z.string().trim().max(10).optional(), // ICD-10
  // Jaminan kecelakaan
  lakaLantas: LakaLantas.default("BKLL"),
  noLp: z.string().trim().max(60).optional(),
  tglKejadian: ISO_DATE.optional(),
  keteranganLaka: z.string().trim().max(300).optional(),
  suplesi: z.boolean().default(false),
  noSepSuplesi: z.string().trim().max(40).optional(),
  cob: z.boolean().default(false),
  katarak: z.boolean().default(false),
  skdpNoSurat: z.string().trim().max(40).optional(),
  skdpKodeDpjp: z.string().trim().max(40).optional(),
  noTelp: z.string().trim().max(20).optional(),
  catatan: z.string().trim().max(500).optional(),
  user: z.string().trim().max(80).optional(), // operator loket → SEP.userPembuat
});

// ── Register kunjungan (POST /kunjungan) ──────────────────────────────────────
export const RegisterKunjunganInput = z
  .object({
    patientId: z.string().uuid("patientId tidak valid"),
    unit: KunjunganUnit,
    tanggal: ISO_DATE,
    jam: HHMM.optional(),
    poli: z.string().trim().max(80).optional(),
    dpjpId: z.string().uuid().optional(), // DPJP master (bukan nama bebas)
    keluhan: z.string().trim().max(1000).optional(),
    caraMasuk: z.string().trim().max(60).optional(),
    penjaminId: z.string().uuid().optional(), // pilih penjamin pasien; default primer
    penjaminTipe: TipePenjamin,
    rujukan: RujukanInput.optional(),
    sep: SepInput.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.unit !== "RawatJalan") {
      ctx.addIssue({ code: "custom", path: ["unit"], message: "Saat ini hanya Rawat Jalan yang didukung" });
      return;
    }
    if (!v.poli) ctx.addIssue({ code: "custom", path: ["poli"], message: "Poli tujuan wajib untuk Rawat Jalan" });
    const isBpjs = v.penjaminTipe === "BPJS_Non_PBI" || v.penjaminTipe === "BPJS_PBI";
    if (isBpjs) {
      if (!v.rujukan) ctx.addIssue({ code: "custom", path: ["rujukan"], message: "Rujukan wajib untuk BPJS Rawat Jalan" });
      if (!v.sep) ctx.addIssue({ code: "custom", path: ["sep"], message: "Data SEP wajib untuk pasien BPJS" });
    }
  });

// ── Worklist (GET /kunjungan) ─────────────────────────────────────────────────
export const WorklistQuery = z.object({
  unit: KunjunganUnit.optional(),
  status: z.string().trim().optional(), // comma-separated → di-split Service
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── Tipe inferensi ─────────────────────────────────────────────────────────---
export type RegisterKunjunganInput = z.infer<typeof RegisterKunjunganInput>;
export type RujukanInput = z.infer<typeof RujukanInput>;
export type SepInput = z.infer<typeof SepInput>;
export type WorklistQuery = z.infer<typeof WorklistQuery>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface RujukanDTO {
  id: string;
  sumber: string;
  asalRujukan: string;
  noRujukan: string;
  tglRujukan: string | null; // ISO date
  ppkRujukan: string | null;
  diagnosaKode: string | null;
  diagnosaNama: string | null;
  poliTujuan: string | null;
  noSepAsal: string | null;
}

// SEP = dokumen klaim → `noKartu` ditampilkan penuh untuk cetak (RBAC bpjs.sep:read).
export interface SepDTO {
  id: string;
  status: string;
  noSep: string | null;
  noKartu: string;
  tglSep: string; // ISO date
  ppkPelayanan: string;
  jnsPelayanan: string;
  klsRawatHak: string | null;
  noMr: string | null;
  naikKelas: boolean;
  klsRawatNaik: string | null;
  tujuanKunj: string;
  poliTujuan: string | null;
  diagAwal: string | null;
  poliEksekutif: boolean;
  dpjpLayan: string | null;
  lakaLantas: string;
  cob: boolean;
  katarak: boolean;
  catatan: string | null;
  userPembuat: string | null;
  createdAt: string;
}

// Item worklist (ringan) — SEP cuma ringkasan (badge), rujukan tak dimuat.
export interface KunjunganListItemDTO {
  id: string;
  noKunjungan: string;
  unit: string;
  status: string;
  waktuKunjungan: string; // ISO datetime
  poli: string | null;
  dpjpId: string | null;
  kelas: string | null;
  triaseLevel: number | null;
  penjaminTipe: string;
  penjaminId: string | null;
  diagnosaMasuk: string | null;
  kodeIcdMasuk: string | null;
  pasien: { id: string; noRm: string; nama: string };
  sep: { id: string; noSep: string | null; status: string } | null;
  version: number;
  createdAt: string;
}

export interface KunjunganDTO {
  id: string;
  noKunjungan: string;
  noPendaftaran: string | null;
  unit: string;
  status: string;
  waktuKunjungan: string; // ISO datetime
  poli: string | null;
  dpjpId: string | null;
  kelas: string | null;
  triaseLevel: number | null;
  caraMasuk: string | null;
  caraDatang: string | null;
  asalMasuk: string | null;
  keluhan: string | null;
  diagnosaMasuk: string | null;
  kodeIcdMasuk: string | null;
  penjaminTipe: string;
  penjaminId: string | null;
  pasien: { id: string; noRm: string; nama: string };
  rujukan: RujukanDTO | null;
  sep: SepDTO | null;
  version: number;
  createdAt: string;
}
