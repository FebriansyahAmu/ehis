// labOrderService — tab Order Lab (order pemeriksaan lab per kunjungan → Laboratorium). Create order
// (header + items, append-only) + list per kunjungan + worklist Lab (lintas-kunjungan) + receive/cancel.
// Penulis = input.penulis (override) atau nama actor (user login). RBAC di Route: clinical.tindakan
// (create/read) untuk klinis · ancillary.lab.worklist (read/update) untuk worklist. ABAC careUnit di
// route() choke-point (clinical.* per kunjungan). Selaras resepService.

import * as defaultDal from "@/lib/dal/lab/labOrderDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { labRoster, assertActorAssignedToLab } from "@/lib/services/lab/labAssignment";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  LabOrderInput, LabOrderDTO, LabOrderItemDTO, LabOrderWorklistDTO, LabWorklistQuery, LabPetugasDTO,
} from "@/lib/schemas/lab/labOrder";
import type { LabOrderEntity, LabOrderWorklistEntity } from "@/lib/dal/lab/labOrderDal";

type Dal = typeof defaultDal;
type ItemEntity = LabOrderEntity["items"][number];

function toItemDTO(i: ItemEntity): LabOrderItemDTO {
  return {
    id: i.id,
    labTestId: i.labTestId ?? null,
    kodeTes: i.kodeTes,
    namaTes: i.namaTes,
    kategori: i.kategori,
    waktuTunggu: i.waktuTunggu ?? null,
    harga: i.harga ?? null,
  };
}

function toDTO(o: LabOrderEntity): LabOrderDTO {
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    labKode: o.labKode ?? null,
    labNama: o.labNama,
    catatan: o.catatan ?? null,
    prioritas: o.prioritas,
    status: o.status,
    penulis: o.penulis,
    penulisKontak: o.penulisKontak ?? null,
    items: o.items.map(toItemDTO),
    createdAt: o.createdAt.toISOString(),
  };
}

/** enum KunjunganUnit → label FE worklist Lab (selaras UNIT_FE_LABEL resepService). */
const UNIT_FE_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
function unitToFe(unit: string): string {
  return UNIT_FE_LABEL[unit] ?? unit;
}

function toWorklistDTO(o: LabOrderWorklistEntity): LabOrderWorklistDTO {
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

export function makeLabOrderService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<LabOrderDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  async function create(
    kunjunganId: string,
    input: LabOrderInput,
    actor: Actor,
  ): Promise<LabOrderDTO> {
    const k = await assertKunjungan(kunjunganId);
    if (input.items.length === 0) throw Errors.validation("Order minimal berisi 1 pemeriksaan");
    // RJ/Poli → langsung worklist (resepsi = antrean fisik). IGD/RI → "Menunggu" (perlu diterima Lab dulu).
    const statusAwal = k.unit === "RawatJalan" ? "Diterima" : "Menunggu";
    const penulis = input.penulis?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      labKode: input.labKode ?? null,
      labNama: input.labNama,
      catatan: input.catatan ?? null,
      prioritas: input.prioritas,
      status: statusAwal,
      penulis,
      penulisKontak: input.penulisKontak ?? null,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it) => ({
        labTestId: it.labTestId ?? null,
        kodeTes: it.kodeTes,
        namaTes: it.namaTes,
        kategori: it.kategori,
        waktuTunggu: it.waktuTunggu ?? null,
        harga: it.harga ?? null,
      })),
    });
    return toDTO(row);
  }

  async function listForLab(query: LabWorklistQuery, _actor: Actor): Promise<LabOrderWorklistDTO[]> {
    const rows = await dal.listForLab({ labKode: query.labKode, status: query.status, noRM: query.noRM });
    return rows.map(toWorklistDTO);
  }

  /** Detail satu order utk halaman Lab. Lintas-kunjungan. */
  async function getLabOne(labId: string, _actor: Actor): Promise<LabOrderWorklistDTO> {
    const row = await dal.findByIdWithKunjungan(labId);
    if (!row) throw Errors.notFound("Order lab tidak ditemukan");
    return toWorklistDTO(row);
  }

  /** Terima order (Lab) — non-Poli "Menunggu" → "Diterima" → masuk worklist. Lintas-kunjungan
   *  (penunjang berdiri-sendiri, bukan careUnit). RBAC di route() + ABAC SDM Assignment: penerima
   *  HARUS ter-assign ke Lab (superuser/global bypass). Guard atomik: hanya status "Menunggu". */
  async function receive(labId: string, actor: Actor): Promise<LabOrderDTO> {
    const order = await dal.findById(labId);
    if (!order || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Order sudah diterima / diproses Lab");
    await assertActorAssignedToLab(actor, order.labKode);
    const n = await dal.receive(labId);
    if (n === 0) throw Errors.conflict("Order sudah diterima / diproses Lab");
    const fresh = await dal.findById(labId);
    return toDTO(fresh!);
  }

  /**
   * Roster petugas Lab utk satu order — pegawai aktif yang DITUGASKAN (SDM Assignment) ke
   * Location Laboratorium. Dipakai FE: cek penerima (Penerimaan) & analis (Entry Hasil)
   * sudah ter-assign, serta sumber dropdown validator (filter dokter di klien).
   * Order ber-labKode → ruangan spesifik; bila kosong → semua Location tipe Laboratorium.
   */
  async function listPetugas(labId: string, _actor: Actor): Promise<LabPetugasDTO[]> {
    const order = await dal.findById(labId);
    if (!order || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    return labRoster(order.labKode);
  }

  /** Batalkan order lab (retraksi DPJP) — hanya saat "Menunggu" (Lab belum menerima).
   *  status → Dibatalkan (tetap terlihat di rekam medis sbg audit, hilang dari worklist Lab). */
  async function cancel(kunjunganId: string, labId: string, _actor: Actor): Promise<LabOrderDTO> {
    await assertKunjungan(kunjunganId);
    const order = await dal.findById(labId);
    if (!order || order.kunjunganId !== kunjunganId || order.deletedAt) throw Errors.notFound("Order lab tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Hanya order yang belum diterima Lab yang dapat dibatalkan");
    const n = await dal.cancel(labId, kunjunganId);
    if (n === 0) throw Errors.conflict("Order sudah diproses Lab — tak bisa dibatalkan");
    const fresh = await dal.findById(labId);
    return toDTO(fresh!);
  }

  return { list, create, listForLab, getLabOne, receive, listPetugas, cancel };
}

export const labOrderService = makeLabOrderService();
