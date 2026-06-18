// tarifRadCatalogService — business rules domain master/TarifRadCatalog (FLOWS §2). Mapping Hub → Tarif.
// Edge (radCatalog × penjaminKode × jenisRuangan) → harga. UPSERT idempoten by triple; remove = hard
// delete. `list` ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1).
// Paralel tarifLabTestService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/tarifRadCatalogDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { UpsertTarifRadInput, TarifRadQuery, TarifRadCatalogDTO } from "@/lib/schemas/master/tarifRadCatalog";
import type { TarifRadListEntity } from "@/lib/dal/master/tarifRadCatalogDal";
import { resolveKomponen } from "./tarifKomponen";

type Dal = typeof defaultDal;

export function makeTarifRadCatalogService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: TarifRadListEntity): TarifRadCatalogDTO {
    return {
      id: e.id,
      radCatalogId: e.radCatalogId,
      penjaminKode: e.penjaminKode,
      jenisRuangan: e.jenisRuangan,
      harga: e.harga,
      jasaSarana: e.jasaSarana,
      jasaMedis: e.jasaMedis,
      jasaParamedis: e.jasaParamedis,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge tarif rad (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: TarifRadQuery): Promise<{ items: TarifRadCatalogDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      radCatalogId: query.radCatalogId,
      penjaminKode: query.penjaminKode,
      jenisRuangan: query.jenisRuangan,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /** Set harga tarif rad (upsert by triple, idempoten). Guard eksistensi rad catalog.
   *  Komponen diisi → harga = jumlah komponen (PMK 85); absen → mode total-only (komponen di-null-kan). */
  async function upsert(input: UpsertTarifRadInput, _actor: Actor): Promise<TarifRadCatalogDTO> {
    const k = resolveKomponen(input);
    return transaction(async (tx) => {
      if (!(await dal.findRadCatalog(input.radCatalogId, tx))) {
        throw Errors.notFound("Pemeriksaan radiologi tidak ditemukan");
      }
      const row = await dal.upsert(
        {
          radCatalogId: input.radCatalogId,
          penjaminKode: input.penjaminKode,
          jenisRuangan: input.jenisRuangan,
          ...k,
        },
        tx,
      );
      return toDTO(row);
    });
  }

  /** Hapus tarif rad (hard delete) → "belum diisi". */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Tarif tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, upsert, remove };
}

export const tarifRadCatalogService = makeTarifRadCatalogService();
