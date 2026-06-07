import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("billing");
  return (
    <ModuleLayout moduleKey="billing">
      {children}
    </ModuleLayout>
  );
}
