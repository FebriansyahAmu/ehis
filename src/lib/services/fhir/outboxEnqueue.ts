// FH3 — Enqueue intent sinkron SatuSehat DI DALAM tx aksi klinis (R4). Ringan: hanya INSERT
// `fhir.SyncLog` berisi DESKRIPTOR job (bukan payload FHIR) — payload dibangun worker saat kirim
// dari state terkini (IHS id pasien/nakes/lokasi bisa baru ter-resolve setelah aksi).
//
// ATURAN: efek samping FHIR TIDAK BOLEH menggagalkan aksi klinis. Config SatuSehat invalid →
// lewati (warn). Query di sini hanya baca/tulis tabel `fhir.*` sederhana (aman dalam tx).

import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import * as syncLogDal from "@/lib/dal/fhir/syncLogDal";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import type { Tx } from "@/lib/db/prisma";

export const ENCOUNTER_TRIGGER = "encounter.sync";

/** Aksi lifecycle kunjungan yang mengubah Encounter SatuSehat. */
const ENCOUNTER_EVENTS = new Set(["receive", "complete", "reopen", "cancel", "manual", "dispense", "diagnostic", "mutasi"]);

export interface EncounterJob {
  kind: "encounter";
  kunjunganId: string;
  event: string;
  at: string;
}

function currentEnv(): string | null {
  try {
    return getSatuSehatConfig().mode;
  } catch (e) {
    console.warn("[fhir-outbox] config SatuSehat tidak valid — enqueue dilewati:", (e as Error).message);
    return null;
  }
}

/**
 * Catat job sinkron Encounter untuk kunjungan. Coalesce: bila sudah ada job Pending untuk
 * kunjungan ini, tak menambah baris (worker membangun dari state terkini). `cancel` hanya
 * di-enqueue bila Encounter sudah pernah terkirim di env aktif.
 */
export async function enqueueEncounterSync(kunjunganId: string, event: string, tx?: Tx): Promise<void> {
  if (!ENCOUNTER_EVENTS.has(event)) return;
  const env = currentEnv();
  if (!env) return;

  if (event === "cancel") {
    const mapped = await resourceMapDal.findByLocal(env, "Encounter", kunjunganId, tx);
    if (!mapped) return;
  }

  const pending = await syncLogDal.findPending(ENCOUNTER_TRIGGER, kunjunganId, tx);
  if (pending) return;

  const job = { kind: "encounter", kunjunganId, event, at: new Date().toISOString() } satisfies EncounterJob;
  await syncLogDal.enqueue({ trigger: ENCOUNTER_TRIGGER, kunjunganId, bundleType: "single", payload: job }, tx);
}
