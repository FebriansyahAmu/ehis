import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("dashboard");
  return (
    <ModuleLayout moduleKey="dashboard">
      {children}
    </ModuleLayout>
  );
}
