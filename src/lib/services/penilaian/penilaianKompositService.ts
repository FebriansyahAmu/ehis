// penilaianKompositService — tab Penilaian, sub-menu Jantung / Kanker (asesmen spesifik-penyakit).
// Append-only: list (riwayat, filter jenis) + add (baris baru). `data` = snapshot JSONB utuh
// (narasi+vocab+klasifikasi master). pemeriksa = input override ATAU nama actor. tanggal/waktu
// derive dari createdAt (TZ Asia/Jakarta). RBAC di Route: clinical.penilaian (read/create).
// Selaras penilaianSkalaService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianKompositDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianKompositEntity } from "@/lib/dal/penilaian/penilaianKompositDal";
import {
  type PenilaianKompositInput, type PenilaianKompositDTO,
} from "@/lib/schemas/penilaian/penilaianKomposit";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

function toData(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toDTO(e: PenilaianKompositEntity): PenilaianKompositDTO {
  return {
    id: e.id,
    jenis: e.jenis as PenilaianKompositDTO["jenis"],
    ringkasan: e.ringkasan,
    data: toData(e.data),
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianKompositService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian komposit per kunjungan (filter jenis opsional, terbaru dulu).
  async function list(kunjunganId: string, jenis: string | undefined, _actor: Actor): Promise<PenilaianKompositDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId, jenis);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penilaian komposit (append-only).
  async function add(
    kunjunganId: string, input: PenilaianKompositInput, actor: Actor,
  ): Promise<PenilaianKompositDTO> {
    await assertKunjungan(kunjunganId);

    const data = input.data ?? {};
    const ringkasan = input.ringkasan?.trim() ?? "";
    if (ringkasan === "" && Object.keys(data).length === 0) {
      throw Errors.validation("Isi minimal satu bagian penilaian");
    }

    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      jenis: input.jenis,
      ringkasan,
      data: data as object,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { list, add };
}

export const penilaianKompositService = makePenilaianKompositService();
