// formulariumService — business rules domain master/FormulariumObat (FLOWS §2).
// Link Obat ⇄ Ruangan (Mapping Hub → Formularium). Tak import prisma langsung (pakai `transaction`
// + DAL). Grant idempoten (pasangan unik). Revoke = hard delete. DTO edge ramping (id + pasangan +
// kode ruangan dari join). `list` ACTOR-LESS → dipanggil langsung Server Component (SSR hybrid,
// API-RULES §6.1). Bentuk persis layananUnitService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/formulariumDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { GrantFormulariumInput, FormulariumQuery, FormulariumEdgeDTO } from "@/lib/schemas/master/formularium";
import type { FormulariumEntity } from "@/lib/dal/master/formulariumDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<FormulariumEntity>;

export function makeFormulariumService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: NonNullEntity): FormulariumEdgeDTO {
    return {
      id: e.id,
      obatId: e.obatId,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge mapping (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: FormulariumQuery): Promise<{ items: FormulariumEdgeDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      obatId: query.obatId,
      locationId: query.locationId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /**
   * Beri formularium: obat masuk formularium di ruangan (idempoten). Guard eksistensi obat +
   * ruangan, lalu kembalikan edge yang sudah ada (created=false) atau buat baru (created=true).
   */
  async function grant(
    input: GrantFormulariumInput,
    _actor: Actor,
  ): Promise<{ edge: FormulariumEdgeDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findObat(input.obatId, tx))) {
        throw Errors.notFound("Obat tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.obatId, input.locationId, tx);
      if (existing) return { edge: toDTO(existing), created: false };

      const row = await dal.create({ obatId: input.obatId, locationId: input.locationId }, tx);
      return { edge: toDTO(row), created: true };
    });
  }

  /** Cabut formularium (hard delete). */
  async function revoke(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Mapping formularium tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, grant, revoke };
}

export const formulariumService = makeFormulariumService();
