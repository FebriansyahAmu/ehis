// icdService — Master Referensi ICD-10/ICD-9. Business rule + map entity→DTO + vocab
// FE⇄DB ("ICD-10"⇄ICD_10 · status "Aktif"⇄active · nama⇄display · version⇄cs_version).
// Reference leaf (tanpa optimistic-version). RBAC `master.icd` di Route; ABAC tak relevan
// (data global RS). Import massal = createMany skipDuplicates ter-chunk.

import * as defaultDal from "@/lib/dal/master/icdDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { IcdEntity, CreateIcdData, UpdateIcdData } from "@/lib/dal/master/icdDal";
import {
  DEFAULT_ICD_VERSION,
  type CreateIcdInput, type UpdateIcdInput, type ImportIcdInput, type ImportIcdResult,
  type IcdQuery, type IcdDTO, type IcdJenisDTO,
} from "@/lib/schemas/master/icd";

type Dal = typeof defaultDal;
type IcdJenisDb = "ICD_10" | "ICD_9";

const DEFAULT_LIMIT = 50;
const IMPORT_CHUNK = 1000; // ukuran batch createMany (hindari statement raksasa)

// ── Vocab map FE ⇄ DB ─────────────────────────────────────────────────────────
function jenisToDb(j: IcdJenisDTO): IcdJenisDb {
  return j === "ICD-10" ? "ICD_10" : "ICD_9";
}
function jenisToFe(j: string): IcdJenisDTO {
  return j === "ICD_10" ? "ICD-10" : "ICD-9";
}

function toDTO(e: IcdEntity): IcdDTO {
  return {
    id: e.id,
    jenis: jenisToFe(e.jenis),
    kode: e.kode,
    nama: e.display,
    version: e.csVersion,
    namaInggris: e.namaInggris ?? undefined,
    chapter: e.chapter ?? undefined,
    blok: e.blok ?? undefined,
    inaCbg: e.inaCbg ?? undefined,
    status: e.active ? "Aktif" : "Non_Aktif",
  };
}

// set hanya bila terdefinisi (patch parsial; allow-list anti mass-assign).
function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeIcdService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** List + filter (jenis/status/q) + keyset cursor. */
  async function list(query: IcdQuery, _actor: Actor): Promise<{ items: IcdDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const active = query.status === "Aktif" ? true : query.status === "Non_Aktif" ? false : undefined;

    const rows = await dal.list({
      jenis: query.jenis ? jenisToDb(query.jenis) : undefined,
      q: query.q || undefined,
      active,
      cursorId: query.cursor,
      limit: limit + 1, // +1 → deteksi halaman berikutnya
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Tambah 1 kode. Konflik (jenis,kode) → P2002 dipetakan handleError jadi 409. */
  async function create(input: CreateIcdInput, _actor: Actor): Promise<IcdDTO> {
    const data: CreateIcdData = {
      jenis: jenisToDb(input.jenis),
      kode: input.kode,
      display: input.nama,
      csVersion: input.version,
      namaInggris: input.namaInggris ?? null,
      chapter: input.chapter ?? null,
      blok: input.blok ?? null,
      inaCbg: input.inaCbg ?? null,
      active: input.status ? input.status === "Aktif" : true,
    };
    const row = await dal.create(data);
    return toDTO(row);
  }

  /** Ubah 1 kode (parsial). jenis tak diubah (jaga natural key). */
  async function update(id: string, input: UpdateIcdInput, _actor: Actor): Promise<IcdDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Kode ICD tidak ditemukan");

    const patch: UpdateIcdData = {};
    setDefined(patch, "kode", input.kode);
    setDefined(patch, "display", input.nama);
    setDefined(patch, "csVersion", input.version);
    setDefined(patch, "namaInggris", input.namaInggris ?? undefined);
    setDefined(patch, "chapter", input.chapter ?? undefined);
    setDefined(patch, "blok", input.blok ?? undefined);
    setDefined(patch, "inaCbg", input.inaCbg ?? undefined);
    if (input.status !== undefined) patch.active = input.status === "Aktif";

    if (Object.keys(patch).length > 0) {
      const count = await dal.update(id, patch);
      if (count === 0) throw Errors.notFound("Kode ICD tidak ditemukan");
    }

    const fresh = await dal.findById(id);
    if (!fresh) throw Errors.internal("Gagal memuat ulang kode ICD pasca update");
    return toDTO(fresh);
  }

  /** Soft-delete 1 kode. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Kode ICD tidak ditemukan");
  }

  /** Import massal 1 jenis. Dedup via unique (jenis,kode) — duplikat dilewati. */
  async function importBatch(input: ImportIcdInput, _actor: Actor): Promise<ImportIcdResult> {
    const jenisDb = jenisToDb(input.jenis);
    const fallbackVersion = DEFAULT_ICD_VERSION[input.jenis];

    const data: CreateIcdData[] = input.items.map((r) => ({
      jenis: jenisDb,
      kode: r.kode,
      display: r.display,
      csVersion: r.version || fallbackVersion,
      namaInggris: r.namaInggris ?? null,
      chapter: r.chapter ?? null,
      blok: r.blok ?? null,
      inaCbg: r.inaCbg ?? null,
      active: true,
    }));

    let inserted = 0;
    for (let i = 0; i < data.length; i += IMPORT_CHUNK) {
      inserted += await dal.createManySkip(data.slice(i, i + IMPORT_CHUNK));
    }

    return { received: data.length, inserted, skipped: data.length - inserted };
  }

  return { list, create, update, remove, importBatch };
}

export const icdService = makeIcdService();
