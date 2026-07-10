// rujukanEksternalService — Rujukan Eksternal / Rujukan Keluar (tab Disposisi RJ → Rujuk Eksternal).
// create: nomor auto sistem (No. Rujukan {PPK}{MMYY}B{6}, counter RUJ-<YYMM>, tx); tglBerlakuKunjungan
// (+90h), terbitAt, pencatat di-isi SERVER (pencatat = actor login, anti-spoof). detail JSONB =
// snapshot penuh (RujukanDetail) → sumber CETAK ULANG. remove: soft-delete (batal = koreksi).
// BPJS issuance MOCK (selalu sukses, belum cons-id prod). RBAC clinical.rekammedis (Route) + ABAC
// careUnit (route()). Unit-agnostic. Selaras suratSakitService.

import * as defaultDal from "@/lib/dal/rujukanEksternal/rujukanEksternalDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { RujukanEksternalEntity } from "@/lib/dal/rujukanEksternal/rujukanEksternalDal";
import {
  type RujukanEksternalInput,
  type RujukanEksternalDTO,
  type RujukanDetail,
} from "@/lib/schemas/rujukanEksternal/rujukanEksternal";

type Dal = typeof defaultDal;

// Kode PPK faskes perujuk (RS kita) — mock (belum ada cons-id prod).
const PPK_ASAL = "0301R001";

function toDTO(e: RujukanEksternalEntity): RujukanEksternalDTO {
  return {
    id: e.id,
    nomor: e.nomor,
    pencatat: e.pencatat,
    createdAt: e.createdAt.toISOString(),
    detail: e.detail as unknown as RujukanDetail,
  };
}

/** tglRujukan ("YYYY-MM-DD") + n hari → "YYYY-MM-DD" (timezone-safe, UTC). */
function addDaysISO(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  const end = new Date(t);
  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
}

export function makeRujukanEksternalService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<RujukanEksternalEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Rujukan tidak ditemukan");
    }
    return item;
  }

  /** GET — rujukan keluar aktif per kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<RujukanEksternalDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** POST — terbitkan rujukan (No. Rujukan auto; berlaku/terbit/pencatat server; selalu sukses mock). */
  async function create(
    kunjunganId: string, input: RujukanEksternalInput, actor: Actor,
  ): Promise<RujukanEksternalDTO> {
    await assertKunjungan(kunjunganId);
    const pencatat = await resolveActorNama(actor);
    const now = new Date();
    const yy = String(now.getFullYear() % 100).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const row = await transaction(async (tx) => {
      const seq = await dal.nextSeq(`RUJ-${yy}${mm}`, tx);
      const noRujukan = `${PPK_ASAL}${mm}${yy}B${String(seq).padStart(6, "0")}`;
      const detail: RujukanDetail = {
        noRujukan,
        tglRujukan: input.tglRujukan,
        tglRencanaKunjungan: input.tglRencanaKunjungan,
        tglBerlakuKunjungan: addDaysISO(input.tglRujukan, 90),
        jnsPelayanan: input.jnsPelayanan,
        tipeRujukan: input.tipeRujukan,
        catatan: input.catatan || undefined,
        asalRujukan: { kode: input.asalRujukan.kode || PPK_ASAL, nama: input.asalRujukan.nama },
        tujuanRujukan: input.tujuanRujukan,
        poliTujuan: input.poliTujuan,
        diagnosa: input.diagnosa,
        peserta: input.peserta,
        dokterPerujuk: input.dokterPerujuk,
        noSep: input.noSep || undefined,
        terbitAt: now.toISOString(),
        pencatat,
      };
      return dal.create({
        kunjunganId,
        nomor: noRujukan,
        detail,
        pencatat,
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
      }, tx);
    });
    return toDTO(row);
  }

  /** DELETE — batalkan rujukan (soft-delete; baris dipertahankan + stamp deleted_at). */
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, create, remove };
}

export const rujukanEksternalService = makeRujukanEksternalService();
