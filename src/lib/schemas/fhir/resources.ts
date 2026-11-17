// Kontrak konsol Resource & Kunjungan SatuSehat (FH9b). Dipakai route + FE (import type).

import { z } from "zod";
import type { Issue } from "@/lib/fhir/links/types";

export const KUNJUNGAN_SYNC_FILTER = ["terkirim", "belum", "gagal", "antre"] as const;
export const KUNJUNGAN_UNIT = ["IGD", "RawatJalan", "RawatInap"] as const;

export const ResourceListQuery = z.object({
  type: z.string().trim().min(1).max(40),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export const ResourceIdParam = z.object({ id: z.string().uuid() });

export const EncounterListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  unit: z.enum(KUNJUNGAN_UNIT).optional(),
  sync: z.enum(KUNJUNGAN_SYNC_FILTER).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** synced = payload identik dgn yang diterima SatuSehat (hash sama) · changed = akan di-PUT · new = belum pernah terkirim. */
export type PayloadStatus = "synced" | "changed" | "new";

export interface ResourceTypeSummaryDTO {
  resourceType: string;
  count: number;
  lastSyncAt: string | null;
}

export interface ResourceSummaryDTO {
  mode: string;
  total: number;
  types: ResourceTypeSummaryDTO[];
}

export interface ResourceRowDTO {
  id: string;
  resourceType: string;
  localType: string;
  localId: string;
  ihsId: string;
  versionId: string | null;
  lastSyncAt: string;
  kunjunganId: string | null;
  /** Nama tampil (pasien/nakes/unit/ruangan) atau no. kunjungan untuk resource klinis. */
  label: string | null;
  sub: string | null;
}

export interface ResourcePageDTO {
  rows: ResourceRowDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ResourceDetailDTO extends ResourceRowDTO {
  hash: string | null;
  /** Payload dibangun ulang dari data terkini (tak disimpan — R14). null = tak ada payload (resolve-only/root). */
  payload: unknown;
  payloadStatus: PayloadStatus | null;
  payloadNote: string | null;
}

export interface EncounterListRowDTO {
  id: string;
  noKunjungan: string;
  unit: string;
  status: string;
  waktuKunjungan: string;
  pasienNama: string;
  noRm: string;
  encounterIhsId: string | null;
  lastSyncAt: string | null;
  resourceCount: number;
  jobStatus: string | null;
  jobAt: string | null;
  jobError: string | null;
}

export interface EncounterPageDTO {
  rows: EncounterListRowDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EncounterResourceDTO {
  localType: string;
  localId: string;
  resourceType: string;
  status: PayloadStatus;
  ihsId: string | null;
  versionId: string | null;
  lastSyncAt: string | null;
  payload: unknown;
}

export interface EncounterJobDTO {
  id: string;
  trigger: string;
  status: string;
  attempts: number;
  lastError: unknown;
  ihsRefs: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface EncounterDetailDTO {
  mode: string;
  kunjungan: {
    id: string;
    noKunjungan: string;
    unit: string;
    status: string;
    waktuKunjungan: string;
    dilayaniAt: string | null;
    selesaiAt: string | null;
    dpjp: string | null;
    ruangan: string | null;
    pasien: { id: string; nama: string; noRm: string; gender: string | null; tanggalLahir: string | null; ihsId: string | null };
  };
  encounterIhsId: string | null;
  /** Status Encounter tujuan (in-progress/finished/cancelled); null = belum layak dikirim. */
  target: string | null;
  skipReason: string | null;
  blockers: string[];
  infos: string[];
  /** Teks ringkas item ditahan (= issues[].message) — dipertahankan untuk kompatibilitas. */
  notes: string[];
  /** Item ditahan gerbang readiness per link (FLOW.md §4) — dipakai panel "Data ditahan" (FG-91). */
  issues: Issue[];
  resources: EncounterResourceDTO[];
  /** Terpetakan di SatuSehat tapi tak lagi dibangun dari data terkini (sumber dihapus/diganti). */
  orphans: ResourceRowDTO[];
  jobs: EncounterJobDTO[];
  counts: Record<PayloadStatus, number>;
}
