// Kunci kirim per kunjungan (dalam proses). Job Bundle (outbox worker) dan kirim per resource dari
// konsol sama-sama membaca ResourceMap lalu POST; bila berjalan bersamaan untuk kunjungan yang sama,
// resource yang sama bisa terkirim dua kali (data ganda di SatuSehat). EHIS = satu proses Node
// (runner `src/instrumentation.ts`), jadi kunci di memori cukup.

import "server-only";

const locked = new Set<string>();

/** true = kunci didapat; false = kunjungan ini sedang dikirim oleh proses lain. */
export function tryLockKunjungan(kunjunganId: string): boolean {
  if (locked.has(kunjunganId)) return false;
  locked.add(kunjunganId);
  return true;
}

export function unlockKunjungan(kunjunganId: string): void {
  locked.delete(kunjunganId);
}
