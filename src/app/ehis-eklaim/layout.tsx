import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisEklaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("eklaim");
  return <ModuleLayout moduleKey="eklaim">{children}</ModuleLayout>;
}
