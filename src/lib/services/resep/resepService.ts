// resepService — tab Resep Pasien (order obat per kunjungan → depo Farmasi). Create order
// (header + items, append-only) + list per kunjungan + worklist Farmasi (lintas-kunjungan).
// Penulis = input.penulis (override) atau nama actor (user login). RBAC di Route:
// clinical.resep (create/read) untuk klinis · ancillary.farmasi.telaah (read) untuk worklist.
// ABAC careUnit di route() choke-point (clinical.* per kunjungan). Selaras tindakanMedisService.

import { randomUUID } from "node:crypto";
import * as defaultDal from "@/lib/dal/resep/resepDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { systemClock, type Clock } from "@/lib/core/clock";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  ResepOrderInput, ResepOrderDTO, ResepItemDTO, ResepOrderFarmasiDTO, FarmasiResepQuery,
  FarmasiTelaahInput, ResepTelaahDTO, TelaahAnswers, TelaahSubstitusiItem,
} from "@/lib/schemas/resep/resep";
import type { ResepOrderEntity, ResepOrderFarmasiEntity, ResepTelaahEntity } from "@/lib/dal/resep/resepDal";

type Dal = typeof defaultDal;
type ItemEntity = ResepOrderEntity["items"][number];

function toItemDTO(i: ItemEntity): ResepItemDTO {
  return {
    id: i.id,
    kodeObat: i.kodeObat,
    namaObat: i.namaObat,
    bzaKode: i.bzaKode ?? null,
    dosis: i.dosis ?? null,
    dosisSekali: i.dosisSekali ?? null,
    signa: i.signa ?? null,
    jumlah: i.jumlah,
    rute: i.rute ?? null,
    aturanPakai: i.aturanPakai ?? null,
    kategori: i.kategori,
    durasiHari: i.durasiHari,
    keterangan: i.keterangan ?? null,
    isHAM: i.isHAM,
  };
}

function toDTO(o: ResepOrderEntity): ResepOrderDTO {
  return {
    id: o.id,
    kunjunganId: o.kunjunganId,
    depoKode: o.depoKode ?? null,
    depoNama: o.depoNama,
    catatan: o.catatan ?? null,
    kondisiGinjal: o.kondisiGinjal ?? null,
    kondisiMenyusui: o.kondisiMenyusui ?? null,
    kondisiKehamilan: o.kondisiKehamilan ?? null,
    prioritas: o.prioritas,
    status: o.status,
    penulis: o.penulis,
    penulisKontak: o.penulisKontak ?? null,
    tteToken: o.tteToken ?? null,
    tteSignedBy: o.tteSignedBy ?? null,
    tteSignedAt: o.tteSignedAt ? o.tteSignedAt.toISOString() : null,
    items: o.items.map(toItemDTO),
    createdAt: o.createdAt.toISOString(),
  };
}

/** Serial TTE (di-encode jadi barcode di resep). Format: TTE-<YYMMDD>-<8 heks>. Mock always-success. */
function makeTteToken(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `TTE-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** enum KunjunganUnit → label FE worklist Farmasi (selaras UNIT_LABEL kunjunganService). */
const UNIT_FE_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
function unitToFe(unit: string): string {
  return UNIT_FE_LABEL[unit] ?? unit;
}

const EMPTY_ANSWERS: TelaahAnswers = { administrasi: {}, farmasetik: {}, klinis: {} };

function toTelaahDTO(t: ResepTelaahEntity): ResepTelaahDTO {
  return {
    id: t.id,
    hasil: t.hasil,
    alasanKembali: t.alasanKembali ?? null,
    catatan: t.catatan ?? null,
    lulusAdministrasi: t.lulusAdministrasi,
    lulusFarmasetik: t.lulusFarmasetik,
    lulusKlinis: t.lulusKlinis,
    answers: (t.answers as unknown as TelaahAnswers) ?? EMPTY_ANSWERS,
    substitusi: (t.substitusi as unknown as TelaahSubstitusiItem[] | null) ?? null,
    justifikasiNonFormularium: (t.justifikasiNonFormularium as unknown as Record<string, string> | null) ?? null,
    lasaKonfirmasi: t.lasaKonfirmasi ?? null,
    apoteker: t.apoteker,
    createdAt: t.createdAt.toISOString(),
  };
}

function toFarmasiDTO(o: ResepOrderFarmasiEntity): ResepOrderFarmasiDTO {
  return {
    ...toDTO(o),
    noOrder: o.kunjungan.noKunjungan,
    noRM: o.kunjungan.pasien.noRm,
    namaPasien: o.kunjungan.pasien.nama,
    unit: unitToFe(o.kunjungan.unit),
    telaah: o.telaahs[0] ? toTelaahDTO(o.telaahs[0]) : null,
  };
}

export function makeResepService(deps: { dal?: Dal; clock?: Clock } = {}) {
  const dal = deps.dal ?? defaultDal;
  const clock = deps.clock ?? systemClock;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<ResepOrderDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  async function create(
    kunjunganId: string,
    input: ResepOrderInput,
    actor: Actor,
  ): Promise<ResepOrderDTO> {
    const k = await assertKunjungan(kunjunganId);
    if (input.items.length === 0) throw Errors.validation("Resep minimal berisi 1 obat");
    // RJ/Poli → langsung worklist (resepsi = antrean fisik). IGD/RI → "Menunggu" (perlu diterima Farmasi dulu).
    const statusAwal = k.unit === "RawatJalan" ? "Diterima" : "Menunggu";
    const penulis = input.penulis?.trim() || (await resolveActorNama(actor));
    // TTE (mock always-success): resep ditanda-tangani elektronik oleh dokter saat dibuat. Hanya
    // role ber-izin clinical.resep:create (Dokter) yang sampai sini → penanda tangan = penulis/DPJP.
    const signedAt = clock.now();
    const row = await dal.create({
      kunjunganId,
      depoKode: input.depoKode ?? null,
      depoNama: input.depoNama,
      catatan: input.catatan ?? null,
      kondisiGinjal: input.kondisiGinjal ?? null,
      kondisiMenyusui: input.kondisiMenyusui ?? null,
      kondisiKehamilan: input.kondisiKehamilan ?? null,
      prioritas: input.prioritas,
      status: statusAwal,
      penulis,
      penulisKontak: input.penulisKontak ?? null,
      tteToken: makeTteToken(signedAt),
      tteSignedBy: penulis,
      tteSignedAt: signedAt,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it) => ({
        kodeObat: it.kodeObat,
        namaObat: it.namaObat,
        bzaKode: it.bzaKode ?? null,
        dosis: it.dosis ?? null,
        dosisSekali: it.dosisSekali ?? null,
        signa: it.signa ?? null,
        jumlah: it.jumlah,
        rute: it.rute ?? null,
        aturanPakai: it.aturanPakai ?? null,
        kategori: it.kategori,
        durasiHari: it.durasiHari,
        keterangan: it.keterangan ?? null,
        isHAM: it.isHAM,
      })),
    });
    return toDTO(row);
  }

  async function listForFarmasi(
    query: FarmasiResepQuery,
    _actor: Actor,
  ): Promise<ResepOrderFarmasiDTO[]> {
    const rows = await dal.listForFarmasi({ depoKode: query.depoKode, status: query.status });
    return rows.map(toFarmasiDTO);
  }

  /** Detail satu order utk halaman Farmasi (telaah/dispensing). Lintas-kunjungan. */
  async function getFarmasiOne(resepId: string, _actor: Actor): Promise<ResepOrderFarmasiDTO> {
    const row = await dal.findByIdWithKunjungan(resepId);
    if (!row) throw Errors.notFound("Order resep tidak ditemukan");
    return toFarmasiDTO(row);
  }

  async function freshFarmasi(resepId: string): Promise<ResepOrderFarmasiDTO> {
    const row = await dal.findByIdWithKunjungan(resepId);
    if (!row) throw Errors.notFound("Order resep tidak ditemukan");
    return toFarmasiDTO(row);
  }

  /** Telaah / pengkajian resep (Apoteker, PMK 72/2016 · QuestionnaireResponse-ready):
   *  "Diterima" → "Ditelaah" (Disetujui) | "Dikembalikan" (ditolak). Persist snapshot telaah
   *  (answers + lulus per-aspek + keputusan) + transisi status ATOMIK (1 transaksi). Guard status. */
  async function telaah(
    resepId: string,
    input: FarmasiTelaahInput,
    actor: Actor,
  ): Promise<ResepOrderFarmasiDTO> {
    const order = await dal.findById(resepId);
    if (!order || order.deletedAt) throw Errors.notFound("Order resep tidak ditemukan");
    if (order.status !== "Diterima") throw Errors.conflict("Telaah hanya untuk order yang sudah diterima Farmasi");
    if (input.result === "Dikembalikan" && !input.alasanKembali) {
      throw Errors.validation("Alasan pengembalian wajib diisi");
    }
    const apoteker = input.apoteker?.trim() || (await resolveActorNama(actor));
    const to = input.result === "Disetujui" ? "Ditelaah" : "Dikembalikan";
    await transaction(async (tx) => {
      const n = await dal.transition(resepId, ["Diterima"], to, tx);
      if (n === 0) throw Errors.conflict("Status order berubah — muat ulang");
      await dal.createTelaah({
        resepOrderId: resepId,
        kunjunganId: order.kunjunganId,
        hasil: input.result,
        alasanKembali: input.alasanKembali ?? null,
        catatan: input.catatan ?? null,
        lulusAdministrasi: input.lulusAdministrasi,
        lulusFarmasetik: input.lulusFarmasetik,
        lulusKlinis: input.lulusKlinis,
        answers: input.answers,
        substitusi: input.substitusi ?? null,
        justifikasiNonFormularium: input.justifikasiNonFormularium ?? null,
        lasaKonfirmasi: input.lasaKonfirmasi ?? null,
        apoteker,
        authorUserId: actor.userId,
        authorPegawaiId: actor.pegawaiId,
      }, tx);
    });
    return freshFarmasi(resepId);
  }

  /** Dispensing & serah (Apoteker) — "Ditelaah" → "Selesai" (obat disiapkan + diserahkan).
   *  Fondasi: hanya transisi status (lot/ED/serah-terima belum dipersist). Guard atomik. */
  async function dispensing(resepId: string, _actor: Actor): Promise<ResepOrderFarmasiDTO> {
    const order = await dal.findById(resepId);
    if (!order || order.deletedAt) throw Errors.notFound("Order resep tidak ditemukan");
    if (order.status !== "Ditelaah") throw Errors.conflict("Dispensing hanya untuk order yang sudah ditelaah & disetujui");
    const n = await dal.transition(resepId, ["Ditelaah"], "Selesai");
    if (n === 0) throw Errors.conflict("Status order berubah — muat ulang");
    return freshFarmasi(resepId);
  }

  /** Terima order (Farmasi) — non-Poli "Menunggu" → "Diterima" → masuk worklist. Lintas-kunjungan
   *  (penunjang berdiri-sendiri, bukan careUnit). Guard atomik: hanya status "Menunggu". */
  async function receive(resepId: string, _actor: Actor): Promise<ResepOrderDTO> {
    const order = await dal.findById(resepId);
    if (!order || order.deletedAt) throw Errors.notFound("Order resep tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Order sudah diterima / diproses Farmasi");
    const n = await dal.receive(resepId);
    if (n === 0) throw Errors.conflict("Order sudah diterima / diproses Farmasi");
    const fresh = await dal.findById(resepId);
    return toDTO(fresh!);
  }

  /** Batalkan order resep (retraksi DPJP) — hanya saat "Menunggu" (Farmasi belum menerima).
   *  status → Dibatalkan (tetap terlihat di rekam medis sbg audit, hilang dari worklist Farmasi). */
  async function cancel(kunjunganId: string, resepId: string, _actor: Actor): Promise<ResepOrderDTO> {
    await assertKunjungan(kunjunganId);
    const order = await dal.findById(resepId);
    if (!order || order.kunjunganId !== kunjunganId || order.deletedAt) throw Errors.notFound("Order resep tidak ditemukan");
    if (order.status !== "Menunggu") throw Errors.conflict("Hanya order yang belum diterima Farmasi yang dapat dibatalkan");
    const n = await dal.cancel(resepId, kunjunganId);
    if (n === 0) throw Errors.conflict("Order sudah diproses Farmasi — tak bisa dibatalkan");
    const fresh = await dal.findById(resepId);
    return toDTO(fresh!);
  }

  return { list, create, listForFarmasi, getFarmasiOne, receive, telaah, dispensing, cancel };
}

export const resepService = makeResepService();
