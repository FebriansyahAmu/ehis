// resumeMedikService — Resume Medik Rawat Inap (kelengkapan RM + klaim BPJS, PMK 269/2008).
// Simpan = append baris baru (latest-wins per kunjungan; jejak revisi utuh; revisi baru
// TANPA TTE → dokumen yang diubah pasca-sign wajib ditandatangani ulang). Sign = stamp TTE
// SEKALI pada revisi terkini (guard tteSignedAt IS NULL) — refinement HANYA DPJP (Dokter)
// di sini (route coarse `update`, pola careplan verify). pencatat/penanda tangan = actor
// login (server-otoritatif). RBAC clinical.rekammedis di Route; ABAC careUnit di route().

import { randomUUID } from "crypto";
import * as defaultDal from "@/lib/dal/resumeMedik/resumeMedikDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as spriDal from "@/lib/dal/spri/spriDal";
import * as diagnosaDal from "@/lib/dal/diagnosa/diagnosaDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import { Prisma } from "@/generated/prisma/client";
import type { ResumeMedikEntity } from "@/lib/dal/resumeMedik/resumeMedikDal";
import {
  type ResumeMedikInput, type ResumeMedikDTO, type DataKlinisSnapshot, type AsalMasukDTO,
} from "@/lib/schemas/resumeMedik/resumeMedik";

type Dal = typeof defaultDal;

function toDTO(e: ResumeMedikEntity): ResumeMedikDTO {
  return {
    id: e.id,
    asalMasuk: e.asalMasuk,
    tanggalMasukIgd: e.tanggalMasukIgd,
    diagnosisIgd: e.diagnosisIgd,
    kondisiMasuk: e.kondisiMasuk,
    kondisiPulang: e.kondisiPulang,
    ringkasanKlinis: e.ringkasanKlinis,
    dataKlinis: (e.dataKlinis as unknown as DataKlinisSnapshot | null) ?? null, // JSONB ditulis via Zod
    pencatat: e.pencatat,
    tteToken: e.tteToken ?? null,
    tteSignedBy: e.tteSignedBy ?? null,
    tteSignedAt: e.tteSignedAt ? e.tteSignedAt.toISOString() : null,
    updatedAt: e.createdAt.toISOString(),
  };
}

/** Serial TTE resume medik (di-encode jadi QR di cetakan). Format: TTE-RSM-<YYMMDD>-<8 heks>. */
function makeTteToken(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `TTE-RSM-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function makeResumeMedikService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // Tanda tangan resume medik hanya DPJP (Dokter) atau superuser/global (Admin).
  function assertCanSign(actor: Actor) {
    if (actor.isSuperuser || actor.isGlobal || actor.roles.includes("Dokter")) return;
    throw Errors.forbidden("Tanda tangan Resume Medik hanya oleh DPJP (Dokter)");
  }

  /**
   * Deteksi asal masuk dari rantai admisi: SPRI yang dikonsumsi kunjungan RI ini →
   * kunjungan asal SPRI (IGD/Poliklinik) + waktu masuk + dx utama. Tanpa SPRI
   * (admisi langsung / transfer) → terdeteksi=false, FE fallback isian manual.
   */
  async function getAsalMasuk(kunjunganId: string, _actor: Actor): Promise<AsalMasukDTO> {
    await assertKunjungan(kunjunganId);
    const kosong: AsalMasukDTO = {
      terdeteksi: false, asalMasuk: "", tanggalMasuk: null, diagnosisAsal: "", noKunjunganAsal: "",
    };

    const spri = await spriDal.findConsumedByRiKunjungan(kunjunganId);
    if (!spri) return kosong;
    const asal = await kunjunganDal.findById(spri.kunjunganId);
    if (!asal) return kosong;

    const unitMap: Record<string, AsalMasukDTO["asalMasuk"]> = { IGD: "IGD", RawatJalan: "Poliklinik" };
    const asalMasuk = unitMap[asal.unit];
    if (!asalMasuk) return kosong;

    const dx = await diagnosaDal.listUtamaByKunjunganIds([asal.id]);
    return {
      terdeteksi: true,
      asalMasuk,
      tanggalMasuk: asal.createdAt.toISOString(),
      diagnosisAsal: dx[0] ? `${dx[0].namaDiagnosis} (${dx[0].kodeIcd10})` : "",
      noKunjunganAsal: asal.noKunjungan,
    };
  }

  /** Revisi terkini (null = belum pernah diisi). */
  async function get(kunjunganId: string, _actor: Actor): Promise<ResumeMedikDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latest(kunjunganId);
    return row ? toDTO(row) : null;
  }

  /** Simpan resume (append latest-wins; draft parsial sah; revisi baru = tanpa TTE). */
  async function save(
    kunjunganId: string, input: ResumeMedikInput, actor: Actor,
  ): Promise<ResumeMedikDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      asalMasuk: input.asalMasuk,
      tanggalMasukIgd: input.tanggalMasukIgd,
      diagnosisIgd: input.diagnosisIgd,
      kondisiMasuk: input.kondisiMasuk,
      kondisiPulang: input.kondisiPulang,
      ringkasanKlinis: input.ringkasanKlinis,
      dataKlinis: input.dataKlinis === null
        ? Prisma.JsonNull
        : (input.dataKlinis as unknown as Prisma.InputJsonValue),
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  /** TTE sign-off DPJP — stamp sekali pada revisi terkini. */
  async function sign(kunjunganId: string, actor: Actor): Promise<ResumeMedikDTO> {
    await assertKunjungan(kunjunganId);
    assertCanSign(actor);

    const row = await dal.latest(kunjunganId);
    if (!row) throw Errors.notFound("Belum ada resume medik tersimpan — simpan dulu sebelum menandatangani");
    if (row.tteSignedAt) throw Errors.forbiddenState("Revisi resume medik ini sudah ditandatangani");

    const signedAt = new Date();
    const count = await dal.signOnce(row.id, {
      tteToken: makeTteToken(signedAt),
      tteSignedBy: await resolveActorNama(actor),
      tteSignedAt: signedAt,
    });
    if (count === 0) throw Errors.conflict("Resume medik sudah ditandatangani oleh proses lain");

    const signed = await dal.findById(row.id);
    if (!signed) throw Errors.notFound("Resume medik tidak ditemukan");
    return toDTO(signed);
  }

  return { get, save, sign, getAsalMasuk };
}

export const resumeMedikService = makeResumeMedikService();
