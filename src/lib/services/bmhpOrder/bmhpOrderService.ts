// bmhpOrderService — tab Order BMHP (permintaan BMHP per kunjungan → depo Farmasi) + worklist
// Farmasi. Create order (header + items, append-only, status awal "Menunggu") + list per kunjungan
// + worklist lintas-kunjungan + TERIMA (Farmasi keluarkan stok) + cancel. Pemohon = input.penulis
// (override) atau nama actor (user login).
//
// RBAC: order di Route = clinical.tindakan (create/read) — Dokter & Perawat boleh order BMHP
// (≠ clinical.resep dokter-only); worklist/terima = ancillary.farmasi.serah (Apoteker, penunjang
// berdiri-sendiri lintas-kunjungan). Selaras resepService (TANPA telaah/dispensing/TTE — BMHP ≠ obat:
// konsumsi langsung, 1 langkah Terima). STOK KELUAR (OUT) saat Terima Farmasi — bukan saat order.

import * as defaultDal from "@/lib/dal/bmhpOrder/bmhpOrderDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { dispenseService } from "@/lib/services/inventory/dispenseService";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  BmhpOrderInput, BmhpOrderDTO, BmhpItemDTO, BmhpOrderFarmasiDTO, FarmasiBmhpQuery,
} from "@/lib/schemas/bmhpOrder/bmhpOrder";
import type { BmhpOrderEntity, BmhpOrderFarmasiEntity } from "@/lib/dal/bmhpOrder/bmhpOrderDal";

type Dal = typeof defaultDal;
type ItemEntity = BmhpOrderEntity["items"][number];

const UNIT_FE_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
function unitToFe(unit: string): string {
  return UNIT_FE_LABEL[unit] ?? unit;
}

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

function toFarmasiDTO(o: BmhpOrderFarmasiEntity): BmhpOrderFarmasiDTO {
  return {
    ...toDTO(o),
    noOrder: o.kunjungan.noKunjungan,
    noRM: o.kunjungan.pasien.noRm,
    namaPasien: o.kunjungan.pasien.nama,
    unit: unitToFe(o.kunjungan.unit),
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
    await assertKunjungan(kunjunganId);
    if (input.items.length === 0) throw Errors.validation("Order minimal berisi 1 BMHP");
    // Semua unit → "Menunggu" (masuk worklist Farmasi). Stok TIDAK keluar di sini — keluar saat
    // Depo menekan Terima (lihat receive). Konsisten: worklist = gerbang pengeluaran.
    const penulis = input.penulis?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      depoKode: input.depoKode ?? null,
      depoNama: input.depoNama,
      catatan: input.catatan ?? null,
      prioritas: input.prioritas,
      status: "Menunggu",
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
    return toDTO(row);
  }

  /** Worklist Farmasi BMHP (lintas-kunjungan). Tanpa filter → order aktif (kecuali Dibatalkan).
   *  noRM → riwayat per pasien (semua status). */
  async function listForFarmasi(query: FarmasiBmhpQuery, _actor: Actor): Promise<BmhpOrderFarmasiDTO[]> {
    const rows = await dal.listForFarmasi({ depoKode: query.depoKode, status: query.status, noRM: query.noRM });
    return rows.map(toFarmasiDTO);
  }

  /** Terima order di Farmasi (Depo) — "Menunggu" → "Selesai" + KELUARKAN stok (OUT) dari depo.
   *  BMHP = konsumsi langsung (1 langkah, tanpa telaah). Transisi status ATOMIK (guard "Menunggu");
   *  OUT best-effort NON-BLOCKING setelah commit (stok kurang/tak ada tak menggagalkan serah —
   *  selaras stance advisory; lihat dispenseService). Lintas-kunjungan (penunjang). */
  async function receive(bmhpOrderId: string, actor: Actor): Promise<BmhpOrderFarmasiDTO> {
    const order = await dal.findById(bmhpOrderId);
    if (!order || order.deletedAt) throw Errors.notFound("Order BMHP tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Order sudah diterima / diproses Farmasi");
    const petugas = await resolveActorNama(actor);
    await transaction(async (tx) => {
      const n = await dal.transition(bmhpOrderId, ["Menunggu"], "Selesai", tx);
      if (n === 0) throw Errors.conflict("Status order berubah — muat ulang");
    });
    // Pengeluaran stok (OUT) dari depo atas BMHP yang diserahkan — best-effort, NON-BLOCKING.
    await dispenseService.dispenseOut({
      locationKode: order.depoKode,
      lines: order.items.map((it) => ({ itemJenis: "BMHP" as const, itemId: it.bmhpId, qty: it.jumlah })),
      refType: "BMHP_ORDER",
      refNo: bmhpOrderId,
      refId: bmhpOrderId,
      petugas,
      actorId: actor.userId,
    });
    const fresh = await dal.findByIdWithKunjungan(bmhpOrderId);
    return toFarmasiDTO(fresh!);
  }

  /** Batalkan order BMHP (retraksi pemohon) — hanya saat "Menunggu" (Farmasi belum menerima, stok
   *  belum keluar → tak perlu reversal). status → Dibatalkan (tetap terlihat di rekam medis sbg audit). */
  async function cancel(kunjunganId: string, bmhpOrderId: string, _actor: Actor): Promise<BmhpOrderDTO> {
    await assertKunjungan(kunjunganId);
    const order = await dal.findById(bmhpOrderId);
    if (!order || order.kunjunganId !== kunjunganId || order.deletedAt) throw Errors.notFound("Order BMHP tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Hanya order yang belum diterima Farmasi yang dapat dibatalkan");
    const n = await dal.cancel(bmhpOrderId, kunjunganId);
    if (n === 0) throw Errors.conflict("Order sudah diproses Farmasi — tak bisa dibatalkan");
    const fresh = await dal.findById(bmhpOrderId);
    return toDTO(fresh!);
  }

  return { list, create, listForFarmasi, receive, cancel };
}

export const bmhpOrderService = makeBmhpOrderService();
