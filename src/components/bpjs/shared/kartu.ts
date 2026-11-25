// No. kartu BPJS bersama modul V-Claim (Monitoring, Rencana Kontrol, …): 13 digit angka.

export const PANJANG_KARTU = 13;

export function validasiKartu(k: string): string | null {
  if (!k) return "Isi No. kartu BPJS peserta";
  if (!/^\d+$/.test(k)) return "No. kartu hanya berisi angka";
  if (k.length !== PANJANG_KARTU) return `No. kartu harus ${PANJANG_KARTU} digit, baru ${k.length}`;
  return null;
}

/** Buang karakter selain angka (tempel "0001 2345 67891" tetap jalan) lalu potong ke 13 digit. */
export function rapikanKartu(v: string): string {
  return v.replace(/\D/g, "").slice(0, PANJANG_KARTU);
}
