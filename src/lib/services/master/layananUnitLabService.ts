// layananUnitLabService — business rules domain master/LayananUnitLab (FLOWS §2).
// Link LabTest ⇄ Ruangan (Mapping Hub → Layanan Unit, grup Lab). Tak import prisma langsung
// (pakai `transaction` + DAL). Grant idempoten (pasangan unik). Revoke = hard delete. DTO edge
// ramping (id + pasangan + kode ruangan dari join). `list` ACTOR-LESS → dipanggil langsung oleh
// Server Component (SSR hybrid, API-RULES §6.1). Selaras layananUnitService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/layananUnitLabDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { GrantLayananLabInput, LayananLabQuery, LayananUnitLabEdgeDTO } from "@/lib/schemas/master/layananUnitLab";
import type { LayananLabEntity } from "@/lib/dal/master/layananUnitLabDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<LayananLabEntity>;

export function makeLayananUnitLabService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: NonNullEntity): LayananUnitLabEdgeDTO {
    return {
      id: e.id,
      labTestId: e.labTestId,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge mapping (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: LayananLabQuery): Promise<{ items: LayananUnitLabEdgeDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      labTestId: query.labTestId,
      locationId: query.locationId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /**
   * Beri layanan: tes lab boleh dikerjakan di ruangan (idempoten). Guard eksistensi tes + ruangan,
   * lalu kembalikan edge yang sudah ada (created=false) atau buat baru (created=true).
   */
  async function grant(
    input: GrantLayananLabInput,
    _actor: Actor,
  ): Promise<{ edge: LayananUnitLabEdgeDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findLabTest(input.labTestId, tx))) {
        throw Errors.notFound("Tes lab tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.labTestId, input.locationId, tx);
      if (existing) return { edge: toDTO(existing), created: false };

      const row = await dal.create(
        { labTestId: input.labTestId, locationId: input.locationId },
        tx,
      );
      return { edge: toDTO(row), created: true };
    });
  }

  /** Cabut layanan (hard delete). */
  async function revoke(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Mapping layanan lab tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, grant, revoke };
}

export const layananUnitLabService = makeLayananUnitLabService();
