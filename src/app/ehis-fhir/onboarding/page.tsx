import type { Metadata } from "next";
import FhirOnboarding from "@/components/fhir/FhirOnboarding";

export const metadata: Metadata = { title: "Onboarding — EHIS SatuSehat" };

export default function Page() {
  return <FhirOnboarding />;
}
