import type { Metadata } from "next";
import FhirOnboarding from "@/components/fhir/FhirOnboarding";

export const metadata: Metadata = { title: "Onboarding / Prerequisites — EHIS SatuSehat" };

export default function Page() {
  return <FhirOnboarding />;
}
