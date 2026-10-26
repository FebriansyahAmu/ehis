// Kontrak konsol outbox SatuSehat (FH3). Dipakai route + FE adapter (import type).

import { z } from "zod";

export const SYNC_STATUS = ["Pending", "Sending", "Acked", "Failed", "Skipped"] as const;

export const OutboxListQuery = z.object({
  status: z.enum(SYNC_STATUS).optional(),
  kunjunganId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const OutboxRunInput = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

export const OutboxIdParam = z.object({ id: z.string().uuid() });
export const KunjunganIdParam = z.object({ kunjunganId: z.string().uuid() });

export interface OutboxItemDTO {
  id: string;
  trigger: string;
  kunjunganId: string | null;
  bundleType: string;
  status: (typeof SYNC_STATUS)[number];
  attempts: number;
  lastError: unknown;
  ihsRefs: unknown;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxRunDTO {
  diproses: number;
  acked: number;
  dijadwalUlang: number;
  failed: number;
  skipped: number;
  dipulihkan: number;
}
