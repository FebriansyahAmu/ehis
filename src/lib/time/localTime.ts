// Helper tampilan sisi klien: instan nyata (ISO dari server) → tanggal kalender LOKAL browser.
// Petugas RS memakai perangkat berzona RS, jadi lokal = zona RS. Jangan `iso.slice(0, 10)`:
// itu tanggal UTC dan mundur sehari untuk jam 00:00–06:59 WIB (07:59 WITA, 08:59 WIT).

const pad2 = (n: number) => String(n).padStart(2, "0");

/** ISO instan → nilai DateTimePicker "YYYY-MM-DDTHH:mm" lokal (bukan `iso.slice(0, 16)` = jam UTC). */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${localYmd(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** ISO / Date → "YYYY-MM-DD" lokal; teks tanggal-saja dikembalikan apa adanya; tak valid → "". */
export function localYmd(input: string | Date): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
