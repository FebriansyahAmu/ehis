// formulariumBmhpService — business rules domain master/FormulariumBmhp (FLOWS §2).
// Link BMHP ⇄ Ruangan (Mapping Hub → Ketersediaan Farmasi, sub BMHP). Tak import prisma langsung
// (pakai `transaction` + DAL). Grant idempoten (pasangan unik). Revoke = hard delete. DTO edge
// ramping (id + pasangan + kode ruangan dari join). `list` ACTOR-LESS → dipanggil langsung Server
// Component (SSR hybrid, API-RULES §6.1). Bentuk persis formulariumService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/formulariumBmhpDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  GrantFormulariumBmhpInput, FormulariumBmhpQuery, FormulariumBmhpEdgeDTO,
} from "@/lib/schemas/master/formulariumBmhp";
import type { BmhpTersediaQuery, BmhpTersediaDTO } from "@/lib/schemas/master/bmhpTersedia";
import type { FormulariumBmhpEntity } from "@/lib/dal/master/formulariumBmhpDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<FormulariumBmhpEntity>;

export function makeFormulariumBmhpService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  function toDTO(e: NonNullEntity): FormulariumBmhpEdgeDTO {
    return {
      id: e.id,
      bmhpId: e.bmhpId,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter edge mapping (cursor pagination). ACTOR-LESS → Server Component boleh panggil. */
  async function list(query: FormulariumBmhpQuery): Promise<{ items: FormulariumBmhpEdgeDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      bmhpId: query.bmhpId,
      locationId: query.locationId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /**
   * Katalog BMHP ter-assign untuk konsumsi KLINIS (tab Order BMHP). Agregasi baris edge → 1 DTO
   * per BMHP dgn daftar ruanganKodes. ACTOR-LESS (read murni). Opsional difilter lokasi.
   * DAL sudah membatasi kode "BHP-…" (cegah bocor katalog Obat).
   */
  async function listBmhpTersedia(query: BmhpTersediaQuery): Promise<BmhpTersediaDTO[]> {
    const rows = await dal.listAssignedBmhp({ ruanganKode: query.ruanganKode });
    const byId = new Map<string, BmhpTersediaDTO>();
    for (const r of rows) {
      const b = r.bmhp;
      const existing = byId.get(b.id);
      if (existing) {
        if (!existing.ruanganKodes.includes(r.location.kode)) existing.ruanganKodes.push(r.location.kode);
        continue;
      }
      byId.set(b.id, {
        id: b.id,
        kode: b.kode,
        nama: b.nama,
        merek: b.merek ?? null,
        kategori: b.kategori,
        ukuran: b.ukuran ?? null,
        satuan: b.satuan,
        hargaSatuan: b.hargaSatuan,
        isSteril: b.isSteril,
        isSingleUse: b.isSingleUse,
        ruanganKodes: [r.location.kode],
      });
    }
    return [...byId.values()];
  }

  /**
   * Beri ketersediaan: BMHP masuk daftar standar depo di ruangan (idempoten). Guard eksistensi
   * BMHP + ruangan, lalu kembalikan edge yang sudah ada (created=false) atau buat baru (created=true).
   */
  async function grant(
    input: GrantFormulariumBmhpInput,
    _actor: Actor,
  ): Promise<{ edge: FormulariumBmhpEdgeDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findBmhp(input.bmhpId, tx))) {
        throw Errors.notFound("BMHP tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.bmhpId, input.locationId, tx);
      if (existing) return { edge: toDTO(existing), created: false };

      const row = await dal.create({ bmhpId: input.bmhpId, locationId: input.locationId }, tx);
      return { edge: toDTO(row), created: true };
    });
  }

  /** Cabut ketersediaan (hard delete). */
  async function revoke(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Mapping ketersediaan BMHP tidak ditemukan");
    await dal.deleteById(id);
  }

  return { list, listBmhpTersedia, grant, revoke };
}

export const formulariumBmhpService = makeFormulariumBmhpService();
