// dischargeChecklistService — Discharge Planning step 3: Checklist Kesiapan H-1 (SNARS ARK 3).
// Simpan = append baris baru (latest-wins per kunjungan; jejak revisi utuh); get = revisi
// terkini atau null. items JSONB = snapshot Zod-validated (bentuk terjamin saat tulis →
// read cast aman). pencatat = nama actor (user login). RBAC clinical.rekammedis di Route;
// ABAC careUnit di route() choke-point. Selaras dischargeAsesmenService.

import * as defaultDal from "@/lib/dal/discharge/dischargeChecklistDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { Prisma } from "@/generated/prisma/client";
import type { DischargeChecklistEntity } from "@/lib/dal/discharge/dischargeChecklistDal";
import {
  type DischargeChecklistInput, type DischargeChecklistDTO, type ChecklistItemInput,
} from "@/lib/schemas/discharge/dischargeChecklist";

type Dal = typeof defaultDal;

function toDTO(e: DischargeChecklistEntity): DischargeChecklistDTO {
  return {
    items: (e.items ?? []) as unknown as ChecklistItemInput[], // JSONB ditulis via Zod → bentuk terjamin
    catatanKhusus: e.catatanKhusus,
    pencatat: e.pencatat,
    updatedAt: e.createdAt.toISOString(),
  };
}

export function makeDischargeChecklistService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Revisi terkini (null = belum pernah diisi). */
  async function get(kunjunganId: string, _actor: Actor): Promise<DischargeChecklistDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latest(kunjunganId);
    return row ? toDTO(row) : null;
  }

  /** Simpan checklist (append latest-wins; draft parsial sah). */
  async function save(
    kunjunganId: string, input: DischargeChecklistInput, actor: Actor,
  ): Promise<DischargeChecklistDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      items: input.items as unknown as Prisma.InputJsonValue,
      catatanKhusus: input.catatanKhusus,
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { get, save };
}

export const dischargeChecklistService = makeDischargeChecklistService();
