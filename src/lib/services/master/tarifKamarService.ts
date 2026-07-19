// tarifKamarService — business rules domain master/TarifKamar (FLOWS §2). Mapping Hub → Tarif Ruang Rawat.
// Edge (kelas × penjaminKode) → harga/hari. UPSERT idempoten by pair; remove = hard delete. `list`
// ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1). Paralel tarifLabTestService.

import * as defaultDal from "@/lib/dal/master/tarifKamarDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { UpsertTarifKamarInput, TarifKamarQuery, TarifKamarDTO } from "@/lib/schemas/master/tarifKamar";
import type { TarifKamarListEntity } from "@/lib/dal/master/tarifKamarDal";
import { resolveKomponen } from "./tarifKomponen";

type Dal = typeof defaultDal;

export function makeTarifKamarService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: TarifKamarListEntity): TarifKamarDTO {
    return {
      id: e.id,
      kelas: e.kelas,
      penjaminKode: e.penjaminKode,
      harga: e.harga,
      jasaSarana: e.jasaSarana,
      jasaMedis: e.jasaMedis,
      jasaParamedis: e.jasaParamedis,
      noSk: e.noSk,
      tglSk: e.tglSk ? e.tglSk.toISOString().slice(0, 10) : null,
    };
  }

  /** List/filter tarif kamar (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: TarifKamarQuery): Promise<{ items: TarifKamarDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      kelas: query.kelas,
      penjaminKode: query.penjaminKode,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Set tarif kamar (upsert by pair, idempoten). Komponen diisi → harga = jumlah komponen (PMK 85);
   *  absen → mode total-only (komponen di-null-kan). */
  async function upsert(input: UpsertTarifKamarInput, _actor: Actor): Promise<TarifKamarDTO> {
    const k = resolveKomponen(input);
    const row = await dal.upsert({
      kelas: input.kelas, penjaminKode: input.penjaminKode, ...k,
      noSk: input.noSk?.trim() || null,
      tglSk: input.tglSk ? new Date(`${input.tglSk}T00:00:00.000Z`) : null,
    });
    return toDTO(row);
  }

  /** Hapus tarif kamar (hard delete) → "belum diisi". */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Tarif kamar tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, upsert, remove };
}

export const tarifKamarService = makeTarifKamarService();
