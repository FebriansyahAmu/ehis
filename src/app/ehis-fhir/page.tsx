import type { Metadata } from "next";
import FhirBeranda from "@/components/fhir/FhirBeranda";

export const metadata: Metadata = { title: "Beranda — EHIS SatuSehat" };

export default function Page() {
  return <FhirBeranda />;
}
