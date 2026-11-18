// Accession Number (ACSN) radiologi — murni (tanpa I/O), dipakai radOrderService + test.
// Format `R<YYMMDD><seq>`: tanggal order WIB (UTC+7, tanpa DST) + urutan harian ≥4 digit.
// Batas DICOM Accession Number (0008,0050) = VR SH, maks 16 karakter → format ini ≤12 karakter
// sampai 99.999 pemeriksaan/hari. Sumber: contoh resmi SatuSehat ServiceRequest rad (identifier
// type v2-0203 `ACSN`, system `http://sys-ids.kemkes.go.id/acsn/{Org_id}`), FHIR L17.

export const ACSN_MAX_LEN = 16;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Scope counter harian, mis. `R261118` (tanggal WIB dari `at`). */
export function acsnScope(at: Date): string {
  const wib = new Date(at.getTime() + WIB_OFFSET_MS);
  const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(wib.getUTCDate()).padStart(2, "0");
  return `R${yy}${mm}${dd}`;
}

/** Nomor ACSN dari scope + urutan, mis. `R2611180007`. */
export function formatAcsn(scope: string, seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) throw new RangeError("Urutan ACSN harus bilangan bulat ≥ 1");
  const acsn = `${scope}${String(seq).padStart(4, "0")}`;
  if (acsn.length > ACSN_MAX_LEN) throw new RangeError(`ACSN melebihi ${ACSN_MAX_LEN} karakter (batas DICOM)`);
  return acsn;
}

/** ACSN sah = pola EHIS + panjang ≤16 (dipakai gerbang FHIR sebelum ServiceRequest rad dikirim). */
export function isAcsnValid(v: string | null | undefined): v is string {
  return !!v && v.length <= ACSN_MAX_LEN && /^R\d{10,}$/.test(v);
}
