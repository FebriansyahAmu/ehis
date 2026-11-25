// Unduh CSV bersama modul BPJS (Monitoring, Rencana Kontrol, …): UTF-8 dengan BOM agar Excel
// membaca huruf non-ASCII, sel aman dari formula injection.

/** Byte order mark UTF-8 (U+FEFF) — ditulis lewat kode agar tidak jadi karakter tak terlihat di sumber. */
const BOM = String.fromCharCode(0xfeff);

/**
 * Sel CSV: diapit kutip ganda. Isi yang diawali = + - @ tab/CR diberi awalan ' agar tidak
 * dijalankan sebagai rumus saat dibuka di spreadsheet (CSV/formula injection — OWASP).
 */
function selCsv(v: string | number | null | undefined): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Unduh CSV UTF-8 (BOM agar Excel membaca huruf non-ASCII). */
export function unduhCsv(baris: readonly (readonly (string | number | null | undefined)[])[], namaBerkas: string): void {
  const isi = BOM + baris.map((r) => r.map(selCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  // Dicabut sesudah unduhan dimulai (mencabut seketika bisa membatalkannya di sebagian peramban).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
