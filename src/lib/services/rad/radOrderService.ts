// radOrderService — tab Order Radiologi (order pemeriksaan rad per kunjungan → Radiologi). Create order
// (header + items, append-only) + list per kunjungan + worklist Rad (lintas-kunjungan) + receive/cancel.
// Penulis = input.penulis (override) atau nama actor (user login). RBAC di Route: clinical.tindakan
// (create/read) untuk klinis · ancillary.rad.worklist (read/update) untuk worklist. ABAC careUnit di
// route() choke-point (clinical.* per kunjungan). Selaras labOrderService.

import * as defaultDal from "@/lib/dal/rad/radOrderDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { radRoster, assertActorAssignedToRad } from "@/lib/services/rad/radAssignment";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  RadOrderInput, RadOrderDTO, RadOrderItemDTO, RadOrderWorklistDTO, RadWorklistQuery, RadPetugasDTO,
} from "@/lib/schemas/rad/radOrder";
import type { RadOrderEntity, RadOrderWorklistEntity } from "@/lib/dal/rad/radOrderDal";

type Dal = typeof defaultDal;
type ItemEntity = RadOrderEntity["items"][number];

function toItemDTO(i: ItemEntity): RadOrderItemDTO {
  return {
    id: i.id,
    radCatalogId: i.radCatalogId ?? null,
    kode: i.kode,
    nama: i.nama,
    modalitas: i.modalitas,
    region: i.region,
    waktuTunggu: i.waktuTunggu ?? null,
    persiapan: i.persiapan ?? null,
    harga: i.harga ?? null,
  };
}

function toDTO(o: RadOrderEntity): RadOrderDTO {
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    radKode: o.radKode ?? null,
    radNama: o.radNama,
    catatan: o.catatan ?? null,
    prioritas: o.prioritas,
    status: o.status,
    penulis: o.penulis,
    penulisKontak: o.penulisKontak ?? null,
    items: o.items.map(toItemDTO),
    createdAt: o.createdAt.toISOString(),
  };
}

/** enum KunjunganUnit → label FE worklist Rad (selaras labOrderService). */
const UNIT_FE_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
function unitToFe(unit: string): string {
  return UNIT_FE_LABEL[unit] ?? unit;
}

function toWorklistDTO(o: RadOrderWorklistEntity): RadOrderWorklistDTO {
  return {
    ...toDTO(o),
    noOrder: o.kunjungan.noKunjungan,
    noRM: o.kunjungan.pasien.noRm,
    namaPasien: o.kunjungan.pasien.nama,
    tanggalLahir: o.kunjungan.pasien.tanggalLahir ? o.kunjungan.pasien.tanggalLahir.toISOString() : null,
    gender: o.kunjungan.pasien.gender as "L" | "P",
    unit: unitToFe(o.kunjungan.unit),
  };
}

export function makeRadOrderService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<RadOrderDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  async function create(
    kunjunganId: string,
    input: RadOrderInput,
    actor: Actor,
  ): Promise<RadOrderDTO> {
    const k = await assertKunjungan(kunjunganId);
    if (input.items.length === 0) throw Errors.validation("Order minimal berisi 1 pemeriksaan");
    // RJ/Poli → langsung worklist (resepsi = antrean fisik). IGD/RI → "Menunggu" (perlu diterima Rad dulu).
    const statusAwal = k.unit === "RawatJalan" ? "Diterima" : "Menunggu";
    const penulis = input.penulis?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      radKode: input.radKode ?? null,
      radNama: input.radNama,
      catatan: input.catatan ?? null,
      prioritas: input.prioritas,
      status: statusAwal,
      penulis,
      penulisKontak: input.penulisKontak ?? null,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it) => ({
        radCatalogId: it.radCatalogId ?? null,
        kode: it.kode,
        nama: it.nama,
        modalitas: it.modalitas,
        region: it.region,
        waktuTunggu: it.waktuTunggu ?? null,
        persiapan: it.persiapan ?? null,
        harga: it.harga ?? null,
      })),
    });
    return toDTO(row);
  }

  async function listForRad(query: RadWorklistQuery, _actor: Actor): Promise<RadOrderWorklistDTO[]> {
    const rows = await dal.listForRad({ radKode: query.radKode, status: query.status, noRM: query.noRM });
    return rows.map(toWorklistDTO);
  }

  /** Detail satu order utk halaman Rad. Lintas-kunjungan. */
  async function getRadOne(radId: string, _actor: Actor): Promise<RadOrderWorklistDTO> {
    const row = await dal.findByIdWithKunjungan(radId);
    if (!row) throw Errors.notFound("Order radiologi tidak ditemukan");
    return toWorklistDTO(row);
  }

  /** Terima order (Rad) — non-Poli "Menunggu" → "Diterima" → masuk worklist. Lintas-kunjungan
   *  (penunjang berdiri-sendiri, bukan careUnit). RBAC di route() + ABAC SDM Assignment: penerima
   *  HARUS ter-assign ke Radiologi (superuser/global bypass). Guard atomik: hanya status "Menunggu". */
  async function receive(radId: string, actor: Actor): Promise<RadOrderDTO> {
    const order = await dal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Order sudah diterima / diproses Rad");
    await assertActorAssignedToRad(actor, order.radKode);
    const n = await dal.receive(radId);
    if (n === 0) throw Errors.conflict("Order sudah diterima / diproses Rad");
    const fresh = await dal.findById(radId);
    return toDTO(fresh!);
  }

  /**
   * Roster petugas Rad utk satu order — pegawai aktif yang DITUGASKAN (SDM Assignment) ke
   * Location Radiologi. Dipakai FE: cek penerima/radiografer/radiolog sudah ter-assign, serta
   * sumber dropdown validator. Order ber-radKode → ruangan spesifik; kosong → semua Location Radiologi.
   */
  async function listPetugas(radId: string, _actor: Actor): Promise<RadPetugasDTO[]> {
    const order = await dal.findById(radId);
    if (!order || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    return radRoster(order.radKode);
  }

  /** Batalkan order rad (retraksi DPJP) — hanya saat "Menunggu" (Rad belum menerima).
   *  status → Dibatalkan (tetap terlihat di rekam medis sbg audit, hilang dari worklist Rad). */
  async function cancel(kunjunganId: string, radId: string, _actor: Actor): Promise<RadOrderDTO> {
    await assertKunjungan(kunjunganId);
    const order = await dal.findById(radId);
    if (!order || order.kunjunganId !== kunjunganId || order.deletedAt) throw Errors.notFound("Order radiologi tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Hanya order yang belum diterima Rad yang dapat dibatalkan");
    const n = await dal.cancel(radId, kunjunganId);
    if (n === 0) throw Errors.conflict("Order sudah diproses Rad — tak bisa dibatalkan");
    const fresh = await dal.findById(radId);
    return toDTO(fresh!);
  }

  return { list, create, listForRad, getRadOne, receive, listPetugas, cancel };
}

export const radOrderService = makeRadOrderService();
