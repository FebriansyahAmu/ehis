// tarifLabTestService — business rules domain master/TarifLabTest (FLOWS §2). Mapping Hub → Tarif.
// Edge (labTest × penjaminKode × jenisRuangan) → harga. UPSERT idempoten by triple; remove = hard
// delete. `list` ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1).
// Paralel tarifTindakanService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/tarifLabTestDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { UpsertTarifLabInput, TarifLabQuery, TarifLabTestDTO } from "@/lib/schemas/master/tarifLabTest";
import type { TarifLabListEntity } from "@/lib/dal/master/tarifLabTestDal";

type Dal = typeof defaultDal;

export function makeTarifLabTestService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: TarifLabListEntity): TarifLabTestDTO {
    return {
      id: e.id,
      labTestId: e.labTestId,
      penjaminKode: e.penjaminKode,
      jenisRuangan: e.jenisRuangan,
      harga: e.harga,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge tarif lab (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: TarifLabQuery): Promise<{ items: TarifLabTestDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      labTestId: query.labTestId,
      penjaminKode: query.penjaminKode,
      jenisRuangan: query.jenisRuangan,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Set harga tarif lab (upsert by triple, idempoten). Guard eksistensi lab test. */
  async function upsert(input: UpsertTarifLabInput, _actor: Actor): Promise<TarifLabTestDTO> {
    return transaction(async (tx) => {
      if (!(await dal.findLabTest(input.labTestId, tx))) {
        throw Errors.notFound("Tes laboratorium tidak ditemukan");
      }
      const row = await dal.upsert(
        {
          labTestId: input.labTestId,
          penjaminKode: input.penjaminKode,
          jenisRuangan: input.jenisRuangan,
          harga: input.harga,
        },
        tx,
      );
      return toDTO(row);
    });
  }

  /** Hapus tarif lab (hard delete) → "belum diisi". */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Tarif tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, upsert, remove };
}

export const tarifLabTestService = makeTarifLabTestService();
