// Metadata tampilan per FHIR resourceType + peringkas payload (judul/sub/chip) untuk kartu konsol.
// Peringkas membaca bentuk payload adapter `lib/fhir/adapters/*` — tahan field hilang.

import {
  Building2, MapPin, Stethoscope, UserRound, Hospital, FileText, HeartPulse, Activity, Scissors,
  ShieldAlert, Pill, ClipboardList, PackageCheck, FlaskConical, Microscope, Boxes, type LucideIcon,
} from "lucide-react";
import type { Tone } from "../fhirShared";
import type { PayloadStatus } from "@/lib/api/fhir/resources";

export type ResourceGroup = "master" | "kunjungan" | "klinis" | "obat" | "penunjang";

export const GROUPS: { key: ResourceGroup; label: string; desc: string; tone: Tone }[] = [
  { key: "master", label: "Identitas & Master", desc: "Organisasi, ruangan, nakes, dan pasien yang sudah terpetakan ke IHS", tone: "sky" },
  { key: "kunjungan", label: "Kunjungan", desc: "Encounter dan resume medis per kunjungan", tone: "teal" },
  { key: "klinis", label: "Klinis", desc: "Diagnosis, tanda vital, tindakan, dan alergi", tone: "rose" },
  { key: "obat", label: "Obat", desc: "Rantai peresepan hingga penyerahan obat", tone: "amber" },
  { key: "penunjang", label: "Penunjang", desc: "Permintaan dan laporan laboratorium & radiologi", tone: "emerald" },
];

export interface ResourceMeta {
  type: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  group: ResourceGroup;
}

const META: ResourceMeta[] = [
  { type: "Organization", label: "Organisasi", desc: "Unit/instalasi di bawah RS", icon: Building2, group: "master" },
  { type: "Location", label: "Lokasi", desc: "Ruangan, poli, bangsal", icon: MapPin, group: "master" },
  { type: "Practitioner", label: "Tenaga Kesehatan", desc: "Resolve IHS by NIK (tanpa kirim)", icon: Stethoscope, group: "master" },
  { type: "Patient", label: "Pasien", desc: "Resolve IHS by NIK (tanpa kirim)", icon: UserRound, group: "master" },
  { type: "Encounter", label: "Kunjungan", desc: "Episode pelayanan IGD/RJ/RI", icon: Hospital, group: "kunjungan" },
  { type: "Composition", label: "Resume Medis", desc: "Ringkasan pulang (LOINC 18842-5)", icon: FileText, group: "kunjungan" },
  { type: "Condition", label: "Diagnosis", desc: "ICD-10 final per kunjungan", icon: HeartPulse, group: "klinis" },
  { type: "Observation", label: "Observasi", desc: "Tanda vital & hasil penunjang", icon: Activity, group: "klinis" },
  { type: "Procedure", label: "Tindakan", desc: "Prosedur ICD-9-CM", icon: Scissors, group: "klinis" },
  { type: "AllergyIntolerance", label: "Alergi", desc: "Riwayat alergi pasien", icon: ShieldAlert, group: "klinis" },
  { type: "Medication", label: "Obat (KFA)", desc: "Master obat ber-KFA", icon: Pill, group: "obat" },
  { type: "MedicationRequest", label: "Resep", desc: "Peresepan per item obat", icon: ClipboardList, group: "obat" },
  { type: "MedicationDispense", label: "Penyerahan Obat", desc: "Dispensing farmasi", icon: PackageCheck, group: "obat" },
  { type: "ServiceRequest", label: "Permintaan Penunjang", desc: "Order lab & radiologi", icon: FlaskConical, group: "penunjang" },
  { type: "DiagnosticReport", label: "Laporan Penunjang", desc: "Hasil lab & ekspertise radiologi", icon: Microscope, group: "penunjang" },
];

const BY_TYPE = new Map(META.map((m) => [m.type, m]));

export function metaOf(type: string): ResourceMeta {
  return BY_TYPE.get(type) ?? { type, label: type, desc: "Resource FHIR", icon: Boxes, group: "klinis" };
}

export const ALL_META = META;

export const groupTone = (g: ResourceGroup): Tone => GROUPS.find((x) => x.key === g)?.tone ?? "slate";

// ── Status payload ──────────────────────────────────────────

export const PAYLOAD_STATUS: Record<PayloadStatus, { label: string; short: string; tone: Tone; hint: string }> = {
  synced: { label: "Terkirim", short: "Terkirim", tone: "emerald", hint: "Payload identik dengan yang sudah diterima SatuSehat" },
  changed: { label: "Berubah — perlu kirim ulang", short: "Berubah", tone: "amber", hint: "Data lokal berubah sejak terakhir dikirim; job berikutnya akan memperbarui (PUT)" },
  new: { label: "Belum terkirim", short: "Belum", tone: "sky", hint: "Belum pernah diterima SatuSehat; akan dibuat (POST) pada job berikutnya" },
};

// ── Peringkas payload ───────────────────────────────────────

type J = Record<string, unknown>;
const obj = (v: unknown): J | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as J) : undefined);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : undefined);

function coding(cc: unknown): { code?: string; display?: string } {
  const c = obj(cc);
  const first = obj(arr(c?.coding)[0]);
  return { code: str(first?.code), display: str(first?.display) ?? str(c?.text) };
}

function refDisplay(r: unknown): string | undefined {
  return str(obj(r)?.display);
}

function fmtDate(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function quantity(q: unknown): string | undefined {
  const o = obj(q);
  const v = str(o?.value);
  return v ? [v, str(o?.unit) ?? str(o?.code)].filter(Boolean).join(" ") : undefined;
}

export interface PayloadSummary {
  title: string;
  subtitle?: string;
  chips: string[];
  when?: string;
}

/** Ringkas payload jadi judul/sub/chip yang bermakna klinis. */
export function summarize(resourceType: string, payload: unknown): PayloadSummary {
  const p = obj(payload) ?? {};
  const code = coding(p.code);
  const status = str(p.status);
  const chips: string[] = [];
  if (status) chips.push(status);

  switch (resourceType) {
    case "Encounter": {
      const cls = obj(p.class);
      const period = obj(p.period);
      const loc = refDisplay(obj(arr(p.location)[0])?.location);
      return {
        title: str(cls?.display) ?? "Kunjungan",
        subtitle: [loc, refDisplay(obj(arr(p.participant)[0])?.individual)].filter(Boolean).join(" · ") || undefined,
        chips: [...chips, ...(arr(p.diagnosis).length ? [`${arr(p.diagnosis).length} diagnosis`] : [])],
        when: fmtDate(period?.start),
      };
    }
    case "Condition": {
      const cat = coding(arr(p.category)[0]).display;
      return {
        title: code.display ?? "Diagnosis",
        subtitle: code.code ? `ICD-10 ${code.code}` : undefined,
        chips: [coding(p.clinicalStatus).code, cat].filter((x): x is string => !!x),
        when: fmtDate(p.recordedDate ?? p.onsetDateTime),
      };
    }
    case "Observation": {
      const val = quantity(p.valueQuantity) ?? str(p.valueString) ?? coding(p.valueCodeableConcept).display;
      const comp = arr(p.component).map((c) => {
        const o = obj(c);
        return [coding(o?.code).display, quantity(o?.valueQuantity)].filter(Boolean).join(" ");
      }).filter(Boolean);
      return {
        title: code.display ?? "Observasi",
        subtitle: val ?? (comp.length ? comp.join(" · ") : undefined),
        chips: [...chips, ...(code.code ? [`LOINC ${code.code}`] : []), coding(arr(p.category)[0]).code].filter((x): x is string => !!x),
        when: fmtDate(p.effectiveDateTime ?? p.issued),
      };
    }
    case "Procedure":
      return {
        title: code.display ?? "Tindakan",
        subtitle: code.code ? `Kode ${code.code}` : undefined,
        chips,
        when: fmtDate(obj(p.performedPeriod)?.start ?? p.performedDateTime),
      };
    case "AllergyIntolerance":
      return {
        title: code.display ?? "Alergi",
        subtitle: arr(p.category).map(str).filter(Boolean).join(", ") || undefined,
        chips: [coding(p.clinicalStatus).code, str(p.criticality)].filter((x): x is string => !!x),
        when: fmtDate(p.recordedDate),
      };
    case "Medication":
      return {
        title: code.display ?? "Obat",
        subtitle: code.code ? `KFA ${code.code}` : undefined,
        chips: [...chips, coding(p.form).display].filter((x): x is string => !!x),
      };
    case "MedicationRequest": {
      const dose = obj(arr(p.dosageInstruction)[0]);
      return {
        title: refDisplay(p.medicationReference) ?? coding(p.medicationCodeableConcept).display ?? "Resep",
        subtitle: str(dose?.text),
        chips: [...chips, str(p.intent)].filter((x): x is string => !!x),
        when: fmtDate(p.authoredOn),
      };
    }
    case "MedicationDispense":
      return {
        title: refDisplay(p.medicationReference) ?? "Penyerahan obat",
        subtitle: quantity(p.quantity),
        chips,
        when: fmtDate(p.whenHandedOver ?? p.whenPrepared),
      };
    case "ServiceRequest":
      return {
        title: code.display ?? "Permintaan penunjang",
        subtitle: code.code ? `Kode ${code.code}` : undefined,
        chips: [...chips, str(p.priority)].filter((x): x is string => !!x),
        when: fmtDate(p.authoredOn),
      };
    case "DiagnosticReport":
      return {
        title: code.display ?? "Laporan penunjang",
        subtitle: str(p.conclusion),
        chips: [...chips, ...(arr(p.result).length ? [`${arr(p.result).length} hasil`] : [])],
        when: fmtDate(p.issued ?? p.effectiveDateTime),
      };
    case "Composition":
      return {
        title: str(p.title) ?? "Resume medis",
        subtitle: `${arr(p.section).length} bagian`,
        chips,
        when: fmtDate(p.date),
      };
    case "Organization":
    case "Location":
      return {
        title: str(p.name) ?? resourceType,
        subtitle: str(obj(arr(p.identifier)[0])?.value),
        chips: [...chips, ...(p.active === false ? ["nonaktif"] : [])],
      };
    default:
      return { title: code.display ?? str(p.name) ?? resourceType, chips };
  }
}
