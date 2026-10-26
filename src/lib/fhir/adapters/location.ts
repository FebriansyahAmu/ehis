/**
 * Adapter `master.Location` (ruangan) → FHIR `Location` (FH1). physicalType = room (`ro`).
 * Alamat: warisi Organization induk kecuali `overrideAlamat` (konvensi master Ruangan).
 * Bed (physicalType `bd`, partOf ruangan) ditunda — FHIR-GAP FG-13.
 * Contoh resmi: docs/fhir-postman/resources/Location.json.
 */

import { orgIdentifierSystem, type FhirResourceBase } from "../fhirShared";
import { toFhirAddress, type FhirAddress, type LocalAddress } from "./address";

export interface LocalLocation extends LocalAddress {
  id: string;
  kode: string;
  nama: string;
  locationType: string;
  kelas: string | null;
  active: boolean;
  overrideAlamat: boolean;
  gpsLat?: number | null;
  gpsLng?: number | null;
}

export interface FhirLocation extends FhirResourceBase {
  resourceType: "Location";
  identifier: { system: string; value: string }[];
  status: "active" | "inactive";
  name: string;
  description?: string;
  mode: "instance";
  address?: FhirAddress;
  physicalType: { coding: { system: string; code: string; display: string }[] };
  position?: { longitude: number; latitude: number; altitude: number };
  managingOrganization: { reference: string };
}

const PHYSICAL_TYPE_SYSTEM = "http://terminology.hl7.org/CodeSystem/location-physical-type";

const TYPE_LABEL: Record<string, string> = {
  Rawat_Inap: "Rawat Inap", Rawat_Jalan: "Rawat Jalan", ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
  IGD: "IGD", OK: "Kamar Operasi", Penunjang: "Penunjang", Laboratorium: "Laboratorium",
  Radiologi: "Radiologi", Farmasi: "Farmasi", Gudang_Farmasi: "Gudang Farmasi", Gudang: "Gudang",
};

export function toFhirLocation(
  l: LocalLocation,
  ctx: { orgId: string; managingOrgIhsId: string; parentAddress: LocalAddress; parentGps?: { lat?: number | null; lng?: number | null } },
): FhirLocation {
  const address = toFhirAddress(l.overrideAlamat ? l : ctx.parentAddress, "work");
  const lat = l.gpsLat ?? ctx.parentGps?.lat;
  const lng = l.gpsLng ?? ctx.parentGps?.lng;
  const kelas = l.kelas ? ` · ${l.kelas.replace("_", " ")}` : "";

  return {
    resourceType: "Location",
    identifier: [{ system: orgIdentifierSystem("location", ctx.orgId), value: l.kode }],
    status: l.active ? "active" : "inactive",
    name: l.nama,
    description: `${TYPE_LABEL[l.locationType] ?? l.locationType}${kelas} — ${l.nama}`,
    mode: "instance",
    ...(address ? { address } : {}),
    physicalType: { coding: [{ system: PHYSICAL_TYPE_SYSTEM, code: "ro", display: "Room" }] },
    // Catatan: contoh Postman resmi menukar lat/long; di sini sesuai spesifikasi FHIR (FG-14).
    ...(lat != null && lng != null ? { position: { longitude: lng, latitude: lat, altitude: 0 } } : {}),
    managingOrganization: { reference: `Organization/${ctx.managingOrgIhsId}` },
  };
}
