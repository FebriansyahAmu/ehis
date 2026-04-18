import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="report">
      {children}
    </ModuleLayout>
  );
}
