// statusEnumService — business master Status Enum + map entity→DTO (mirror EnumEntry FE + groupKey).
// Kode `<PREFIX>-NNN` AUTO-GEN per grup (counter atomik, dalam transaksi) — prefix dari
// ENUM_GROUP_PREFIX. Katalog leaf (tanpa version). RBAC master.konfigurasi di Route. list
// ACTOR-LESS (SSR-safe, API-RULES §6.1). Pola identik asesmenKatalogService.

import * as defaultDal from "@/lib/dal/master/statusEnumDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { EnumEntryEntity, EnumEntryData, EnumEntryPatch } from "@/lib/dal/master/statusEnumDal";
import {
  ENUM_GROUP_PREFIX,
  type CreateEnumEntryInput, type UpdateEnumEntryInput, type EnumQuery,
  type EnumEntryDTO, type EnumGroupKeyEnum, type EnumToneEnum, type EnumStatusEnum,
} from "@/lib/schemas/master/statusEnum";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 500;

function toDTO(e: EnumEntryEntity): EnumEntryDTO {
  return {
    id: e.id,
    groupKey: e.groupKey as EnumGroupKeyEnum,
    kode: e.kode,
    label: e.label,
    deskripsi: e.deskripsi,
    tone: e.tone as EnumToneEnum,
    icon: e.icon ?? undefined,
    urutan: e.urutan,
    status: e.status as EnumStatusEnum,
  };
}

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export interface StatusEnumServiceConfig {
  dal?: Dal;
}

export function makeStatusEnumService(config: StatusEnumServiceConfig = {}) {
  const dal = config.dal ?? defaultDal;

  /** Kode `<PREFIX>-NNN` (pad min 3 digit). */
  function formatKode(prefix: string, seq: number): string {
    return `${prefix}-${String(seq).padStart(3, "0")}`;
  }

  /** List + filter (q/groupKey/status). ACTOR-LESS (SSR-safe). */
  async function list(query: EnumQuery): Promise<{ items: EnumEntryDTO[] }> {
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await dal.list({
      groupKey: query.groupKey,
      q: query.q || undefined,
      status,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
    return { items: rows.map(toDTO) };
  }

  /** Tambah 1 entri. Kode auto `<PREFIX>-NNN` (counter atomik per grup) dalam 1 transaksi. */
  async function create(input: CreateEnumEntryInput, _actor: Actor): Promise<EnumEntryDTO> {
    const prefix = ENUM_GROUP_PREFIX[input.groupKey];

    const row = await transaction(async (tx) => {
      const seq = await dal.nextEnumSeq(prefix, tx);
      const urutan = input.urutan ?? (await dal.maxUrutan(input.groupKey, tx)) + 1;
      const data: EnumEntryData = {
        groupKey: input.groupKey,
        kode: formatKode(prefix, seq),
        label: input.label,
        deskripsi: input.deskripsi ?? "",
        tone: input.tone ?? "slate",
        icon: input.icon ?? null,
        urutan,
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 entri (parsial). Kode & groupKey immutable (auto-gen terikat prefix grup). */
  async function update(id: string, input: UpdateEnumEntryInput, _actor: Actor): Promise<EnumEntryDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Entri enum tidak ditemukan");

    const patch: EnumEntryPatch = {};
    setDefined(patch, "label", input.label);
    setDefined(patch, "deskripsi", input.deskripsi);
    setDefined(patch, "tone", input.tone);
    if (input.icon !== undefined) patch.icon = input.icon.trim() || null;
    setDefined(patch, "urutan", input.urutan);
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 entri. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Entri enum tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const statusEnumService = makeStatusEnumService();
