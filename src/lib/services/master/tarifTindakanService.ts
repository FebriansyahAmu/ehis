// tarifTindakanService — business rules domain master/TarifTindakan (FLOWS §2). Mapping Hub → Tarif.
// Edge (tindakan × penjaminKode × jenisRuangan) → harga. UPSERT idempoten by triple; remove = hard
// delete. `list` ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1).
// Selaras layananUnitService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/tarifTindakanDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { UpsertTarifInput, TarifQuery, TarifTindakanDTO } from "@/lib/schemas/master/tarifTindakan";
import type { TarifListEntity } from "@/lib/dal/master/tarifTindakanDal";
import { resolveKomponen } from "./tarifKomponen";

type Dal = typeof defaultDal;

export function makeTarifTindakanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: TarifListEntity): TarifTindakanDTO {
    return {
      id: e.id,
      tindakanId: e.tindakanId,
      penjaminKode: e.penjaminKode,
      jenisRuangan: e.jenisRuangan,
      harga: e.harga,
      jasaSarana: e.jasaSarana,
      jasaMedis: e.jasaMedis,
      jasaParamedis: e.jasaParamedis,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge tarif (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: TarifQuery): Promise<{ items: TarifTindakanDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      tindakanId: query.tindakanId,
      penjaminKode: query.penjaminKode,
      jenisRuangan: query.jenisRuangan,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Set harga tarif (upsert by triple, idempoten). Guard eksistensi tindakan.
   *  Komponen diisi → harga = jumlah komponen (PMK 85); absen → mode total-only (komponen di-null-kan). */
  async function upsert(input: UpsertTarifInput, _actor: Actor): Promise<TarifTindakanDTO> {
    const k = resolveKomponen(input);
    return transaction(async (tx) => {
      if (!(await dal.findTindakan(input.tindakanId, tx))) {
        throw Errors.notFound("Tindakan tidak ditemukan");
      }
      const row = await dal.upsert(
        {
          tindakanId: input.tindakanId,
          penjaminKode: input.penjaminKode,
          jenisRuangan: input.jenisRuangan,
          ...k,
        },
        tx,
      );
      return toDTO(row);
    });
  }

  /** Hapus tarif (hard delete) → "belum diisi". */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Tarif tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, upsert, remove };
}

export const tarifTindakanService = makeTarifTindakanService();
