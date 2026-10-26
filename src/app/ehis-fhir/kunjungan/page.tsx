import type { Metadata } from "next";
import FhirKunjungan from "@/components/fhir/kunjungan/FhirKunjungan";

export const metadata: Metadata = { title: "Kunjungan — EHIS SatuSehat" };

export default function Page() {
  return <FhirKunjungan />;
}
