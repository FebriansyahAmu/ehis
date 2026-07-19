// tarifAdministrasiService — business rules domain master/TarifAdministrasi (FLOWS §2). Mapping Hub → Tarif Administrasi.
// Edge (unit × penjaminKode) → biaya/kunjungan. UPSERT idempoten by pair; remove = hard delete. `list`
// ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1). Paralel tarifKamarService.

import * as defaultDal from "@/lib/dal/master/tarifAdministrasiDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  UpsertTarifAdministrasiInput, TarifAdministrasiQuery, TarifAdministrasiDTO,
} from "@/lib/schemas/master/tarifAdministrasi";
import type { TarifAdministrasiListEntity } from "@/lib/dal/master/tarifAdministrasiDal";
import { resolveKomponen } from "./tarifKomponen";

type Dal = typeof defaultDal;

export function makeTarifAdministrasiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: TarifAdministrasiListEntity): TarifAdministrasiDTO {
    return {
      id: e.id,
      unit: e.unit,
      penjaminKode: e.penjaminKode,
      harga: e.harga,
      jasaSarana: e.jasaSarana,
      jasaMedis: e.jasaMedis,
      jasaParamedis: e.jasaParamedis,
      noSk: e.noSk,
      tglSk: e.tglSk ? e.tglSk.toISOString().slice(0, 10) : null,
    };
  }

  /** List/filter tarif administrasi (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: TarifAdministrasiQuery): Promise<{ items: TarifAdministrasiDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      unit: query.unit,
      penjaminKode: query.penjaminKode,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Set tarif administrasi (upsert by pair, idempoten). Komponen diisi → harga = jumlah komponen. */
  async function upsert(input: UpsertTarifAdministrasiInput, _actor: Actor): Promise<TarifAdministrasiDTO> {
    const k = resolveKomponen(input);
    const row = await dal.upsert({
      unit: input.unit, penjaminKode: input.penjaminKode, ...k,
      noSk: input.noSk?.trim() || null,
      tglSk: input.tglSk ? new Date(`${input.tglSk}T00:00:00.000Z`) : null,
    });
    return toDTO(row);
  }

  /** Hapus tarif administrasi (hard delete) → "belum diisi". */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Tarif administrasi tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, upsert, remove };
}

export const tarifAdministrasiService = makeTarifAdministrasiService();
