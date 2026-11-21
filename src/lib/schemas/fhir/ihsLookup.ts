// Kontrak GET by Nomor IHS (Playbook SATUSEHAT · API Catalogue Onboarding): `GET /Practitioner/{id}`
// dan `GET /Patient/{id}` — 1 resource (bukan Bundle). Dipakai route + FE (import type).

import { z } from "zod";

export const IHS_LOOKUP_TYPES = ["Practitioner", "Patient"] as const;
export type IhsLookupType = (typeof IHS_LOOKUP_TYPES)[number];

/** Nomor IHS = logical id SatuSehat (Practitioner mis. `10009880728`, Patient mis. `P02478375538`). */
const IhsId = z.string().trim().regex(/^[A-Za-z0-9-]{3,64}$/, "Nomor IHS hanya huruf/angka (3–64 karakter)");

export const IhsLookupInput = z.object({
  resourceType: z.enum(IHS_LOOKUP_TYPES),
  ihsId: IhsId,
  /** Data lokal yang sedang dilihat → panggilan tertaut di Log pengiriman + cek kecocokan peta. */
  localId: z.string().uuid().optional(),
});
export type IhsLookupInput = z.infer<typeof IhsLookupInput>;

/**
 * Petakan manual data lokal → Nomor IHS. KHUSUS mode Sandbox: NIK data asli RS tak ada di Sandbox,
 * padahal resource lain (Encounter, dst.) butuh referensi Practitioner/Patient yang valid. Di produksi
 * IHS hanya dari pencocokan NIK (Cari IHS) — server menolak di luar Sandbox.
 */
export const IhsMapInput = z.object({
  resourceType: z.enum(IHS_LOOKUP_TYPES),
  ihsId: IhsId,
  localId: z.string().uuid(),
});
export type IhsMapInput = z.infer<typeof IhsMapInput>;

export interface IhsLocalRefDTO {
  localId: string;
  label: string;
  sub: string | null;
}

export interface IhsMapDTO {
  mode: "mock" | "sandbox" | "prod";
  resourceType: IhsLookupType;
  ihsId: string;
  /** Data yang dipetakan (label untuk catatan kecocokan). */
  lokal: IhsLocalRefDTO;
  /** IHS yang dipetakan sebelumnya (null = belum pernah terpetakan; sama dengan `ihsId` = tak berubah). */
  sebelumnya: string | null;
  /** Data lokal LAIN yang juga memakai IHS ini (Sandbox boleh dipakai bersama). */
  dipakaiJuga: IhsLocalRefDTO | null;
  lastSyncAt: string;
}

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
  lokal: IhsLocalRefDTO | null;
  /** Ada `localId`: true = peta lokal menunjuk IHS ini · false = peta menunjuk IHS lain · null = belum terpetakan. */
  cocok: boolean | null;
  /** Ada `localId`: IHS yang saat ini terpetakan ke data tsb (null = belum terpetakan). */
  ihsTerpetakan: string | null;
}
