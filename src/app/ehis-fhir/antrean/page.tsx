import type { Metadata } from "next";
import FhirAntrean from "@/components/fhir/FhirAntrean";

export const metadata: Metadata = { title: "Antrean Kirim — EHIS SatuSehat" };

export default function Page() {
  return <FhirAntrean />;
}
