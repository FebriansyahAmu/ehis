import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisFhirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("fhir");
  return <ModuleLayout moduleKey="fhir">{children}</ModuleLayout>;
}
