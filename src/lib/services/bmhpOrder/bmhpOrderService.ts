// bmhpOrderService — tab Order BMHP (permintaan BMHP per kunjungan → depo Farmasi). Create order
// (header + items, append-only) + list per kunjungan + cancel. Pemohon = input.penulis (override)
// atau nama actor (user login). RBAC di Route: clinical.tindakan (create/read) — Dokter & Perawat
// boleh order BMHP (≠ clinical.resep yang dokter-only). ABAC careUnit di route() choke-point
// (clinical.* per kunjungan). Selaras resepService (tanpa telaah/dispensing/TTE — BMHP ≠ obat).

import * as defaultDal from "@/lib/dal/bmhpOrder/bmhpOrderDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { dispenseService } from "@/lib/services/inventory/dispenseService";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { BmhpOrderInput, BmhpOrderDTO, BmhpItemDTO } from "@/lib/schemas/bmhpOrder/bmhpOrder";
import type { BmhpOrderEntity } from "@/lib/dal/bmhpOrder/bmhpOrderDal";

type Dal = typeof defaultDal;
type ItemEntity = BmhpOrderEntity["items"][number];

function toItemDTO(i: ItemEntity): BmhpItemDTO {
  return {
    id: i.id,
    bmhpId: i.bmhpId ?? null,
    kode: i.kode,
    nama: i.nama,
    satuan: i.satuan,
    kategori: i.kategori,
    jumlah: i.jumlah,
    keterangan: i.keterangan ?? null,
    harga: i.harga ?? null,
  };
}

function toDTO(o: BmhpOrderEntity): BmhpOrderDTO {
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    depoKode: o.depoKode ?? null,
    depoNama: o.depoNama,
    catatan: o.catatan ?? null,
    prioritas: o.prioritas,
    status: o.status,
    penulis: o.penulis,
    penulisKontak: o.penulisKontak ?? null,
    items: o.items.map(toItemDTO),
    createdAt: o.createdAt.toISOString(),
  };
}

export function makeBmhpOrderService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<BmhpOrderDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  async function create(
    kunjunganId: string,
    input: BmhpOrderInput,
    actor: Actor,
  ): Promise<BmhpOrderDTO> {
    const k = await assertKunjungan(kunjunganId);
    if (input.items.length === 0) throw Errors.validation("Order minimal berisi 1 BMHP");
    // RJ/Poli → langsung diterima depo (antrean fisik). IGD/RI → "Menunggu" (perlu diterima Farmasi dulu).
    const statusAwal = k.unit === "RawatJalan" ? "Diterima" : "Menunggu";
    const penulis = input.penulis?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      depoKode: input.depoKode ?? null,
      depoNama: input.depoNama,
      catatan: input.catatan ?? null,
      prioritas: input.prioritas,
      status: statusAwal,
      penulis,
      penulisKontak: input.penulisKontak ?? null,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it) => ({
        bmhpId: it.bmhpId ?? null,
        kode: it.kode,
        nama: it.nama,
        satuan: it.satuan,
        kategori: it.kategori,
        jumlah: it.jumlah,
        keterangan: it.keterangan ?? null,
        harga: it.harga ?? null,
      })),
    });
    // BMHP = floor-stock konsumsi langsung di titik layan (tanpa telaah/dispensing Apoteker) →
    // keluarkan stok (OUT) dari depo saat order dibuat. Best-effort NON-BLOCKING; dibalik (IN) saat
    // order dibatalkan (lihat cancel). Beda dari Resep (OUT saat serah Apoteker).
    await dispenseService.dispenseOut({
      locationKode: row.depoKode,
      lines: row.items.map((it) => ({ itemJenis: "BMHP" as const, itemId: it.bmhpId, qty: it.jumlah })),
      refType: "BMHP_ORDER",
      refNo: row.id,
      refId: row.id,
      petugas: penulis,
      actorId: actor.userId,
    });
    return toDTO(row);
  }

  /** Batalkan order BMHP (retraksi pemohon) — hanya saat "Menunggu" (Farmasi belum menerima).
   *  status → Dibatalkan (tetap terlihat di rekam medis sbg audit). */
  async function cancel(kunjunganId: string, bmhpOrderId: string, actor: Actor): Promise<BmhpOrderDTO> {
    await assertKunjungan(kunjunganId);
    const order = await dal.findById(bmhpOrderId);
    if (!order || order.kunjunganId !== kunjunganId || order.deletedAt) throw Errors.notFound("Order BMHP tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Hanya order yang belum diterima Farmasi yang dapat dibatalkan");
    const n = await dal.cancel(bmhpOrderId, kunjunganId);
    if (n === 0) throw Errors.conflict("Order sudah diproses Farmasi — tak bisa dibatalkan");
    // Kembalikan stok yang sempat dikeluarkan saat order dibuat (IN kompensasi, best-effort).
    await dispenseService.reverseDispenseOut("BMHP_ORDER", bmhpOrderId, { petugas: order.penulis, actorId: actor.userId });
    const fresh = await dal.findById(bmhpOrderId);
    return toDTO(fresh!);
  }

  return { list, create, cancel };
}

export const bmhpOrderService = makeBmhpOrderService();
