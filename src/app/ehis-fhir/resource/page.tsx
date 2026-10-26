import type { Metadata } from "next";
import FhirResources from "@/components/fhir/resource/FhirResources";

export const metadata: Metadata = { title: "Resource — EHIS SatuSehat" };

export default function Page() {
  return <FhirResources />;
}
