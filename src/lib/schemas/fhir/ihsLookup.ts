// Kontrak GET by Nomor IHS (Playbook SATUSEHAT · API Catalogue Onboarding): `GET /Practitioner/{id}`
// dan `GET /Patient/{id}` — 1 resource (bukan Bundle). Dipakai route + FE (import type).

import { z } from "zod";

export const IHS_LOOKUP_TYPES = ["Practitioner", "Patient"] as const;
export type IhsLookupType = (typeof IHS_LOOKUP_TYPES)[number];

export const IhsLookupInput = z.object({
  resourceType: z.enum(IHS_LOOKUP_TYPES),
  /** Nomor IHS = logical id SatuSehat (Practitioner mis. `10009880728`, Patient mis. `P02478375538`). */
  ihsId: z.string().trim().regex(/^[A-Za-z0-9-]{3,64}$/, "Nomor IHS hanya huruf/angka (3–64 karakter)"),
  /** Data lokal yang sedang dilihat → panggilan tertaut di Log pengiriman + cek kecocokan peta. */
  localId: z.string().uuid().optional(),
});
export type IhsLookupInput = z.infer<typeof IhsLookupInput>;

export interface IhsIdentifierDTO {
  system: string;
  /** NIK/KK/paspor sudah dimasker server. */
  value: string;
}

export interface IhsLookupDTO {
  mode: "mock" | "sandbox" | "prod";
  resourceType: IhsLookupType;
  ihsId: string;
  found: boolean;
  /** HTTP status SatuSehat atau "ERR" (jaringan/timeout). */
  status: string;
  /** Alasan bila tidak ditemukan / gagal. */
  message: string | null;
  durationMs: number;
  ringkas: {
    nama: string | null;
    gender: string | null;
    birthDate: string | null;
    active: boolean | null;
    identifiers: IhsIdentifierDTO[];
    /** Practitioner: kualifikasi (display/code). */
    kualifikasi: string[];
    versionId: string | null;
    lastUpdated: string | null;
  } | null;
  /** Respons SatuSehat apa adanya, identitas pribadi dimasker. */
  resource: unknown;
  /** Data lokal yang terpetakan ke IHS ini di mode aktif (null = belum dipetakan ke data mana pun). */
  lokal: { localId: string; label: string; sub: string | null } | null;
  /** Ada `localId`: true = peta lokal menunjuk IHS ini · false = peta menunjuk IHS lain · null = belum terpetakan. */
  cocok: boolean | null;
}
