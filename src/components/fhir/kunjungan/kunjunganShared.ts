// Label & status sinkron kunjungan (konsol /ehis-fhir/kunjungan).

import type { Tone } from "../fhirShared";

export const UNIT_LABEL: Record<string, string> = { IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };

export const KUNJUNGAN_STATUS_LABEL: Record<string, string> = {
  Registered: "Terdaftar", Queued: "Antre", InService: "Dilayani", Completed: "Selesai",
  Closed: "Ditutup", Billed: "Ditagih", Claimed: "Diklaim", Cancelled: "Dibatalkan",
};

export const ENCOUNTER_TARGET_LABEL: Record<string, string> = {
  "in-progress": "Sedang berlangsung", finished: "Selesai", cancelled: "Dibatalkan",
};

export type SyncState = "terkirim" | "antre" | "gagal" | "belum";

export const SYNC_STATE: Record<SyncState, { label: string; tone: Tone }> = {
  terkirim: { label: "Terkirim", tone: "emerald" },
  antre: { label: "Dalam antrean", tone: "sky" },
  gagal: { label: "Gagal", tone: "rose" },
  belum: { label: "Belum dikirim", tone: "slate" },
};

/** Status sinkron kunjungan: job terakhir gagal/antre menang atas peta Encounter. */
export function syncStateOf(r: { jobStatus: string | null; encounterIhsId: string | null }): SyncState {
  if (r.jobStatus === "Failed") return "gagal";
  if (r.jobStatus === "Pending" || r.jobStatus === "Sending") return "antre";
  return r.encounterIhsId ? "terkirim" : "belum";
}
