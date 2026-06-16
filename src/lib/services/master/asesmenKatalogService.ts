// asesmenKatalogService — business master Asesmen Katalog + map entity→DTO (mirror AsesmenItem FE).
// Kode `<PREFIX>-NNN` AUTO-GEN per kategori (counter atomik, dalam transaksi) — prefix dari
// KATEGORI_PREFIX. Katalog leaf (tanpa version). RBAC master.katalog di Route. list ACTOR-LESS
// (SSR-safe, API-RULES §6.1). Pola identik skalaService/sdkiService.

import * as defaultDal from "@/lib/dal/master/asesmenKatalogDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenEntity, AsesmenData, AsesmenPatch } from "@/lib/dal/master/asesmenKatalogDal";
import {
  KATEGORI_PREFIX,
  type CreateAsesmenInput, type UpdateAsesmenInput, type AsesmenQuery,
  type AsesmenItemDTO, type AsesmenKategoriEnum,
} from "@/lib/schemas/master/asesmenKatalog";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 500;

function toDTO(e: AsesmenEntity): AsesmenItemDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    kategori: e.kategori as AsesmenKategoriEnum,
    deskripsi: e.deskripsi,
    snomedCode: e.snomedCode ?? undefined,
    severityDefault: (e.severityDefault as AsesmenItemDTO["severityDefault"]) ?? undefined,
    status: e.status as AsesmenItemDTO["status"],
  };
}

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export interface AsesmenKatalogServiceConfig {
  dal?: Dal;
}

export function makeAsesmenKatalogService(config: AsesmenKatalogServiceConfig = {}) {
  const dal = config.dal ?? defaultDal;

  /** Kode `<PREFIX>-NNN` (pad min 3 digit). */
  function formatKode(prefix: string, seq: number): string {
    return `${prefix}-${String(seq).padStart(3, "0")}`;
  }

  /** List + filter (q/kategori/status). ACTOR-LESS (SSR-safe). */
  async function list(query: AsesmenQuery): Promise<{ items: AsesmenItemDTO[] }> {
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await dal.list({
      kategori: query.kategori,
      q: query.q || undefined,
      status,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
    return { items: rows.map(toDTO) };
  }

  /** Tambah 1 item. Kode auto `<PREFIX>-NNN` (counter atomik per kategori) dalam 1 transaksi. */
  async function create(input: CreateAsesmenInput, _actor: Actor): Promise<AsesmenItemDTO> {
    const prefix = KATEGORI_PREFIX[input.kategori];
    // severityDefault hanya bermakna untuk ReaksiAlergi; abaikan di kategori lain.
    const severityDefault = input.kategori === "ReaksiAlergi" ? (input.severityDefault ?? null) : null;

    const row = await transaction(async (tx) => {
      const seq = await dal.nextAsesmenSeq(prefix, tx);
      const data: AsesmenData = {
        kode: formatKode(prefix, seq),
        nama: input.nama,
        kategori: input.kategori,
        deskripsi: input.deskripsi ?? "",
        snomedCode: input.snomedCode ?? null,
        severityDefault,
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 item (parsial). Kode & kategori immutable (auto-gen terikat prefix kategori). */
  async function update(id: string, input: UpdateAsesmenInput, _actor: Actor): Promise<AsesmenItemDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Item asesmen tidak ditemukan");

    const patch: AsesmenPatch = {};
    setDefined(patch, "nama", input.nama);
    setDefined(patch, "deskripsi", input.deskripsi);
    if (input.snomedCode !== undefined) patch.snomedCode = input.snomedCode.trim() || null;
    if (input.severityDefault !== undefined) {
      // severityDefault hanya untuk ReaksiAlergi — kategori lain dipaksa null.
      patch.severityDefault = existing.kategori === "ReaksiAlergi" ? input.severityDefault : null;
    }
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 item. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Item asesmen tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const asesmenKatalogService = makeAsesmenKatalogService();
