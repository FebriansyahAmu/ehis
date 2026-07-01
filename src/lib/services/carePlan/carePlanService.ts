// carePlanService — tab Rencana Asuhan (RAT, SNARS PP 1 & PP 2). Goal-centric, problem-oriented.
// CRUD masalah (add/edit/verify co-sign/hapus) + goal anak (add/edit/hapus). add masalah boleh
// menyertakan goal awal (1 tx). Pencatat = input override ATAU nama actor. Verifikasi co-sign
// KHUSUS DPJP (Dokter/superuser) — ditegakkan di sini (RBAC route hanya clinical.careplan:update,
// dipakai Dokter & Perawat). RBAC di Route: clinical.careplan; ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/carePlan/carePlanDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { MasalahEntity, GoalEntity } from "@/lib/dal/carePlan/carePlanDal";
import {
  type MasalahInput, type MasalahUpdate, type GoalInput, type GoalUpdate,
  type CarePlanMasalahDTO, type CarePlanGoalDTO,
  type SumberDTO, type FaseDTO, type PrioritasDTO, type MasalahStatusDTO,
  type PpaDTO, type GoalStatusDTO,
} from "@/lib/schemas/carePlan/carePlan";

type Dal = typeof defaultDal;

// ── Normalisasi list ──
function cleanList(a?: string[]): string[] { return (a ?? []).map((x) => x.trim()).filter(Boolean); }

// ── Entity → DTO ──────────────────────────────────────────────────────────────
function toGoalDTO(g: GoalEntity): CarePlanGoalDTO {
  return {
    id: g.id,
    ppa: g.ppa as PpaDTO,
    target: g.target,
    indikator: g.indikator,
    targetWaktu: g.targetWaktu,
    intervensi: g.intervensi,
    status: g.status as GoalStatusDTO,
    evaluasi: g.evaluasi,
    waktu: g.waktu.toISOString(),
    pencatat: g.pencatat,
  };
}

function toDTO(e: MasalahEntity): CarePlanMasalahDTO {
  return {
    id: e.id,
    masalah: e.masalah,
    sumber: e.sumber as SumberDTO,
    refKode: e.refKode,
    fase: (e.fase ?? "") as FaseDTO | "",
    prioritas: (e.prioritas ?? "") as PrioritasDTO | "",
    status: e.status as MasalahStatusDTO,
    goals: e.goals.map(toGoalDTO),
    tanggalInput: e.tanggalInput.toISOString(),
    pencatat: e.pencatat,
    verified: e.verified,
    verifiedBy: e.verifiedBy ?? "",
    verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : "",
  };
}

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeCarePlanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMasalah(kunjunganId: string, masalahId: string): Promise<MasalahEntity> {
    const item = await dal.findMasalahById(masalahId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Masalah rencana asuhan tidak ditemukan");
    }
    return item;
  }

  // Verifikasi co-sign hanya DPJP (Dokter) atau superuser (Admin).
  function assertCanVerify(actor: Actor) {
    if (actor.isSuperuser || actor.roles.includes("Dokter")) return;
    throw Errors.forbidden("Verifikasi RAT hanya oleh DPJP (Dokter)");
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<CarePlanMasalahDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // Tambah masalah (+ goal awal opsional) — 1 transaksi.
  async function addMasalah(
    kunjunganId: string, input: MasalahInput, actor: Actor,
  ): Promise<CarePlanMasalahDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = input.pencatat?.trim() || (await resolveActorNama(actor));
    const tanggalInput = input.tanggalInput ? new Date(input.tanggalInput) : new Date();

    const row = await transaction(async (tx) => {
      const m = await dal.createMasalah({
        kunjunganId,
        masalah: input.masalah,
        sumber: input.sumber ?? "Manual",
        refKode: input.refKode ?? "",
        fase: input.fase ?? null,
        prioritas: input.prioritas ?? null,
        status: input.status ?? "Aktif",
        tanggalInput,
        pencatat,
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
      }, tx);

      for (const g of input.goals ?? []) {
        await dal.createGoal({
          masalahId: m.id,
          ppa: g.ppa,
          target: g.target,
          indikator: g.indikator?.trim() ?? "",
          targetWaktu: g.targetWaktu?.trim() ?? "",
          intervensi: cleanList(g.intervensi),
          status: g.status ?? "Belum_Tercapai",
          evaluasi: g.evaluasi?.trim() ?? "",
          waktu: g.waktu ? new Date(g.waktu) : new Date(),
          pencatat,
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
        }, tx);
      }

      const fresh = await dal.findMasalahById(m.id, tx);
      return fresh!;
    });

    return toDTO(row);
  }

  async function updateMasalah(
    kunjunganId: string, masalahId: string, input: MasalahUpdate, actor: Actor,
  ): Promise<CarePlanMasalahDTO> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMasalah(kunjunganId, masalahId);

    const patch: defaultDal.UpdateMasalahData = {};
    setDefined(patch, "masalah", input.masalah);
    setDefined(patch, "sumber", input.sumber);
    setDefined(patch, "refKode", input.refKode);
    if (input.fase !== undefined) patch.fase = input.fase;
    if (input.prioritas !== undefined) patch.prioritas = input.prioritas;
    setDefined(patch, "status", input.status);
    if (input.tanggalInput !== undefined) patch.tanggalInput = new Date(input.tanggalInput);
    setDefined(patch, "pencatat", input.pencatat);

    // Verifikasi co-sign (DPJP). set verifiedAt saat verified→true; bersihkan saat dibatalkan.
    if (input.verified !== undefined) {
      assertCanVerify(actor);
      patch.verified = input.verified;
      if (input.verified) {
        patch.verifiedBy = input.verifiedBy?.trim() || existing.verifiedBy || (await resolveActorNama(actor));
        patch.verifiedAt = existing.verified && existing.verifiedAt ? existing.verifiedAt : new Date();
      } else {
        patch.verifiedBy = null;
        patch.verifiedAt = null;
      }
    } else if (input.verifiedBy !== undefined) {
      patch.verifiedBy = input.verifiedBy.trim();
    }

    if (Object.keys(patch).length > 0) {
      const count = await dal.updateMasalah(masalahId, patch);
      if (count === 0) throw Errors.notFound("Masalah rencana asuhan tidak ditemukan");
    }
    return toDTO(await assertMasalah(kunjunganId, masalahId));
  }

  async function removeMasalah(kunjunganId: string, masalahId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMasalah(kunjunganId, masalahId);
    await dal.softDeleteMasalah(masalahId);
  }

  // ── Goal (anak) ───────────────────────────────────────────────────────────
  async function addGoal(
    kunjunganId: string, masalahId: string, input: GoalInput, actor: Actor,
  ): Promise<CarePlanMasalahDTO> {
    await assertKunjungan(kunjunganId);
    await assertMasalah(kunjunganId, masalahId);
    const pencatat = input.pencatat?.trim() || (await resolveActorNama(actor));
    await dal.createGoal({
      masalahId,
      ppa: input.ppa,
      target: input.target,
      indikator: input.indikator?.trim() ?? "",
      targetWaktu: input.targetWaktu?.trim() ?? "",
      intervensi: cleanList(input.intervensi),
      status: input.status ?? "Belum_Tercapai",
      evaluasi: input.evaluasi?.trim() ?? "",
      waktu: input.waktu ? new Date(input.waktu) : new Date(),
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(await assertMasalah(kunjunganId, masalahId));
  }

  async function assertGoalMilik(masalahId: string, goalId: string): Promise<GoalEntity> {
    const g = await dal.findGoalById(goalId);
    if (!g || g.masalahId !== masalahId || g.deletedAt) {
      throw Errors.notFound("Goal rencana asuhan tidak ditemukan");
    }
    return g;
  }

  async function updateGoal(
    kunjunganId: string, masalahId: string, goalId: string, input: GoalUpdate, _actor: Actor,
  ): Promise<CarePlanMasalahDTO> {
    await assertKunjungan(kunjunganId);
    await assertMasalah(kunjunganId, masalahId);
    await assertGoalMilik(masalahId, goalId);

    const patch: defaultDal.UpdateGoalData = {};
    setDefined(patch, "ppa", input.ppa);
    setDefined(patch, "target", input.target);
    setDefined(patch, "indikator", input.indikator);
    setDefined(patch, "targetWaktu", input.targetWaktu);
    if (input.intervensi !== undefined) patch.intervensi = cleanList(input.intervensi);
    setDefined(patch, "status", input.status);
    setDefined(patch, "evaluasi", input.evaluasi);
    if (input.waktu !== undefined) patch.waktu = new Date(input.waktu);
    setDefined(patch, "pencatat", input.pencatat);

    if (Object.keys(patch).length > 0) {
      const count = await dal.updateGoal(goalId, patch);
      if (count === 0) throw Errors.notFound("Goal rencana asuhan tidak ditemukan");
    }
    return toDTO(await assertMasalah(kunjunganId, masalahId));
  }

  async function removeGoal(
    kunjunganId: string, masalahId: string, goalId: string, _actor: Actor,
  ): Promise<CarePlanMasalahDTO> {
    await assertKunjungan(kunjunganId);
    await assertMasalah(kunjunganId, masalahId);
    await assertGoalMilik(masalahId, goalId);
    await dal.softDeleteGoal(goalId);
    return toDTO(await assertMasalah(kunjunganId, masalahId));
  }

  return { list, addMasalah, updateMasalah, removeMasalah, addGoal, updateGoal, removeGoal };
}

export const carePlanService = makeCarePlanService();
