/**
 * Adapter alamat lokal → FHIR `Address` + extension `administrativeCode` SatuSehat.
 * Kode wilayah = Kemendagri FLAT (tanpa titik): province 2 · city 4 · district 6 · village 10 digit.
 * Level yang kosong diturunkan dari kode paling spesifik yang ada (mis. hanya kelurahan terisi).
 */

export const ADMINISTRATIVE_CODE_URL = "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode";

export interface LocalAddress {
  alamat?: string | null;
  rtRw?: string | null;
  kodePos?: string | null;
  kotaNama?: string | null;
  provinsiKode?: string | null;
  kotaKode?: string | null;
  kecamatanKode?: string | null;
  kelurahanKode?: string | null;
}

export interface FhirAddress {
  use?: "home" | "work";
  type?: "both" | "physical" | "postal";
  line?: string[];
  city?: string;
  postalCode?: string;
  country: "ID";
  extension?: { url: string; extension: { url: string; valueCode: string }[] }[];
}

const digits = (v?: string | null) => (v ?? "").replace(/\D/g, "");

/** Kode wilayah per level dari isian lokal (dotted/flat). Kosong bila tak ada sumber. */
export function administrativeCodes(a: LocalAddress): { province?: string; city?: string; district?: string; village?: string } {
  const village = digits(a.kelurahanKode);
  const district = digits(a.kecamatanKode) || village.slice(0, 6);
  const city = digits(a.kotaKode) || district.slice(0, 4);
  const province = digits(a.provinsiKode) || city.slice(0, 2);
  return {
    province: province.length === 2 ? province : undefined,
    city: city.length === 4 ? city : undefined,
    district: district.length === 6 ? district : undefined,
    village: village.length === 10 ? village : undefined,
  };
}

/** `rt/rw` "001/002" → { rt: "1", rw: "2" }. */
function rtRw(v?: string | null): { rt?: string; rw?: string } {
  const [rt, rw] = (v ?? "").split(/[\/\-\s]+/).map((x) => digits(x).replace(/^0+(?=\d)/, ""));
  return { rt: rt || undefined, rw: rw || undefined };
}

export function toFhirAddress(a: LocalAddress, use: "home" | "work" = "work"): FhirAddress | undefined {
  const codes = administrativeCodes(a);
  const { rt, rw } = rtRw(a.rtRw);
  const ext = [
    codes.province && { url: "province", valueCode: codes.province },
    codes.city && { url: "city", valueCode: codes.city },
    codes.district && { url: "district", valueCode: codes.district },
    codes.village && { url: "village", valueCode: codes.village },
    rt && { url: "rt", valueCode: rt },
    rw && { url: "rw", valueCode: rw },
  ].filter((x): x is { url: string; valueCode: string } => !!x);

  if (!a.alamat && ext.length === 0) return undefined;
  return {
    use,
    ...(use === "work" ? { type: "both" as const } : {}),
    ...(a.alamat ? { line: [a.alamat] } : {}),
    ...(a.kotaNama ? { city: a.kotaNama } : {}),
    ...(a.kodePos ? { postalCode: a.kodePos } : {}),
    country: "ID",
    ...(ext.length ? { extension: [{ url: ADMINISTRATIVE_CODE_URL, extension: ext }] } : {}),
  };
}
