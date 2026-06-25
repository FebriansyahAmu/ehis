// MOCK SERVER-SIDE — Penerbitan No. Referensi SPRI ke BPJS (V-Claim insertSPRI).
//
// Dipanggil saat IGD complete (jenis Rawat_Inap) DAN saat revisi di worklist admisi. Mengembalikan
// nomor referensi BILA "kepesertaan aktif"; mengembalikan `null` bila BPJS bermasalah / nonaktif —
// SPRI tetap terbit, No. Referensi diisi nanti via revisi (lihat docs/MOCK-SPRI-RAWAT-INAP.md).
//
// Aturan demo "tidak aktif" (sampai V-Claim nyata): noKartu kosong, ATAU digit terakhir = "0"
// (mudah diuji: kartu berakhir 0 → simulasi BPJS bermasalah). Swap produksi = ganti body →
// panggil BFF V-Claim insertSPRI, map error/timeout → null.

const pad = (n: number, len: number) => String(n).padStart(len, "0");

/** Format No. Referensi SPRI: PPK(4) R 001 MM YY K SEQ(6) — mis. 0491R0010625K000291. */
function genNoReferensi(): string {
  const now = new Date();
  const mm = pad(now.getMonth() + 1, 2);
  const yy = pad(now.getFullYear() % 100, 2);
  const seq = pad(Math.floor(Math.random() * 1_000_000), 6);
  return `0491R001${mm}${yy}K${seq}`;
}

/** true = kepesertaan dianggap aktif (boleh dapat ref). Aturan demo, ganti saat produksi. */
function isMembershipActive(noKartu: string): boolean {
  const k = noKartu.trim();
  if (!k) return false;             // tanpa kartu → tak bisa terbit ref
  if (k.endsWith("0")) return false; // demo: kartu berakhir "0" → BPJS bermasalah
  return true;
}

/**
 * Terbitkan No. Referensi SPRI. Latensi ~400ms meniru jaringan.
 * @returns string No. Referensi bila aktif; `null` bila BPJS nonaktif/bermasalah (surat tetap terbit).
 */
export async function issueSpriRef(noKartu: string): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 400));
  return isMembershipActive(noKartu) ? genNoReferensi() : null;
}
