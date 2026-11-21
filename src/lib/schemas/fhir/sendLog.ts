// Kontrak log pengiriman SatuSehat per data (konsol /ehis-fhir). Dipakai route + FE (import type).

import { z } from "zod";

export const SendLogQuery = z.object({
  /** Organization · Location · Practitioner · Patient · Encounter · Condition · … */
  localType: z.string().trim().regex(/^[A-Za-z]{2,40}$/, "localType tidak valid"),
  /** PK lokal; resource klinis bisa komposit (mis. `<ttvId>:<key>`). */
  localId: z.string().trim().min(1).max(200),
  /** Resource klinis per kunjungan → ikutkan Bundle transaction yang memuatnya. */
  kunjunganId: z.string().uuid().optional(),
  /** Keyset opaque dari halaman sebelumnya. */
  cursor: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type SendLogQuery = z.infer<typeof SendLogQuery>;

export const SendLogIdParam = z.object({ id: z.string().uuid() });

export const SendLogDetailQuery = z.object({
  /** Data yang sedang dilihat → nomor entry-nya bila panggilan berupa Bundle. */
  localType: z.string().trim().regex(/^[A-Za-z]{2,40}$/).optional(),
  localId: z.string().trim().min(1).max(200).optional(),
});

export interface SendLogRowDTO {
  id: string;
  startedAt: string;
  method: string;
  target: string;
  /** Template tanpa nilai, mis. `Location?identifier={system}|{kode}`. */
  endpoint: string;
  /** Path nyata (NIK dimasker); null = log sebelum fitur ini. */
  path: string | null;
  resourceType: string | null;
  ihsId: string | null;
  /** HTTP status atau "ERR". */
  status: string;
  success: boolean;
  durationMs: number;
  errorType: string | null;
  retryCount: number;
  actor: string;
  actorNama: string | null;
  /** Panggilan berupa Bundle transaction kunjungan (data ini salah satu entry-nya). */
  viaBundle: boolean;
  /** Nomor entry data ini di Bundle (1-based). */
  entryIndex: number | null;
  entryCount: number | null;
  /** Isi request/response masih tersimpan (false = dipangkas retensi / log lama / tak dicatat). */
  hasBody: boolean;
}

export interface SendLogPageDTO {
  mode: string;
  rows: SendLogRowDTO[];
  nextCursor: string | null;
  /** Total panggilan — hanya dikirim di halaman pertama (tanpa cursor). */
  total: number | null;
  /** Hari simpan isi request/response (0 = tidak disimpan). */
  retensiHari: number;
}

export interface SendLogDetailDTO extends SendLogRowDTO {
  mode: string;
  localType: string | null;
  localId: string | null;
  kunjunganId: string | null;
  request: { body: unknown; bytes: number | null };
  response: { body: unknown; bytes: number | null };
  /** Body melebihi batas simpan → disimpan terpotong sebagai teks. */
  truncated: boolean;
}
