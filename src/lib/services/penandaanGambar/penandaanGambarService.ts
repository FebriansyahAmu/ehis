// penandaanGambarService — tab Penandaan Gambar (status lokalis / body-diagram). Daftar hidup:
// list · add (titik pin / coretan area) · remove (soft-delete, lepas tanda). TANPA edit (koreksi =
// hapus + baris baru). pemeriksa = input override ATAU nama actor. createdAt → "HH:mm" (Asia/Jakarta).
// RBAC di Route: clinical.pemeriksaan (read/create/delete). ABAC careUnit di route() choke-point
// (clinical.* + params.id). Selaras penandaanAnatomiService.

import * as defaultDal from "@/lib/dal/penandaanGambar/penandaanGambarDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenandaanGambarEntity } from "@/lib/dal/penandaanGambar/penandaanGambarDal";
import { type PenandaanGambarInput, type PenandaanGambarDTO } from "@/lib/schemas/penandaanGambar/penandaanGambar";

type Dal = typeof defaultDal;
type Point = { x: number; y: number };

const TIME_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });

// JSONB → titik (defensif: kolom Json bisa apa saja)
function toPoints(v: unknown): Point[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => {
    const o = (p ?? {}) as Record<string, unknown>;
    return typeof o.x === "number" && typeof o.y === "number" ? [{ x: o.x, y: o.y }] : [];
  });
}

function toDTO(e: PenandaanGambarEntity): PenandaanGambarDTO {
  const path = toPoints(e.path);
  return {
    id: e.id,
    mode: e.modelJenis as PenandaanGambarDTO["mode"],
    kind: e.kind as PenandaanGambarDTO["kind"],
    koordinat2d: { x: e.koordinatX, y: e.koordinatY },
    path: path.length ? path : null,
    region: e.region,
    label: e.label,
    deskripsi: e.deskripsi,
    severitas: e.severitas as PenandaanGambarDTO["severitas"],
    pemeriksa: e.pemeriksa,
    createdAt: TIME_FMT.format(e.createdAt),
  };
}

export function makePenandaanGambarService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<PenandaanGambarEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Penandaan gambar tidak ditemukan");
    }
    return item;
  }

  // GET — daftar penanda aktif per kunjungan (urut buat).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenandaanGambarDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penanda (pin / draw).
  async function add(
    kunjunganId: string, input: PenandaanGambarInput, actor: Actor,
  ): Promise<PenandaanGambarDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const path: Point[] = input.kind === "draw" ? (input.path ?? []) : [];
    const row = await dal.create({
      kunjunganId,
      modelJenis: input.mode,
      kind: input.kind,
      koordinatX: input.koordinat2d.x,
      koordinatY: input.koordinat2d.y,
      path,
      region: input.region.trim(),
      label: input.label.trim(),
      deskripsi: input.deskripsi?.trim() ?? "",
      severitas: input.severitas,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  // DELETE — soft-delete (lepas tanda).
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, remove };
}

export const penandaanGambarService = makePenandaanGambarService();
