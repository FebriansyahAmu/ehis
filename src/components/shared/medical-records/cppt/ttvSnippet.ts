// Ringkasan TTV terakhir (domain Observation) untuk disisipkan ke bagian Objektif / Background CPPT —
// TTV tetap satu sumber di tab TTV; CPPT hanya menyalin teks ringkasnya.

import type { ObservationDTO } from "@/lib/schemas/observation";
import { fmtDate } from "../cpptShared";

const num = (n: number | undefined, digits = 0) =>
  n == null || !Number.isFinite(n) ? null : n.toLocaleString("id-ID", { maximumFractionDigits: digits });

export function latestObservation(rows: ObservationDTO[]): ObservationDTO | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => b.waktuObservasi.localeCompare(a.waktuObservasi))[0];
}

export function ttvSnippet(o: ObservationDTO): string {
  const v = o.vitalSigns;
  const gcs = v.gcsEye + v.gcsVerbal + v.gcsMotor;
  const parts = [
    `TD ${num(v.tdSistolik)}/${num(v.tdDiastolik)} mmHg`,
    `N ${num(v.nadi)} x/mnt`,
    `RR ${num(v.respirasi)} x/mnt`,
    `S ${num(v.suhu, 1)}°C`,
    `SpO₂ ${num(v.spo2)}%`,
    `GCS ${gcs} (E${v.gcsEye}V${v.gcsVerbal}M${v.gcsMotor})`,
    `Nyeri ${num(v.skalaNyeri)}/10`,
    num(v.beratBadan, 1) && `BB ${num(v.beratBadan, 1)} kg`,
    num(v.tinggiBadan, 1) && `TB ${num(v.tinggiBadan, 1)} cm`,
  ].filter(Boolean);
  return `TTV ${fmtDate(o.tanggal)} ${o.jam}: ${parts.join(", ")}. Kesadaran: ${o.statusKesadaran}.`;
}
