// dispenseService — pengeluaran stok (OUT) konsumsi KLINIS: Resep (serah Apoteker) & BMHP (order).
// Memakai primitif movementService.postMovement dalam TRANSAKSI SENDIRI (terpisah dari tx klinis) →
// efek samping inventory yang downstream, tak memblokir aksi klinis.
//
// KONTRAK PENTING: best-effort & NON-BLOCKING. Stok kurang/tak ada/UUID tak ketemu → item di-skip;
// fungsi TAK PERNAH melempar (alur klinis tak boleh gagal karena stok — selaras stance advisory).
// `dispenseOut` meng-cap qty ke saldo tersedia agar postMovement OUT tak pernah throw (anti-negatif).
// `reverseDispenseOut` membalik (IN kompensasi) semua OUT ber-ref tertentu saat order dibatalkan
// (ledger append-only: tak hapus baris, tambah entri lawan).

import { transaction } from "@/lib/db/prisma";
import * as dal from "@/lib/dal/inventory/stockDal";
import { movementService } from "@/lib/services/inventory/movementService";
import type { ItemJenis } from "@/lib/dal/inventory/stockDal";

export interface DispenseLine {
  itemJenis: ItemJenis;
  /** UUID master (BMHP: bmhpId). Absen → resolve via `kode` (khusus Obat). */
  itemId?: string | null;
  /** Kode katalog (Obat: kodeObat) bila `itemId` absen. */
  kode?: string | null;
  qty: number;
}

export interface DispenseOutInput {
  locationKode?: string | null;
  locationId?: string | null;
  lines: DispenseLine[];
  refType: string;
  refNo?: string | null;
  refId?: string | null;
  petugas: string;
  actorId?: string | null;
}

export interface DispenseOutResult {
  locationId: string | null;
  posted: number;
  skipped: number;
}

export function makeDispenseService() {
  async function resolveLocationId(input: DispenseOutInput): Promise<string | null> {
    if (input.locationId) return input.locationId;
    if (input.locationKode) return (await dal.findLocationIdByKode(input.locationKode))?.id ?? null;
    return null;
  }

  /** Keluarkan stok (OUT) untuk daftar item dari satu lokasi. Cap ke saldo tersedia, skip item tanpa
   *  saldo/UUID. NEVER THROWS — kegagalan inventory tak menggagalkan aksi klinis. */
  async function dispenseOut(input: DispenseOutInput): Promise<DispenseOutResult> {
    try {
      const locationId = await resolveLocationId(input);
      if (!locationId) return { locationId: null, posted: 0, skipped: input.lines.length };

      // Resolusi itemId untuk baris Obat yang hanya membawa kode (resep menyimpan kodeObat, bukan UUID).
      const kodes = input.lines.filter((l) => l.itemJenis === "Obat" && !l.itemId && l.kode).map((l) => l.kode!);
      const byKode = new Map<string, string>();
      if (kodes.length) {
        for (const r of await dal.findObatByKodes([...new Set(kodes)])) byKode.set(r.kode, r.id);
      }

      let posted = 0;
      let skipped = 0;
      await transaction(async (tx) => {
        for (const l of input.lines) {
          const itemId = l.itemId ?? (l.itemJenis === "Obat" && l.kode ? byKode.get(l.kode) : undefined);
          if (!itemId || l.qty <= 0) { skipped++; continue; }
          const bal = await dal.getBalance({ itemJenis: l.itemJenis, itemId, locationId }, tx);
          const out = Math.min(l.qty, bal?.qtyOnHand ?? 0); // cap → postMovement OUT tak akan throw
          if (out <= 0) { skipped++; continue; }
          await movementService.postMovement(
            { jenis: "OUT", itemJenis: l.itemJenis, itemId, fromLocationId: locationId, qty: out },
            { petugas: input.petugas, actorId: input.actorId, refType: input.refType, refNo: input.refNo, refId: input.refId },
            tx,
          );
          posted++;
        }
      });
      return { locationId, posted, skipped };
    } catch {
      return { locationId: null, posted: 0, skipped: input.lines.length }; // non-blocking
    }
  }

  /** Balikkan (IN kompensasi) semua OUT ber-ref tertentu — saat order dibatalkan. Best-effort. */
  async function reverseDispenseOut(
    refType: string,
    refId: string,
    ctx: { petugas: string; actorId?: string | null },
  ): Promise<void> {
    try {
      const outs = await dal.listMovementsByRef(refType, refId, "OUT");
      if (outs.length === 0) return;
      await transaction(async (tx) => {
        for (const m of outs) {
          if (!m.fromLocationId || !m.batchId) continue;
          const batch = await dal.findBatchById(m.batchId, tx);
          if (!batch) continue;
          await movementService.postMovement(
            {
              jenis: "IN", itemJenis: m.itemJenis, itemId: m.itemId,
              toLocationId: m.fromLocationId, batchNo: batch.batchNo, expiryDate: batch.expiryDate, qty: m.qty,
            },
            { petugas: ctx.petugas, actorId: ctx.actorId, refType: `${refType}_REVERSAL`, refId },
            tx,
          );
        }
      });
    } catch {
      /* non-blocking */
    }
  }

  return { dispenseOut, reverseDispenseOut };
}

export const dispenseService = makeDispenseService();
