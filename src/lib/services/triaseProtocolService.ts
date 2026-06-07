// triaseProtocolService — business rules master/Skala Klinis: Triase IGD (FLOWS §2 ·
// docs/BACKEND-MASTER-SKALA-KLINIK §A.4.2). Tak import prisma langsung (pakai `transaction`
// + DAL). DTO mirror FE TriaseRecord (zero-refactor UI). Matrix sel ternormalisasi
// (TriaseProtocolCriteria) → di-rekonstruksi jadi `parameter.values` map di toDTO.
//
// Invariant (§A.3): kode unik · level/param kode unik per protokol · single-default
// (Service unset-others + partial-unique DB) · protokol default = WAJIB valid (≥2 level,
// ≥1 parameter) · hapus protokol default-aktif ditolak. Optimistic concurrency (version).
// TODO(GAP-B infra): cache-aside Redis getDefault + audit emit — infra belum ada (spt ruanganService).

import { transaction, type Tx } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/triaseProtocolDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreateTriaseInput, UpdateTriaseInput, LevelInput, ParameterInput,
  TriaseRecordDTO, TriaseLevelDTO, TriaseParameterDTO, TriaseTone, TriaseStatus, TriaseValueType,
} from "@/lib/schemas/triaseProtocol";
import type { ProtocolFullEntity } from "@/lib/dal/triaseProtocolDal";

type Dal = typeof defaultDal;
type Full = NonNullable<ProtocolFullEntity>;

export function makeTriaseProtocolService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  // ── Validasi matrix (cermin isTriaseValid FE; dipakai utk izinkan isDefault) ──
  function assertValidMatrix(levels: LevelInput[], parameters: ParameterInput[]): void {
    if (levels.length < 2) throw Errors.validation("Protokol triase butuh minimal 2 level urgensi");
    if (parameters.length < 1) throw Errors.validation("Protokol triase butuh minimal 1 parameter");
  }

  // ── DTO mapping (rekonstruksi values map dari criteria) ───────────────────────
  function toLevelDTO(l: Full["levels"][number]): TriaseLevelDTO {
    return {
      id: l.id,
      kode: l.kode,
      label: l.label,
      tone: l.tone as TriaseTone,
      responsTime: l.responsTime ?? "",
      prioritas: l.prioritas,
      deskripsi: l.deskripsi ?? "",
    };
  }

  function toDTO(p: Full): TriaseRecordDTO {
    const kodeByLevelId = new Map(p.levels.map((l) => [l.id, l.kode] as const));
    const parameters: TriaseParameterDTO[] = p.parameters.map((param) => {
      const values: Record<string, string[]> = {};
      // criteria sudah terurut `urutan` (DAL include) → push berurutan per level.
      for (const c of param.criteria) {
        const kode = kodeByLevelId.get(c.levelId);
        if (kode !== undefined) (values[kode] ??= []).push(c.nilai);
      }
      return {
        id: param.id, kode: param.kode, label: param.label,
        tipeNilai: param.tipeNilai as TriaseValueType,
        satuan: param.satuan ?? undefined,
        values,
      };
    });
    return {
      id: p.id,
      kode: p.kode,
      nama: p.nama,
      deskripsi: p.deskripsi ?? "",
      protokol: p.protokol ?? "",
      levels: p.levels.map(toLevelDTO),
      parameters,
      status: p.status as TriaseStatus,
      isDefault: p.isDefault,
      version: p.version,
    };
  }

  // ── Tulis matrix (level + parameter + sel) dalam tx milik pemanggil ───────────
  async function writeMatrix(
    protocolId: string,
    levels: LevelInput[],
    parameters: ParameterInput[],
    tx: Tx,
  ): Promise<void> {
    const createdLevels = await dal.createLevels(
      levels.map((l, i) => ({
        protocolId,
        kode: l.kode,
        label: l.label,
        tone: l.tone,
        responsTime: l.responsTime ?? null,
        prioritas: l.prioritas,
        deskripsi: l.deskripsi ?? null,
        urutan: i,
      })),
      tx,
    );
    const createdParams = await dal.createParameters(
      parameters.map((p, i) => ({
        protocolId, kode: p.kode, label: p.label, urutan: i,
        tipeNilai: p.tipeNilai, satuan: p.satuan ?? null,
      })),
      tx,
    );

    // kode → id map (link sel ke level & parameter aktual)
    const levelIdByKode = new Map(createdLevels.map((l) => [l.kode, l.id] as const));
    const criteria: { parameterId: string; levelId: string; nilai: string; urutan: number }[] = [];
    for (let i = 0; i < parameters.length; i++) {
      const parameterId = createdParams[i].id;
      for (const [levelKode, items] of Object.entries(parameters[i].values)) {
        const levelId = levelIdByKode.get(levelKode);
        if (levelId === undefined) continue;
        // banyak item per sel → tiap item 1 baris (urutan = index dalam sel)
        items.forEach((nilai, urutan) => criteria.push({ parameterId, levelId, nilai, urutan }));
      }
    }
    await dal.createCriteria(criteria, tx);
  }

  // ── Reads ──────────────────────────────────────────────────────────────────--
  async function list(_actor: Actor): Promise<TriaseRecordDTO[]> {
    const rows = await dal.listFull();
    return rows.map(toDTO);
  }

  async function getFull(id: string, _actor: Actor): Promise<TriaseRecordDTO> {
    const found = await dal.findFull(id);
    if (!found) throw Errors.notFound("Protokol triase tidak ditemukan");
    return toDTO(found);
  }

  /** Protokol default aktif (dikonsumsi medicalrecord.Triase). null bila belum ada. */
  async function getDefault(_actor: Actor): Promise<TriaseRecordDTO | null> {
    const found = await dal.findDefaultFull();
    return found ? toDTO(found) : null;
  }

  // ── Create ─────────────────────────────────────────────────────────────────--
  async function createProtocol(input: CreateTriaseInput, _actor: Actor): Promise<TriaseRecordDTO> {
    if (input.isDefault) assertValidMatrix(input.levels, input.parameters);
    const kode = input.kode.toUpperCase();
    if (await dal.findByKode(kode)) throw Errors.conflict(`Kode protokol "${kode}" sudah dipakai`);

    const fresh = await transaction(async (tx) => {
      const created = await dal.createProtocol({
        kode,
        nama: input.nama,
        deskripsi: input.deskripsi ?? null,
        protokol: input.protokol ?? null,
        status: input.status,
        isDefault: input.isDefault,
      }, tx);
      await writeMatrix(created.id, input.levels, input.parameters, tx);
      if (input.isDefault) await dal.unsetOtherDefaults(created.id, tx);
      const full = await dal.findFull(created.id, tx);
      if (!full) throw Errors.internal("Gagal memuat protokol setelah dibuat");
      return full;
    });
    return toDTO(fresh);
  }

  // ── Update (version guard; matrix replace bila dikirim) ───────────────────────
  async function updateProtocol(id: string, input: UpdateTriaseInput, _actor: Actor): Promise<TriaseRecordDTO> {
    const kode = input.kode?.toUpperCase();
    if (kode) {
      const dup = await dal.findByKode(kode);
      if (dup && dup.id !== id) throw Errors.conflict(`Kode protokol "${kode}" sudah dipakai`);
    }

    const fresh = await transaction(async (tx) => {
      const existing = await dal.findFull(id, tx);
      if (!existing) throw Errors.notFound("Protokol triase tidak ditemukan");
      if (existing.version !== input.expectedVersion) throw Errors.conflictVersion();

      // Matrix final (untuk validasi isDefault) = input bila dikirim, else existing.
      const finalLevels = input.levels ?? existing.levels.map(levelEntityToInput);
      const finalParams = input.parameters ?? existing.parameters.map((p) => parameterEntityToInput(p, existing));
      if (input.isDefault) assertValidMatrix(finalLevels, finalParams);

      const count = await dal.updateProtocolWithVersion(id, input.expectedVersion, {
        ...(kode !== undefined ? { kode } : {}),
        ...(input.nama !== undefined ? { nama: input.nama } : {}),
        ...(input.deskripsi !== undefined ? { deskripsi: input.deskripsi } : {}),
        ...(input.protokol !== undefined ? { protokol: input.protokol } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      }, tx);
      if (count === 0) throw Errors.conflictVersion();

      // Replace matrix penuh bila levels/parameters dikirim.
      if (input.levels !== undefined || input.parameters !== undefined) {
        await dal.deleteChildren(id, tx);
        await writeMatrix(id, finalLevels, finalParams, tx);
      }
      if (input.isDefault) await dal.unsetOtherDefaults(id, tx);

      const full = await dal.findFull(id, tx);
      if (!full) throw Errors.internal("Gagal memuat protokol setelah update");
      return full;
    });
    return toDTO(fresh);
  }

  // ── Set default ────────────────────────────────────────────────────────────--
  async function setDefault(id: string, expectedVersion: number, _actor: Actor): Promise<TriaseRecordDTO> {
    const fresh = await transaction(async (tx) => {
      const existing = await dal.findFull(id, tx);
      if (!existing) throw Errors.notFound("Protokol triase tidak ditemukan");
      if (existing.version !== expectedVersion) throw Errors.conflictVersion();
      assertValidMatrix(
        existing.levels.map(levelEntityToInput),
        existing.parameters.map((p) => parameterEntityToInput(p, existing)),
      );
      const count = await dal.updateProtocolWithVersion(id, expectedVersion, { isDefault: true, status: "Aktif" }, tx);
      if (count === 0) throw Errors.conflictVersion();
      await dal.unsetOtherDefaults(id, tx);
      const full = await dal.findFull(id, tx);
      if (!full) throw Errors.internal("Gagal memuat protokol setelah set default");
      return full;
    });
    return toDTO(fresh);
  }

  // ── Delete (soft; tolak hapus default-aktif) ──────────────────────────────────
  async function deleteProtocol(id: string, expectedVersion: number, _actor: Actor): Promise<void> {
    await transaction(async (tx) => {
      const existing = await dal.findById(id, tx);
      if (!existing) throw Errors.notFound("Protokol triase tidak ditemukan");
      if (existing.isDefault && existing.status === "Aktif") {
        throw Errors.forbiddenState("Protokol default aktif tak bisa dihapus — set default lain dulu");
      }
      const count = await dal.softDeleteProtocol(id, expectedVersion, clock.now(), tx);
      if (count === 0) throw Errors.conflictVersion();
    });
  }

  // ── Helper: entity → input (untuk re-validasi tanpa kirim ulang matrix) ───────
  function levelEntityToInput(l: Full["levels"][number]): LevelInput {
    return {
      kode: l.kode,
      label: l.label,
      tone: l.tone as TriaseTone,
      responsTime: l.responsTime ?? undefined,
      prioritas: l.prioritas,
      deskripsi: l.deskripsi ?? undefined,
    };
  }
  function parameterEntityToInput(p: Full["parameters"][number], full: Full): ParameterInput {
    const kodeByLevelId = new Map(full.levels.map((l) => [l.id, l.kode] as const));
    const values: Record<string, string[]> = {};
    for (const c of p.criteria) {
      const kode = kodeByLevelId.get(c.levelId);
      if (kode !== undefined) (values[kode] ??= []).push(c.nilai);
    }
    return {
      kode: p.kode, label: p.label,
      tipeNilai: p.tipeNilai as TriaseValueType,
      satuan: p.satuan ?? undefined,
      values,
    };
  }

  return { list, getFull, getDefault, createProtocol, updateProtocol, setDefault, deleteProtocol };
}

export const triaseProtocolService = makeTriaseProtocolService();
