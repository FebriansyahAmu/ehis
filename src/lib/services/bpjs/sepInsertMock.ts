// Konektor MOCK Insert SEP (V-Claim `Peserta/sep/2.0/insert`) — server-side.
//
// ⚠️ MOCK: BPJS V-Claim belum di-hit (belum ada cons-id). `insertSepMock` MENSIMULASIKAN
// respons BPJS — sukses ({ ok:true }) ATAU error metaData ala asli ({ ok:false, error })
// ketika data tidak sesuai. Saat V-Claim siap: ganti isi fungsi ini dengan
//   callBpjs({ service:"vclaim", method:"POST", path:".../SEP/2.0/insert", body: toSepWire(payload) })
//   → decode envelope → { ok } / { ok:false, error: metaData }.
// SIGNATURE (payload, now) → return InsertSepConnectorResult. Param `now` = jam server (dari
// clock inject) HANYA untuk emulasi aturan tanggal (R7); konektor NYATA mengabaikannya (BPJS
// memakai jam servernya sendiri) → swap tanpa sentuh Service.
//
// Aturan validasi mock (mirror perilaku V-Claim — di-dokumentasikan di docs/MOCK-SEP-INSERT.md):
//   R1 noKartu  : wajib, ≥ 10 digit numerik          → code "201" (peserta tak ditemukan)
//   R2 peserta  : kartu demo non-aktif → ditolak       → code "204" (tidak aktif)
//   R3 noTelp   : wajib                                 → code "412" (data tak lengkap)
//   R4 diagAwal : wajib (ICD-10)                        → code "412"
//   R5 skdp     : Rawat Inap WAJIB No. Surat (SPRI)     → code "412"
//   R6 ppk      : kode PPK pelayanan wajib              → code "500"
//   R7 tglSep   : batas waktu penerbitan SEP           → code "412"
//                 · RJ/IGD (jns "2") = HARUS hari pelayanan yang sama.
//                 · Rawat Inap (jns "1") = maks. 3×24 jam HARI KERJA (Sabtu/Minggu tak dihitung).

import type { InsertSEPPayload } from "@/lib/bpjs/vClaimSEP";
import type { InsertSepConnectorResult } from "@/lib/schemas/bpjs/sepInsert";

/**
 * Kartu BPJS demo yang disetel "tidak aktif" agar operator bisa menguji jalur penolakan
 * (SEP gagal terbit → pilih "Tetap daftarkan" / "Revisi"). Selaras BPJS_MOCK (Siti Rahayu).
 */
const KARTU_NONAKTIF_DEMO = new Set<string>(["0009876543210"]);

const digits = (s: string): string => s.replace(/\D/g, "");

const DAY_MS = 86_400_000;
// Zona klinis: Asia/Jakarta (WIB, UTC+7). `tglSep` = tanggal kalender WIB (dari input operator /
// waktuKunjungan). "Hari ini" harus dihitung di WIB juga agar SEP same-day tidak salah tolak pada
// 00:00–07:00 WIB (= hari UTC sebelumnya). Zona tunggal — WITA/WIT = fase later (lihat combineDateTime).
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Epoch UTC-midnight dari tanggal kalender WIB milik sebuah instant (buang komponen jam). */
function wibDateMidnight(d: Date): number {
  const w = new Date(d.getTime() + WIB_OFFSET_MS);
  return Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate());
}

/** Parse "yyyy-MM-dd" → epoch UTC-midnight; `NaN` bila tak valid. */
function ymdToUtcMidnight(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
}

/**
 * Jumlah HARI KERJA (Senin–Jumat) dalam rentang (from, to] berbasis UTC-midnight.
 * Sabtu & Minggu TIDAK dihitung (bukan hari kerja). `to <= from` → 0. Loop per-hari via
 * DAY_MS (UTC bebas DST → langkah 24 jam eksak). Libur nasional belum diperhitungkan
 * (butuh kalender libur — lihat TECH_DEBT).
 */
function workdaysBetween(fromUtc: number, toUtc: number): number {
  if (!(toUtc > fromUtc)) return 0;
  let count = 0;
  for (let t = fromUtc + DAY_MS; t <= toUtc; t += DAY_MS) {
    const dow = new Date(t).getUTCDay(); // 0=Minggu … 6=Sabtu
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/**
 * Simulasi Insert SEP. Validasi sesuai aturan V-Claim → kembalikan error metaData saat tidak
 * sesuai; selain itu sukses (Service yang generate No. SEP via sequence DB). `now` = jam server
 * (clock inject) untuk aturan batas tanggal (R7).
 */
export function insertSepMock(payload: InsertSEPPayload, now: Date): InsertSepConnectorResult {
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

  // R7 — Batas waktu penerbitan SEP (tata cara BPJS: SEP diterbitkan pada masa pelayanan).
  //  · Rawat Jalan / IGD (jnsPelayanan "2"): SEP WAJIB pada tanggal pelayanan yang SAMA — tak
  //    boleh diterbitkan di hari berbeda (mis. kunjungan 29 Jun, SEP baru dibuat 30 Jun → tolak).
  //  · Rawat Inap (jnsPelayanan "1"): maksimal 3×24 jam sejak tanggal masuk, Sabtu & Minggu TIDAK
  //    dihitung (hari kerja). Lebih dari 3 hari kerja → tolak.
  const tglSepUtc = ymdToUtcMidnight(payload.tglSep);
  if (!Number.isNaN(tglSepUtc)) {
    const nowUtc = wibDateMidnight(now);
    if (payload.jnsPelayanan === "2") {
      if (tglSepUtc !== nowUtc) {
        return {
          ok: false,
          error: {
            code: "412",
            message: `SEP Rawat Jalan/IGD harus diterbitkan pada tanggal pelayanan yang sama (${payload.tglSep}). Penerbitan di hari berbeda tidak diperbolehkan sesuai ketentuan BPJS.`,
            field: "tglSep",
          },
        };
      }
    } else {
      const hariKerjaLewat = workdaysBetween(tglSepUtc, nowUtc);
      if (hariKerjaLewat > 3) {
        return {
          ok: false,
          error: {
            code: "412",
            message: `SEP Rawat Inap melewati batas 3×24 jam hari kerja sejak tanggal masuk (${payload.tglSep}) — ${hariKerjaLewat} hari kerja telah berlalu (Sabtu/Minggu tidak dihitung). Penerbitan tidak dapat dilakukan.`,
            field: "tglSep",
          },
        };
      }
    }
  }

  // Sukses — No. SEP digenerate Service (uniq via sequence DB). Konektor nyata isi noSep BPJS.
  return { ok: true };
}
