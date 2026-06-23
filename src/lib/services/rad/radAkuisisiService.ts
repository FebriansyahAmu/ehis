// radAkuisisiService — Akuisisi & Dosis Radiologi (OPSIONAL). Save = insert sesi akuisisi (append-only
// "latest wins"); transisi RadOrder Diterima → Diperiksa (atomik, count diabaikan → opsional, tak
// memblokir ekspertise). RBAC di Route: ancillary.rad.worklist (radiografer pelaksana). Lintas-kunjungan
// (scopeKunjungan:false). ABAC SDM Assignment: aktor HARUS ter-assign Radiologi. Selaras radResultService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/rad/radAkuisisiDal";
import * as radOrderDal from "@/lib/dal/rad/radOrderDal";
import { assertActorAssignedToRad } from "@/lib/services/rad/radAssignment";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  SaveRadAkuisisiInput, RadAkuisisiDTO, RadiograferRefDTO,
  RadParamTeknisInput, RadProteksiInput, RadDosisInput,
} from "@/lib/schemas/rad/radAkuisisi";
import type { RadAkuisisiEntity } from "@/lib/dal/rad/radAkuisisiDal";

type Dal = typeof defaultDal;

// Status order yang boleh simpan akuisisi (sudah diterima, belum divalidasi).
const ENTRY_STATES = ["Diterima", "Diperiksa"] as const;

function toRadiografer(raw: unknown): RadiograferRefDTO[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        pegawaiId: typeof o.pegawaiId === "string" ? o.pegawaiId : "",
        nama: typeof o.nama === "string" ? o.nama : "",
      };
    })
    .filter((r) => r.nama);
}

function asObj<T>(v: unknown): T | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null;
}

function toDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDTO(e: RadAkuisisiEntity): RadAkuisisiDTO {
  return {
    id: e.id,
    radOrderId: e.radOrderId,
    kunjunganId: e.kunjunganId,
    radiografer: toRadiografer(e.radiografer),
    paramTeknis: asObj<RadParamTeknisInput>(e.paramTeknis),
    proteksi: asObj<RadProteksiInput>(e.proteksi),
    dosis: asObj<RadDosisInput>(e.dosis),
    mulaiAt: e.mulaiAt ? e.mulaiAt.toISOString() : null,
    selesaiAt: e.selesaiAt ? e.selesaiAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeRadAkuisisiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Akuisisi terbaru utk 1 order (null bila belum ada). */
  async function getAkuisisi(radId: string, _actor: Actor): Promise<RadAkuisisiDTO | null> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    const row = await dal.findLatestByOrder(radId);
    return row ? toDTO(row) : null;
  }

  /** Simpan sesi akuisisi (opsional) + transisi Diterima → Diperiksa (atomik). */
  async function saveAkuisisi(radId: string, input: SaveRadAkuisisiInput, actor: Actor): Promise<RadAkuisisiDTO> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    if (!ENTRY_STATES.includes(order.status as (typeof ENTRY_STATES)[number])) {
      throw Errors.conflict("Order belum diterima atau sudah divalidasi — akuisisi tak dapat disimpan");
    }
    // ABAC SDM Assignment — radiografer pelaksana HARUS ter-assign ke Radiologi (superuser/global bypass).
    await assertActorAssignedToRad(actor, order.radKode);

    const created = await transaction(async (tx) => {
      const row = await dal.create(
        {
          radOrderId: radId,
          kunjunganId: order.kunjunganId,
          radiografer: input.radiografer ?? [],
          paramTeknis: input.paramTeknis ?? undefined,
          proteksi: input.proteksi ?? undefined,
          dosis: input.dosis ?? undefined,
          mulaiAt: toDate(input.mulaiAt),
          selesaiAt: toDate(input.selesaiAt),
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
        },
        tx,
      );
      // Transisi opsional Diterima → Diperiksa (count diabaikan: sudah Diperiksa = no-op).
      await radOrderDal.transition(radId, ["Diterima"], "Diperiksa", tx);
      return row;
    });

    return toDTO(created);
  }

  return { getAkuisisi, saveAkuisisi };
}

export const radAkuisisiService = makeRadAkuisisiService();
