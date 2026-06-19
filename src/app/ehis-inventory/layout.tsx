import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisInventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("inventory");
  return <ModuleLayout moduleKey="inventory">{children}</ModuleLayout>;
}
