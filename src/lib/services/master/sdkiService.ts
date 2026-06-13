// sdkiService — Master Katalog Keperawatan (SDKI/SLKI/SIKI). Business rule + map
// entity→DTO. Vocab kategori/jenis/status pass-through (nilai enum identik union FE).
// Kode `D.NNNN` AUTO-GEN (counter atomik, dalam transaksi). Blok data klinis = JSONB
// (di-set/replace utuh). Katalog leaf (tanpa optimistic-version). RBAC `master.katalog`
// di Route; ABAC tak relevan (data global RS).

import * as defaultDal from "@/lib/dal/master/sdkiDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SdkiEntity, SdkiData, SdkiPatch } from "@/lib/dal/master/sdkiDal";
import {
  type CreateSdkiInput, type UpdateSdkiInput, type SdkiQuery,
  type SdkiDTO, type SdkiDataDTO, type SdkiIntervensiDTO,
  type SdkiKategoriDTO, type SdkiJenisDTO, type SdkiStatusDTO,
} from "@/lib/schemas/master/sdki";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 100;

// ── JSONB → tipe DTO (defensif: bentuk bisa apa saja dari kolom Json) ──────────
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function toData(v: unknown): SdkiDataDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return { subjektif: strArr(o.subjektif), objektif: strArr(o.objektif) };
}
function toIntervensi(v: unknown): SdkiIntervensiDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    observasi: strArr(o.observasi),
    terapeutik: strArr(o.terapeutik),
    edukasi: strArr(o.edukasi),
    kolaborasi: strArr(o.kolaborasi),
  };
}

function toDTO(e: SdkiEntity): SdkiDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    kategori: e.kategori as SdkiKategoriDTO,
    subKategori: e.subKategori,
    jenis: e.jenis as SdkiJenisDTO,
    penyebabUmum: e.penyebabUmum,
    faktorResiko: e.faktorResiko ?? undefined,
    dataMayor: toData(e.dataMayor),
    dataMinor: toData(e.dataMinor),
    kriteriaHasil: e.kriteriaHasil,
    intervensi: toIntervensi(e.intervensi),
    status: e.status as SdkiStatusDTO,
  };
}

const EMPTY_DATA = { subjektif: [], objektif: [] };
const EMPTY_INTERVENSI = { observasi: [], terapeutik: [], edukasi: [], kolaborasi: [] };

// set hanya bila terdefinisi (patch parsial; allow-list anti mass-assign).
function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeSdkiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Kode keperawatan `D.NNNN` (pad min 4 digit; bila >9999 lebar tumbuh). */
  function formatKode(seq: number): string {
    return `D.${String(seq).padStart(4, "0")}`;
  }

  /** List + filter (q/kategori/jenis/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: SdkiQuery): Promise<{ items: SdkiDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      jenis: query.jenis,
      status,
      cursorId: query.cursor,
      limit: limit + 1, // +1 → deteksi halaman berikutnya
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Tambah 1 diagnosa. Kode auto `D.NNNN` (counter atomik) dalam 1 transaksi. */
  async function create(input: CreateSdkiInput, _actor: Actor): Promise<SdkiDTO> {
    const row = await transaction(async (tx) => {
      const seq = await dal.nextSdkiSeq(tx);
      const data: SdkiData = {
        kode: formatKode(seq),
        nama: input.nama,
        kategori: input.kategori ?? "Fisiologis",
        subKategori: input.subKategori ?? "",
        jenis: input.jenis ?? "Aktual",
        penyebabUmum: input.penyebabUmum ?? "",
        faktorResiko: input.faktorResiko ?? null,
        dataMayor: input.dataMayor ?? EMPTY_DATA,
        dataMinor: input.dataMinor ?? EMPTY_DATA,
        kriteriaHasil: input.kriteriaHasil ?? [],
        intervensi: input.intervensi ?? EMPTY_INTERVENSI,
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 diagnosa (parsial). Kode immutable (auto-gen). */
  async function update(id: string, input: UpdateSdkiInput, _actor: Actor): Promise<SdkiDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Diagnosa keperawatan tidak ditemukan");

    const patch: SdkiPatch = {};
    setDefined(patch, "nama", input.nama);
    setDefined(patch, "kategori", input.kategori);
    setDefined(patch, "subKategori", input.subKategori);
    setDefined(patch, "jenis", input.jenis);
    setDefined(patch, "penyebabUmum", input.penyebabUmum);
    if (input.faktorResiko !== undefined) patch.faktorResiko = input.faktorResiko;
    if (input.dataMayor !== undefined) patch.dataMayor = input.dataMayor;
    if (input.dataMinor !== undefined) patch.dataMinor = input.dataMinor;
    setDefined(patch, "kriteriaHasil", input.kriteriaHasil);
    if (input.intervensi !== undefined) patch.intervensi = input.intervensi;
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 diagnosa. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Diagnosa keperawatan tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const sdkiService = makeSdkiService();
