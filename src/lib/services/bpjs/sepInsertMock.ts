// Konektor MOCK Insert SEP (V-Claim `Peserta/sep/2.0/insert`) — server-side.
//
// ⚠️ MOCK: BPJS V-Claim belum di-hit (belum ada cons-id). `insertSepMock` MENSIMULASIKAN
// respons BPJS — sukses ({ ok:true }) ATAU error metaData ala asli ({ ok:false, error })
// ketika data tidak sesuai. Saat V-Claim siap: ganti isi fungsi ini dengan
//   callBpjs({ service:"vclaim", method:"POST", path:".../SEP/2.0/insert", body: toSepWire(payload) })
//   → decode envelope → { ok } / { ok:false, error: metaData }.
// SIGNATURE TETAP (return InsertSepConnectorResult) → swap tanpa sentuh Service.
//
// Aturan validasi mock (mirror perilaku V-Claim — di-dokumentasikan di docs/MOCK-SEP-INSERT.md):
//   R1 noKartu  : wajib, ≥ 10 digit numerik          → code "201" (peserta tak ditemukan)
//   R2 peserta  : kartu demo non-aktif → ditolak       → code "204" (tidak aktif)
//   R3 noTelp   : wajib                                 → code "412" (data tak lengkap)
//   R4 diagAwal : wajib (ICD-10)                        → code "412"
//   R5 skdp     : Rawat Inap WAJIB No. Surat (SPRI)     → code "412"
//   R6 ppk      : kode PPK pelayanan wajib              → code "500"

import type { InsertSEPPayload } from "@/lib/bpjs/vClaimSEP";
import type { InsertSepConnectorResult } from "@/lib/schemas/bpjs/sepInsert";

/**
 * Kartu BPJS demo yang disetel "tidak aktif" agar operator bisa menguji jalur penolakan
 * (SEP gagal terbit → pilih "Tetap daftarkan" / "Revisi"). Selaras BPJS_MOCK (Siti Rahayu).
 */
const KARTU_NONAKTIF_DEMO = new Set<string>(["0009876543210"]);

const digits = (s: string): string => s.replace(/\D/g, "");

/**
 * Simulasi Insert SEP. Validasi sesuai aturan V-Claim → kembalikan error metaData saat tidak
 * sesuai; selain itu sukses (Service yang generate No. SEP via sequence DB).
 */
export function insertSepMock(payload: InsertSEPPayload): InsertSepConnectorResult {
  // R1 — No. Kartu peserta.
  const kartu = digits(payload.noKartu);
  if (kartu.length < 10) {
    return { ok: false, error: { code: "201", message: "No. Kartu peserta tidak ditemukan / tidak valid", field: "noKartu" } };
  }

  // R2 — kepesertaan tidak aktif (demo).
  if (KARTU_NONAKTIF_DEMO.has(kartu)) {
    return {
      ok: false,
      error: { code: "204", message: "Peserta tidak aktif pada bulan pelayanan — SEP tidak dapat diterbitkan", field: "noKartu" },
    };
  }

  // R6 — PPK pelayanan (RS) wajib.
  if (!payload.ppkPelayanan || !payload.ppkPelayanan.trim()) {
    return { ok: false, error: { code: "500", message: "Kode PPK pelayanan tidak valid", field: "ppkPelayanan" } };
  }

  // R3 — No. Telepon wajib (BPJS menolak SEP tanpa kontak).
  if (!payload.noTelp || !payload.noTelp.trim()) {
    return { ok: false, error: { code: "412", message: "No. Telepon peserta wajib diisi", field: "noTelp" } };
  }

  // R4 — Diagnosa awal (ICD-10) wajib.
  if (!payload.diagAwal || payload.diagAwal.trim().length < 2) {
    return { ok: false, error: { code: "412", message: "Diagnosa awal (ICD-10) wajib diisi", field: "diagAwal" } };
  }

  // R5 — Rawat Inap WAJIB No. Surat Kontrol (SPRI).
  if (payload.jnsPelayanan === "1" && !payload.skdp?.noSurat?.trim()) {
    return {
      ok: false,
      error: { code: "412", message: "No. Surat Kontrol (SPRI) wajib untuk Rawat Inap", field: "skdpNoSurat" },
    };
  }

  // Sukses — No. SEP digenerate Service (uniq via sequence DB). Konektor nyata isi noSep BPJS.
  return { ok: true };
}
