// labTestService — Master Katalog Laboratorium (Tes → Parameter). Business rule +
// map entity→DTO. Vocab FE⇄DB hanya status "Aktif"/"NonAktif" ⇄ active; kategori/tipe
// pass-through (TEXT). Katalog leaf (tanpa optimistic-version). RBAC `master.katalog` di
// Route. `list` ACTOR-LESS → Server Component boleh panggil (SSR hybrid, API-RULES §6.1).
// Update mengganti parameters secara REPLACE-ALL bila field `parameters` dikirim.

import * as defaultDal from "@/lib/dal/master/labTestDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  LabTestEntity, ParameterData, CreateLabTestData, UpdateLabTestData,
} from "@/lib/dal/master/labTestDal";
import {
  type CreateLabTestInput, type UpdateLabTestInput, type LabTestQuery,
  type LabTestDTO, type LabParameterDTO, type LabRujukanDTO,
  type LabKategoriDTO, type LabResultTypeDTO, type ParameterInput,
} from "@/lib/schemas/master/labTest";

type Dal = typeof defaultDal;
type ParamEntity = LabTestEntity["parameters"][number];

const DEFAULT_LIMIT = 50;

// JSON rujukan (unknown dari DB) → baris DTO ter-validasi bentuk minimal.
function rujukanFromJson(v: unknown): LabRujukanDTO[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const o = row as Record<string, unknown>;
    const gender = o.gender === "L" || o.gender === "P" ? o.gender : "LP";
    return [{
      gender: gender as "L" | "P" | "LP",
      usiaMin: typeof o.usiaMin === "number" ? o.usiaMin : undefined,
      usiaMax: typeof o.usiaMax === "number" ? o.usiaMax : undefined,
      low: typeof o.low === "number" ? o.low : 0,
      high: typeof o.high === "number" ? o.high : 0,
      keterangan: typeof o.keterangan === "string" ? o.keterangan : undefined,
    }];
  });
}

function paramToDTO(p: ParamEntity): LabParameterDTO {
  return {
    id: p.id,
    nama: p.nama,
    satuan: p.satuan,
    tipeHasil: p.tipeHasil as LabResultTypeDTO,
    nilaiNormalText: p.nilaiNormalText ?? undefined,
    rujukan: rujukanFromJson(p.rujukan),
    criticalLow: p.criticalLow ?? null,
    criticalHigh: p.criticalHigh ?? null,
    deltaAbsolute: p.deltaAbsolute ?? null,
    deltaPercent: p.deltaPercent ?? null,
    metode: p.metode ?? undefined,
    urutan: p.urutan,
  };
}

function toDTO(e: LabTestEntity): LabTestDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    kategori: e.kategori as LabKategoriDTO,
    spesimen: e.spesimen ?? undefined,
    metode: e.metode ?? undefined,
    waktuTunggu: e.waktuTunggu ?? undefined,
    keterangan: e.keterangan ?? undefined,
    status: e.active ? "Aktif" : "NonAktif",
    parameters: [...e.parameters].sort((a, b) => a.urutan - b.urutan).map(paramToDTO),
  };
}

// Input parameter (Zod) → data DAL. Kualitatif → satuan dikosongkan & rujukan diabaikan.
function paramInputToData(p: ParameterInput, idx: number): ParameterData {
  const tipe = p.tipeHasil ?? "Numerik";
  const kualitatif = tipe === "Kualitatif";
  return {
    nama: p.nama,
    satuan: kualitatif ? "" : (p.satuan ?? ""),
    tipeHasil: tipe,
    nilaiNormalText: kualitatif ? (p.nilaiNormalText ?? null) : null,
    rujukan: kualitatif
      ? []
      : (p.rujukan ?? []).map((r) => ({
          gender: r.gender,
          usiaMin: r.usiaMin,
          usiaMax: r.usiaMax,
          low: r.low,
          high: r.high,
          keterangan: r.keterangan,
        })),
    criticalLow: kualitatif ? null : (p.criticalLow ?? null),
    criticalHigh: kualitatif ? null : (p.criticalHigh ?? null),
    deltaAbsolute: kualitatif ? null : (p.deltaAbsolute ?? null),
    deltaPercent: kualitatif ? null : (p.deltaPercent ?? null),
    metode: p.metode ?? null,
    urutan: p.urutan ?? idx,
  };
}

export function makeLabTestService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** List + filter (q/kategori/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: LabTestQuery): Promise<{ items: LabTestDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const active = query.status === "Aktif" ? true : query.status === "NonAktif" ? false : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      active,
      cursorId: query.cursor,
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Batch read by ids (+parameter). ACTOR-LESS read (RBAC di Route). Dipakai entry hasil Lab. */
  async function getByIds(ids: string[]): Promise<LabTestDTO[]> {
    if (ids.length === 0) return [];
    const rows = await dal.findByIds(ids);
    return rows.map(toDTO);
  }

  /** Tambah 1 tes + parameter. */
  async function create(input: CreateLabTestInput, _actor: Actor): Promise<LabTestDTO> {
    const data: CreateLabTestData = {
      kode: input.kode ?? "",
      nama: input.nama,
      kategori: input.kategori ?? "Hematologi",
      spesimen: input.spesimen ?? null,
      metode: input.metode ?? null,
      waktuTunggu: input.waktuTunggu ?? null,
      keterangan: input.keterangan ?? null,
      active: input.status ? input.status === "Aktif" : true,
      parameters: (input.parameters ?? []).map(paramInputToData),
    };
    const row = await dal.create(data);
    return toDTO(row);
  }

  /** Ubah 1 tes (parsial). `parameters` bila ada → replace-all. */
  async function update(id: string, input: UpdateLabTestInput, _actor: Actor): Promise<LabTestDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Tes laboratorium tidak ditemukan");

    const patch: UpdateLabTestData = {};
    if (input.nama !== undefined) patch.nama = input.nama;
    if (input.kode !== undefined) patch.kode = input.kode;
    if (input.kategori !== undefined) patch.kategori = input.kategori;
    if (input.spesimen !== undefined) patch.spesimen = input.spesimen;
    if (input.metode !== undefined) patch.metode = input.metode;
    if (input.waktuTunggu !== undefined) patch.waktuTunggu = input.waktuTunggu;
    if (input.keterangan !== undefined) patch.keterangan = input.keterangan;
    if (input.status !== undefined) patch.active = input.status === "Aktif";
    if (input.parameters !== undefined) patch.parameters = input.parameters.map(paramInputToData);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 tes (parameter ikut hilang via cascade saat hard-delete; di sini soft). */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Tes laboratorium tidak ditemukan");
  }

  return { list, getByIds, create, update, remove };
}

export const labTestService = makeLabTestService();
