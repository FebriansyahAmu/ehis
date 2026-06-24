// MOCK — Penerbitan SPRI (Surat Perintah Rawat Inap) "selalu berhasil".
//
// Tujuan: alur "Selesaikan Kunjungan → Rawat Inap" di IGD bisa dijalankan tanpa integrasi
// V-Claim BPJS. `terbitkanSPRI()` SELALU mengembalikan sukses + nomor referensi.
//
// Aksi produksi: ganti body `terbitkanSPRI()` → panggil V-Claim insertSPRI (BFF). Kontrak
// `SPRIRequest` sudah 1:1 dengan payload BPJS (request.{noKartu,kodeDokter,poliKontrol,
// tglRencanaKontrol,user}). Checklist & catatan poliKontrol → docs/MOCK-SPRI-RAWAT-INAP.md.

/** Payload SPRI BPJS (request.*) — dipertahankan saat swap ke produksi. */
export interface SPRIRequest {
  noKartu: string;            // nomor kartu BPJS peserta
  kodeDokter: string;         // kode dokter DPJP rawat inap (kode BPJS)
  poliKontrol: string;        // kode poli/spesialistik TUJUAN rawat (bukan ruang IGD asal)
  tglRencanaKontrol: string;  // yyyy-MM-dd — tanggal mulai rawat inap
  user: string;               // user pembuat SPRI (login)
}

export interface SPRIResult {
  ok: true;
  /** Nomor SPRI/referensi dari BPJS, mis. 0491R0010626K000291. */
  noReferensi: string;
  tglTerbit: string;          // ISO timestamp
  raw: SPRIRequest;           // echo payload (debug/print)
}

const pad = (n: number, len: number) => String(n).padStart(len, "0");

/**
 * Format nomor referensi SPRI: `PPK(4) R 001 MM YY K SEQ(6)`.
 * Contoh BPJS: 0491R0010626K000291 → 0491 · R · 001 · 06 · 26 · K · 000291.
 * Bagian tanggal (MM/YY) dibuat sadar-waktu agar realistis; SEQ acak per terbit.
 */
function genNoReferensi(): string {
  const now = new Date();
  const mm = pad(now.getMonth() + 1, 2);
  const yy = pad(now.getFullYear() % 100, 2);
  const seq = pad(Math.floor(Math.random() * 1_000_000), 6);
  return `0491R001${mm}${yy}K${seq}`;
}

/**
 * MOCK — selalu berhasil. Latensi ~600ms meniru jaringan agar skeleton/loading terlihat.
 * Tidak pernah melempar / mengembalikan gagal (lihat doc untuk mengaktifkan cabang error
 * saat produksi).
 */
export async function terbitkanSPRI(req: SPRIRequest): Promise<SPRIResult> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    ok: true,
    noReferensi: genNoReferensi(),
    tglTerbit: new Date().toISOString(),
    raw: req,
  };
}
