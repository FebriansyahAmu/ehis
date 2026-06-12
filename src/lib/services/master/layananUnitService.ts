// layananUnitService — business rules domain master/LayananUnit (FLOWS §2).
// Link Tindakan ⇄ Ruangan (Mapping Hub → Layanan Unit). Tak import prisma langsung (pakai
// `transaction` + DAL). Grant idempoten (pasangan unik). Revoke = hard delete. DTO edge ramping
// (id + pasangan + kode ruangan dari join). `list` ACTOR-LESS → dipanggil langsung oleh Server
// Component (SSR hybrid, API-RULES §6.1). Selaras penugasanRuanganService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/layananUnitDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { GrantLayananInput, LayananQuery, LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";
import type { TindakanTersediaQuery, TindakanTersediaDTO } from "@/lib/schemas/master/tindakanTersedia";
import type { LayananEntity } from "@/lib/dal/master/layananUnitDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<LayananEntity>;

export function makeLayananUnitService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: NonNullEntity): LayananUnitEdgeDTO {
    return {
      id: e.id,
      tindakanId: e.tindakanId,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge mapping (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: LayananQuery): Promise<{ items: LayananUnitEdgeDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      tindakanId: query.tindakanId,
      locationId: query.locationId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /**
   * Katalog tindakan ter-assign untuk konsumsi KLINIS (rekam medis tab Tindakan). Agregasi
   * baris edge → 1 DTO per tindakan dgn daftar ruanganKodes. ACTOR-LESS (read murni). Lab/Rad
   * tidak termuat (bukan entri LayananUnit). Opsional difilter ruangan.
   */
  async function listTindakanTersedia(query: TindakanTersediaQuery): Promise<TindakanTersediaDTO[]> {
    const rows = await dal.listAssignedTindakan({ ruanganKode: query.ruanganKode });
    const byId = new Map<string, TindakanTersediaDTO>();
    for (const r of rows) {
      const t = r.tindakan;
      const existing = byId.get(t.id);
      if (existing) {
        if (!existing.ruanganKodes.includes(r.location.kode)) existing.ruanganKodes.push(r.location.kode);
        continue;
      }
      byId.set(t.id, {
        id: t.id,
        kode: t.kode,
        nama: t.nama,
        kategori: t.kategori,
        kompleksitas: t.kompleksitas ?? null,
        ruanganKodes: [r.location.kode],
      });
    }
    return [...byId.values()];
  }

  /**
   * Beri layanan: tindakan boleh dilakukan di ruangan (idempoten). Guard eksistensi tindakan +
   * ruangan, lalu kembalikan edge yang sudah ada (created=false) atau buat baru (created=true).
   */
  async function grant(
    input: GrantLayananInput,
    _actor: Actor,
  ): Promise<{ edge: LayananUnitEdgeDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findTindakan(input.tindakanId, tx))) {
        throw Errors.notFound("Tindakan tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.tindakanId, input.locationId, tx);
      if (existing) return { edge: toDTO(existing), created: false };

      const row = await dal.create(
        { tindakanId: input.tindakanId, locationId: input.locationId },
        tx,
      );
      return { edge: toDTO(row), created: true };
    });
  }

  /** Cabut layanan (hard delete). */
  async function revoke(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Mapping layanan tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, listTindakanTersedia, grant, revoke };
}

export const layananUnitService = makeLayananUnitService();
