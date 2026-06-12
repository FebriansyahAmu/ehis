/**
 * Helper transformasi untuk mapping Katalog Obat ↔ KFA / FHIR SatuSehat.
 */

import type { ObatRecord, KfaMapping, KfaMappedIngredient } from "@/lib/master/obatMock";
import { KFA_SYSTEM_URL, type KfaProduct } from "@/lib/master/kfaMock";

/** Produk KFA terpilih → KfaMapping siap simpan (sumber = KFA_API). */
export function productToMapping(p: KfaProduct): KfaMapping {
  return {
    poaKode: p.kfaCode,
    poaNama: p.name,
    nie: p.nie,
    povKode: p.productTemplate.code,
    povNama: p.productTemplate.name,
    ruteKode: p.rutePemberian.code,
    ruteNama: p.rutePemberian.name,
    bentukKode: p.dosageForm.code,
    bentukNama: p.dosageForm.name,
    zatAktif: p.activeIngredients.map((i): KfaMappedIngredient => ({
      kode: i.kode,
      display: i.zatAktif,
      dosis: i.kekuatan,
      satuan: i.satuan,
      dosisPerSatuan: i.kekuatan != null
        ? `${i.kekuatan} ${i.satuan ?? ""}`.trim() + (p.uom?.name ? ` / 1 ${p.uom.name.toLowerCase()}` : "")
        : undefined,
    })),
    sumber: "KFA_API",
    mappedAt: new Date().toISOString(),
  };
}

/** Apakah mapping sudah punya produk terpetakan (POA atau POV). */
export function isKfaMapped(m: KfaMapping | undefined): boolean {
  return !!(m && (m.poaKode || m.povKode));
}

// ── FHIR preview ──────────────────────────────────────────

interface FhirCoding {
  system: string;
  code: string;
  display?: string;
}

/**
 * Bangun representasi FHIR `Medication` (subset) dari mapping KFA — untuk
 * preview interop SatuSehat. Bukan validator FHIR penuh; menampilkan struktur
 * `code` (POV+POA), `form` (bentuk sediaan), dan `ingredient[]` (BZA + strength).
 */
export function buildFhirMedication(obat: ObatRecord, m: KfaMapping): Record<string, unknown> {
  const codings: FhirCoding[] = [];
  if (m.povKode) codings.push({ system: KFA_SYSTEM_URL, code: m.povKode, display: m.povNama });
  if (m.poaKode) codings.push({ system: KFA_SYSTEM_URL, code: m.poaKode, display: m.poaNama });

  const med: Record<string, unknown> = {
    resourceType: "Medication",
    status: "active",
  };

  if (m.nie) {
    med.identifier = [{ system: "https://fhir.kemkes.go.id/id/nie", value: m.nie }];
  }

  med.code = {
    coding: codings,
    text: obat.namaGenerik || obat.namaDagang || undefined,
  };

  if (m.bentukKode) {
    med.form = { coding: [{ system: KFA_SYSTEM_URL, code: m.bentukKode, display: m.bentukNama }] };
  }

  if (m.zatAktif.length > 0) {
    med.ingredient = m.zatAktif.map((z) => {
      const ing: Record<string, unknown> = {
        itemCodeableConcept: {
          coding: [{ system: KFA_SYSTEM_URL, code: z.kode, display: z.display }],
        },
      };
      if (z.dosis != null) {
        ing.strength = {
          numerator: { value: z.dosis, unit: z.satuan, system: "http://unitsofmeasure.org", code: z.satuan },
          denominator: { value: 1, unit: m.bentukNama ?? "unit" },
        };
      }
      return ing;
    });
  }

  return med;
}
