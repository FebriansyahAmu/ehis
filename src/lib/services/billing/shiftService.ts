// shiftService — lifecycle Shift kasir (Slice 2e persist). Buka/tutup/board. Totals shift Open =
// PROYEKSI billing.payment (live, via aggregatePaymentByShifts); shift Closed = SNAPSHOT saat tutup.
// Kasir (operator) di-resolve dari user role "Kasir" (anti-spoof: nama dari DB, bukan client).
// Owner sesi = actor.userId → "shift saya" persist lintas navigasi. Layered: dipanggil route (gate
// billing.kasir).

import * as shiftDal from "@/lib/dal/billing/shiftDal";
import * as setoranDal from "@/lib/dal/billing/setoranDal";
import * as billingCounterDal from "@/lib/dal/billing/billingCounterDal";
import * as billingReadDal from "@/lib/dal/billing/billingReadDal";
import { namaTampilPegawai, resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { ShiftEntity } from "@/lib/dal/billing/shiftDal";
import type { SetoranEntity } from "@/lib/dal/billing/setoranDal";
import type {
  OpenShiftInput, CloseShiftInput, SetoranInput, ShiftDTO, ShiftBoardDTO,
  ShiftMetodeBreakdownDTO, SetoranDTO, KasirUserDTO,
} from "@/lib/schemas/billing/shift";

const METODE_KEYS = ["Tunai", "Transfer", "QRIS", "EDC", "Voucher"] as const;
type MetodeKey = (typeof METODE_KEYS)[number];

function emptyBreakdown(): ShiftMetodeBreakdownDTO {
  return { Tunai: 0, Transfer: 0, QRIS: 0, EDC: 0, Voucher: 0 };
}

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

/** Breakdown JSONB snapshot (closed) → DTO aman (default 0 bila absen/rusak). */
function breakdownFromSnapshot(raw: unknown): ShiftMetodeBreakdownDTO {
  const b = emptyBreakdown();
  if (raw && typeof raw === "object") {
    for (const k of METODE_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "number") b[k] = v;
    }
  }
  return b;
}

function setoranToDTO(s: SetoranEntity | null | undefined): SetoranDTO | null {
  if (!s) return null;
  return {
    noSetor: s.noSetor,
    tanggalSerah: s.tanggalSerah.toISOString(),
    nominal: s.nominal,
    penerima: s.penerima,
    penyetor: s.penyetor,
    catatan: s.catatan,
  };
}

function toDTO(
  s: ShiftEntity,
  liveTotals?: { byMetode: ShiftMetodeBreakdownDTO; trx: number; refund: number },
  setoran?: SetoranEntity | null,
): ShiftDTO {
  const totals = liveTotals ?? {
    byMetode: breakdownFromSnapshot(s.totalByMetode),
    trx: s.totalTransaksi,
    refund: s.totalRefund,
  };
  return {
    id: s.id,
    counter: s.counter,
    kasirNama: s.kasirNama,
    kasirPegawaiId: s.kasirPegawaiId,
    authorUserId: s.authorUserId,
    status: s.status === "Closed" ? "Closed" : "Open",
    bukaAt: s.bukaAt.toISOString(),
    bukaSaldoAwal: s.bukaSaldoAwal,
    bukaCatatan: s.bukaCatatan,
    totalByMetode: totals.byMetode,
    totalTransaksi: totals.trx,
    totalRefund: totals.refund,
    tutupAt: iso(s.tutupAt),
    tutupSaldoAkhir: s.tutupSaldoAkhir,
    selisih: s.selisih,
    tutupCatatan: s.tutupCatatan,
    supervisor: s.supervisor,
    setoran: setoranToDTO(setoran),
  };
}

/** Totals live per shift (Open) dari billing.payment non-void. */
async function liveTotalsByShift(shiftIds: string[]) {
  const map = new Map<string, { byMetode: ShiftMetodeBreakdownDTO; trx: number; refund: number }>();
  if (shiftIds.length === 0) return map;
  const rows = await billingReadDal.aggregatePaymentByShifts(shiftIds);
  for (const r of rows) {
    let e = map.get(r.shiftId);
    if (!e) { e = { byMetode: emptyBreakdown(), trx: 0, refund: 0 }; map.set(r.shiftId, e); }
    if ((METODE_KEYS as readonly string[]).includes(r.metode)) {
      e.byMetode[r.metode as MetodeKey] = Number(r.masuk);
    }
    e.trx += Number(r.trx);
    e.refund += Number(r.refund);
  }
  return map;
}

/** Kandidat kasir (dropdown Buka Shift) — user role "Kasir" + unitKerja kasir. */
async function listKasirUsers(): Promise<KasirUserDTO[]> {
  const users = await shiftDal.listKasirUsers();
  return users.map((u) => ({ pegawaiId: u.pegawaiId, nama: namaTampilPegawai(u.pegawai) }));
}

/** Papan shift: active (milik actor) + open (semua counter, live) + recent closed (snapshot). */
async function board(actor: Actor): Promise<ShiftBoardDTO> {
  const [openRows, closedRows] = await Promise.all([
    shiftDal.listOpen(),
    shiftDal.listRecentClosed(8),
  ]);
  const [liveMap, setoranRows] = await Promise.all([
    liveTotalsByShift(openRows.map((s) => s.id)),
    // Setoran hanya relevan untuk shift tertutup (shift Open belum bisa disetorkan).
    setoranDal.listByShiftIds(closedRows.map((s) => s.id)),
  ]);
  const setoranMap = new Map(setoranRows.map((r) => [r.shiftId, r]));
  const open = openRows.map((s) => toDTO(s, liveMap.get(s.id)));
  const recentClosed = closedRows.map((s) => toDTO(s, undefined, setoranMap.get(s.id) ?? null));
  const active = open.find((s) => s.authorUserId === actor.userId) ?? null;
  return { active, open, recentClosed };
}

/** Buka shift. Kasir operator di-resolve dari user role "Kasir" (anti-spoof). Owner = actor. */
async function openShift(input: OpenShiftInput, actor: Actor): Promise<ShiftBoardDTO> {
  // Counter tak boleh double-open.
  const occupied = await shiftDal.findOpenByCounter(input.counter);
  if (occupied) throw Errors.validation("Counter ini sedang dipakai shift lain — pilih counter lain");

  // Resolve operator dari kandidat kasir (nama dari DB, bukan client).
  const kasirs = await listKasirUsers();
  const operator = kasirs.find((k) => k.pegawaiId === input.kasirPegawaiId);
  if (!operator) throw Errors.validation("Kasir tidak valid — pilih pengguna dengan peran Kasir");

  await shiftDal.create({
    counter: input.counter,
    kasirNama: operator.nama,
    kasirPegawaiId: operator.pegawaiId,
    authorUserId: actor.userId,
    bukaAt: new Date(),
    bukaSaldoAwal: input.bukaSaldoAwal,
    bukaCatatan: input.bukaCatatan ?? null,
  });
  return board(actor);
}

/** Tutup shift. Snapshot totals dari payment (authoritative) + hitung selisih server-side. */
async function closeShift(shiftId: string, input: CloseShiftInput, actor: Actor): Promise<ShiftBoardDTO> {
  const shift = await shiftDal.findById(shiftId);
  if (!shift) throw Errors.notFound("Shift tidak ditemukan");
  if (shift.status !== "Open") throw Errors.validation("Shift sudah ditutup");

  const liveMap = await liveTotalsByShift([shiftId]);
  const t = liveMap.get(shiftId) ?? { byMetode: emptyBreakdown(), trx: 0, refund: 0 };
  // Kas fisik diharapkan = saldo awal + tunai masuk − refund (asumsi refund tunai).
  const expectedCash = shift.bukaSaldoAwal + t.byMetode.Tunai - t.refund;
  const selisih = input.tutupSaldoAkhir - expectedCash;
  const supervisor = await resolveActorNama(actor);

  const count = await shiftDal.closeGuarded(shiftId, {
    tutupSaldoAkhir: input.tutupSaldoAkhir,
    selisih,
    tutupCatatan: input.tutupCatatan ?? null,
    supervisor,
    totalByMetode: t.byMetode,
    totalTransaksi: t.trx,
    totalRefund: t.refund,
  });
  if (count === 0) throw Errors.validation("Shift sudah ditutup sebelumnya");

  return board(actor);
}

/**
 * Catat setoran kas shift ke bendahara. Guard: shift ADA, sudah **ditutup**, dan belum pernah
 * disetorkan (unique `shiftId` = jaring pengaman terakhir di DB). Nomor `STR/YYYY/MM/NNNNN` dan
 * `penyetor` di-isi server (anti-spoof) — client hanya kirim nominal/penerima/catatan.
 */
async function recordSetoran(shiftId: string, input: SetoranInput, actor: Actor): Promise<ShiftBoardDTO> {
  const shift = await shiftDal.findById(shiftId);
  if (!shift) throw Errors.notFound("Shift tidak ditemukan");
  if (shift.status !== "Closed") {
    throw Errors.validation("Shift belum ditutup — tutup kas dulu sebelum menyetorkan");
  }
  const existing = await setoranDal.findByShift(shiftId);
  if (existing) throw Errors.validation(`Shift ini sudah disetorkan (${existing.noSetor})`);

  const penyetor = await resolveActorNama(actor);
  const now = new Date();
  const periode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = await billingCounterDal.nextSeq("STR", periode);
  const noSetor = `STR/${periode.slice(0, 4)}/${periode.slice(4)}/${String(seq).padStart(5, "0")}`;

  await setoranDal.create(shiftId, {
    noSetor,
    tanggalSerah: input.tanggalSerah ? new Date(input.tanggalSerah) : now,
    nominal: input.nominal,
    penerima: input.penerima,
    catatan: input.catatan ?? null,
    penyetor,
    authorUserId: actor.userId,
  });
  return board(actor);
}

export const shiftService = { board, openShift, closeShift, recordSetoran, listKasirUsers };
