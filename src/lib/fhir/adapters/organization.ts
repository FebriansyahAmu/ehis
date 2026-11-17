/**
 * Adapter `master.Organization` (sub-unit RS) → FHIR `Organization` (FH1).
 * Root RS TIDAK dikirim — sudah terdaftar di SatuSehat (Org_id DevHub = SATUSEHAT_ORG_ID).
 * Contoh resmi: docs/fhir-postman/resources/Organization.json.
 */

import { orgIdentifierSystem, type FhirResourceBase } from "../fhirShared";
import { toFhirAddress, type FhirAddress, type LocalAddress } from "./address";

export interface LocalOrganization extends LocalAddress {
  id: string;
  kode: string;
  nama: string;
  orgType: "prov" | "dept" | "dept_clin" | "team";
  active: boolean;
  telp?: string | null;
  email?: string | null;
}

export interface FhirOrganization extends FhirResourceBase {
  resourceType: "Organization";
  active: boolean;
  identifier: { use: "official"; system: string; value: string }[];
  type: { coding: { system: string; code: string; display: string }[] }[];
  name: string;
  telecom?: { system: "phone" | "email"; value: string; use: "work" }[];
  address?: FhirAddress[];
  partOf: { reference: string };
}

const ORG_TYPE_SYSTEM = "http://terminology.hl7.org/CodeSystem/organization-type";

/** OrgType lokal → HL7 organization-type. `dept_clin` tak ada di CodeSystem HL7 → `dept` (FHIR-GAP FG-12). */
const ORG_TYPE: Record<LocalOrganization["orgType"], { code: string; display: string }> = {
  prov: { code: "prov", display: "Healthcare Provider" },
  dept: { code: "dept", display: "Hospital Department" },
  dept_clin: { code: "dept", display: "Hospital Department" },
  team: { code: "team", display: "Organizational team" },
};

export function toFhirOrganization(o: LocalOrganization, ctx: { orgId: string; partOfIhsId: string }): FhirOrganization {
  const telecom = [
    o.telp && { system: "phone" as const, value: o.telp, use: "work" as const },
    o.email && { system: "email" as const, value: o.email, use: "work" as const },
  ].filter((x): x is Exclude<typeof x, "" | null | undefined> => !!x);
  const address = toFhirAddress(o, "work");

  return {
    resourceType: "Organization",
    active: o.active,
    identifier: [{ use: "official", system: orgIdentifierSystem("organization", ctx.orgId), value: o.kode }],
    type: [{ coding: [{ system: ORG_TYPE_SYSTEM, ...ORG_TYPE[o.orgType] }] }],
    name: o.nama,
    ...(telecom.length ? { telecom } : {}),
    ...(address ? { address: [address] } : {}),
    partOf: { reference: `Organization/${ctx.partOfIhsId}` },
  };
}
