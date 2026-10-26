/**
 * Validasi terminologi LOKAL (R12 — SatuSehat tak punya terminology server yang bisa di-query).
 * Aman dipakai client & server (tanpa dependensi). Dipakai Zod master + form katalog.
 */

/** Format kode LOINC: 1–7 digit, tanda hubung, 1 check digit (mis. `718-7`). */
export const LOINC_PATTERN = /^\d{1,7}-\d$/;

/**
 * Validasi check digit LOINC (Mod 10, algoritma resmi Regenstrief — setara Luhn dengan digit
 * paling kanan digandakan). Contoh: `718-7` Hemoglobin, `2345-7` Glukosa serum/plasma.
 */
export function isValidLoinc(code: string): boolean {
  const c = code.trim();
  if (!LOINC_PATTERN.test(c)) return false;
  const [body, check] = c.split("-");
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let d = Number(body[body.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === Number(check);
}

export type LoincCheck = "empty" | "format" | "checkdigit" | "valid";

/** Status validasi untuk UI (badge live). */
export function checkLoinc(code: string | null | undefined): LoincCheck {
  const c = (code ?? "").trim();
  if (!c) return "empty";
  if (!LOINC_PATTERN.test(c)) return "format";
  return isValidLoinc(c) ? "valid" : "checkdigit";
}
