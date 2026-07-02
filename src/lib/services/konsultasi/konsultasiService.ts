// konsultasiService — Konsultasi antar-SMF (closed-loop SBAR, SNARS SKP 2).
// Peminta (tab klinis): create (dokterPeminta = actor) · konfirmasi Selesai (read-back DPJP) ·
// batal saat Terkirim. Konsultan (worklist RJ, lintas careUnit): terima (stamp sekali) · jawab —
// jawaban + AUTO-CPPT ke kunjungan asal dalam 1 transaksi (bangsal lihat advis di timeline CPPT).
// Semua nama aktor server-otoritatif (resolveActorNama). RBAC clinical.konsultasi di Route;
// endpoint nested kena ABAC careUnit, worklist scopeKunjungan:false (pola ancillary).

import * as defaultDal from "@/lib/dal/konsultasi/konsultasiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as cpptDal from "@/lib/dal/cppt/cpptDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { KonsultasiEntity } from "@/lib/dal/konsultasi/konsultasiDal";
import {
  type KonsultasiCreateInput, type KonsultasiJawabInput, type KonsultasiWorklistQuery,
  type KonsultasiDTO, type KonsultasiWorklistDTO,
  type KonsultasiUrgency, type KonsultasiStatus,
} from "@/lib/schemas/konsultasi/konsultasi";

type Dal = typeof defaultDal;

function asUrgency(v: string): KonsultasiUrgency {
  return v === "CITO" || v === "Urgen" ? v : "Rutin";
}

function asStatus(v: string): KonsultasiStatus {
  return v === "Diterima" || v === "Dijawab" || v === "Selesai" || v === "Ditolak" ? v : "Terkirim";
}

const hhmm = (d: Date | null) => (d ? d.toISOString().slice(11, 16) : undefined);

function toDTO(e: KonsultasiEntity): KonsultasiDTO {
  const iso = e.createdAt.toISOString();
  return {
    id: e.id,
    kunjunganId: e.kunjunganId,
    noRM: e.kunjungan.pasien.noRm,
    tanggalRequest: iso.slice(0, 10),
    waktuRequest: iso.slice(11, 16),
    urgency: asUrgency(e.urgency),
    smfId: e.smfId,
    smfNama: e.smfNama,
    smfSingkatan: e.smfSingkatan,
    dokterKonsultan: e.dokterKonsultan ?? undefined,
    dokterPeminta: e.dokterPeminta,
    situation: e.situation,
    background: e.background,
    assessment: e.assessment,
    recommendation: e.recommendation,
    status: asStatus(e.status),
    waktuDiterima: hhmm(e.diterimaAt),
    waktuDijawab: hhmm(e.dijawabAt),
    waktuSelesai: hhmm(e.selesaiAt),
    jawaban: e.dijawabAt
      ? {
          konsultan: e.konsultanNama ?? "",
          asesmen: e.jawabanAsesmen,
          rekomendasi: e.jawabanRekomendasi,
          tindakLanjut: e.jawabanTindakLanjut,
          followUp: e.jawabanFollowUp ?? undefined,
        }
      : undefined,
  };
}

function toWorklistDTO(e: KonsultasiEntity): KonsultasiWorklistDTO {
  return {
    ...toDTO(e),
    pasienNama: e.kunjungan.pasien.nama,
    unitAsal: e.kunjungan.unit,
    noKunjungan: e.kunjungan.noKunjungan,
  };
}

export function makeKonsultasiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Item milik kunjungan (anti-IDOR endpoint nested). */
  async function findInKunjungan(kunjunganId: string, itemId: string) {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId) {
      throw Errors.notFound("Konsultasi tidak ditemukan pada kunjungan ini");
    }
    return item;
  }

  // ── Sisi peminta (tab klinis, careUnit ABAC) ─────────────────────────────

  async function listForKunjungan(kunjunganId: string, _actor: Actor): Promise<KonsultasiDTO[]> {
    await assertKunjungan(kunjunganId);
    return (await dal.listByKunjungan(kunjunganId)).map(toDTO);
  }

  async function create(kunjunganId: string, input: KonsultasiCreateInput, actor: Actor): Promise<KonsultasiDTO> {
    await assertKunjungan(kunjunganId);
    const dokterPeminta = input.dokterPeminta?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      urgency: input.urgency,
      smfId: input.smfId,
      smfNama: input.smfNama,
      smfSingkatan: input.smfSingkatan,
      dokterKonsultan: input.dokterKonsultan ?? null,
      situation: input.situation,
      background: input.background ?? "",
      assessment: input.assessment ?? "",
      recommendation: input.recommendation,
      dokterPeminta,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  /** Konfirmasi selesai (read-back) oleh DPJP peminta. */
  async function selesai(kunjunganId: string, itemId: string, actor: Actor): Promise<KonsultasiDTO> {
    await assertKunjungan(kunjunganId);
    await findInKunjungan(kunjunganId, itemId);
    const oleh = await resolveActorNama(actor);
    const n = await dal.selesai(itemId, oleh);
    if (n === 0) throw Errors.conflict("Konsultasi belum dijawab atau sudah selesai");
    return toDTO((await dal.findById(itemId))!);
  }

  /** Batalkan permintaan — hanya saat masih Terkirim. */
  async function batal(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await findInKunjungan(kunjunganId, itemId);
    const n = await dal.softDelete(itemId);
    if (n === 0) throw Errors.conflict("Konsultasi sudah diterima konsultan — tidak bisa dibatalkan");
  }

  // ── Sisi konsultan (worklist, lintas careUnit) ───────────────────────────

  async function listWorklist(query: KonsultasiWorklistQuery, _actor: Actor): Promise<KonsultasiWorklistDTO[]> {
    const status = query.status ?? "aktif";
    const statuses =
      status === "semua" ? undefined
      : status === "aktif" ? ["Terkirim", "Diterima"]
      : [status];
    return (await dal.listWorklist(statuses)).map(toWorklistDTO);
  }

  async function getById(id: string, _actor: Actor): Promise<KonsultasiWorklistDTO> {
    const item = await dal.findById(id);
    if (!item) throw Errors.notFound("Konsultasi tidak ditemukan");
    return toWorklistDTO(item);
  }

  /** Terima (stamp sekali) oleh konsultan. */
  async function terima(id: string, actor: Actor): Promise<KonsultasiWorklistDTO> {
    const item = await dal.findById(id);
    if (!item) throw Errors.notFound("Konsultasi tidak ditemukan");
    const oleh = await resolveActorNama(actor);
    const n = await dal.terima(id, oleh);
    if (n === 0) throw Errors.conflict("Konsultasi sudah diterima atau tidak lagi menunggu");
    return toWorklistDTO((await dal.findById(id))!);
  }

  /** Jawab + AUTO-CPPT ke kunjungan asal (1 transaksi). */
  async function jawab(id: string, input: KonsultasiJawabInput, actor: Actor): Promise<KonsultasiWorklistDTO> {
    const item = await dal.findById(id);
    if (!item) throw Errors.notFound("Konsultasi tidak ditemukan");
    const konsultan = input.konsultan?.trim() || (await resolveActorNama(actor));

    await transaction(async (tx) => {
      const n = await dal.jawab(id, {
        konsultanNama: konsultan,
        konsultanUserId: actor.userId,
        konsultanPegawaiId: actor.pegawaiId,
        jawabanAsesmen: input.asesmen,
        jawabanRekomendasi: input.rekomendasi,
        jawabanTindakLanjut: input.tindakLanjut,
        jawabanFollowUp: input.followUp ?? null,
      }, tx);
      if (n === 0) throw Errors.conflict("Konsultasi belum diterima atau sudah dijawab");

      // Auto-CPPT: advis konsultan tercatat di timeline kunjungan asal (SNARS SKP 2).
      await cpptDal.create({
        kunjunganId: item.kunjunganId,
        profesi: "Dokter",
        penulis: konsultan,
        jenisCatatan: "SOAP",
        subjektif: `Jawaban konsultasi SMF ${item.smfNama} atas permintaan ${item.dokterPeminta}.`,
        objektif: null,
        asesmen: input.asesmen,
        planning: input.rekomendasi,
        instruksi: input.followUp
          ? `${input.tindakLanjut}\nKontrol kembali: ${input.followUp}`
          : input.tindakLanjut,
        verified: null,
        flagged: false,
        waktuCatatan: new Date(),
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
      }, tx);
    });

    return toWorklistDTO((await dal.findById(id))!);
  }

  return { listForKunjungan, create, selesai, batal, listWorklist, getById, terima, jawab };
}

export const konsultasiService = makeKonsultasiService();
