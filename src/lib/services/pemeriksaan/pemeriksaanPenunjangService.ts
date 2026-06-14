// pemeriksaanPenunjangService — tab Pemeriksaan, sub Penunjang (diagnostik bedside non-Lab/Rad).
// Daftar hidup: list · add (tambah hasil) · remove (soft-delete; koreksi = hapus + baris baru).
// pemeriksa = input override ATAU nama actor. waktu = input ISO ATAU now() (opsional). tanggal/jam =
// derive TZ Asia/Jakarta. RBAC di Route: clinical.pemeriksaan (read/create/delete). ABAC careUnit
// di route() choke-point (clinical.* + params.id). Selaras penandaanAnatomiService.

import * as defaultDal from "@/lib/dal/pemeriksaan/pemeriksaanPenunjangDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenunjangEntity } from "@/lib/dal/pemeriksaan/pemeriksaanPenunjangDal";
import {
  type PemeriksaanPenunjangInput, type PemeriksaanPenunjangDTO,
} from "@/lib/schemas/pemeriksaan/pemeriksaanPenunjang";

type Dal = typeof defaultDal;

// ── waktu (timestamptz, opsional) → tanggal/jam tampilan (TZ Asia/Jakarta) ──────
const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });

function toDTO(e: PenunjangEntity): PemeriksaanPenunjangDTO {
  return {
    id: e.id,
    jenis: e.jenis,
    keterangan: e.keterangan,
    hasil: e.hasil,
    kesimpulan: e.kesimpulan,
    waktu: e.waktu ? e.waktu.toISOString() : "",
    tanggal: e.waktu ? DATE_FMT.format(e.waktu) : "",
    jam: e.waktu ? TIME_FMT.format(e.waktu) : "",
  };
}

export function makePemeriksaanPenunjangService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<PenunjangEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Pemeriksaan penunjang tidak ditemukan");
    }
    return item;
  }

  // GET — daftar penunjang aktif per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PemeriksaanPenunjangDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 hasil penunjang.
  async function add(
    kunjunganId: string, input: PemeriksaanPenunjangInput, actor: Actor,
  ): Promise<PemeriksaanPenunjangDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      jenis: input.jenis,
      keterangan: input.keterangan?.trim() ?? "",
      hasil: input.hasil.trim(),
      kesimpulan: input.kesimpulan?.trim() ?? "",
      waktu: input.waktu ? new Date(input.waktu) : new Date(),
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  // DELETE — soft-delete (jejak medico-legal).
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, remove };
}

export const pemeriksaanPenunjangService = makePemeriksaanPenunjangService();
