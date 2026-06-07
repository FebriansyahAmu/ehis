import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("report");
  return (
    <ModuleLayout moduleKey="report">
      {children}
    </ModuleLayout>
  );
}
