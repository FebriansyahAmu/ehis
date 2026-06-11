// tindakanService — Master Katalog Tindakan. Business rule + map entity→DTO. Vocab
// FE⇄DB hanya status "Aktif"/"NonAktif" ⇄ active; kategori/kompleksitas pass-through
// (nilai enum DB identik union FE). Katalog leaf (tanpa optimistic-version). RBAC
// `master.katalog` di Route; ABAC tak relevan (data global RS).

import * as defaultDal from "@/lib/dal/master/tindakanDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { TindakanEntity, CreateTindakanData, UpdateTindakanData } from "@/lib/dal/master/tindakanDal";
import {
  type CreateTindakanInput, type UpdateTindakanInput, type TindakanQuery,
  type TindakanDTO, type TindakanKategoriDTO, type KompleksitasDTO,
} from "@/lib/schemas/master/tindakan";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 50;

function toDTO(e: TindakanEntity): TindakanDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    kategori: e.kategori as TindakanKategoriDTO,
    kptlAktif: e.kptlAktif,
    nomorKptl: e.nomorKptl ?? undefined,
    kompleksitas: (e.kompleksitas as KompleksitasDTO | null) ?? null,
    spesialisDefault: e.spesialisDefault,
    unitDefault: e.unitDefault,
    deskripsi: e.deskripsi ?? undefined,
    status: e.active ? "Aktif" : "NonAktif",
  };
}

// set hanya bila terdefinisi (patch parsial; allow-list anti mass-assign).
function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeTindakanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** List + filter (q/kategori/kompleksitas/status) + keyset cursor.
   *  Tanpa `actor` → bisa dipanggil Server Component utk SSR first-paint (API-RULES §6.1). */
  async function list(query: TindakanQuery): Promise<{ items: TindakanDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const active = query.status === "Aktif" ? true : query.status === "NonAktif" ? false : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      kompleksitas: query.kompleksitas,
      active,
      cursorId: query.cursor,
      limit: limit + 1, // +1 → deteksi halaman berikutnya
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Tambah 1 tindakan. Kode boleh kosong (diisi belakangan via update). */
  async function create(input: CreateTindakanInput, _actor: Actor): Promise<TindakanDTO> {
    const data: CreateTindakanData = {
      kode: input.kode ?? "",
      nama: input.nama,
      kategori: input.kategori ?? "Konsultasi",
      kptlAktif: input.kptlAktif ?? false,
      nomorKptl: input.nomorKptl ?? null,
      kompleksitas: input.kompleksitas ?? null,
      spesialisDefault: input.spesialisDefault ?? [],
      unitDefault: input.unitDefault ?? [],
      deskripsi: input.deskripsi ?? null,
      active: input.status ? input.status === "Aktif" : true,
    };
    const row = await dal.create(data);
    return toDTO(row);
  }

  /** Ubah 1 tindakan (parsial). */
  async function update(id: string, input: UpdateTindakanInput, _actor: Actor): Promise<TindakanDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Tindakan tidak ditemukan");

    const patch: UpdateTindakanData = {};
    setDefined(patch, "nama", input.nama);
    setDefined(patch, "kode", input.kode);
    setDefined(patch, "kategori", input.kategori);
    setDefined(patch, "kptlAktif", input.kptlAktif);
    setDefined(patch, "nomorKptl", input.nomorKptl);
    setDefined(patch, "kompleksitas", input.kompleksitas);
    setDefined(patch, "spesialisDefault", input.spesialisDefault);
    setDefined(patch, "unitDefault", input.unitDefault);
    setDefined(patch, "deskripsi", input.deskripsi);
    if (input.status !== undefined) patch.active = input.status === "Aktif";

    if (Object.keys(patch).length > 0) {
      const count = await dal.update(id, patch);
      if (count === 0) throw Errors.notFound("Tindakan tidak ditemukan");
    }

    const fresh = await dal.findById(id);
    if (!fresh) throw Errors.internal("Gagal memuat ulang tindakan pasca update");
    return toDTO(fresh);
  }

  /** Soft-delete 1 tindakan. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Tindakan tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const tindakanService = makeTindakanService();
