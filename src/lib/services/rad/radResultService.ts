// radResultService — Ekspertise/Hasil Radiologi (laporan tunggal per RadOrder). Save = insert hasil
// (append-only "latest wins"); finalize=true → transisi RadOrder Diterima/Diperiksa → Divalidasi
// (atomik). Validate = stamp validator + transisi Divalidasi → Selesai. Radiolog = input.radiolog
// (nama SpRad, desain free-text). RBAC di Route: ancillary.rad.expertise. Lintas-kunjungan
// (scopeKunjungan:false). ABAC SDM Assignment: aktor HARUS ter-assign Radiologi. Selaras labResultService.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/rad/radResultDal";
import * as radOrderDal from "@/lib/dal/rad/radOrderDal";
import { assertActorAssignedToRad } from "@/lib/services/rad/radAssignment";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  SaveRadResultInput, ValidateRadResultInput, RadResultDTO, RadCriticalFindingDTO,
} from "@/lib/schemas/rad/radResult";
import type { RadResultEntity } from "@/lib/dal/rad/radResultDal";

type Dal = typeof defaultDal;

// Status order yang boleh entry hasil → transisi ke Divalidasi (saat finalize).
const ENTRY_STATES = ["Diterima", "Diperiksa"] as const;

function toFindings(raw: unknown): RadCriticalFindingDTO[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f, i) => {
    const o = (f ?? {}) as Record<string, unknown>;
    return {
      id: typeof o.id === "string" ? o.id : `cf-${i}`,
      kategori: typeof o.kategori === "string" ? o.kategori : "",
      deskripsi: typeof o.deskripsi === "string" ? o.deskripsi : "",
      metode: (["Telepon", "SMS", "WhatsApp", "Langsung"].includes(o.metode as string)
        ? (o.metode as RadCriticalFindingDTO["metode"]) : null),
      namaDokter: typeof o.namaDokter === "string" ? o.namaDokter : null,
      jamLapor: typeof o.jamLapor === "string" ? o.jamLapor : null,
      pelapor: typeof o.pelapor === "string" ? o.pelapor : null,
      confirmed: o.confirmed === true,
    };
  });
}

function toDTO(e: RadResultEntity): RadResultDTO {
  return {
    id: e.id,
    radOrderId: e.radOrderId,
    kunjunganId: e.kunjunganId,
    indikasiKlinis: e.indikasiKlinis ?? "",
    teknik: e.teknik ?? "",
    temuan: e.temuan ?? "",
    kesan: e.kesan ?? "",
    saran: e.saran ?? null,
    radiolog: e.radiolog,
    radiologSip: e.radiologSip ?? null,
    radiografer: e.radiografer ?? null,
    criticalFindings: toFindings(e.criticalNotifs),
    validator: e.validator ?? null,
    catatanValidator: e.catatanValidator ?? null,
    validatedAt: e.validatedAt ? e.validatedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeRadResultService(deps: { dal?: Dal; clock?: Clock } = {}) {
  const dal = deps.dal ?? defaultDal;
  const clock = deps.clock ?? systemClock;

  /** Hasil terbaru utk 1 order (null bila belum ada). */
  async function getHasil(radId: string, _actor: Actor): Promise<RadResultDTO | null> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    const row = await dal.findLatestByOrder(radId);
    return row ? toDTO(row) : null;
  }

  /** Hasil terbaru utk 1 order DALAM kunjungan (read klinis). Verifikasi order ∈ kunjungan (anti-IDOR). */
  async function getHasilForKunjungan(
    kunjunganId: string,
    radId: string,
    _actor: Actor,
  ): Promise<RadResultDTO | null> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt || order.kunjunganId !== kunjunganId) {
      throw Errors.notFound("Order radiologi tidak ditemukan");
    }
    const row = await dal.findLatestByOrder(radId);
    return row ? toDTO(row) : null;
  }

  /** Simpan ekspertise. finalize=false → draft (status tetap). finalize=true → terbitkan → Divalidasi. */
  async function saveHasil(radId: string, input: SaveRadResultInput, actor: Actor): Promise<RadResultDTO> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    if (!ENTRY_STATES.includes(order.status as (typeof ENTRY_STATES)[number])) {
      throw Errors.conflict("Order belum siap entry hasil atau sudah divalidasi");
    }
    // ABAC SDM Assignment — penulis ekspertise HARUS ter-assign ke Radiologi (superuser/global bypass).
    await assertActorAssignedToRad(actor, order.radKode);
    if (input.finalize) {
      if (!input.temuan.trim() || !input.kesan.trim()) throw Errors.validation("Temuan & Kesan wajib diisi sebelum diterbitkan");
      if (!input.radiolog.trim()) throw Errors.validation("Nama SpRad wajib diisi");
    }

    const created = await transaction(async (tx) => {
      const row = await dal.create(
        {
          radOrderId: radId,
          kunjunganId: order.kunjunganId,
          indikasiKlinis: input.indikasiKlinis ?? null,
          teknik: input.teknik ?? null,
          temuan: input.temuan ?? null,
          kesan: input.kesan ?? null,
          saran: input.saran ?? null,
          radiolog: input.radiolog ?? "",
          radiologSip: input.radiologSip ?? null,
          radiografer: input.radiografer ?? null,
          authorUserId: actor.userId,
          authorPegawaiId: actor.pegawaiId,
          criticalNotifs: input.criticalFindings ?? null,
        },
        tx,
      );
      if (input.finalize) {
        const n = await radOrderDal.transition(radId, [...ENTRY_STATES], "Divalidasi", tx);
        if (n === 0) throw Errors.conflict("Status order berubah — muat ulang halaman");
      }
      return row;
    });

    return toDTO(created);
  }

  /** Validasi hasil (SpRad) — stamp validator + transisi order Divalidasi → Selesai (atomik). */
  async function validate(radId: string, input: ValidateRadResultInput, actor: Actor): Promise<RadResultDTO> {
    const order = await radOrderDal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    if (order.status !== "Divalidasi") throw Errors.conflict("Order belum siap divalidasi atau sudah selesai");
    const latest = await dal.findLatestByOrder(radId);
    if (!latest) throw Errors.conflict("Belum ada hasil untuk divalidasi");
    // ABAC SDM Assignment — aktor validator HARUS ter-assign ke Radiologi (superuser/global bypass).
    await assertActorAssignedToRad(actor, order.radKode);

    const result = await transaction(async (tx) => {
      const c = await dal.stampValidation(
        latest.id,
        {
          validator: input.validator.trim(),
          validatorUserId: actor.userId,
          catatanValidator: input.catatanValidator ?? null,
          validatedAt: clock.now(),
        },
        tx,
      );
      if (c === 0) throw Errors.conflict("Hasil sudah divalidasi");
      const n = await radOrderDal.transition(radId, ["Divalidasi"], "Selesai", tx);
      if (n === 0) throw Errors.conflict("Status order berubah — muat ulang halaman");
      const fresh = await dal.findLatestByOrder(radId);
      if (!fresh) throw Errors.internal("Gagal memuat hasil pasca-validasi");
      return fresh;
    });

    return toDTO(result);
  }

  return { getHasil, getHasilForKunjungan, saveHasil, validate };
}

export const radResultService = makeRadResultService();
