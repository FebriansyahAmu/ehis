// bedAllocationService — okupansi/reservasi bed (BACKEND-ENCOUNTER, perluasan bed). Tak import
// prisma langsung. Mutasi (reserve/occupy/release) dipanggil DALAM transaksi milik use-case
// kunjungan (mirip bpjsService.issueSep) → terima `tx`. Read `listActive` berdiri sendiri.
//
// PRINSIP: "tersedia" DIHITUNG (bed master aktif − alokasi aktif), bukan counter. Double-booking
// dicegah partial unique index DB (P2002 → CONFLICT 409 "Bed sudah dipakai").

import * as defaultDal from "@/lib/dal/bedAllocationDal";
import * as defaultRuanganDal from "@/lib/dal/ruanganDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Tx } from "@/lib/db/prisma";
import type { Actor } from "@/lib/auth/actor";
import type { ActiveAllocationQuery, BedAllocationDTO, AllocStatus } from "@/lib/schemas/bedAllocation";
import type { BedAllocationActiveRow } from "@/lib/dal/bedAllocationDal";

type Dal = typeof defaultDal;
type RuanganDal = typeof defaultRuanganDal;

const isP2002 = (e: unknown): boolean =>
  typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";

// Map baris alokasi aktif (+ringkasan kunjungan/pasien) → DTO bed-map.
function toActiveDTO(a: NonNullable<BedAllocationActiveRow>): BedAllocationDTO {
  return {
    id: a.id,
    bedId: a.bedId,
    kunjunganId: a.kunjunganId,
    status: a.status as AllocStatus,
    reservedAt: a.reservedAt.toISOString(),
    occupiedAt: a.occupiedAt ? a.occupiedAt.toISOString() : null,
    releasedAt: a.releasedAt ? a.releasedAt.toISOString() : null,
    kunjunganNo: a.kunjungan?.noKunjungan ?? null,
    pasienNama: a.kunjungan?.pasien?.nama ?? null,
    pasienNoRm: a.kunjungan?.pasien?.noRm ?? null,
  };
}

export function makeBedAllocationService(
  deps: { clock?: Clock; dal?: Dal; ruangan?: RuanganDal } = {},
) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;
  const ruangan = deps.ruangan ?? defaultRuanganDal;

  // ── Mutasi (dipanggil dalam tx milik use-case kunjungan) ──
  async function allocate(bedId: string, kunjunganId: string, status: Extract<AllocStatus, "Reserved" | "Occupied">, tx?: Tx) {
    const bed = await ruangan.findBed(bedId, tx);
    if (!bed) throw Errors.validation("Bed tidak ditemukan di master");
    if (bed.status !== "active") throw Errors.validation("Bed tidak aktif / sedang maintenance");
    try {
      return await dal.create(
        { bedId, kunjunganId, status, occupiedAt: status === "Occupied" ? clock.now() : undefined },
        tx,
      );
    } catch (e) {
      if (isP2002(e)) throw Errors.conflict("Bed sudah dipakai pasien lain");
      throw e;
    }
  }

  /** Hold bed (RI saat daftar). */
  function reserve(bedId: string, kunjunganId: string, tx?: Tx) {
    return allocate(bedId, kunjunganId, "Reserved", tx);
  }
  /** Tempati bed (IGD saat terima). */
  function occupy(bedId: string, kunjunganId: string, tx?: Tx) {
    return allocate(bedId, kunjunganId, "Occupied", tx);
  }
  /**
   * RI saat "Terima Order": tempati bed yang SUDAH direservasi admisi (Reserved→Occupied)
   * via update in-place — JANGAN create baru (akan tabrak partial-unique → P2002). Kembalikan
   * bedId yang ditempati, atau null bila tak ada reservasi aktif (mis. IGD belum reservasi).
   */
  async function occupyReserved(kunjunganId: string, tx?: Tx): Promise<string | null> {
    const active = await dal.findActiveByKunjungan(kunjunganId, tx);
    if (!active || active.status !== "Reserved") return null;
    await dal.occupyByKunjungan(kunjunganId, clock.now(), tx);
    return active.bedId;
  }
  /** Lepas semua alokasi aktif kunjungan (batal/pulang/transfer). */
  function release(kunjunganId: string, tx?: Tx) {
    return dal.releaseByKunjungan(kunjunganId, clock.now(), tx);
  }

  // ── Read (endpoint GET /bed-allocations) ──
  async function listActive(query: ActiveAllocationQuery, _actor: Actor): Promise<BedAllocationDTO[]> {
    let bedIds: string[] | undefined;
    if (query.locationType) {
      const locs = await ruangan.listLocationsByType(query.locationType);
      bedIds = locs.flatMap((l) => l.beds.map((b) => b.id));
      if (bedIds.length === 0) return [];
    }
    const rows = await dal.listActive(bedIds);
    return rows.map(toActiveDTO);
  }

  return { reserve, occupy, occupyReserved, release, listActive };
}

export const bedAllocationService = makeBedAllocationService();
