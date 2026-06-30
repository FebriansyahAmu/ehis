// templateAnamnesisService — Master Template Anamnesis. Business rule + map entity→DTO.
// Vocab kategori/modul/status pass-through (enum identik union FE). Katalog leaf (tanpa
// version, tanpa kode). RBAC `master.konfigurasi` di Route (CRUD) · konsumen klinis lewat
// `clinical.rekammedis` (endpoint terpisah). ABAC tak relevan (data global RS).

import * as defaultDal from "@/lib/dal/master/templateAnamnesisDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { TemplateAnamnesisEntity, TemplateAnamnesisData, TemplateAnamnesisPatch } from "@/lib/dal/master/templateAnamnesisDal";
import {
  type CreateTemplateAnamnesisInput, type UpdateTemplateAnamnesisInput, type TemplateAnamnesisQuery,
  type TemplateAnamnesisDTO, type AnamnesisTemplateDTO,
  type ChiefComplaintDTO, type ModulContextDTO, type TemplateStatusDTO,
} from "@/lib/schemas/master/templateAnamnesis";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 100;
const VALID_MODUL = new Set(["IGD", "RI", "RJ"]);

function toModulTags(v: string[]): ModulContextDTO[] {
  return v.filter((m): m is ModulContextDTO => VALID_MODUL.has(m));
}

function toDTO(e: TemplateAnamnesisEntity): TemplateAnamnesisDTO {
  return {
    id: e.id,
    label: e.label,
    kategori: e.kategori as ChiefComplaintDTO,
    contextTags: toModulTags(e.contextTags),
    keluhanUtama: e.keluhanUtama,
    rps: e.rps,
    onsetDurasi: e.onsetDurasi,
    mekanismeCedera: e.mekanismeCedera ?? undefined,
    faktorPemberat: e.faktorPemberat,
    faktorPemerut: e.faktorPemerut,
    statusGeneralis: e.statusGeneralis,
    catatanPerawat: e.catatanPerawat ?? undefined,
    status: e.status as TemplateStatusDTO,
  };
}

// set hanya bila terdefinisi (patch parsial; allow-list anti mass-assign).
function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeTemplateAnamnesisService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** List + filter (q/kategori/modul/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: TemplateAnamnesisQuery): Promise<{ items: TemplateAnamnesisDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      modul: query.modul,
      status,
      cursorId: query.cursor,
      limit: limit + 1, // +1 → deteksi halaman berikutnya
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Template untuk KONSUMEN KLINIS (picker AnamnesisPane) — hanya Aktif + relevan modul,
   *  bentuk ringkas (field pre-fill). ACTOR-LESS. */
  async function listForModul(modul: ModulContextDTO): Promise<AnamnesisTemplateDTO[]> {
    const { items } = await list({ modul, status: "Aktif", limit: 300 });
    return items.map((t) => ({
      id: t.id,
      label: t.label,
      kategori: t.kategori,
      keluhanUtama: t.keluhanUtama,
      rps: t.rps,
      onsetDurasi: t.onsetDurasi,
      mekanismeCedera: t.mekanismeCedera ?? "",
      faktorPemberat: t.faktorPemberat,
      faktorPemerut: t.faktorPemerut,
      statusGeneralis: t.statusGeneralis,
      catatanPerawat: t.catatanPerawat ?? "",
    }));
  }

  /** Tambah 1 template. */
  async function create(input: CreateTemplateAnamnesisInput, _actor: Actor): Promise<TemplateAnamnesisDTO> {
    const data: TemplateAnamnesisData = {
      label: input.label,
      kategori: input.kategori ?? "Lainnya",
      contextTags: input.contextTags,
      keluhanUtama: input.keluhanUtama,
      rps: input.rps ?? "",
      onsetDurasi: input.onsetDurasi ?? "",
      mekanismeCedera: input.mekanismeCedera ?? null,
      faktorPemberat: input.faktorPemberat ?? "",
      faktorPemerut: input.faktorPemerut ?? "",
      statusGeneralis: input.statusGeneralis ?? "",
      catatanPerawat: input.catatanPerawat ?? null,
      status: input.status ?? "Aktif",
    };
    return toDTO(await dal.create(data));
  }

  /** Ubah 1 template (parsial). */
  async function update(id: string, input: UpdateTemplateAnamnesisInput, _actor: Actor): Promise<TemplateAnamnesisDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Template anamnesis tidak ditemukan");

    const patch: TemplateAnamnesisPatch = {};
    setDefined(patch, "label", input.label);
    setDefined(patch, "kategori", input.kategori);
    setDefined(patch, "contextTags", input.contextTags);
    setDefined(patch, "keluhanUtama", input.keluhanUtama);
    setDefined(patch, "rps", input.rps);
    setDefined(patch, "onsetDurasi", input.onsetDurasi);
    if (input.mekanismeCedera !== undefined) patch.mekanismeCedera = input.mekanismeCedera;
    setDefined(patch, "faktorPemberat", input.faktorPemberat);
    setDefined(patch, "faktorPemerut", input.faktorPemerut);
    setDefined(patch, "statusGeneralis", input.statusGeneralis);
    if (input.catatanPerawat !== undefined) patch.catatanPerawat = input.catatanPerawat;
    setDefined(patch, "status", input.status);

    return toDTO(await dal.update(id, patch));
  }

  /** Soft-delete 1 template. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Template anamnesis tidak ditemukan");
  }

  return { list, listForModul, create, update, remove };
}

export const templateAnamnesisService = makeTemplateAnamnesisService();
