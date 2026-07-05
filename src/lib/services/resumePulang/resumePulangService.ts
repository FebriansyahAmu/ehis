// resumePulangService — Resume Pulang RI (salinan discharge summary utk pasien, PMK 24/2022).
// Simpan = append baris baru (latest-wins per kunjungan; jejak revisi utuh; revisi baru TANPA
// TTE → dokumen yang diubah pasca-sign wajib ditandatangani ulang). Sign = stamp TTE SEKALI
// pada revisi terkini (guard tteSignedAt IS NULL) — refinement HANYA DPJP (Dokter) di sini
// (route coarse `update`, pola resumeMedik/careplan). pencatat/penanda tangan = actor login.
// RBAC clinical.rekammedis di Route; ABAC careUnit di route().

import { randomUUID } from "crypto";
import * as defaultDal from "@/lib/dal/resumePulang/resumePulangDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { ResumePulangEntity } from "@/lib/dal/resumePulang/resumePulangDal";
import {
  type ResumePulangInput, type ResumePulangDTO,
} from "@/lib/schemas/resumePulang/resumePulang";

type Dal = typeof defaultDal;

function toDTO(e: ResumePulangEntity): ResumePulangDTO {
  return {
    id: e.id,
    ringkasanAnamnesis: e.ringkasanAnamnesis,
    hasilPemeriksaan: e.hasilPemeriksaan,
    terapiDiberikan: e.terapiDiberikan,
    kondisiSaatPulang: e.kondisiSaatPulang,
    instruksiPulang: e.instruksiPulang,
    pembatasanAktivitas: e.pembatasanAktivitas,
    dietPulang: e.dietPulang,
    tandaTanganPasien: e.tandaTanganPasien,
    pencatat: e.pencatat,
    tteToken: e.tteToken ?? null,
    tteSignedBy: e.tteSignedBy ?? null,
    tteSignedAt: e.tteSignedAt ? e.tteSignedAt.toISOString() : null,
    updatedAt: e.createdAt.toISOString(),
  };
}

/** Serial TTE resume pulang (di-encode jadi QR di cetakan). Format: TTE-RSP-<YYMMDD>-<8 heks>. */
function makeTteToken(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `TTE-RSP-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function makeResumePulangService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // Tanda tangan resume pulang hanya DPJP (Dokter) atau superuser/global (Admin).
  function assertCanSign(actor: Actor) {
    if (actor.isSuperuser || actor.isGlobal || actor.roles.includes("Dokter")) return;
    throw Errors.forbidden("Tanda tangan Resume Pulang hanya oleh DPJP (Dokter)");
  }

  /** Revisi terkini (null = belum pernah diisi). */
  async function get(kunjunganId: string, _actor: Actor): Promise<ResumePulangDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latest(kunjunganId);
    return row ? toDTO(row) : null;
  }

  /** Simpan resume (append latest-wins; draft parsial sah; revisi baru = tanpa TTE). */
  async function save(
    kunjunganId: string, input: ResumePulangInput, actor: Actor,
  ): Promise<ResumePulangDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      ringkasanAnamnesis: input.ringkasanAnamnesis,
      hasilPemeriksaan: input.hasilPemeriksaan,
      terapiDiberikan: input.terapiDiberikan,
      kondisiSaatPulang: input.kondisiSaatPulang,
      instruksiPulang: input.instruksiPulang,
      pembatasanAktivitas: input.pembatasanAktivitas,
      dietPulang: input.dietPulang,
      tandaTanganPasien: input.tandaTanganPasien,
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  /** TTE sign-off DPJP — stamp sekali pada revisi terkini. */
  async function sign(kunjunganId: string, actor: Actor): Promise<ResumePulangDTO> {
    await assertKunjungan(kunjunganId);
    assertCanSign(actor);

    const row = await dal.latest(kunjunganId);
    if (!row) throw Errors.notFound("Belum ada resume pulang tersimpan — simpan dulu sebelum menandatangani");
    if (row.tteSignedAt) throw Errors.forbiddenState("Revisi resume pulang ini sudah ditandatangani");

    const signedAt = new Date();
    const count = await dal.signOnce(row.id, {
      tteToken: makeTteToken(signedAt),
      tteSignedBy: await resolveActorNama(actor),
      tteSignedAt: signedAt,
    });
    if (count === 0) throw Errors.conflict("Resume pulang sudah ditandatangani oleh proses lain");

    const signed = await dal.findById(row.id);
    if (!signed) throw Errors.notFound("Resume pulang tidak ditemukan");
    return toDTO(signed);
  }

  return { get, save, sign };
}

export const resumePulangService = makeResumePulangService();
