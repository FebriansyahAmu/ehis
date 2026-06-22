// layananUnitRadService — business rules domain master/LayananUnitRad (FLOWS §2).
// Link RadCatalog ⇄ Ruangan (Mapping Hub → Layanan Unit, grup Rad). Grant idempoten (pasangan unik).
// Revoke = hard delete. `list` ACTOR-LESS → Server Component boleh panggil (SSR). Selaras layananUnitLabService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/master/layananUnitRadDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { GrantLayananRadInput, LayananRadQuery, LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";
import type { RadCatalogTersediaQuery, RadCatalogTersediaDTO } from "@/lib/schemas/master/radCatalogTersedia";
import type { RadModalitasDTO, RadRegionDTO, RadKategoriDTO } from "@/lib/schemas/master/radCatalog";
import type { LayananRadEntity } from "@/lib/dal/master/layananUnitRadDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<LayananRadEntity>;

// ── Format blok JSONB → ramah-tampil (selaras helper FE lama OrderRadTab) ──────
/** TAT rutin (menit) → string human-readable (mis. "30 mnt", "1 jam", "1–2 jam"). */
function formatTAT(menit: number | undefined): string | null {
  if (!menit || menit <= 0) return null;
  if (menit < 60) return `${menit} mnt`;
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa === 0 ? `${jam} jam` : `${jam}–${jam + 1} jam`;
}

/** Ringkas persiapan pasien (puasa + premedikasi + instruksi) → 1 kalimat, atau null. */
function summarizePersiapan(p: { puasaJam?: number; premedikasi?: string; instruksiPasien?: string } | null): string | null {
  if (!p) return null;
  const parts: string[] = [];
  if (p.puasaJam) parts.push(`Puasa ${p.puasaJam} jam`);
  if (p.premedikasi) parts.push(p.premedikasi);
  if (p.instruksiPasien) parts.push(p.instruksiPasien);
  return parts.length > 0 ? parts.join(", ") : null;
}

type TatJson = { cito?: number; semiCito?: number; rutin?: number };
type PersiapanJson = { puasaJam?: number; premedikasi?: string; instruksiPasien?: string };

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

  /**
   * Katalog pemeriksaan radiologi ter-assign untuk konsumsi KLINIS (tab Order Radiologi). Agregasi
   * baris edge → 1 DTO per pemeriksaan dgn daftar ruanganKodes (ruangan radiologi). ACTOR-LESS (read
   * murni). Opsional difilter ruangan; harga ter-resolve bila (penjaminKode, jenisRuangan) lengkap.
   * Blok JSONB (TAT/persiapan) di-format ke string ramah-tampil di sini.
   */
  async function listRadCatalogTersedia(query: RadCatalogTersediaQuery): Promise<RadCatalogTersediaDTO[]> {
    const rows = await dal.listAssignedRadCatalog({
      ruanganKode: query.ruanganKode,
      penjaminKode: query.penjaminKode,
      jenisRuangan: query.jenisRuangan,
    });
    const byId = new Map<string, RadCatalogTersediaDTO>();
    for (const r of rows) {
      const c = r.radCatalog;
      const existing = byId.get(c.id);
      if (existing) {
        if (!existing.ruanganKodes.includes(r.location.kode)) existing.ruanganKodes.push(r.location.kode);
        continue;
      }
      const tat = (c.tatTarget ?? null) as TatJson | null;
      const persiapan = (c.persiapan ?? null) as PersiapanJson | null;
      byId.set(c.id, {
        id: c.id,
        kode: c.kode,
        nama: c.nama,
        modalitas: c.modalitas as RadModalitasDTO,
        modalitasSubtype: c.modalitasSubtype ?? null,
        region: c.region as RadRegionDTO,
        kategori: c.kategori as RadKategoriDTO,
        waktuTunggu: formatTAT(tat?.rutin),
        persiapan: summarizePersiapan(persiapan),
        ruanganKodes: [r.location.kode],
        harga: c.tarif[0]?.harga ?? null,
      });
    }
    return [...byId.values()];
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

  return { list, listRadCatalogTersedia, grant, revoke };
}

export const layananUnitRadService = makeLayananUnitRadService();
