import type { Metadata } from "next";
import FhirPasien from "@/components/fhir/FhirPasien";

export const metadata: Metadata = { title: "Pasien & NIK — EHIS SatuSehat" };

export default function Page() {
  return <FhirPasien />;
}
