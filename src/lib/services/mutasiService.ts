// mutasiService — pindah ruangan/bed dalam kunjungan yang sama (IGD · Rawat Inap).
//
// Alur dua tahap (pola admisi RI: reservasi → terima):
//   ajukan    : bed tujuan di-RESERVE (BedAllocation Reserved) — bed asal tetap Occupied.
//   selesai   : bed asal Released → reservasi tujuan Occupied → pointer kunjungan
//               (ruanganId/bedId; RI juga kelas kamar) dipindah → enqueue sinkron Encounter.
//   batal     : reservasi tujuan Released.
// Pulang/batal kunjungan → bedAllocationService.release membatalkan mutasi Diajukan otomatis.
// Lembar transfer (opsional) = snapshot JSONB, bisa diisi saat Diajukan atau sesudah Selesai.
//
// Ruang lingkup tujuan: IGD → ruangan IGD + ruang rawat inap (penempatan fisik; kunjungan tetap
// IGD, kelas tak diubah, admisi RI tetap via SPRI); RI → Rawat_Inap/ICU/HCU/Isolasi.

import type { Prisma } from "@/generated/prisma/client";
import * as defaultDal from "@/lib/dal/mutasiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as ruanganDal from "@/lib/dal/ruanganDal";
import * as bedAllocationDal from "@/lib/dal/bedAllocationDal";
import { bedAllocationService } from "@/lib/services/bedAllocationService";
import * as fhirOutbox from "@/lib/services/fhir/outboxEnqueue";
import { resolveActorNama } from "@/lib/services/actorName";
import { parseClientDateTime } from "@/lib/time/rsTime";
import { systemClock, type Clock } from "@/lib/core/clock";
import { transaction, type Tx } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { MutasiEntity } from "@/lib/dal/mutasiDal";
import type {
  AjukanMutasiInput, BatalMutasiInput, BedState, LembarTransferData, LembarTransferInput, LokasiDTO,
  MutasiDTO, MutasiOpsiDTO, MutasiRoomDTO, MutasiStateDTO,
} from "@/lib/schemas/mutasi";

type LocationType = Parameters<typeof ruanganDal.listLocationsByType>[0];
type KelasRawat = NonNullable<kunjunganDal.UpdateLokasiPatch["kelas"]>;

const RI_TYPES: LocationType[] = ["Rawat_Inap", "ICU", "HCU", "Isolasi"];

// IGD boleh ke ruangan IGD lain ATAU ruang rawat inap (penempatan fisik saja — kunjungan tetap IGD;
// admisi RI tetap lewat SPRI). Bed RI dilepas saat kunjungan IGD selesai → admisi bisa mereservasi.
const TUJUAN: Record<string, LocationType[]> = {
  IGD: ["IGD", ...RI_TYPES],
  RawatInap: RI_TYPES,
};

/** Kelas kamar efektif ruangan RI (selaras roomKelas di admisi RI). Ruangan non-RI → null. */
function kelasOf(loc: { locationType: string; kelas: string | null }): KelasRawat | null {
  if (!RI_TYPES.includes(loc.locationType as LocationType)) return null;
  if (loc.locationType === "ICU" || loc.locationType === "HCU" || loc.locationType === "Isolasi") {
    return loc.locationType;
  }
  return (loc.kelas as KelasRawat | null) ?? "Kelas_3";
}

function toDTO(m: MutasiEntity): MutasiDTO {
  return {
    id: m.id,
    status: m.status,
    dari: { ruanganId: m.dariRuanganId, ruanganNama: m.dariRuanganNama, bedId: m.dariBedId, bedKode: m.dariBedKode, kelas: m.dariKelas },
    ke: { ruanganId: m.keRuanganId, ruanganNama: m.keRuanganNama, bedId: m.keBedId, bedKode: m.keBedKode, kelas: m.keKelas },
    alasan: m.alasan,
    catatan: m.catatan,
    diajukanOleh: m.diajukanOleh,
    diajukanAt: m.diajukanAt.toISOString(),
    selesaiOleh: m.selesaiOleh,
    selesaiAt: m.selesaiAt?.toISOString() ?? null,
    dibatalkanOleh: m.dibatalkanOleh,
    dibatalkanAt: m.dibatalkanAt?.toISOString() ?? null,
    alasanBatal: m.alasanBatal,
    lembarTransfer: (m.lembarTransfer as unknown as LembarTransferData | null) ?? null,
    lembarDiisiOleh: m.lembarDiisiOleh,
    lembarDiisiAt: m.lembarDiisiAt?.toISOString() ?? null,
    version: m.version,
  };
}

export function makeMutasiService(deps: { clock?: Clock; dal?: typeof defaultDal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  async function loadKunjungan(kunjunganId: string, tx?: Tx) {
    const k = await kunjunganDal.findById(kunjunganId, tx);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    if (!TUJUAN[k.unit]) throw Errors.validation("Mutasi ruangan hanya untuk kunjungan IGD dan Rawat Inap");
    return k;
  }

  function assertDilayani(k: { status: string }) {
    if (k.status !== "InService") {
      throw Errors.forbiddenState("Mutasi hanya untuk pasien yang sedang dilayani (sudah diterima dan belum selesai)");
    }
  }

  async function loadMutasi(kunjunganId: string, mutasiId: string, tx?: Tx) {
    const m = await dal.findById(mutasiId, tx);
    if (!m || m.kunjunganId !== kunjunganId) throw Errors.notFound("Mutasi tidak ditemukan");
    return m;
  }

  /** Lokasi kunjungan sekarang: bed dari alokasi Occupied (fallback pointer), ruangan dari bed/pointer. */
  async function lokasiSekarang(
    k: { id: string; unit: string; ruanganId: string | null; bedId: string | null; kelas: string | null },
    tx?: Tx,
  ): Promise<LokasiDTO> {
    const occ = await bedAllocationService.findOccupied(k.id, tx);
    const bedId = occ?.bedId ?? k.bedId;
    const bed = bedId ? await ruanganDal.findBed(bedId, tx) : null;
    const ruanganId = bed?.locationId ?? k.ruanganId;
    const loc = ruanganId ? await ruanganDal.findLocation(ruanganId, tx) : null;
    return {
      ruanganId: ruanganId ?? null,
      ruanganNama: loc?.nama ?? null,
      bedId: bed?.id ?? null,
      bedKode: bed?.kode ?? null,
      kelas: (k.unit === "RawatInap" ? k.kelas : null) ?? (loc ? kelasOf(loc) : null),
    };
  }

  // ── Baca ──

  async function getState(kunjunganId: string, _actor: Actor): Promise<MutasiStateDTO> {
    const k = await loadKunjungan(kunjunganId);
    const [lokasi, rows] = await Promise.all([lokasiSekarang(k), dal.listByKunjungan(kunjunganId)]);
    const all = rows.map(toDTO);
    return {
      kunjunganId,
      unit: k.unit,
      kunjunganStatus: k.status,
      lokasi,
      pending: all.find((m) => m.status === "Diajukan") ?? null,
      riwayat: all.filter((m) => m.status !== "Diajukan"),
    };
  }

  /** Ruangan tujuan yang diizinkan + peta bed (status per bed relatif terhadap kunjungan ini). */
  async function getOpsi(kunjunganId: string, _actor: Actor): Promise<MutasiOpsiDTO> {
    const k = await loadKunjungan(kunjunganId);
    const locs = (await Promise.all(TUJUAN[k.unit].map((t) => ruanganDal.listLocationsByType(t)))).flat();
    const bedIds = locs.flatMap((l) => l.beds.map((b) => b.id));
    const allocs = bedIds.length ? await bedAllocationDal.listActive(bedIds) : [];
    const allocByBed = new Map(allocs.map((a) => [a.bedId, a]));

    const rooms: MutasiRoomDTO[] = locs.map((l) => {
      const beds = l.beds.map((b) => {
        const a = allocByBed.get(b.id);
        let state: BedState;
        if (a && a.kunjunganId === k.id) state = a.status === "Occupied" ? "current" : "target";
        else if (a) state = a.status === "Occupied" ? "occupied" : "reserved";
        else state = b.status === "active" ? "available" : "unavailable";
        return {
          id: b.id,
          kode: b.kode,
          nama: b.nama,
          state,
          pasienNama: a && a.kunjunganId !== k.id ? (a.kunjungan?.pasien?.nama ?? null) : null,
        };
      });
      return {
        id: l.id,
        kode: l.kode,
        nama: l.nama,
        locationType: l.locationType,
        kelas: kelasOf(l),
        beds,
        tersedia: beds.filter((b) => b.state === "available").length,
      };
    });
    return { rooms };
  }

  // ── Tulis ──

  async function ajukan(kunjunganId: string, input: AjukanMutasiInput, actor: Actor): Promise<MutasiDTO> {
    const nama = await resolveActorNama(actor);
    const id = await transaction(async (tx) => {
      const k = await loadKunjungan(kunjunganId, tx);
      assertDilayani(k);
      if (await dal.findPendingByKunjungan(kunjunganId, tx)) {
        throw Errors.conflict("Masih ada mutasi yang belum selesai — selesaikan atau batalkan dulu");
      }

      const loc = await ruanganDal.findLocation(input.keRuanganId, tx);
      if (!loc || !loc.active) throw Errors.validation("Ruangan tujuan tidak ditemukan / tidak aktif");
      if (!TUJUAN[k.unit].includes(loc.locationType as LocationType)) {
        throw Errors.validation(
          k.unit === "IGD"
            ? "Ruangan tujuan harus ruangan IGD atau ruang rawat inap"
            : "Ruangan tujuan harus ruangan rawat inap (termasuk ICU/HCU/Isolasi)",
        );
      }

      const dari = await lokasiSekarang(k, tx);
      const activeBeds = loc.beds.filter((b) => b.status === "active");
      let bed: (typeof loc.beds)[number] | null = null;
      if (input.keBedId) {
        bed = loc.beds.find((b) => b.id === input.keBedId) ?? null;
        if (!bed) throw Errors.validation("Bed tujuan bukan bagian dari ruangan tujuan");
        if (bed.status !== "active") throw Errors.validation("Bed tujuan tidak aktif / sedang maintenance");
        if (bed.id === dari.bedId) throw Errors.validation("Bed tujuan sama dengan bed pasien sekarang");
      } else if (activeBeds.length > 0) {
        throw Errors.validation("Pilih bed tujuan di ruangan tersebut");
      } else if (loc.id === dari.ruanganId) {
        throw Errors.validation("Pasien sudah berada di ruangan ini");
      }

      // Reservasi bed tujuan — bed terpakai pasien lain → CONFLICT (index unik per bed).
      if (bed) await bedAllocationService.reserve(bed.id, k.id, tx);

      const m = await dal.create({
        kunjunganId,
        dariRuanganId: dari.ruanganId,
        dariRuanganNama: dari.ruanganNama,
        dariBedId: dari.bedId,
        dariBedKode: dari.bedKode,
        dariKelas: dari.kelas,
        keRuanganId: loc.id,
        keRuanganNama: loc.nama,
        keBedId: bed?.id ?? null,
        keBedKode: bed?.kode ?? null,
        keKelas: kelasOf(loc),
        alasan: input.alasan,
        catatan: input.catatan ?? null,
        diajukanOleh: nama,
        diajukanOlehUserId: actor.userId || null,
      }, tx);
      return m.id;
    });
    return toDTO((await dal.findById(id))!);
  }

  async function selesai(kunjunganId: string, mutasiId: string, actor: Actor): Promise<MutasiDTO> {
    const nama = await resolveActorNama(actor);
    await transaction(async (tx) => {
      const k = await loadKunjungan(kunjunganId, tx);
      assertDilayani(k);
      const m = await loadMutasi(kunjunganId, mutasiId, tx);
      if (m.status !== "Diajukan") throw Errors.forbiddenState(`Mutasi sudah ${m.status === "Selesai" ? "selesai" : "dibatalkan"}`);

      // Urutan penting (index unik "satu Occupied per kunjungan"): lepas asal DULU, baru tempati tujuan.
      await bedAllocationService.releaseOccupied(k.id, tx);
      if (m.keBedId) {
        const n = await bedAllocationService.occupyReservation(k.id, tx);
        if (n === 0) throw Errors.conflict("Reservasi bed tujuan sudah tidak berlaku — batalkan lalu ajukan ulang");
      }
      await kunjunganDal.updateLokasi(k.id, {
        ruanganId: m.keRuanganId,
        bedId: m.keBedId,
        ...(k.unit === "RawatInap" && m.keKelas ? { kelas: m.keKelas as KelasRawat } : {}),
      }, tx);
      const n = await dal.markSelesai(m.id, m.version, nama, clock.now(), tx);
      if (n === 0) throw Errors.conflict("Mutasi baru saja diubah pengguna lain — muat ulang");
      // Lokasi Encounter SatuSehat ikut diperbarui (worker membangun dari state terkini).
      await fhirOutbox.enqueueEncounterSync(k.id, "mutasi", tx);
    });
    return toDTO((await dal.findById(mutasiId))!);
  }

  async function batal(kunjunganId: string, mutasiId: string, input: BatalMutasiInput, actor: Actor): Promise<MutasiDTO> {
    const nama = await resolveActorNama(actor);
    await transaction(async (tx) => {
      const m = await loadMutasi(kunjunganId, mutasiId, tx);
      if (m.status !== "Diajukan") throw Errors.forbiddenState(`Mutasi sudah ${m.status === "Selesai" ? "selesai" : "dibatalkan"}`);
      if (m.keBedId) await bedAllocationService.releaseReserved(kunjunganId, tx);
      const n = await dal.markBatal(m.id, m.version, nama, input.alasan, clock.now(), tx);
      if (n === 0) throw Errors.conflict("Mutasi baru saja diubah pengguna lain — muat ulang");
    });
    return toDTO((await dal.findById(mutasiId))!);
  }

  async function simpanLembar(kunjunganId: string, mutasiId: string, input: LembarTransferInput, actor: Actor): Promise<MutasiDTO> {
    const m = await loadMutasi(kunjunganId, mutasiId);
    if (m.status === "Dibatalkan") throw Errors.forbiddenState("Mutasi sudah dibatalkan — lembar transfer tidak dapat diisi");
    const waktu = parseClientDateTime(input.waktuTransfer);
    if (!waktu) throw Errors.validation("Waktu transfer tidak valid");
    const data: LembarTransferData = { ...input, waktuTransfer: waktu.toISOString() };
    const nama = await resolveActorNama(actor);
    const n = await dal.saveLembar(m.id, data as unknown as Prisma.InputJsonValue, nama, clock.now());
    if (n === 0) throw Errors.conflict("Lembar transfer tidak dapat disimpan — status mutasi berubah");
    return toDTO((await dal.findById(mutasiId))!);
  }

  return { getState, getOpsi, ajukan, selesai, batal, simpanLembar };
}

export const mutasiService = makeMutasiService();
