// Zod schema + DTO domain Kunjungan/BPJS (FLOWS §5 · BACKEND-ENCOUNTER §4.3).
// FOKUS RAWAT JALAN: unit lain di-tolak superRefine sampai didukung. Vocab = kanonik
// (mirror enum Prisma encounter/bpjs). Mapping entity→DTO ada di Service.

import { z } from "zod";
import { TipePenjamin } from "@/lib/schemas/patient";
import { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";

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
export const KelasRawat = z.enum(["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi"]);

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
    triaseLevel: z.number().int().min(1).max(4).optional(), // IGD prioritas P1..P4
    dpjpId: z.string().uuid().optional(), // DPJP master (Dokter id, bukan nama bebas)
    ruanganId: z.string().uuid().optional(), // ruangan layanan (master Location) — IGD bay / RI bangsal
    kelas: KelasRawat.optional(), // RI — kelas rawat
    bedId: z.string().uuid().optional(), // RI — bed di-reserve saat daftar (master Bed)
    keluhan: z.string().trim().max(1000).optional(),
    caraMasuk: z.string().trim().max(60).optional(),
    penjaminId: z.string().uuid().optional(), // pilih penjamin pasien; default primer
    penjaminTipe: TipePenjamin,
    // No. Kartu BPJS terverifikasi di loket — dikirim terpisah dari SEP agar penjamin tetap
    // tersimpan walau penerbitan SEP ditangguhkan ("buat SEP nanti").
    noKartu: z.string().trim().max(40).optional(),
    rujukan: RujukanInput.optional(),
    sep: SepInput.optional(),
    // Tetap daftarkan walau SEP DITOLAK BPJS (data tak lengkap / peserta non-aktif): kunjungan
    // dibuat, SEP DITANGGUHKAN (bukan rollback). Default false → SEP gagal = batalkan pendaftaran
    // (operator pilih "Tetap daftarkan" / "Revisi" di review). Lihat KunjunganDTO.sepError.
    forceSep: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    const isBpjs = v.penjaminTipe === "BPJS_Non_PBI" || v.penjaminTipe === "BPJS_PBI";
    // SEP OPSIONAL saat pendaftaran: dapat ditangguhkan ("buat SEP nanti"). Bila `sep` dikirim,
    // sub-skema SepInput memvalidasi kelengkapannya; bila tidak, kunjungan tetap terdaftar.
    if (v.unit === "RawatJalan") {
      if (!v.poli) ctx.addIssue({ code: "custom", path: ["poli"], message: "Poli tujuan wajib untuk Rawat Jalan" });
      // Rujukan wajib untuk BPJS RJ (dasar rujukan tetap dicatat walau SEP ditangguhkan).
      if (isBpjs && !v.rujukan) ctx.addIssue({ code: "custom", path: ["rujukan"], message: "Rujukan wajib untuk BPJS Rawat Jalan" });
    }
    // IGD = kegawatdaruratan: triase opsional di loket; rujukan TIDAK wajib (emergency).
  });

// ── Worklist (GET /kunjungan) ─────────────────────────────────────────────────
export const WorklistQuery = z.object({
  unit: KunjunganUnit.optional(),
  status: z.string().trim().optional(), // comma-separated → di-split Service
  /** Filter per pasien → timeline/Riwayat (patientId ada → semua status, bukan cuma aktif). */
  patientId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── Transisi status (PATCH /kunjungan/:id/status) ─────────────────────────────
// State machine worklist RJ. callState (Idle/Dipanggil) = sub-state, tak ubah status puncak.
//   Registered ─call→ Queued/Dipanggil ─receive→ InService ─complete→ Completed
//        └─checkIn→ Queued        └─recall (++count)      └─cancel→ Cancelled
//   Completed ─reopen→ InService
export const KunjunganActionName = z.enum([
  "checkIn", "call", "recall", "receive", "complete", "cancel", "reopen",
]);
export const TransitionInput = z
  .object({
    action: KunjunganActionName,
    /** Optimistic concurrency — bila dikirim, ditolak (409) saat version sudah berubah. */
    expectedVersion: z.number().int().nonnegative().optional(),
    /** Bed yang ditempati saat `receive` (IGD). Bila ada → buat alokasi Occupied + set Kunjungan.bedId. */
    bedId: z.string().uuid().optional(),
    /** Waktu selesai efektif (DateTimePicker "YYYY-MM-DDTHH:mm") — `complete`/re-complete. Default now. */
    waktuSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Waktu selesai tidak valid").optional(),
    /** Disploisi (outcome) — WAJIB saat `complete`; ditulis atomik bersama kunci lifecycle. */
    disposisi: DisposisiInput.optional(),
    /** Alasan batal-selesai (medico-legal) — opsional saat `reopen`. */
    alasanReopen: z.string().max(2000).optional(),
  })
  .refine((d) => d.action !== "complete" || d.disposisi != null, {
    message: "Disposisi wajib saat menyelesaikan kunjungan",
    path: ["disposisi"],
  });

// ── Tipe inferensi ─────────────────────────────────────────────────────────---
export type RegisterKunjunganInput = z.infer<typeof RegisterKunjunganInput>;
export type RujukanInput = z.infer<typeof RujukanInput>;
export type SepInput = z.infer<typeof SepInput>;
export type WorklistQuery = z.infer<typeof WorklistQuery>;
export type KunjunganActionName = z.infer<typeof KunjunganActionName>;
export type TransitionInput = z.infer<typeof TransitionInput>;

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
  ruanganId: string | null;
  kelas: string | null;
  triaseLevel: number | null;
  callState: "Idle" | "Dipanggil" | null;
  recallCount: number;
  penjaminTipe: string;
  penjaminId: string | null;
  keluhan: string | null;
  diagnosaMasuk: string | null;
  kodeIcdMasuk: string | null;
  pasien: { id: string; noRm: string; nama: string; gender: "L" | "P"; tanggalLahir: string | null };
  sep: { id: string; noSep: string | null; status: string } | null;
  selesaiAt: string | null; // ISO — waktu selesai efektif (worklist "Selesai hari ini")
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
  ruanganId: string | null;
  kelas: string | null;
  triaseLevel: number | null;
  caraMasuk: string | null;
  caraDatang: string | null;
  asalMasuk: string | null;
  callState: "Idle" | "Dipanggil" | null;
  recallCount: number;
  keluhan: string | null;
  diagnosaMasuk: string | null;
  kodeIcdMasuk: string | null;
  penjaminTipe: string;
  penjaminId: string | null;
  pasien: { id: string; noRm: string; nama: string };
  rujukan: RujukanDTO | null;
  sep: SepDTO | null;
  // SEP DITOLAK BPJS tapi kunjungan tetap didaftarkan (forceSep). Null = SEP terbit / tak diminta /
  // ditangguhkan manual. Terisi → tampilkan peringatan "SEP gagal, terbitkan ulang nanti".
  sepError: { code: string; message: string; field?: string } | null;
  // ── Finalize / lock (Selesaikan Kunjungan) ──
  lockedAt: string | null; // ISO — terisi = rekam medis terkunci (Completed)
  selesaiAt: string | null; // ISO — waktu selesai efektif
  selesaiPertamaAt: string | null; // ISO — waktu selesai pertama (audit)
  disposisi: string | null; // jenis disposisi terbaru
  alasanReopen: string | null; // alasan batal-selesai terakhir
  version: number;
  createdAt: string;
}
