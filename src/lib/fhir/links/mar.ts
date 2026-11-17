/**
 * L21 — MAR (`medicalrecord.MarEntry`) → MedicationAdministration. docs/fhir-mapping/L21-mar-to-medicationadministration.md.
 *
 * MarEntry append-only "latest wins" per slot (resepItemId × tanggal × shift) → 1 resource per SLOT
 * (`localId` = `<resepItemId>:<tanggal>:<shift>`), sehingga koreksi entri = PUT resource yang sama, bukan resource baru.
 *
 * Murni (tanpa I/O) — aman diimpor client maupun server.
 */

import { MAR_STATUS, lookup } from "../conceptMap";
import type { Issue } from "./types";

export interface MarRow {
  id: string;
  resepItemId: string;
  dosis: string;
  rute: string;
  tanggal: string; // "YYYY-MM-DD" (tanggal bisnis WIB)
  shift: string;
  status: string;
  waktuPemberian: string | null; // "HH:mm" WIB — hanya saat Diberikan
  perawat2: string;
  catatan: string;
  authorPegawaiId: string | null;
  createdAt: Date;
}

export const marLocalId = (m: Pick<MarRow, "resepItemId" | "tanggal" | "shift">) => `${m.resepItemId}:${m.tanggal}:${m.shift}`;

/** Entri terakhir per slot (input urut createdAt asc). */
export function marSlotsOf<T extends MarRow>(rows: T[]): T[] {
  const bySlot = new Map<string, T>();
  for (const r of [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) bySlot.set(marLocalId(r), r);
  return [...bySlot.values()];
}

/** Tanggal bisnis + jam WIB (UTC+7, tanpa DST) → instant. null bila format salah. */
export function wibToDate(tanggal: string, jam: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jam)) return null;
  const d = new Date(`${tanggal}T${jam}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const UCUM: Record<string, string> = {
  mg: "mg", g: "g", mcg: "ug", "µg": "ug", ug: "ug", ml: "mL", l: "L", iu: "[IU]", ui: "[IU]", unit: "[U]", u: "[U]",
};

/**
 * Dosis teks MAR → `dosage.dose` UCUM (playbook RI §19: "UCUM unit") — hanya bentuk sederhana "<angka> <satuan UCUM>",
 * mis. "500 mg", "2,5 ml". Selain itu (mis. "1 tablet", "2x1") → null; teks tetap di `dosage.text`.
 */
export function doseOf(dosis: string): { value: number; unit: string; system: string; code: string } | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Zµ]+)\s*$/.exec(dosis);
  if (!m) return null;
  const code = UCUM[m[2].toLowerCase()];
  const value = Number(m[1].replace(",", "."));
  return code && Number.isFinite(value) && value > 0
    ? { value, unit: m[2], system: "http://unitsofmeasure.org", code }
    : null;
}

export type MarRencana =
  | { aksi: "kirim"; status: "completed" | "not-done"; alasan?: string; waktu: Date }
  /** Belum diberikan (Ditunda) — tidak dibuat; ditarik bila slot pernah terkirim. */
  | { aksi: "tarik"; waktu: Date }
  | { aksi: "tahan"; issue: Issue };

/** Rencana kirim 1 slot MAR (entri terakhir). */
export function marRencanaOf(m: MarRow): MarRencana {
  const localId = marLocalId(m);
  if (!Object.prototype.hasOwnProperty.call(MAR_STATUS, m.status)) {
    return { aksi: "tahan", issue: { link: "L21", resourceType: "MedicationAdministration", localId, code: "kode-tidak-valid", message: `Status MAR "${m.status}" tidak dikenal — ditahan` } };
  }
  const st = lookup(MAR_STATUS, m.status);
  if (!st) return { aksi: "tarik", waktu: m.createdAt };
  if (st.status === "not-done") return { aksi: "kirim", status: "not-done", alasan: st.alasan, waktu: m.createdAt };
  const waktu = m.waktuPemberian ? wibToDate(m.tanggal, m.waktuPemberian) : null;
  if (!waktu) {
    return {
      aksi: "tahan",
      issue: { link: "L21", resourceType: "MedicationAdministration", localId, code: "kode-kosong", message: `Pemberian obat ${m.tanggal} shift ${m.shift} tanpa jam pemberian yang valid — ditahan` },
    };
  }
  return { aksi: "kirim", status: "completed", waktu };
}
