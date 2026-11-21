// GET by Nomor IHS SatuSehat (browser). Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type { IhsIdentifierDTO, IhsLookupDTO, IhsLookupType } from "@/lib/schemas/fhir/ihsLookup";

export type { IhsIdentifierDTO, IhsLookupDTO, IhsLookupType };

/** `GET {resourceType}/{ihsId}` di SatuSehat. `localId` = data lokal yang sedang dilihat (opsional). */
export async function lookupIhs(p: { resourceType: IhsLookupType; ihsId: string; localId?: string }): Promise<IhsLookupDTO> {
  const { data } = await api.post<IhsLookupDTO>("/fhir/ihs-lookup", p);
  return data;
}
