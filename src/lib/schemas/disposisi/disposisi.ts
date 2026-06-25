// Zod input + DTO — Disposisi / Outcome episode (tab Pasien Pulang, IGD).
// DisposisiInput = payload disposisi yang menyertai aksi "complete" (Selesaikan Kunjungan);
// ditulis atomik di kunjunganService.transition. DTO mirror PasienPulang FE. waktuKeluar =
// waktuSelesai lifecycle (single moment). TTV keluar TIDAK di sini (single-source Observation).

import { z } from "zod";

export const DisposisiJenis = z.enum(["Pulang", "Rawat_Inap", "Rujuk", "Meninggal", "APS"]);
export type DisposisiJenis = z.infer<typeof DisposisiJenis>;

// Jenis ruang/tingkat perawatan SPRI (level of care, BUKAN kelas BPJS).
export const SpriJenisPerawatan = z.enum([
  "Perawatan Biasa", "Perawatan Intensif", "Isolasi", "HCU", "ICU",
]);
export type SpriJenisPerawatan = z.infer<typeof SpriJenisPerawatan>;

// Lifecycle SPRI (encounter.Spri.status).
export const SpriStatus = z.enum(["MenungguRef", "Terbit", "Dikonsumsi", "Batal"]);
export type SpriStatus = z.infer<typeof SpriStatus>;

// ── Blok SPRI (menyertai complete saat jenis = Rawat_Inap) ──────────────────────
// Penerbitan BPJS (No. Referensi) dilakukan SERVER (mock) — FE tidak mengirim noReferensi.
export const SpriInput = z.object({
  noKartu: z.string().trim().max(40).default(""),
  dpjpNama: z.string().trim().min(1, "DPJP wajib").max(160),
  dpjpPegawaiId: z.string().uuid().optional(),
  smfSpesialistik: z.string().trim().max(120).optional(),
  poliKode: z.string().trim().max(20).optional(),
  poliNama: z.string().trim().max(120).optional(),
  tglRencanaRawat: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  jenisPerawatan: SpriJenisPerawatan,
  indikasi: z.string().trim().min(1, "Indikasi rawat inap wajib").max(2000),
  keterangan: z.string().trim().max(2000).optional(),
});
export type SpriInput = z.infer<typeof SpriInput>;

// ── Input (menyertai complete) ─────────────────────────────────────────────────
export const DisposisiInput = z
  .object({
    jenis: DisposisiJenis,
    dokter: z.string().trim().optional(), // default nama actor di Service
    kondisiUmum: z.string().trim().min(1, "Kondisi umum wajib").max(120),
    diagnosaKeluar: z.array(z.string().trim().min(1)).max(50).optional(),
    instruksi: z.string().max(4000).optional(),
    // blok per-jenis (opsional)
    rujukTujuan: z.string().max(300).optional(),
    rujukAlasan: z.string().max(2000).optional(),
    meninggalWaktu: z.string().max(60).optional(),
    meninggalSebab: z.string().max(2000).optional(),
    apsAlasan: z.string().max(2000).optional(),
    rawatInapRuangan: z.string().max(200).optional(),
    rawatInapKelas: z.string().max(60).optional(),
    catatan: z.string().max(2000).optional(),
    // tambahan per-jenis (form Pasien Pulang IGD)
    obatPulang: z.string().max(2000).optional(),            // Sembuh/Membaik
    edukasiRisiko: z.string().max(2000).optional(),         // APS
    penandatangan: z.string().max(160).optional(),          // APS
    hubunganPenandatangan: z.string().max(80).optional(),   // APS
    // SPRI (wajib saat Rawat_Inap) → ditulis ke encounter.Spri atomik di complete
    spri: SpriInput.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.jenis === "Rawat_Inap" && !v.spri) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["spri"], message: "Data SPRI wajib untuk Rawat Inap" });
    }
  });
export type DisposisiInput = z.infer<typeof DisposisiInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── SPRI worklist (admisi registrasi) ───────────────────────────────────────────
export const SpriQuery = z.object({
  // default (kosong) = belum dikonsumsi (MenungguRef + Terbit); ?status= override eksplisit.
  status: SpriStatus.optional(),
});
export type SpriQuery = z.infer<typeof SpriQuery>;

export const SpriIdParam = z.object({ id: z.string().uuid("ID SPRI tidak valid") });

export const ConsumeSpriInput = z.object({
  riKunjunganId: z.string().uuid("riKunjunganId tidak valid"),
});
export type ConsumeSpriInput = z.infer<typeof ConsumeSpriInput>;

// DTO worklist/kartu admisi
export interface SpriDTO {
  id: string;
  kunjunganId: string;
  noKunjungan: string;   // kunjungan IGD asal
  noRM: string;
  namaPasien: string;
  noKartu: string;
  dpjpNama: string;
  smfSpesialistik: string | null;
  poliKode: string | null;
  poliNama: string | null;
  tglRencanaRawat: string;  // YYYY-MM-DD
  jenisPerawatan: string;
  indikasi: string;
  keterangan: string | null;
  noReferensi: string | null;
  status: SpriStatus;
  riKunjunganId: string | null;
  user: string;
  createdAt: string;        // ISO
  version: number;
}

// ── DTO (response GET /kunjungan/:id/disposisi) ────────────────────────────────
export interface DisposisiDTO {
  id: string;
  jenis: "Pulang" | "Rawat_Inap" | "Rujuk" | "Meninggal" | "APS";
  waktuKeluar: string; // ISO
  dokter: string;
  kondisiUmum: string;
  diagnosaKeluar: string[];
  instruksi: string;
  rujukTujuan?: string;
  rujukAlasan?: string;
  meninggalWaktu?: string;
  meninggalSebab?: string;
  apsAlasan?: string;
  rawatInapRuangan?: string;
  rawatInapKelas?: string;
  catatan?: string;
  pemeriksa: string;
  createdAt: string; // ISO
}
