// layananUnitRadService — business rules domain master/LayananUnitRad (FLOWS §2).
// Link RadCatalog ⇄ Ruangan (Mapping Hub → Layanan Unit, grup Rad). Grant idempoten (pasangan unik).
// Revoke = hard delete. `list` ACTOR-LESS → Server Component boleh panggil (SSR). Selaras layananUnitLabService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/layananUnitRadDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { GrantLayananRadInput, LayananRadQuery, LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";
import type { LayananRadEntity } from "@/lib/dal/master/layananUnitRadDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<LayananRadEntity>;

export function makeLayananUnitRadService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: NonNullEntity): LayananUnitRadEdgeDTO {
    return {
      id: e.id,
      radCatalogId: e.radCatalogId,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
    };
  }

  /** List/filter edge mapping (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: LayananRadQuery): Promise<{ items: LayananUnitRadEdgeDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      radCatalogId: query.radCatalogId,
      locationId: query.locationId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Beri layanan: pemeriksaan rad boleh dilakukan di ruangan (idempoten). Guard eksistensi. */
  async function grant(
    input: GrantLayananRadInput,
    _actor: Actor,
  ): Promise<{ edge: LayananUnitRadEdgeDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findRadCatalog(input.radCatalogId, tx))) {
        throw Errors.notFound("Pemeriksaan radiologi tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.radCatalogId, input.locationId, tx);
      if (existing) return { edge: toDTO(existing), created: false };

      const row = await dal.create(
        { radCatalogId: input.radCatalogId, locationId: input.locationId },
        tx,
      );
      return { edge: toDTO(row), created: true };
    });
  }

  /** Cabut layanan (hard delete). */
  async function revoke(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Mapping layanan radiologi tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, grant, revoke };
}

export const layananUnitRadService = makeLayananUnitRadService();
