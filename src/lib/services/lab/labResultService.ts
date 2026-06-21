// labResultService — Entry Hasil Lab (nilai per parameter utk 1 LabOrder). Save = insert hasil
// (header + values, append-only "latest wins") + transisi status LabOrder Diterima/Dianalisa →
// Divalidasi (atomik, satu transaksi). Analis = input.analis (override) atau nama actor (user login).
// RBAC di Route: ancillary.lab.worklist (read/update). Lintas-kunjungan (scopeKunjungan:false).
// Selaras labOrderService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/lab/labResultDal";
import * as labOrderDal from "@/lib/dal/lab/labOrderDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  SaveLabResultInput, ValidateLabResultInput, LabResultDTO, LabValueDTO, CriticalNotifInput,
} from "@/lib/schemas/lab/labResult";
import type { LabResultEntity } from "@/lib/dal/lab/labResultDal";

type Dal = typeof defaultDal;
type ValueEntity = LabResultEntity["values"][number];

// Status order yang boleh entry hasil → transisi ke Divalidasi.
const ENTRY_STATES = ["Diterima", "Sampel Diterima", "Dianalisa"] as const;

function toValueDTO(v: ValueEntity): LabValueDTO {
  return {
    id: v.id,
    rowKey: v.rowKey,
    labTestId: v.labTestId ?? null,
    labParameterId: v.labParameterId ?? null,
    kodeTes: v.kodeTes,
    nama: v.nama,
    kategori: v.kategori,
    nilai: v.nilai ?? null,
    satuan: v.satuan,
    rujukanStr: v.rujukanStr,
    nilaiMin: v.nilaiMin ?? null,
    nilaiMax: v.nilaiMax ?? null,
    criticalLow: v.criticalLow ?? null,
    criticalHigh: v.criticalHigh ?? null,
    flag: (v.flag as "N" | "H" | "L" | "C" | null) ?? null,
    urutan: v.urutan,
  };
}

function toDTO(e: LabResultEntity): LabResultDTO {
  return {
    id: e.id,
    labOrderId: e.labOrderId,
    kunjunganId: e.kunjunganId,
    analis: e.analis,
    catatan: e.catatan ?? null,
    criticalNotifs: (e.criticalNotifs as CriticalNotifInput[] | null) ?? [],
    values: e.values.map(toValueDTO),
    validator: e.validator ?? null,
    catatanValidator: e.catatanValidator ?? null,
    validatedAt: e.validatedAt ? e.validatedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeLabResultService(deps: { dal?: Dal; clock?: Clock } = {}) {
  const dal = deps.dal ?? defaultDal;
  const clock = deps.clock ?? systemClock;

  /** Hasil terbaru utk 1 order (null bila belum ada). */
  async function getHasil(labId: string, _actor: Actor): Promise<LabResultDTO | null> {
    const order = await labOrderDal.findById(labId);
    if (!order || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    const row = await dal.findLatestByOrder(labId);
    return row ? toDTO(row) : null;
  }

  /** Simpan entry hasil + transisi order → Divalidasi (atomik). */
  async function saveHasil(labId: string, input: SaveLabResultInput, actor: Actor): Promise<LabResultDTO> {
    const order = await labOrderDal.findById(labId);
    if (!order || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    if (!ENTRY_STATES.includes(order.status as (typeof ENTRY_STATES)[number])) {
      throw Errors.conflict("Order belum siap entry hasil atau sudah divalidasi");
    }
    const analis = input.analis?.trim() || (await resolveActorNama(actor));

    const created = await transaction(async (tx) => {
      const row = await dal.create(
        {
          labOrderId: labId,
          kunjunganId: order.kunjunganId,
          analis,
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
          catatan: input.catatan ?? null,
          criticalNotifs: input.criticalNotifs ?? null,
          values: input.values.map((v, i) => ({
            rowKey: v.rowKey,
            labTestId: v.labTestId ?? null,
            labParameterId: v.labParameterId ?? null,
            kodeTes: v.kodeTes,
            nama: v.nama,
            kategori: v.kategori,
            nilai: v.nilai ?? null,
            satuan: v.satuan,
            rujukanStr: v.rujukanStr,
            nilaiMin: v.nilaiMin ?? null,
            nilaiMax: v.nilaiMax ?? null,
            criticalLow: v.criticalLow ?? null,
            criticalHigh: v.criticalHigh ?? null,
            flag: v.flag ?? null,
            urutan: v.urutan ?? i,
          })),
        },
        tx,
      );
      const n = await labOrderDal.transition(labId, [...ENTRY_STATES], "Divalidasi", tx);
      if (n === 0) throw Errors.conflict("Status order berubah — muat ulang halaman");
      return row;
    });

    return toDTO(created);
  }

  /** Validasi hasil (SpPK) — stamp validator + transisi order Divalidasi → Selesai (atomik). */
  async function validate(labId: string, input: ValidateLabResultInput, actor: Actor): Promise<LabResultDTO> {
    const order = await labOrderDal.findById(labId);
    if (!order || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    if (order.status !== "Divalidasi") throw Errors.conflict("Order belum siap divalidasi atau sudah selesai");
    const latest = await dal.findLatestByOrder(labId);
    if (!latest) throw Errors.conflict("Belum ada hasil untuk divalidasi");
    const validator = input.validator?.trim() || (await resolveActorNama(actor));

    const result = await transaction(async (tx) => {
      const c = await dal.stampValidation(
        latest.id,
        {
          validator,
          validatorUserId: actor.userId,
          catatanValidator: input.catatanValidator ?? null,
          validatedAt: clock.now(),
        },
        tx,
      );
      if (c === 0) throw Errors.conflict("Hasil sudah divalidasi");
      const n = await labOrderDal.transition(labId, ["Divalidasi"], "Selesai", tx);
      if (n === 0) throw Errors.conflict("Status order berubah — muat ulang halaman");
      const fresh = await dal.findLatestByOrder(labId);
      if (!fresh) throw Errors.internal("Gagal memuat hasil pasca-validasi");
      return fresh;
    });

    return toDTO(result);
  }

  return { getHasil, saveHasil, validate };
}

export const labResultService = makeLabResultService();
