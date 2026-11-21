// GET by Nomor IHS SatuSehat (browser). Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type { IhsIdentifierDTO, IhsLookupDTO, IhsLookupType, IhsMapDTO } from "@/lib/schemas/fhir/ihsLookup";

export type { IhsIdentifierDTO, IhsLookupDTO, IhsLookupType, IhsMapDTO };

/** `GET {resourceType}/{ihsId}` di SatuSehat. `localId` = data lokal yang sedang dilihat (opsional). */
export async function lookupIhs(p: { resourceType: IhsLookupType; ihsId: string; localId?: string }): Promise<IhsLookupDTO> {
  const { data } = await api.post<IhsLookupDTO>("/fhir/ihs-lookup", p);
  return data;
}

/** Petakan manual data lokal → Nomor IHS (KHUSUS mode Sandbox; ditolak server di mode lain). */
export async function mapIhs(p: { resourceType: IhsLookupType; ihsId: string; localId: string }): Promise<IhsMapDTO> {
  const { data } = await api.post<IhsMapDTO>("/fhir/ihs-lookup/map", p);
  return data;
}
